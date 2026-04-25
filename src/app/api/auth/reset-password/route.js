// FILE: src/app/api/auth/reset-password/route.js

import { NextResponse } from 'next/server'

export async function GET(request) {
  const { origin } = new URL(request.url)
  // Supabase sends the user here after they click the reset link
  // Next.js handles the token via the URL hash — redirect to the reset page
  return NextResponse.redirect(new URL('/reset-password', origin))
}