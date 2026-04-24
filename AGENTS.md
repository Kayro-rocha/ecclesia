# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Params e SearchParams
- Em Next.js 15, `params` e `searchParams` são Promise — sempre use `await params`
- Nunca acesse `params.id` diretamente, sempre `const { id } = await params`

## Componentes
- Server Components por padrão — só adicione `'use client'` quando necessário (interatividade, hooks, browser APIs)
- Nunca use `useEffect` para buscar dados que poderiam ser server-side

## Prisma
- Sempre inclua `parentChurchId` no `select` quando for usar `hasChurchAccess()`
- Unique constraint em Tithe: `[churchId, memberId, month, year]`
