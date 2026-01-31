import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../src/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { email, sessionId, faceDescriptor } = await req.json();
    let emailFinal = email;
    let nomeFinal = "Aluno Nova Academia"; // Valor padrão caso não ache o nome

    // 1. Busca dados completos no Stripe
    if (sessionId) {
      console.log("Buscando dados no Stripe pelo sessionId:", sessionId);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.customer_details) {
        emailFinal = session.customer_details.email;
        nomeFinal = session.customer_details.name || nomeFinal;
      }
    }

    if (!emailFinal) {
      return NextResponse.json({ success: false, error: "Email não identificado" }, { status: 400 });
    }

    const emailLimpo = emailFinal.toLowerCase().trim();

    // 2. Tenta o UPSERT com os campos obrigatórios
    const { error } = await supabaseAdmin
      .from('alunos')
      .upsert({ 
        email: emailLimpo, 
        nome: nomeFinal, // <--- AGORA O NOME ESTÁ AQUI PARA NÃO DAR ERRO
        face_descriptor: faceDescriptor,
        status_assinatura: 'ativo' 
      }, { onConflict: 'email' });

    if (error) {
        console.error("Erro Supabase:", error.message);
        throw error;
    }

    console.log("✅ Biometria e Nome salvos com sucesso!");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("ERRO NA API SALVAR-ROSTO:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}