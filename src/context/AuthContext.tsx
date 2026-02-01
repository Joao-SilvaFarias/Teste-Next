'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

// Definimos o que o nosso contexto vai compartilhar
interface AuthContextType {
  user: any;
  perfil: any;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function getPerfil(session: any) {
    if (session?.user) {
      setUser(session.user);
      const { data } = await supabase
        .from('alunos')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();
      setPerfil(data);
    } else {
      setUser(null);
      setPerfil(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    // Checagem inicial
    supabase.auth.getSession().then(({ data: { session } }) => getPerfil(session));

    // Ouvinte de mudanças (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      getPerfil(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Garante limpeza total
  };

  const isAdmin = perfil?.role === 'admin' || perfil?.role === 'aluno_admin';

  return (
    <AuthContext.Provider value={{ user, perfil, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export const useAuth = () => useContext(AuthContext);