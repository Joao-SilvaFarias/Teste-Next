import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../src/lib/supabase';
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as any;
  const email = session.customer_details?.email || session.email;

  switch (event.type) {
    // 1. Pagamento aprovado ou nova assinatura
    case 'checkout.session.completed':
    case 'invoice.paid':
      if (email) {
        await supabaseAdmin
          .from('alunos')
          .update({ status_assinatura: 'ativo' })
          .eq('email', email.toLowerCase().trim());
      }
      break;

    // 2. Assinatura cancelada ou pagamento falhou definitivamente
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed':
      // Aqui buscamos o cliente pelo ID do Stripe para pegar o e-mail
      const customer = await stripe.customers.retrieve(session.customer as string);
      const customerEmail = (customer as Stripe.Customer).email;

      if (customerEmail) {
        await supabaseAdmin
          .from('alunos')
          .update({ status_assinatura: 'cancelado' })
          .eq('email', customerEmail.toLowerCase().trim());
        
        console.log(`🚫 Acesso bloqueado para: ${customerEmail}`);
      }
      break;
  }

  return NextResponse.json({ received: true });
}