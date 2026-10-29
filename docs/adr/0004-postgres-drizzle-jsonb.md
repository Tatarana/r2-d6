# ADR-0004: PostgreSQL + Drizzle; ficha como JSONB com revisões e snapshots

- Status: proposto (2026-10-28)

## Contexto

Há dados claramente relacionais (usuários, sessões, campanhas, membros e papéis, convites, rolagens) e um documento rico, já especificado por JSON Schema (`data/character-sheet.schema.json`), que é a ficha. O usuário quer histórico de versões. Não há Postgres local; Docker está disponível.

## Decisão

- **PostgreSQL 17** (imagem `postgres:17-alpine` no `docker-compose.yml`, volume nomeado; banco `r2d6_test` criado por `docker/postgres/init.sql`).
- **Drizzle ORM** com schema em TS e migrações SQL geradas pelo `drizzle-kit` e versionadas.
- Ficha em `characters.sheet` (**JSONB**, validada por Ajv contra o schema), estado de mesa em `characters.play_state` (JSONB), campos desnormalizados para listas (`name`, `species_id`, `template_type`).
- Histórico em duas camadas: `character_changes` (cada revisão com as ops, base do rebase offline e da auditoria; retenção 90 dias) e `character_versions` (snapshots visíveis: criação, marco, aprovação, evolução, restauração e um automático por sessão de jogo).
- Ids UUIDv7 (fichas e rolagens gerados no cliente, para criação offline).

## Alternativas

- **Ficha normalizada em tabelas** (atributos, perícias, especializações, armas): consultas finas que não precisamos, dezenas de joins e migrações a cada ajuste do schema; perde a correspondência direta com o schema do livro.
- **MongoDB/documento puro:** a ficha cabe bem, mas campanhas, papéis e convites pedem relações e transações; dois bancos seria pior.
- **Prisma:** maduro e popular, mas a geração de cliente e o histórico de engine binária adicionam passos; Drizzle é TS puro e próximo do SQL.
- **SQLite:** simples no dev, mas tempo real multi-instância e produção gerenciada favorecem Postgres; manter dois dialetos não compensa.
- **Event sourcing completo:** o log de ops já dá auditoria; reconstruir estado por eventos seria complexidade sem ganho.

## Consequências

- Validação estrutural fica no app (Ajv), não no banco; o banco garante relações e unicidade.
- Consultas por conteúdo da ficha usam operadores JSONB (e índices GIN se necessário).
- Snapshots ocupam espaço (fichas têm poucos KB; irrelevante no porte).
