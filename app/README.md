# r2-d6: protótipo web do jogador

Companheiro de mesa para o Star Wars RPG REUP (D6): assistente de criação, ficha, modo mesa (round, rolador com Wild Die, pontos, ferimentos, munição) e consulta de regras com a página do livro. Estático, sem build, sem bibliotecas externas, sem rede em tempo de execução (PWA, offline). Especificação: `docs/product-spec.md`, `docs/rules-decisions.md`, `docs/ux-platforms.md`.

## Gerar os dados

O app lê um único arquivo, `app/data/bundle.json`, gerado de `data/` (nada em `data/` é alterado):

```bash
python tools/build_app_data.py
```

O script (só stdlib) imprime um relatório com o que não conseguiu mapear. Veja `tools/README.md`. Gere o bundle de novo sempre que `data/` mudar.

## Rodar

A partir de `E:\dev\r2-d6`:

```bash
python -m http.server 8080 --directory app
```

Abra <http://localhost:8080/>. (Há também `.claude/launch.json` com a configuração `r2-d6-app`.) O app precisa ser servido por HTTP: `file://` não carrega módulos nem o bundle.

## Testes

```bash
node --test E:\dev\r2-d6\app\tests\
# ou, equivalente:
node --test "app/tests/*.test.mjs"
```

O Node 22 não aceita diretório em `node --test`; por isso `app/tests/index.js` carrega os `*.test.mjs` quando o diretório é informado. Os testes de regras e de dados leem `data/` e `app/data/bundle.json` (gere o bundle antes). Cobertura: `dice.test.mjs` (Wild Die, normalização, dobrar), `rules.test.mjs` (penalidades, CP/FP, ferimentos, escala, evolução, validação de criação), `store.test.mjs` (salvar/recarregar, exportar/importar, campos obrigatórios do schema), `data.test.mjs` (busca, errata, bundle, markdown).

## Instalar como PWA

Com o servidor rodando, abra a página no Chrome/Edge e use "Instalar app" (barra de endereço) ou, no celular, "Adicionar à tela inicial". O service worker (`sw.js`) pré-carrega o shell e o `bundle.json` na instalação (primeiro uso offline) e depois é **network-first**: tenta a rede (timeout de 3 s), grava a resposta no cache e, se falhar, serve do cache. Atualizações chegam sozinhas ao recarregar com rede; `main.js` chama `registration.update()` a cada carregamento. Se publicar um arquivo novo do shell, inclua-o na lista `SHELL` de `sw.js`; mude `CACHE` apenas para descartar caches antigos. Service workers só funcionam em `localhost` ou HTTPS.

## Estrutura

```
app/
  index.html, manifest.webmanifest, sw.js, icons/icon.svg
  css/app.css              layout responsivo, temas claro/escuro, impressão A4
  data/bundle.json         gerado por tools/build_app_data.py
  js/
    dice.js                PURO: códigos de dados, Wild Die, CP (RD-01..04, 10, 13)
    rules.js               PURO: parada efetiva, CP/FP, ferimentos, escala, criação (RD-xx citadas)
    store.js               localStorage, export/import conforme o schema, x_app
    state.js, data.js      estado do app, acesso ao bundle e busca global
    markdown.js, util.js, seals.js, layout.js   renderizador, helpers, selos, painel lateral
    main.js                boot, rotas (hash), navegação, atalhos, tema
    views/
      creation.js          assistente de criação (8 passos + painel de contexto)
      sheet.js, print.js   ficha editável e ficha A4 de 2 páginas
      mesa.js              modo mesa e rolador
      reference.js         consulta (regras, entidades, tabelas, errata) e busca
      characters.js        lista de personagens, importar, glossário, "Mais"
  tests/*.test.mjs, index.js
```

## Formas de tela

- **PC** (largura >= 1100 px e ponteiro fino): barra lateral fixa; assistente em 3 painéis (passos, passo atual, contexto da regra); painel de consulta ao lado da ficha/mesa.
- **Tablet** (700 a 1099 px, ou toque em tela grande): abas no topo; em paisagem, ficha ou mesa à esquerda e consulta à direita.
- **Celular** (< 700 px): barra inferior (Mesa, Ficha, Rolar, Regras, Mais); botão de rolar fixo na metade de baixo; alvos >= 44 px.

Atalhos no PC: `/` ou `Ctrl+K` busca, `R` rolar, `N` próximo round, `1` a `9` ações declaradas, `?` ajuda.

## Dados e privacidade

Personagens ficam só no `localStorage` do navegador (chave `r2d6.char.<id>`). Exporte o JSON para guardar ou compartilhar. Importação valida os campos obrigatórios do `character-sheet.schema.json` e diz quais faltam. Estado do app (round, stuns, histórico) vai em `x_app` dentro do mesmo JSON.

## Limitações conhecidas

- Selos de regra da casa (CASA) e leitura provisória (PROV) só aparecem onde o app aplica essas decisões (rolador, ferimentos, assistente) e nas seções/entidades com E-0xx aberto; `data/` não cita E-0xx nas entidades, então o app usa uma pequena lista em `ENTITY_ERRATA_HINTS` (Aqualish, lightsaber, perícias de pilotagem).
- Todas as decisões RD-xx estão como `proposta`; nenhuma é regra oficial além das marcadas RAW.
- O bônus de criação do Ewok (RD-38) e vantagens/desvantagens (RD-39) só aparecem como aviso/lista; o cálculo automático e o passo opcional do assistente ficam para depois. Não há evolução de personagem com custo em CP na interface (a função `advancementCost` existe em `rules.js`).
- Perícia avançada na criação: o valor é a quantidade de dados colocada (1D ou 2D), interpretação de "começa em 1D" (RD-31).
- Criação do zero: poderes da Força sem quantidade definida (escolha com o mestre); templates com espécie "livre" (Alien Student) pedem a escolha manual.
- Droide (Protocol Droid): atributos fixos, 17D de perícias, sem regras de espécie.
- QR da ficha, combinar ações, rolagem simplificada de paradas grandes (RD-43) e ferramentas do mestre ficam fora do protótipo.
- Wake Lock e vibração dependem do navegador.
