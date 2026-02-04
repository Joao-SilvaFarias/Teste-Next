import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase'; // Certifique-se que este use a Service Role Key
import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  // 1. Validação de Assinatura do Stripe
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret!);
  } catch (err: any) {
    console.error(`⚠️ Erro na assinatura do Webhook: ${err.message}`);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  console.log(`🔔 Processando evento: ${event.type}`);

  try {
    switch (event.type) {
      // EVENTO: Checkout finalizado com sucesso
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Prioridade para o client_reference_id (ID do aluno no seu banco)
        const email = session.client_reference_id || session.customer_details?.email;
        if (email) await atualizarStatus(email, 'ativo');
        break;
      }

      // EVENTO: Pagamento de fatura (Renovação mensal)
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        if (email) await atualizarStatus(email, 'ativo');
        break;
      }

      // EVENTO: Falha no pagamento (Cartão recusado, etc)
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        // Aqui você pode definir como 'pendente' para dar um aviso na recepção
        if (email) await atualizarStatus(email, 'pendente');
        break;
      }

      // Este evento dispara no minuto exato em que o período pago acaba
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as Stripe.Customer).email;
        if (email) await atualizarStatus(email, 'inativo');
        break;
      }

      // EVENTO: Atualização de assinatura (Controle de ciclo de vida)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as Stripe.Customer).email;

        if (email) {
          // LÓGICA DE RESPEITO AO PERÍODO PAGO:

          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            // Se o status mudou para cancelado ou não pago, bloqueia.
            await atualizarStatus(email, 'inativo');
          }
          else if (subscription.cancel_at_period_end === true) {
            // O aluno cancelou, mas ainda tem dias pagos.
            // MANTEMOS COMO ATIVO para ele continuar treinando até o fim do ciclo.
            console.log(`ℹ️ Aluno ${email} cancelou, mas tem acesso até o fim do período.`);
            await atualizarStatus(email, 'ativo');
          }
          else if (subscription.status === 'active') {
            // Assinatura normal e saudável
            await atualizarStatus(email, 'ativo');
          }
          else if (subscription.status === 'past_due') {
            // Pagamento atrasado (tentando cobrar), status vira pendente
            await atualizarStatus(email, 'pendente');
          }
        }
        break;
      }

      default:
        console.log(`ℹ️ Evento não monitorado: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error(`❌ Erro interno ao processar ${event.type}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// FUNÇÃO AUXILIAR DE BANCO DE DADOS
async function atualizarStatus(email: string, status: string) {
  const customerEmail = email.toLowerCase().trim();

  // Usamos o supabaseAdmin para ignorar RLS e garantir a escrita
  const { error } = await supabaseAdmin
    .from('alunos')
    .update({ status_assinatura: status })
    .eq('email', customerEmail);

  if (error) {
    console.error(`[Supabase Error]: ${error.message} para o aluno ${customerEmail}`);
    throw error;
  }

  console.log(`✅ [${status.toUpperCase()}] aplicado para: ${customerEmail}`);
}