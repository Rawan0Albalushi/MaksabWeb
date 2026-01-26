import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Success Handler
 * 
 * This API route handles successful payment callbacks.
 * The backend or payment gateway redirects here after successful payment.
 * 
 * Expected URL: /api/payment/success?o_id=123
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract order ID - support multiple naming conventions
  const orderId = searchParams.get('o_id') || searchParams.get('order_id') || searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent_id');
  
  // Get the locale from cookies or default to 'ar'
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'ar';
  
  // Build the redirect URL to the frontend payment result page
  const baseUrl = request.nextUrl.origin;
  const redirectUrl = new URL(`/${locale}/payment/result`, baseUrl);
  
  // Add parameters
  redirectUrl.searchParams.set('status', 'success');
  if (orderId) redirectUrl.searchParams.set('order_id', orderId);
  if (sessionId) redirectUrl.searchParams.set('session_id', sessionId);
  if (paymentIntentId) redirectUrl.searchParams.set('payment_intent_id', paymentIntentId);
  
  // Redirect to the frontend payment result page
  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
