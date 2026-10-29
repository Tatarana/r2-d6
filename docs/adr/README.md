# ADRs do r2-d6 v2

Registro das decisões de arquitetura. Formato: contexto, decisão, alternativas, consequências, status. Visão geral em `docs/architecture.md`.

| ADR | Decisão | Status |
|---|---|---|
| [0001](0001-monorepo-npm-workspaces.md) | Monorepo com npm workspaces e pacotes TS internos | proposto |
| [0002](0002-frontend-react-vite-pwa.md) | Front: SPA React + Vite, PWA, Tailwind + shadcn/ui | proposto |
| [0003](0003-backend-fastify-rest.md) | Back: Node + Fastify, REST com contratos Zod e OpenAPI | proposto |
| [0004](0004-postgres-drizzle-jsonb.md) | PostgreSQL + Drizzle; ficha como JSONB com revisões e snapshots | proposto |
| [0005](0005-auth-better-auth-cookie.md) | Auth: Better Auth, Argon2id, sessão em cookie httpOnly; OAuth e magic link opcionais | proposto |
| [0006](0006-realtime-socketio.md) | Tempo real: Socket.IO só para distribuição; escrita via REST | proposto |
| [0007](0007-offline-sync-ops-rebase.md) | Offline: IndexedDB + outbox; ops com `inc` e rebase por revisão | proposto |
| [0008](0008-shared-rules-and-data.md) | `@r2d6/rules` e `@r2d6/data` compartilhados; bundle do script Python | proposto |
| [0009](0009-server-authoritative-rolls.md) | Rolagens compartilhadas sorteadas no servidor | proposto |
| [0010](0010-media-storage.md) | Mídia: sharp + driver local/S3; R2 em produção; sem MinIO | proposto |
| [0011](0011-rules-assistant-claude.md) | Assistente de regras com Claude, corpus em cache, sem dados do usuário | proposto |
| [0012](0012-hosting.md) | Hospedagem: um serviço em PaaS + Postgres gerenciado; AWS como referência de escala | proposto |
