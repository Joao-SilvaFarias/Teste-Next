import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase';
import { stripe } from '@/src/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, sessionId, faceDescriptor } = await req.json();
    let emailFinal = typeof email === 'string' ? email : undefined;
    let nomeFinal = 'Aluno Nova Academia';

    if (sessionId && typeof sessionId === 'string') {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.customer_details) {
        emailFinal = session.customer_details.email ?? emailFinal;
        nomeFinal = session.customer_details.name || nomeFinal;
      }
    }

    if (!emailFinal) {
      return NextResponse.json({ success: false, error: 'Email não identificado.' }, { status: 400 });
    }

    const emailLimpo = emailFinal.toLowerCase().trim();

    const { error } = await supabaseAdmin
      .from('alunos')
      .upsert(
        {
          email: emailLimpo,
          nome: nomeFinal,
          face_descriptor: faceDescriptor,
          status_assinatura: 'ativo',
        },
        { onConflict: 'email' },
      );

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ERRO API [salvar-rosto]:', error);
    return NextResponse.json({ success: false, error: 'Falha ao salvar biometria.' }, { status: 500 });
  }
}
