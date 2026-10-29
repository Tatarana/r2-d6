# ADR-0003: Back em Node + Fastify com REST, contratos Zod e OpenAPI

- Status: proposto (2026-10-28)

## Contexto

O back guarda fichas, campanhas e rolagens, autentica, faz upload e distribui eventos. Tem de reaproveitar a lógica JS de regras (`dice.js`, `rules.js`) e rodar no Windows sem fricção. O cliente reenvia mutações feitas offline.

## Decisão

**Node 22 + Fastify 5 + TypeScript**, monólito modular (`auth`, `characters`, `campaigns`, `rolls`, `media`, `assistant`, `me`).

- API **REST JSON** sob `/api`; schemas Zod em `@r2d6/contracts` validam a entrada (`fastify-type-provider-zod`) e tipam o cliente; OpenAPI gerado (`@fastify/swagger`, UI em `/api/docs`).
- Erros `application/problem+json`; `Idempotency-Key` em todas as mutações.
- Plugins: `@fastify/multipart`, `@fastify/rate-limit`, `@fastify/helmet`, `@fastify/static` (serve o front em produção), `@fastify/cookie`.
- Dev com `tsx watch`; build com `tsup`; logs pino.

## Alternativas

- **tRPC:** tipos ponta a ponta sem gerar nada, mas o outbox offline precisa reenviar requisições simples e idempotentes; upload multipart e o Better Auth já são REST; amarraria clientes futuros (bot de Discord, app nativo) ao TypeScript. Com Zod compartilhado, o REST fica quase tão tipado.
- **GraphQL:** flexível para leitura, custo alto (schema, resolvers, cache, autorização por campo) sem necessidade real.
- **NestJS:** estrutura pesada (decorators, DI) para um time de uma pessoa.
- **Hono:** moderno e leve, mas ecossistema de plugins e integração com Socket.IO menos maduros que o Fastify.
- **Express:** maduro, mas mais lento e sem validação por schema nativa.

## Consequências

- Uma única via de escrita (REST); o WebSocket só distribui (ADR-0006).
- Contratos mudam em um lugar (`@r2d6/contracts`) e quebram o build dos dois lados se divergirem.
- OpenAPI permite testar a API pelo navegador e gerar clientes.
