// FILE: src/lib/services/notifications.js
import { createClient } from '@/lib/supabase/server';
import { EmailService } from './email';

/**
 * Orchestrator for all system notifications
 */
export const NotificationService = {
  /**
   * Notify vendor of a new order
   */
  async notifyNewOrder(vendorId, orderId, amount) {
    const supabase = await createClient();
    
    // Fetch vendor and their user email/prefs
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, store_name, notif_email, notif_new_order, users(email, full_name)')
      .eq('id', vendorId)
      .single();

    if (!vendor || !vendor.users?.email || !vendor.notif_email || !vendor.notif_new_order) return;

    await EmailService.send({
      to: vendor.users.email,
      subject: `New Order Received! (#${orderId.slice(0, 8)})`,
      html: `
        <p>Hi ${vendor.users.full_name},</p>
        <p>Congratulations! You've just received a new order for <strong>${amount}</strong>.</p>
        <p>Head over to your dashboard to view the details and start fulfilling it.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/orders/${orderId}" class="button">View Order</a>
      `
    });
  },

  /**
   * Notify buyer of order status change
   */
  async notifyOrderStatusUpdate(buyerId, orderId, status, details = '') {
    const supabase = await createClient();
    const { data: buyer } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', buyerId)
      .single();

    if (!buyer?.email) return;

    const statusMap = {
      'vendor_accepted': { 
        subject: 'Order Accepted!', 
        text: 'The vendor has accepted your order and is preparing it.' 
      },
      'shipped': { 
        subject: 'Order Shipped!', 
        text: `Your order has been shipped. ${details}` 
      },
      'delivered': { 
        subject: 'Order Delivered!', 
        text: 'Great news! Your order has been delivered.' 
      },
      'cancelled': { 
        subject: 'Order Cancelled', 
        text: `Your order has been cancelled. ${details}` 
      }
    };

    const config = statusMap[status];
    if (!config) return;

    await EmailService.send({
      to: buyer.email,
      subject: config.subject,
      html: `
        <p>Hi ${buyer.full_name},</p>
        <p>${config.text}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}" class="button">Track Order</a>
      `
    });
  },

  /**
   * Notify recipient of a new DM
   */
  async notifyNewMessage(recipientId, senderName, contentSnippet, threadId) {
    const supabase = await createClient();
    const { data: recipient } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', recipientId)
      .single();

    if (!recipient?.email) return;

    // Optional: Check if user is offline or has prefs (omitted for simplicity in MVP)

    await EmailService.send({
      to: recipient.email,
      subject: `New message from ${senderName}`,
      html: `
        <p>Hi ${recipient.full_name},</p>
        <p>You have a new message from <strong>${senderName}</strong>:</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
          "${contentSnippet}"
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/chat?thread=${threadId}" class="button">Reply in Chat</a>
      `
    });
  },

  /**
   * Notify circle members of an announcement
   */
  async notifyCircleAnnouncement(circleId, senderName, circleName, contentSnippet) {
    const supabase = await createClient();
    
    // Fetch all members who have not muted the circle
    const { data: members } = await supabase
      .from('circle_members')
      .select('users(email, full_name)')
      .eq('circle_id', circleId)
      .eq('muted', false);

    if (!members?.length) return;

    // Batching logic: For a real production app, use a queue. 
    // Here we send them concurrently with Promise.all (handle with care for huge groups)
    await Promise.all(members.map(m => {
      if (!m.users?.email) return null;
      return EmailService.send({
        to: m.users.email,
        subject: `Announcement in ${circleName}`,
        html: `
          <p>Hi ${m.users.full_name},</p>
          <p><strong>${senderName}</strong> posted a new announcement in <strong>${circleName}</strong>:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            "${contentSnippet}"
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/circles/${circleId}" class="button">View Announcement</a>
        `
      });
    }));
  },

  /**
   * Send Welcome Email
   */
  async sendWelcomeEmail(email, name) {
    await EmailService.send({
      to: email,
      subject: 'Welcome to Novara QuickBuy! 🛍️',
      html: `
        <p>Hi ${name},</p>
        <p>We're thrilled to have you join the Novara QuickBuy community!</p>
        <p>Explore thousands of products, follow your favorite vendors, and enjoy a seamless shopping experience.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/explore" class="button">Start Shopping</a>
        </div>
        <p>Happy buying!</p>
      `
    });
  }
};
