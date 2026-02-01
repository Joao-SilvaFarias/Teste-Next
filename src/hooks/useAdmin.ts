'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function verificarAcesso() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/admin/login');
        return;
      }

      const { data: perfil } = await supabase
        .from('alunos')
        .select('role')
        .eq('email', session.user.email)
        .maybeSingle();

      if (!perfil || (perfil.role !== 'admin')) {
        router.replace('/'); 
        return;
      }

      setUser(session.user);
      setLoading(false);
    }

    verificarAcesso();
  }, [router]);

  return { loading, user };
}