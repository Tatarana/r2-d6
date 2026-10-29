# ADR-0010: Mídia com sharp e driver local ou S3; R2 em produção

- Status: proposto (2026-10-28)

## Contexto

Upload de retrato do personagem (e depois avatar e banner de campanha). No dev precisa funcionar sem serviço externo; em produção, armazenamento durável e barato. A edição comunitária do MinIO deixou de publicar imagens Docker em 2025 e entrou em modo de manutenção (depois arquivada).

## Decisão

- Upload via API (`POST /api/media`, multipart, até 8 MB). O `sharp` decodifica (rejeita o que não for JPEG, PNG, WebP ou AVIF de verdade), remove EXIF e gera WebP de 256 e 768 px.
- Interface `StorageDriver { put, get, delete, url }` com dois drivers: **`local`** (pasta `.data/media`, entregue pela API com checagem de permissão) e **`s3`** (`@aws-sdk/client-s3`, endpoint configurável).
- Produção: **Cloudflare R2** (10 GB e egress gratuitos) ou S3; entrega por URL assinada de curta duração ou pela API com cache.
- O service worker guarda retratos já vistos (CacheFirst).
- As imagens do universo (artes do app) não são mídia de usuário: ficam em `apps/web/public/art/` com placeholders.

## Alternativas

- **MinIO no compose:** daria paridade S3 local, mas não há mais imagem oficial e o projeto não é mantido; forks e imagens de terceiros são risco de manutenção.
- **Garage, SeaweedFS, LocalStack no compose:** possíveis se for preciso testar S3 localmente; desnecessários com o driver local.
- **Upload direto do navegador para o S3 (URL pré-assinada):** economiza banda da API, mas o processamento com `sharp` exigiria função separada; desnecessário com imagens pequenas.
- **Imagem em `bytea` no Postgres:** simples, mas incha backups e o banco.

## Consequências

- Mesma interface no dev e na produção; trocar por variável `STORAGE_DRIVER`.
- A API processa imagens (CPU por alguns centésimos de segundo por upload; ok no porte).
