# ADR-0011: Assistente de regras com Claude, fundamentado em `data/`

- Status: proposto (2026-10-28); entrada no protótipo depende do usuário

## Contexto

Pergunta em linguagem natural na mesa ("posso gastar CP numa esquiva com Force Point ativo?") com resposta curta, em português, com página citada e selos CASA/PROV. A base destilada é pequena (cerca de 1.000 linhas de Markdown em `data/rules/` mais glossário e errata; entidades em JSON). PD-07: só o que está destilado em `data/`.

## Decisão

- Rota `POST /api/assistant/ask`, resposta em streaming (SSE), só no servidor (chave nunca vai ao cliente), atrás de feature flag (`ANTHROPIC_API_KEY` vazio = desligado).
- Contexto: **corpus inteiro das regras, glossário, errata e `docs/rules-decisions.md` no prompt de sistema com prompt caching** (estável entre perguntas, entrada em cache custa uma fração); entidades relevantes (perícias, poderes, armas) recuperadas pela busca do `@r2d6/data` e anexadas; opcionalmente a ficha do personagem ativo do próprio usuário.
- Instruções: responder só com base no contexto, citar `(p.N)` e o id da seção (o front transforma em link para a consulta), marcar regra da casa e leitura provisória, dizer "o livro não cobre; decisão do mestre" quando for o caso, não reproduzir texto longo do livro.
- Modelo por variável (`ASSISTANT_MODEL`), padrão Haiku pelo custo; limite diário por usuário; registro de tokens em `assistant_queries`; teto mensal configurado no console da Anthropic.
- Sem ferramentas e sem acesso a dados de outros usuários.

## Alternativas

- **RAG com embeddings (pgvector):** útil se o corpus crescer muito; hoje o corpus cabe no contexto e caching é mais simples e preciso.
- **Modelo local:** sem custo por uso, mas pesado para o PC do jogador e pior em português e em citação.
- **Só busca, sem IA:** já existe (consulta); o assistente é complemento.

## Consequências

- Custo variável (centavos por dezena de perguntas com Haiku e cache); exige monitorar.
- Precisa de rede; offline a UI oferece a busca local.
- Qualidade avaliada com um conjunto de perguntas e respostas esperadas tirado dos exemplos do `docs/product-spec.md`.
