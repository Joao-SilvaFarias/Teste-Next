// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: "Price ID não fornecido" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      // Certifique-se que NEXT_PUBLIC_URL está correta no .env
      success_url: `http://localhost:3000/registrar-rosto?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("ERRO STRIPE:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}