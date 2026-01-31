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
    console.error(`⚠️ Erro na assinatura do Webhook: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  console.log(`🔔 Evento recebido: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email;
        if (email) await atualizarStatus(email, 'ativo');
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        if (email) await atualizarStatus(email, 'ativo');
        break;
      }

      // Este é o evento principal de cancelamento
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // Buscamos o cliente porque o evento de assinatura nem sempre traz o email direto
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as Stripe.Customer).email;

        if (email) {
          await atualizarStatus(email, 'cancelado');
          console.log(`🚫 Assinatura deletada para: ${email}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        if (email) await atualizarStatus(email, 'inativo');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // 1. Buscamos o email do cliente
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as Stripe.Customer).email;

        if (email) {
          // 2. Verificamos se o aluno marcou para cancelar ao fim do período
          // ou se a assinatura foi cancelada/inadimplente
          const deveBloquear =
            subscription.cancel_at_period_end === true ||
            subscription.status === 'canceled' ||
            subscription.status === 'unpaid';

          if (deveBloquear) {
            await atualizarStatus(email, 'cancelado');
          } else if (subscription.status === 'active') {
            // Se o aluno reativou a assinatura antes dela expirar
            await atualizarStatus(email, 'ativo');
          }
        }
        break;
      }
    }
  } catch (dbError) {
    console.error(`❌ Erro ao processar evento ${event.type}:`, dbError);
    return NextResponse.json({ error: 'Internal Database Error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function atualizarStatus(email: string, status: string) {
  const customerEmail = email.toLowerCase().trim();

  const { error } = await supabaseAdmin
    .from('alunos')
    .update({ status_assinatura: status }) // AQUI: Usar a variável status, não o texto fixo
    .eq('email', customerEmail); // Como já usamos toLowerCase(), o eq funciona perfeitamente

  if (error) {
    console.error(`Erro no Supabase: ${error.message}`);
    throw error;
  }

  console.log(`🔄 Status atualizado para [${status.toUpperCase()}] | Aluno: ${customerEmail}`);
}