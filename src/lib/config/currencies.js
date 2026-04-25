// FILE: src/lib/config/currencies.js
// Maps country → { currency, symbol, monthlyRate, sixMonthRate, paymentMethods }
// Base prices: $32/month, $100/6-months — converted at approximate fixed rates

export const COUNTRY_CURRENCY_MAP = {
  // West Africa
  'Ghana':         { currency: 'GHS', symbol: '₵',  monthly: 490,    sixMonth: 1530,  methods: ['bank', 'momo'] },
  'Nigeria':       { currency: 'NGN', symbol: '₦',  monthly: 52000,  sixMonth: 162000,methods: ['bank', 'momo'] },
  'Senegal':       { currency: 'XOF', symbol: 'CFA',monthly: 20000,  sixMonth: 62000, methods: ['bank', 'orange_money', 'wave'] },
  'Ivory Coast':   { currency: 'XOF', symbol: 'CFA',monthly: 20000,  sixMonth: 62000, methods: ['bank', 'orange_money', 'wave', 'momo'] },
  'Cameroon':      { currency: 'XAF', symbol: 'CFA',monthly: 20000,  sixMonth: 62000, methods: ['bank', 'momo', 'orange_money'] },

  // East Africa
  'Kenya':         { currency: 'KES', symbol: 'Ksh',monthly: 4200,   sixMonth: 13000, methods: ['bank', 'mpesa'] },
  'Tanzania':      { currency: 'TZS', symbol: 'TSh',monthly: 80000,  sixMonth: 250000,methods: ['bank', 'mpesa', 'tigopesa'] },
  'Uganda':        { currency: 'UGX', symbol: 'USh',monthly: 120000, sixMonth: 375000,methods: ['bank', 'momo', 'airtel_money'] },
  'Ethiopia':      { currency: 'ETB', symbol: 'Br', monthly: 1800,   sixMonth: 5600,  methods: ['bank', 'telebirr'] },
  'Rwanda':        { currency: 'RWF', symbol: 'RF', monthly: 38000,  sixMonth: 118000,methods: ['bank', 'momo', 'airtel_money'] },

  // Southern Africa
  'South Africa':  { currency: 'ZAR', symbol: 'R',  monthly: 590,    sixMonth: 1840,  methods: ['bank', 'ozow', 'snapscan'] },
  'Zambia':        { currency: 'ZMW', symbol: 'ZK', monthly: 740,    sixMonth: 2300,  methods: ['bank', 'momo', 'airtel_money'] },
  'Zimbabwe':      { currency: 'USD', symbol: '$',  monthly: 32,     sixMonth: 100,   methods: ['bank', 'ecocash', 'onemoney'] },
  'Mozambique':    { currency: 'MZN', symbol: 'MT', monthly: 2050,   sixMonth: 6400,  methods: ['bank', 'mpesa', 'emola'] },

  // North Africa
  'Egypt':         { currency: 'EGP', symbol: 'E£', monthly: 1000,   sixMonth: 3100,  methods: ['bank', 'vodafone_cash', 'fawry'] },
  'Morocco':       { currency: 'MAD', symbol: 'DH', monthly: 320,    sixMonth: 1000,  methods: ['bank', 'cmi', 'orangemoney'] },

  // Middle East
  'Saudi Arabia':  { currency: 'SAR', symbol: '﷼',  monthly: 120,    sixMonth: 375,   methods: ['bank', 'stcpay', 'apple_pay'] },
  'UAE':           { currency: 'AED', symbol: 'د.إ',monthly: 117,    sixMonth: 367,   methods: ['bank', 'apple_pay', 'google_pay'] },
  'Jordan':        { currency: 'JOD', symbol: 'JD', monthly: 23,     sixMonth: 71,    methods: ['bank', 'zain_cash', 'umniah'] },

  // South/Southeast Asia
  'India':         { currency: 'INR', symbol: '₹',  monthly: 2650,   sixMonth: 8300,  methods: ['bank', 'upi', 'paytm'] },
  'Pakistan':      { currency: 'PKR', symbol: '₨',  monthly: 8900,   sixMonth: 28000, methods: ['bank', 'easypaisa', 'jazzcash'] },
  'Bangladesh':    { currency: 'BDT', symbol: '৳',  monthly: 3500,   sixMonth: 11000, methods: ['bank', 'bkash', 'nagad'] },
  'Malaysia':      { currency: 'MYR', symbol: 'RM', monthly: 150,    sixMonth: 470,   methods: ['bank', 'duitnow', 'tng'] },
  'Indonesia':     { currency: 'IDR', symbol: 'Rp', monthly: 515000, sixMonth: 1610000,methods: ['bank', 'gopay', 'ovo', 'dana'] },
  'Myanmar':       { currency: 'MMK', symbol: 'K',  monthly: 67000,  sixMonth: 210000,methods: ['bank', 'wavepay', 'kbzpay'] },

  // Americas
  'Brazil':        { currency: 'BRL', symbol: 'R$', monthly: 160,    sixMonth: 500,   methods: ['bank', 'pix', 'boleto'] },
  'Mexico':        { currency: 'MXN', symbol: 'MX$',monthly: 550,    sixMonth: 1720,  methods: ['bank', 'spei', 'oxxo'] },

  // Default (USD)
  'United States': { currency: 'USD', symbol: '$',  monthly: 32,     sixMonth: 100,   methods: ['bank', 'paypal', 'stripe'] },
  'United Kingdom':{ currency: 'GBP', symbol: '£',  monthly: 26,     sixMonth: 80,    methods: ['bank', 'paypal', 'stripe'] },
  'Canada':        { currency: 'CAD', symbol: 'CA$',monthly: 44,     sixMonth: 137,   methods: ['bank', 'paypal', 'stripe', 'interac'] },
  'Australia':     { currency: 'AUD', symbol: 'A$', monthly: 49,     sixMonth: 154,   methods: ['bank', 'paypal', 'stripe'] },
  'Germany':       { currency: 'EUR', symbol: '€',  monthly: 30,     sixMonth: 92,    methods: ['bank', 'paypal', 'stripe', 'sepa'] },
  'France':        { currency: 'EUR', symbol: '€',  monthly: 30,     sixMonth: 92,    methods: ['bank', 'paypal', 'stripe'] },
  'Singapore':     { currency: 'SGD', symbol: 'S$', monthly: 43,     sixMonth: 135,   methods: ['bank', 'paynow', 'grabpay'] },
}

