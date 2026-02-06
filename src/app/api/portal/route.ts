import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/src/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any });

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Buscar o ID do cliente no Stripe através do e-mail
    const customers = await stripe.customers.list({ email: email.toLowerCase().trim(), limit: 1 });
    
    if (customers.data.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado no Stripe." }, { status: 404 });
    }

    // 2. Criar uma sessão do Portal de Gerenciamento
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${"http://localhost:3000"}/perfil`, // Para onde ele volta ao sair do portal
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}