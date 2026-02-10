import type { Metadata } from 'next';
import { Inter, Archivo } from 'next/font/google';
import './globals.css';
import Navbar from '@/src/components/Navbar';
import { AuthProvider } from '@/src/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: 'BXVS Connect | Gestão profissional para academia',
  description: 'Sistema de gestão para academia com biometria facial, controle de acesso e automação de assinaturas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${archivo.variable}`}>
        <AuthProvider>
          {children}
          <Navbar />
        </AuthProvider>
      </body>
    </html>
  );
}
