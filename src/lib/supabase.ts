import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cliente para o Navegador (Seguro)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para o Servidor (Admin) - Só inicializa se estiver no ambiente Node (servidor)
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  : null as any;