# BXVS Connect

Sistema de gestão para academia com foco em operação real: autenticação, biometria facial, área administrativa e cobrança recorrente via Stripe.

## Requisitos

- Node.js 20+
- npm 10+
- Projeto Supabase configurado
- Conta Stripe (modo teste e produção)

## Variáveis de ambiente

Crie um arquivo `.env.local` com:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

> Em produção, use a URL pública do seu domínio em `NEXT_PUBLIC_APP_URL`.

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Fluxo de pagamento (Stripe)

1. API `/api/checkout` cria sessão de assinatura.
2. Webhook `/api/webhooks` recebe eventos e atualiza status do aluno.
3. API `/api/portal` abre o portal de gerenciamento da assinatura.
4. API `/api/salvar-rosto` salva biometria após checkout concluído.

## Padrões de produção recomendados

- Use banco Supabase com backups ativos.
- Configure observabilidade (logs e alertas) para webhooks.
- Mantenha chaves separadas por ambiente (dev/staging/prod).
- Ative HTTPS e domínio próprio no deploy.

## Scripts

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm run start   # servidor de produção
npm run lint    # lint do projeto
```
