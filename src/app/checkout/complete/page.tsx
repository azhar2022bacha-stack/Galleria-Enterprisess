import { CheckoutCompletion } from '@/components/checkout/CheckoutCompletion';

export default function CheckoutCompletePage({ searchParams }: { searchParams: { session_id?: string } }) {
  return <CheckoutCompletion sessionId={searchParams.session_id || ''} />;
}
