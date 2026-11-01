# Dockerfile - imagem de producao: a API (Fastify + Socket.IO) serve tambem o front estatico (mesma origem).
# Etapa 1 gera os dados (Python le data/, nao o PDF) e o build do front; etapa 2 roda so a API.

FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/data/package.json packages/data/
COPY packages/rules/package.json packages/rules/
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app
# a API roda o TypeScript direto com tsx (como no dev); por isso node_modules vai inteiro.
# Roda como root porque o volume da Fly (retratos em /data) e montado como root; a VM e isolada.
COPY --from=build /app /app
EXPOSE 3000
CMD ["npm", "start", "-w", "@r2d6/api"]
