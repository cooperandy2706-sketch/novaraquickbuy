// FILE: src/app/page.jsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  return (
    <>
      <h1 className="sr-only">Novara Quickbuy — The Best Place to Sell and Buy from Trusted Vendors</h1>
      {redirect('/feed')}
    </>
  )
}