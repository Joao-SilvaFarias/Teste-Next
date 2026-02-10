import { NextResponse } from 'next/server';
import { stripe } from '@/src/lib/stripe';
import { getAppUrl } from '@/src/lib/env';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Price ID não fornecido' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: typeof email === 'string' ? email : undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${getAppUrl()}/registrar-rosto?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: getAppUrl(),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('ERRO STRIPE [checkout]:', error);
    return NextResponse.json({ error: 'Não foi possível iniciar o checkout.' }, { status: 500 });
  }
}
