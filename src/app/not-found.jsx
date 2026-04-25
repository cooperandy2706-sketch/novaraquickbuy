// FILE: src/app/not-found.jsx
import { redirect } from 'next/navigation'

export default function NotFound() {
  redirect('/feed')
}