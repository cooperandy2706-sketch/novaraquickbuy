import { createClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/pushNotifier';

/**
 * Orchestrator for all system notifications
 */
export const NotificationService = {
  /**
   * Notify vendor of a new order
   */
  async notifyNewOrder(vendorId, orderId, amount) {
    const supabase = await createClient();
    
    // Fetch vendor details
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, user_id')
      .eq('id', vendorId)
      .single();

    if (!vendor?.user_id) return;

    // Send Push Notification only
    await sendPushNotification(
      vendor.user_id, 
      `New Order Received! (#${orderId.slice(0, 8)})`, 
      `You've just received a new order for ${amount}.`
    );
  },

  /**
   * Notify buyer of order status change
   */
  async notifyOrderStatusUpdate(buyerId, orderId, status, details = '') {
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

    // Send Push Notification only
    await sendPushNotification(buyerId, config.subject, config.text);
  },

  /**
   * Notify recipient of a new DM
   */
  async notifyNewMessage(recipientId, senderName, contentSnippet, threadId) {
    // Send Push Notification only
    await sendPushNotification(recipientId, `New message from ${senderName}`, contentSnippet);
  },

  /**
   * Notify circle members of an announcement
   */
  async notifyCircleAnnouncement(circleId, senderName, circleName, contentSnippet) {
    const supabase = await createClient();
    
    // Fetch all members who have not muted the circle
    const { data: members } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circleId)
      .eq('muted', false);

    if (!members?.length) return;

    // Send Push Notifications only
    await Promise.all(members.map(async (m) => {
      await sendPushNotification(m.user_id, `Announcement in ${circleName}`, contentSnippet);
    }));
  },
};
