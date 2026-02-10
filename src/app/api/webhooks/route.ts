import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/src/lib/supabase';
import { getServerSecrets } from '@/src/lib/env';

export const runtime = 'nodejs';

const serverSecrets = getServerSecrets();

const stripe = new Stripe(serverSecrets.stripeSecretKey, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  if (!serverSecrets.stripeWebhookSecret) {
    return NextResponse.json({ error: 'Webhook secret não configurado.' }, { status: 500 });
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Assinatura Stripe ausente.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, serverSecrets.stripeWebhookSecret);
  } catch (error) {
    console.error('ERRO [webhook assinatura]:', error);
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email ?? session.customer_email ?? undefined;

        if (email) await atualizarStatus(email, 'ativo');
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer_email) await atualizarStatus(invoice.customer_email, 'ativo');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer_email) await atualizarStatus(invoice.customer_email, 'pendente');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const customerEmail = (customer as Stripe.Customer).email;
        if (customerEmail) await atualizarStatus(customerEmail, 'inativo');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as Stripe.Customer).email;

        if (!email) break;

        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          await atualizarStatus(email, 'inativo');
        } else if (subscription.cancel_at_period_end || subscription.status === 'active') {
          await atualizarStatus(email, 'ativo');
        } else if (subscription.status === 'past_due') {
          await atualizarStatus(email, 'pendente');
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`ERRO [webhook ${event.type}]:`, error);
    return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}

async function atualizarStatus(email: string, status: 'ativo' | 'pendente' | 'inativo') {
  const customerEmail = email.toLowerCase().trim();

  const { error } = await supabaseAdmin
    .from('alunos')
    .update({ status_assinatura: status })
    .eq('email', customerEmail);

  if (error) {
    throw new Error(`[Supabase] ${error.message}`);
  }
}
