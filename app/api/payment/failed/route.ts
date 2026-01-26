import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Failed Handler
 * 
 * This API route handles failed payment callbacks.
 * The backend or payment gateway redirects here after failed payment.
 * 
 * Expected URL: /api/payment/failed?o_id=123
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Extract order ID - support multiple naming conventions
  const orderId = searchParams.get('o_id') || searchParams.get('order_id') || searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  const error = searchParams.get('error') || searchParams.get('message');
  
  // Get the locale from cookies or default to 'ar'
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 'ar';
  
  // Build the redirect URL to the frontend payment result page
  const baseUrl = request.nextUrl.origin;
  const redirectUrl = new URL(`/${locale}/payment/result`, baseUrl);
  
  // Add parameters
  redirectUrl.searchParams.set('status', 'failed');
  if (orderId) redirectUrl.searchParams.set('order_id', orderId);
  if (sessionId) redirectUrl.searchParams.set('session_id', sessionId);
  if (error) redirectUrl.searchParams.set('error', error);
  
  // Redirect to the frontend payment result page
  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
