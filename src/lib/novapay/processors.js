// FILE: src/lib/novapay/processors.js
// Server-side processor client wrappers.
// Each processor exposes a consistent interface:
//   initiate(params)   → { reference, authorization_url?, data }
//   verify(reference)  → { success, amount, currency, metadata }
//   refund(params)     → { success, refund_id }
//   transfer(params)   → { success, transfer_id }   (for payouts)

import Stripe from 'stripe'

const PLATFORM_FEE_RATE = 0.015  // 1.5%

// ─────────────────────────────────────────────────────────────
// PAYSTACK CLIENT
// Handles: Ghana, Nigeria — cards, MoMo, bank transfer, USSD
// ─────────────────────────────────────────────────────────────

export const paystackClient = {
  baseUrl: 'https://api.paystack.co',

  headers() {
    return {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }
  },

  async request(method, path, body = null) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok || !data.status) {
      throw new Error(data.message ?? `Paystack error: ${res.status}`)
    }
    return data.data
  },

  // ── initiate payment ──────────────────────────────────────
  async initiate({
    email, amount, currency, reference, callbackUrl,
    paymentMethod, momoNumber, metadata,
  }) {
    const channels = {
      card:            ['card'],
      momo_mtn:        ['mobile_money'],
      momo_vodafone:   ['mobile_money'],
      momo_airteltigo: ['mobile_money'],
      bank_transfer:   ['bank_transfer'],
      ussd:            ['ussd'],
    }

    const body = {
      email,
      amount,        // Paystack uses smallest unit (kobo/pesewas)
      currency,
      reference,
      callback_url:  callbackUrl,
      channels:      channels[paymentMethod] ?? ['card'],
      metadata:      { novapay: true, ...metadata },
    }

    // For MoMo, add mobile_money object
    if (['momo_mtn','momo_vodafone','momo_airteltigo'].includes(paymentMethod) && momoNumber) {
      const networkMap = {
        momo_mtn:        'mtn',
        momo_vodafone:   'vod',
        momo_airteltigo: 'atl',
      }
      body.mobile_money = {
        phone:    momoNumber,
        provider: networkMap[paymentMethod] ?? 'mtn',
      }
    }

    const data = await this.request('POST', '/transaction/initialize', body)
    return {
      reference:         data.reference,
      authorization_url: data.authorization_url,
      access_code:       data.access_code,
      processor:         'paystack',
    }
  },

  // ── verify payment ────────────────────────────────────────
  async verify(reference) {
    const data = await this.request('GET', `/transaction/verify/${reference}`)
    return {
      success:    data.status === 'success',
      amount:     data.amount,
      currency:   data.currency,
      reference:  data.reference,
      processor_charge_id: data.id?.toString(),
      metadata:   data.metadata,
      paid_at:    data.paid_at,
      channel:    data.channel,
      customer:   { email: data.customer?.email },
      raw:        data,
    }
  },

  // ── refund ────────────────────────────────────────────────
  async refund({ transactionId, amount, reason }) {
    const data = await this.request('POST', '/refund', {
      transaction: transactionId,
      amount,
      merchant_note: reason,
    })
    return {
      success:   true,
      refund_id: data.id?.toString(),
      raw:       data,
    }
  },

  // ── transfer (payout to vendor) ───────────────────────────
  async transfer({ amount, currency, recipientCode, reason, reference }) {
    // First create a transfer recipient if needed
    const data = await this.request('POST', '/transfer', {
      source:    'balance',
      amount,
      currency,
      recipient: recipientCode,
      reason:    reason ?? 'Novara vendor payout',
      reference,
    })
    return {
      success:     data.status === 'success' || data.status === 'pending',
      transfer_id: data.transfer_code,
      raw:         data,
    }
  },

  // ── create transfer recipient (bank account or MoMo) ─────
  async createRecipient({ type, name, accountNumber, bankCode, currency }) {
    const data = await this.request('POST', '/transferrecipient', {
      type,           // 'ghipss' | 'mobile_money' | 'nuban'
      name,
      account_number: accountNumber,
      bank_code:      bankCode,
      currency,
    })
    return {
      recipient_code: data.recipient_code,
      raw: data,
    }
  },
}


// ─────────────────────────────────────────────────────────────
// FLUTTERWAVE CLIENT
// Handles: Rest of Africa — cards, MoMo, bank transfer
// ─────────────────────────────────────────────────────────────