export const DEFAULT_CURRENCY = { currency: 'USD', symbol: '$', monthly: 32, sixMonth: 100, methods: ['bank', 'paypal'] }

export function getCurrencyForCountry(country) {
  return COUNTRY_CURRENCY_MAP[country] ?? DEFAULT_CURRENCY
}

// Payment method display config
export const PAYMENT_METHOD_CONFIG = {
  bank:          { label: 'Bank Transfer',      icon: '🏦', desc: 'Direct bank deposit / wire transfer'                },
  mpesa:         { label: 'M-Pesa',             icon: '📱', desc: 'Send to M-Pesa till or paybill'                    },
  momo:          { label: 'Mobile Money (MTN)', icon: '📲', desc: 'MTN MoMo — send to merchant code'                  },
  orange_money:  { label: 'Orange Money',       icon: '🍊', desc: 'Orange Money mobile transfer'                      },
  wave:          { label: 'Wave',               icon: '🌊', desc: 'Wave mobile money transfer'                        },
  airtel_money:  { label: 'Airtel Money',       icon: '📡', desc: 'Airtel Money transfer'                             },
  telebirr:      { label: 'Telebirr',           icon: '📱', desc: 'Ethio Telecom telebirr'                            },
  tigopesa:      { label: 'Tigo Pesa',          icon: '📲', desc: 'Tigo Pesa mobile money'                            },
  ecocash:       { label: 'EcoCash',            icon: '💚', desc: 'EcoCash mobile money'                              },
  onemoney:      { label: 'OneMoney',           icon: '💳', desc: 'OneMoney ZIPIT transfer'                           },
  bkash:         { label: 'bKash',              icon: '🔴', desc: 'bKash mobile banking'                              },
  nagad:         { label: 'Nagad',              icon: '🟠', desc: 'Nagad mobile financial service'                    },
  easypaisa:     { label: 'EasyPaisa',          icon: '💚', desc: 'EasyPaisa mobile account transfer'                 },
  jazzcash:      { label: 'JazzCash',           icon: '🔴', desc: 'JazzCash mobile account transfer'                  },
  upi:           { label: 'UPI',                icon: '🇮🇳', desc: 'UPI ID transfer (GPay, PhonePe, Paytm)'           },
  paytm:         { label: 'Paytm',              icon: '💙', desc: 'Paytm wallet transfer'                             },
  pix:           { label: 'PIX',                icon: '🇧🇷', desc: 'PIX instant bank transfer'                        },
  boleto:        { label: 'Boleto',             icon: '🧾', desc: 'Boleto bancário'                                   },
  spei:          { label: 'SPEI',               icon: '🇲🇽', desc: 'SPEI interbank transfer'                          },
  oxxo:          { label: 'OXXO',               icon: '🏪', desc: 'Pay at OXXO store'                                 },
  paypal:        { label: 'PayPal',             icon: '🅿️', desc: 'PayPal payment'                                   },
  stripe:        { label: 'Card (Stripe)',       icon: '💳', desc: 'Debit or credit card via Stripe'                  },
  duitnow:       { label: 'DuitNow',            icon: '🇲🇾', desc: 'DuitNow QR or transfer'                          },
  tng:           { label: 'Touch \'n Go',       icon: '🟢', desc: 'Touch \'n Go eWallet'                             },
  gopay:         { label: 'GoPay',              icon: '💚', desc: 'GoPay digital wallet'                              },
  ovo:           { label: 'OVO',                icon: '🟣', desc: 'OVO digital wallet'                               },
  dana:          { label: 'DANA',               icon: '🔵', desc: 'DANA digital wallet'                              },
  wavepay:       { label: 'Wave Pay',           icon: '🌊', desc: 'Wave Pay Myanmar'                                  },
  kbzpay:        { label: 'KBZPay',             icon: '🔴', desc: 'KBZPay mobile banking'                            },
  stcpay:        { label: 'STC Pay',            icon: '🟣', desc: 'STC Pay mobile wallet'                            },
  apple_pay:     { label: 'Apple Pay',          icon: '🍎', desc: 'Apple Pay'                                         },
  google_pay:    { label: 'Google Pay',         icon: '🔵', desc: 'Google Pay'                                        },
  fawry:         { label: 'Fawry',              icon: '🟡', desc: 'Pay at Fawry point'                               },
  vodafone_cash: { label: 'Vodafone Cash',      icon: '🔴', desc: 'Vodafone Cash Egypt'                              },
  cmi:           { label: 'CMI / HPS',          icon: '🇲🇦', desc: 'Moroccan Interbank transfer'                     },
  ozow:          { label: 'Ozow',               icon: '🟢', desc: 'Ozow instant EFT'                                 },
  snapscan:      { label: 'SnapScan',           icon: '📷', desc: 'SnapScan QR payment'                              },
  emola:         { label: 'e-Mola',             icon: '📱', desc: 'e-Mola mobile money'                              },
  zain_cash:     { label: 'Zain Cash',          icon: '🔵', desc: 'Zain Cash mobile wallet'                          },
  umniah:        { label: 'Umniah',             icon: '🟠', desc: 'Umniah mobile payment'                            },
  paynow:        { label: 'PayNow',             icon: '🇸🇬', desc: 'Singapore PayNow transfer'                       },
  grabpay:       { label: 'GrabPay',            icon: '🟢', desc: 'GrabPay wallet'                                   },
  sepa:          { label: 'SEPA Transfer',      icon: '🇪🇺', desc: 'SEPA bank transfer'                              },
  interac:       { label: 'Interac e-Transfer', icon: '🇨🇦', desc: 'Interac email transfer'                         },
}

// Novara's payment receiving details per method (admin fills these in production)
export const NOVARA_PAYMENT_DETAILS = {
  bank: {
    account_name:   'Novara Quickbuy Ltd',
    bank_name:      'GTBank / Access Bank',
    account_number: '0123456789',
    swift_code:     'GTBINGLA',
    iban:           'GB29NWBK60161331926819',
    note:           'Use your vendor store handle as payment reference',
  },
  mpesa: {
    paybill:    '123456',
    account:    'NOVARA',
    note:       'Use your store handle as the account number',
  },
  momo: {
    merchant_code: '456789',
    name:          'Novara Quickbuy',
    note:          'Use your store handle as reference',
  },
  paypal: {
    email: 'payments@novaraquickbuy.com',
    note:  'Send as Friends & Family — include your store handle in notes',
  },
}