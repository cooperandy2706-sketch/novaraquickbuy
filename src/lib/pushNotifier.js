import * as admin from 'firebase-admin'
import { createClient } from '@/lib/supabase/server'

// Initialize Firebase Admin lazily to avoid cold start issues or duplicate initializations
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // Decode private key to handle literal \n characters properly
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined

      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        console.warn('Firebase Admin is not configured. Push notifications will be skipped.')
        return null
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
    } catch (error) {
      console.error('Firebase Admin initialization error:', error)
      return null
    }
  }
  return admin
}

/**
 * Sends a push notification to a specific user.
 * Looks up the user's push_token from the Supabase users table.
 * 
 * @param {string} userId - The Supabase UUID of the user to notify.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body message of the notification.
 * @param {object} [data] - Optional custom data payload to send silently to the app.
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const firebaseAdmin = getFirebaseAdmin()
    if (!firebaseAdmin) return { success: false, error: 'Firebase not configured' }

    // Retrieve the user's push_token from Supabase
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single()

    if (error || !user?.push_token) {
      console.log(`No push token found for user ${userId}. Skipping notification.`)
      return { success: false, error: 'No push token found' }
    }

    const message = {
      token: user.push_token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // Capacitor compatibility
      },
      android: {
        notification: {
          sound: 'default',
          icon: 'ic_launcher_foreground', // Using the native app icon
          color: '#16A34A', // Brand color
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          }
        }
      }
    }

    const response = await firebaseAdmin.messaging().send(message)
    console.log(`Successfully sent push notification to ${userId}:`, response)
    return { success: true, messageId: response }

  } catch (error) {
    console.error(`Error sending push notification to ${userId}:`, error)
    return { success: false, error: error.message }
  }
}
