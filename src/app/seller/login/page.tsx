import { redirect } from 'next/navigation';

export default function SellerLoginPage() {
  redirect('/seller?mode=signin');
}
