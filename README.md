# r2-d6

Companheiro de mesa para jogadores do **Star Wars Roleplaying Game REUP** (sistema D6) jogado na mesa física. Interface e documentação em português do Brasil; termos do jogo ficam em inglês (Wild Die, Character Points, Force Points).

- **v2 (este monorepo):** app com conta, fichas no servidor, campanhas, rolagens compartilhadas em tempo real, modo mesa, PWA offline. Visual "datapad de bordo".
- **v1 (`app/`):** protótipo estático congelado. Continua funcionando (`.claude/launch.json`, configuração `r2-d6-app`, porta 8080) e é a fonte da lógica de regras portada para `packages/rules`.
- **`data/`:** base de conhecimento do livro (fonte única das regras). Não é alterada pela v2.

> Projeto de fãs, aberto e sem fins comerciais, sem vínculo com a Lucasfilm ou a Disney. Star Wars é marca de seus titulares. Nenhuma marca, logotipo ou fonte da Lucasfilm; arte só original.
>
> O PDF da REUP não está no repositório. Para conferir citações, coloque sua cópia em `data/raw-data/`.

## Como rodar (3 comandos)

Pré-requisitos: **Node 22.12+**, **Docker Desktop rodando** (só para Postgres e Mailpit) e, opcionalmente, Python 3 (gera os dados; sem ele o script copia o bundle do v1).

```powershell
docker compose up -d     # Postgres 17 (5432) e Mailpit (SMTP 1025, UI http://localhost:8025)
npm install
npm run dev              # predev: cria .env, gera dados se faltarem, espera o banco, migra e faz o seed
```

- Web: <http://localhost:5173> (o Vite faz proxy de `/api` e `/socket.io`; o cookie de sessão é do mesmo site).
- API: <http://localhost:3000> (`/healthz`, `/readyz`).
- E-mails de reset de senha: Mailpit em <http://localhost:8025>.

### Contas de demonstração (só desenvolvimento)

| E-mail | Papel | Senha |
|---|---|---|
| `mestre@r2d6.local` | mestre da campanha "Demo: Fuga de Tatooine" (e dona da piloto Zia Marn) | `r2d6-demo-2026` (`SEED_PASSWORD` em `.env.example`) |
| `jogador@r2d6.local` | jogador (dono do contrabandista Kael Varn) | idem |

A senha demo vem de `SEED_PASSWORD` (`.env.example`; o padrão do seed é o mesmo valor). Tem 14 caracteres porque o cadastro exige pelo menos 10. O seed também cria o convite `DEMO-R2D6` para a campanha. Para recomeçar do zero: `docker compose down -v` e rode os comandos de novo.

## Verificação

```powershell
npm test            # Vitest: 56 testes de regras/dados (migrados do v1) + testes de API (usa o banco r2d6_test)
npm run typecheck   # tsc em todos os pacotes
npm run test:e2e    # Playwright (Chromium): precisa da stack de pé (docker compose up -d + npm run dev)
```

O Playwright é devDependency do projeto; na primeira vez rode `npx playwright install chromium`. As capturas de layout (375, 768, 1024, 1366) vão para `e2e/screenshots/`.

## Estrutura

```
apps/web         SPA React 19 + Vite + Tailwind 4 + Motion + TanStack Query + Zustand + Dexie + vite-plugin-pwa (dados 3D com R3F, carregados sob demanda)
apps/api         Fastify 5 + Drizzle + PostgreSQL 17 + Better Auth (Argon2id) + Socket.IO
packages/rules   @r2d6/rules: dice/rules (porta do v1), sheet (Ajv), creation (assistente), ops (sync), round (mesa)
packages/data    @r2d6/data: bundle gerado de data/, catálogo, busca, Markdown seguro
packages/contracts  @r2d6/contracts: schemas Zod de DTOs e eventos
docs/            arquitetura, ADRs, especificação, direção visual, backlog
tools/           scripts Python (build_app_data.py --out, gen_image_briefs.py ...)
```

Documentação: `docs/architecture.md`, `docs/adr/`, `docs/product-spec-v2.md`, `docs/visual-direction.md`, `docs/ux-platforms.md`, `docs/rules-decisions.md`, `docs/backlog.md` (o que ficou de fora).

