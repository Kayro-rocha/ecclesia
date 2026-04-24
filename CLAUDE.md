# Ecclesia — Instruções para o Claude

@AGENTS.md

## Comportamento geral
- Nunca edite arquivos sem perguntar antes o que vai fazer
- Sempre apresente o plano antes de implementar qualquer coisa nova
- Respostas curtas e diretas, sem enrolação

## Stack
- Next.js 15 App Router com TypeScript
- Prisma ORM + MySQL
- NextAuth.js para autenticação de gestores
- Cookie próprio (membro_token) para autenticação de membros
- Resend para e-mails, Evolution API para WhatsApp, Asaas para pagamentos
- Web Push / VAPID para notificações push

## Regras do banco
- Nunca altere o schema sem criar a migration correspondente
- Migrations não-interativas: usar `prisma db execute --file` + `prisma migrate resolve --applied`
- Nunca use SQL raw sem necessidade

## Planos
- IGREJA: igreja única, sem filiais
- REDE: sede + até 3 filiais. Pastor da sede acessa tudo via `hasChurchAccess()`

## Segurança
- Toda rota de API deve verificar sessão e usar `hasChurchAccess()` para rotas de gestão
- Rotas do membro usam `getMembroSession()` de `@/lib/membro-auth`

## O que ainda falta implementar
- Frequência/attendance (cron job)
- Confirmação de presença em eventos automática (app nativo WebView + location bridge)
- Domínio definitivo ainda não definido (hoje usa marketcontroll.com)
