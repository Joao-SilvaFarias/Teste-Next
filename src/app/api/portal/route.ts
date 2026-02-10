import { NextResponse } from 'next/server';
import { stripe } from '@/src/lib/stripe';
import { getAppUrl } from '@/src/lib/env';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }

    const customers = await stripe.customers.list({ email: email.toLowerCase().trim(), limit: 1 });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'Cliente não encontrado no Stripe.' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${getAppUrl()}/perfil`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('ERRO STRIPE [portal]:', error);
    return NextResponse.json({ error: 'Não foi possível abrir o portal de assinaturas.' }, { status: 500 });
  }
}