## Onde colocar as imagens

O app tem **568 espaços de imagem** (`docs/image-manifest.json`, descrições em `docs/image-briefs.md`; o manifesto é gerado por `tools/gen_image_briefs.py`, não edite o JSON à mão). Enquanto não existe arquivo, o componente `ArtSlot` desenha um placeholder da família (gradiente, scanlines, ícone, alt e, em dev, o id no tooltip).

1. Salve a arte como `apps/web/public/art/<id>.webp` (ex.: `apps/web/public/art/hero.login.webp`; AVIF/PNG/JPG/SVG também são aceitos) ou no caminho que o campo `file` do manifesto indicar.
2. Abra <http://localhost:5173/dev/art>: lista todos os espaços com status (tem arte / usa reserva / falta) e a reserva em uso. Itens (`weapon.<id>`, `armor.`, `gear.`, `vehicle.`, `starship.`, `skill.`, `power.`) caem na reserva de categoria do campo `fallback` do manifesto e depois no placeholder da família, proporção, ponto focal e descrição. A página atualiza ao recarregar.
3. Só arte original. Nada de logos, marcas, fontes ou quadros da Lucasfilm.

## Configuração opcional (variáveis em `.env`)

| Variável | Efeito |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Ligam o login social (botões só aparecem se configurados). Desligado por padrão: exige criar os apps OAuth. |
| `ANTHROPIC_API_KEY` | Liga o **Holocron** (assistente de regras com IA, modelo `claude-haiku-5-5` por padrão em `ASSISTANT_MODEL`, corpus de `data/rules` em cache de prompt e citação de página obrigatória). Vazio = a tela mostra "em breve". Nunca versione a chave. |
| `MEDIA_DIR` | Pasta dos retratos enviados (padrão `.data/media`, fora do git). |

## Login com Google (opcional)

O botão "Entrar/Cadastrar com Google" sempre aparece, mas fica **desabilitado** (com dica para quem administra) até as credenciais existirem. Escolhi mostrá-lo desabilitado, e não escondê-lo, para o administrador descobrir como ligar. O primeiro login cria a conta com nome e e-mail do Google; se já existir conta de e-mail com o mesmo e-mail, ela é vinculada (o Google só entra como provedor confiável porque garante e-mail verificado).

1. No [Google Cloud Console](https://console.cloud.google.com/) crie (ou escolha) um projeto, configure a **Tela de consentimento OAuth** (escopos `openid`, `email`, `profile`) e em **APIs e serviços > Credenciais > Criar credenciais > ID do cliente OAuth**.
2. Tipo de aplicativo: **Aplicativo da Web**.
3. **Origens JavaScript autorizadas:** `http://localhost:5173`
4. **URIs de redirecionamento autorizados:** `http://localhost:5173/api/auth/callback/google`. O callback é do Better Auth e passa pelo proxy do Vite (5173 para a API em 3000); ele é montado a partir de `APP_URL` (o `baseURL` do Better Auth), então em produção use `https://SEU-DOMINIO/api/auth/callback/google` e ajuste `APP_URL`.
5. No `.env`: `GOOGLE_CLIENT_ID=...` e `GOOGLE_CLIENT_SECRET=...` e reinicie `npm run dev`. `GET /api/meta` passa a mostrar `features.google: true`.

Verificado só até o redirecionamento (teste de API com credenciais falsas confere `client_id` e `redirect_uri`); o login real com o Google não foi testado.

## Dicas

- **Celular na rede local:** `npm run dev -w @r2d6/web -- --host` e abra `http://<ip-do-pc>:5173`. O service worker só registra em HTTPS ou localhost (use um túnel para testar a instalação do PWA no celular).
- **"Não consegui falar com o Postgres":** abra o Docker Desktop e rode `docker compose up -d`.
- **Dados de regras:** `npm run data:build` regenera `packages/data/generated/bundle.json` a partir de `data/` (o `predev` só gera se faltar).
- Atalhos no PC: `/` ou `Ctrl+K` busca; no modo mesa, `R` rola, `N` próximo round, `1`-`9` ações declaradas.
