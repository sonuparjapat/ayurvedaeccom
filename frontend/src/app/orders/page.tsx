import { redirect } from 'next/navigation'

// /orders has no standalone list UI — the account page's Orders tab is the canonical location.
export default function OrdersIndexPage() {
  redirect('/account?tab=orders')
}
