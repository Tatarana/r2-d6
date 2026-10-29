# ADR-0005: Autenticação com Better Auth, Argon2id e sessão em cookie httpOnly

- Status: proposto (2026-10-28)

## Contexto

O usuário pediu login. Grupos de RPG costumam usar Discord. O protótipo tem de rodar localmente sem serviços externos. O mesmo jogador usa vários aparelhos e precisa sair de um deles remotamente. O WebSocket precisa autenticar com a mesma credencial.

## Decisão

- **Better Auth** como biblioteca, montada na API em `/api/auth/*`, com adaptador Drizzle (tabelas `user`, `session`, `account`, `verification` no nosso Postgres).
- **Protótipo:** e-mail e senha; hash **Argon2id** (`@node-rs/argon2`, m=19 MiB, t=2, p=1) via `password.hash/verify`; senha mínima de 10 caracteres e bloqueio de senhas comuns; **sessão no banco com cookie httpOnly**, `SameSite=Lax`, `Secure` em produção, 30 dias renováveis; listar e revogar sessões; reset de senha por e-mail (Mailpit no dev). Verificação de e-mail ligada só em produção.
- **Pronto, desligado por padrão:** OAuth Discord e Google, ativados se as variáveis `*_CLIENT_ID/SECRET` existirem.
- **Depois:** magic link (plugin) quando houver e-mail de produção confiável; passkeys.
- Rate limit nas rotas de auth; `trustedOrigins`; respostas que não revelam se o e-mail existe.
- Mesma origem no dev (proxy do Vite) e em produção (API serve o front), então o cookie funciona sem CORS com credenciais.

## Alternativas

- **Implementação própria (padrão Lucia/oslo):** controle total e pouco código, mas reset, OAuth, rate limit e rotação de sessão ficam por nossa conta; mais superfície para erro.
- **Auth.js:** o projeto passou a ser mantido junto do Better Auth; o Better Auth é a opção atual para TS fora do Next.
- **Serviços gerenciados (Clerk, Auth0, Supabase Auth, Cognito):** rápidos, mas exigem rede e conta externa até no dev, dados de usuário fora do nosso banco e custo por usuário ativo depois do plano gratuito.
- **JWT em `localStorage`:** sem revogação imediata e exposto a XSS.
- **Só magic link:** depende de e-mail funcionando desde o primeiro dia; ruim na mesa sem sinal para abrir o e-mail.

## Consequências

- Dependência de uma biblioteca com releases frequentes: fixar versão e isolar em `apps/api/src/auth`.
- Uma consulta de sessão por requisição (desprezível; há cache em cookie assinado se precisar).
- Se `@node-rs/argon2` der problema em alguma máquina, o fallback é o scrypt padrão do Better Auth (também aceito pela OWASP), mantendo o formato do hash identificável para migrar depois.
