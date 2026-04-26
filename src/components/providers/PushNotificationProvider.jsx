'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { useAuthStore } from '@/store/authStore'
import { createClient } from '@/lib/supabase/client'

export default function PushNotificationProvider({ children }) {
  const { user } = useAuthStore()

  useEffect(() => {
    // Only run this code if the user is inside the native iOS or Android app.
    // It will not run on standard web browsers or the Desktop apps.
    if (Capacitor.isNativePlatform()) {
      setupPushNotifications()
    }
  }, [user])

  const setupPushNotifications = async () => {
    try {
      // 1. Request permission from the user to send notifications
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') {
        console.warn('User denied push notification permissions.')
        return
      }

      // 2. Register with Firebase (Android) or APNs (iOS)
      await PushNotifications.register()

      // 3. Listen for successful registration and receive the unique device token
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success! Token:', token.value)
        
        // Save the device token to the database if the user is logged in
        if (user?.id) {
          const supabase = createClient()
          const { error } = await supabase
            .from('users')
            .update({ push_token: token.value })
            .eq('id', user.id)
            
          if (error) {
            console.error('Error saving push token to Supabase:', error)
          }
        }
      })

      // 4. Handle registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on push registration:', JSON.stringify(error))
      })

      // 5. Handle incoming notifications while the app is open
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received:', notification)
        // You could trigger a custom in-app toast notification here if you want
      })

      // 6. Handle the user tapping on the notification in the notification center
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push action performed:', action)
        // You could redirect the user to a specific page based on the notification payload
      })

    } catch (error) {
      console.error('Push notification setup failed:', error)
    }
  }

  return children
}