export const flutterwaveClient = {
  baseUrl: 'https://api.flutterwave.com/v3',

  headers() {
    return {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    }
  },

  async request(method, path, body = null) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (data.status !== 'success') {
      throw new Error(data.message ?? `Flutterwave error: ${res.status}`)
    }
    return data.data
  },

  async initiate({
    email, amount, currency, reference, callbackUrl,
    paymentMethod, momoNumber, customerName, metadata,
  }) {
    const body = {
      tx_ref:       reference,
      amount,
      currency,
      redirect_url: callbackUrl,
      customer: {
        email,
        name: customerName ?? email,
      },
      meta: { novapay: true, ...metadata },
      customizations: {
        title:       'NovaPay',
        description: 'Powered by Novara Quickbuy',
        logo:        process.env.NEXT_PUBLIC_LOGO_URL ?? '',
      },
    }

    // Payment type specific
    if (['momo_mtn','momo_vodafone'].includes(paymentMethod) && momoNumber) {
      body.payment_options = 'mobilemoneyrwanda,mobilemoneyghana,mobilemoneyuganda,mobilemoneyfrancophone,mobilemoneyzambia,mobilemoneytanzania'
      body.phone_number = momoNumber
    }

    const data = await this.request('POST', '/payments', body)
    return {
      reference:         reference,
      authorization_url: data.link,
      processor:         'flutterwave',
    }
  },

  async verify(transactionId) {
    const data = await this.request('GET', `/transactions/${transactionId}/verify`)
    return {
      success:    data.status === 'successful',
      amount:     data.amount,
      currency:   data.currency,
      reference:  data.tx_ref,
      processor_charge_id: data.id?.toString(),
      metadata:   data.meta,
      paid_at:    data.created_at,
      channel:    data.payment_type,
      customer:   { email: data.customer?.email },
      raw:        data,
    }
  },

  async refund({ transactionId, amount }) {
    const data = await this.request('POST', `/transactions/${transactionId}/refund`, { amount })
    return {
      success:   data.status === 'completed',
      refund_id: data.id?.toString(),
      raw:       data,
    }
  },

  async transfer({ accountBank, accountNumber, amount, currency, narration, reference }) {
    const data = await this.request('POST', '/transfers', {
      account_bank:    accountBank,
      account_number:  accountNumber,
      amount,
      currency,
      narration:       narration ?? 'Novara vendor payout',
      reference,
    })
    return {
      success:     data.status === 'NEW' || data.status === 'PENDING',
      transfer_id: data.id?.toString(),
      raw:         data,
    }
  },
}


// ─────────────────────────────────────────────────────────────
// STRIPE CLIENT
// Handles: Global cards, Apple Pay, Google Pay, EU/US
// ─────────────────────────────────────────────────────────────

let stripeInstance = null
function getStripe() {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      // In build time or if missing, we return a mock or just let it fail if called
      console.warn('[Stripe] SECRET_KEY missing. If this is build time, it is expected.')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2024-04-10',
    })
  }
  return stripeInstance
}

export const stripeClient = {
  async initiate({
    amount, currency, email, reference, vendorStripeAccountId,
    metadata,
  }) {
    const platformFee = Math.round(amount * PLATFORM_FEE_RATE)

    const params = {
      amount,
      currency:      currency.toLowerCase(),
      metadata:      { novapay_ref: reference, ...metadata },
      receipt_email: email,
      description:   'NovaPay — Novara Quickbuy',
      automatic_payment_methods: { enabled: true },
    }

    // Stripe Connect: route to vendor, take platform fee
    if (vendorStripeAccountId) {
      params.application_fee_amount = platformFee
      params.transfer_data = { destination: vendorStripeAccountId }
    }

    const pi = await getStripe().paymentIntents.create(params)
    return {
      reference,
      client_secret:      pi.client_secret,
      payment_intent_id:  pi.id,
      processor:          'stripe',
    }
  },

  async verify(paymentIntentId) {
    const pi = await getStripe().paymentIntents.retrieve(paymentIntentId)
    return {
      success:    pi.status === 'succeeded',
      amount:     pi.amount,
      currency:   pi.currency.toUpperCase(),
      reference:  pi.metadata?.novapay_ref,
      processor_charge_id: pi.latest_charge,
      metadata:   pi.metadata,
      paid_at:    pi.created ? new Date(pi.created * 1000).toISOString() : null,
      raw:        pi,
    }
  },

  async refund({ chargeId, amount, reason }) {
    const refund = await getStripe().refunds.create({
      charge: chargeId,
      amount,
      reason: reason ?? 'requested_by_customer',
    })
    return {
      success:   refund.status === 'succeeded',
      refund_id: refund.id,
      raw:       refund,
    }
  },

  async transfer({ destination, amount, currency, metadata }) {
    const transfer = await getStripe().transfers.create({
      destination,
      amount,
      currency: currency.toLowerCase(),
      metadata,
    })
    return {
      success:     true,
      transfer_id: transfer.id,
      raw:         transfer,
    }
  },

  constructWebhookEvent(body, signature) {
    return getStripe().webhooks.constructEvent(
      body, signature, process.env.STRIPE_WEBHOOK_SECRET
    )
  },
}


// ─────────────────────────────────────────────────────────────
// PROCESSOR SELECTOR
// Returns the correct client for a given processor name.
// ─────────────────────────────────────────────────────────────

export function getProcessorClient(processor) {
  switch (processor) {
    case 'paystack':    return paystackClient
    case 'flutterwave': return flutterwaveClient
    case 'stripe':      return stripeClient
    default: throw new Error(`Unknown processor: ${processor}`)
  }
}