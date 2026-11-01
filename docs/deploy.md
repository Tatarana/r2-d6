# Deploy em produção (Fly.io + Neon)

Decisão em [ADR-0012](adr/0012-hosting.md): um container na Fly.io (API servindo o front, Socket.IO), sempre ligado,
Postgres no Neon, retratos num volume da Fly, endereço `https://<app>.fly.dev`, **login só com Google** e cadastro só
por convite.

Custo esperado: ~US$ 3–5/mês (máquina `shared-cpu-1x` de 512 MB sempre ligada + volume de 1 GB); Neon no plano grátis.
Confira os preços nas páginas da Fly e do Neon antes de contratar.

Você cria as contas e cola os segredos no terminal; nenhum segredo vai para o Git.

## Como funciona o acesso

- Em produção não há e-mail e senha (`EMAIL_LOGIN=off`): só "Entrar com Google". Sem senha, não há "esqueci a senha" e
  não é preciso provedor de e-mail.
- A conta nasce no primeiro login com Google, e só nasce se a pessoa tiver convite (`SIGNUP_MODE=invite`):
  - você (o primeiro mestre) entra direto porque seu e-mail está em `SIGNUP_ALLOWLIST`;
  - os jogadores abrem o link de convite da campanha e clicam em "Entrar com Google para aceitar". O app guarda o
    convite num cookie de 1 hora, e a conta é criada na volta do Google.
- Quem tentar entrar com Google sem convite volta para a tela de entrar com um aviso.
- No dev e nos testes o login por e-mail continua ligado (seed `mestre@r2d6.local` / `jogador@r2d6.local`).

## 1. Contas (uma vez)

1. **Fly.io**: crie a conta em fly.io e instale o `flyctl` (`winget install flyio.flyctl` no Windows). Depois `fly auth login`.
2. **Neon**: crie a conta em neon.tech e um projeto `r2-d6` na região mais próxima (São Paulo, se houver; senão
   us-east). Copie a *connection string* com `sslmode=require` (a "pooled" serve).
3. **Google OAuth**: no Google Cloud Console, crie um projeto, configure a tela de consentimento (tipo "Externo",
   escopos só `email` e `profile`) e crie uma credencial "ID do cliente OAuth" do tipo "Aplicativo da Web" com:
   - origem JavaScript autorizada: `https://<app>.fly.dev`;
   - URI de redirecionamento autorizado: `https://<app>.fly.dev/api/auth/callback/google`.

   Enquanto o app estiver "em teste" no Google, só os e-mails cadastrados como usuários de teste conseguem entrar;
   publique o app (sem verificação, já que só usa `email` e `profile`) para liberar qualquer conta Google.

## 2. Criar o app na Fly

Na raiz do repositório:

```bash
fly launch --no-deploy --copy-config --name r2-d6
```

Se o nome `r2-d6` estiver ocupado, escolha outro e troque `app` e `APP_URL` no [fly.toml](../fly.toml) e as URLs no Google.

```bash
fly volumes create r2d6_media --region gru --size 1
```

## 3. Segredos

Gere um segredo de sessão (64 caracteres aleatórios) e grave tudo de uma vez. Rode no seu terminal; os valores não
aparecem em lugar nenhum do repositório:

```bash
fly secrets set BETTER_AUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")" DATABASE_URL="<connection string do Neon>" GOOGLE_CLIENT_ID="<id do cliente>" GOOGLE_CLIENT_SECRET="<chave secreta do cliente>" SIGNUP_ALLOWLIST="<seu e-mail do Google>"
```

Opcional: `ANTHROPIC_API_KEY` (Holocron). A API se recusa a subir em produção sem o Google configurado.

## 4. Primeiro deploy

```bash
fly deploy
```

O `release_command` aplica as migrações no Neon antes de a versão nova entrar. Confira:

- `https://<app>.fly.dev/readyz` responde `{"ok":true}`;
- entre com o Google usando o e-mail da allowlist;
- crie uma campanha, gere um convite e abra o link numa janela anônima com outra conta Google.

O seed de demonstração **não** roda em produção.

## 5. Deploy automático (GitHub Actions)

O workflow [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) roda typecheck e testes em todo push e PR. O
deploy na `main` fica desligado até você:

1. gerar um token: `fly tokens create deploy -x 999999h`;
2. no GitHub (Settings › Secrets and variables › Actions), criar o segredo `FLY_API_TOKEN` com o token e a variável
   `DEPLOY_ENABLED` = `true`.

## Operação

- **Logs:** `fly logs`. **Status:** `fly status`.
- **Backups:** o Neon guarda o histórico do banco (restauração por ponto no tempo, janela curta no plano grátis). A Fly
  tira snapshots diários do volume dos retratos (`fly volumes snapshots list <id>`).
- **Escala:** uma máquina só, de propósito: o Socket.IO da mesa não está preparado para várias instâncias.
- **Imagens:** o PWA guarda em cache todas as artes de `apps/web/public/art` (~27 MB hoje) na primeira visita.
