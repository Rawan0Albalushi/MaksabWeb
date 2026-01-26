import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Callback Handler
 * 
 * This API route handles the payment callback from the backend.
 * The backend redirects to this URL after processing the payment,
 * and we redirect the user to the appropriate frontend page.
 * 
 * Expected URL patterns:
 * - /api/payment/callback?status=success&o_id=123
 * - /api/payment/callback?status=failed&o_id=123
 * - /api/payment/callback?o_id=123 (status determined from backend)
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract parameters - support multiple naming conventions
  const orderId = searchParams.get('o_id') || searchParams.get('order_id') || searchParams.get('orderId');
  const status = searchParams.get('status') || 'success'; // Default to success if status is not provided
  const sessionId = searchParams.get('session_id');
  const paymentIntentId = searchParams.get('payment_intent_id');
  
  // Get the locale from cookies or default to 'ar'
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'ar';
  
  // Build the redirect URL to the frontend payment result page
  const baseUrl = request.nextUrl.origin;
  const redirectUrl = new URL(`/${locale}/payment/result`, baseUrl);
  
  // Add all relevant parameters
  if (orderId) redirectUrl.searchParams.set('order_id', orderId);
  if (status) redirectUrl.searchParams.set('status', status);
  if (sessionId) redirectUrl.searchParams.set('session_id', sessionId);
  if (paymentIntentId) redirectUrl.searchParams.set('payment_intent_id', paymentIntentId);
  
  // Redirect to the frontend payment result page
  return NextResponse.redirect(redirectUrl);
}

// Also handle POST requests in case the payment gateway uses POST
export async function POST(request: NextRequest) {
  return GET(request);
}
