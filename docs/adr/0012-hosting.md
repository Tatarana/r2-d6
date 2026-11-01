# ADR-0012: Hospedagem em um serviço PaaS com Postgres gerenciado

- Status: aceito (2026-11-01): Fly.io + Neon, máquina sempre ligada, subdomínio `fly.dev`, login só com Google
  (`EMAIL_LOGIN=off`, dispensa provedor de e-mail) e cadastro só por convite (`SIGNUP_MODE=invite`). Passo a passo em
  [docs/deploy.md](../deploy.md).

## Contexto

Uso inicial por um ou poucos grupos, orçamento baixo, uma pessoa operando. WebSocket é necessário. Cookie de sessão funciona melhor com front e API na mesma origem.

## Decisão

- **Um container** com a API servindo também o front estático (`apps/web/dist`): mesma origem, um deploy, um domínio.
- **PaaS** (Render, Fly.io ou Railway) com Postgres gerenciado e backups; Cloudflare R2 para mídia e cópia diária do `pg_dump`; e-mail transacional no plano gratuito (Resend, Postmark ou SES). Ordem de custo: US$ 13 a 25/mês (conferir preços na contratação; mudaram em 2026).
- Dockerfile multi-stage na raiz; migrações rodam no início do deploy (`db:migrate`).
- Caminho de escala sem mudar a arquitetura: AWS (CloudFront + S3, ALB + ECS Fargate em duas AZs, RDS Multi-AZ, ElastiCache se necessário, SES, Secrets Manager), ordem de US$ 250 a 800/mês, ou equivalentes em GCP/Azure.

## Alternativas

- **VPS com docker compose (Caddy + API + Postgres):** US$ 6 a 12/mês, mas atualizações, firewall, backup e restauração ficam com o usuário.
- **Front em CDN separada (Cloudflare Pages) + API em outro domínio:** cookie entre subdomínios do mesmo site funciona, mas exige domínio próprio e CORS com credenciais; ganho pequeno no porte.
- **Serverless (Lambda, Cloud Run com escala a zero):** WebSocket e conexões Postgres ficam mais complicados; partida a frio na mesa.
- **Kubernetes:** desproporcional.

## Consequências

- Ponto único de falha aceito no plano pequeno, compensado pelo offline-first e por backups testados.
- Trocar de PaaS é barato (é só um container e um Postgres).
