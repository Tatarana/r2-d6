# ADR-0008: Regras e dados compartilhados entre front e back

- Status: proposto (2026-10-28)

## Contexto

O v1 tem a lógica de regras pura e testada em `app/js/dice.js` e `app/js/rules.js` (56 testes) e gera `app/data/bundle.json` com `tools/build_app_data.py` (PD-02: `data/` é a fonte única). Na v2 o servidor precisa da mesma lógica para validar fichas e sortear rolagens, e o v1 tem de ficar intacto.

## Decisão

- **`@r2d6/rules`:** port para TypeScript de `dice.js` e `rules.js`, mantendo nomes, assinaturas, RNG injetável e citações RD-xx; os 56 testes portados para Vitest com as mesmas asserções. Novos módulos: `sheet.ts` (validação via Ajv com o schema, ficha vazia, valor de perícia), `creation.ts` (lógica do assistente extraída de `app/js/views/creation.js`), `ops.ts` (ADR-0007), `options.ts` (regras da casa como parâmetros, padrão igual ao v1). O v1 mantém sua cópia congelada.
- **`@r2d6/data`:** `scripts/build.mjs` roda `tools/build_app_data.py --out packages/data/generated/bundle.json` (o `--out` é aditivo; sem ele o script segue gravando para o v1). Sem Python, copia `app/data/bundle.json`. Gera `bundle.meta.json` (hash) e tipos da ficha a partir do schema. `src/catalog.ts` porta a busca e o acesso de `app/js/data.js`.
- Front busca o bundle (precache do service worker); back carrega em memória no boot e publica o hash em `/api/meta`.
- O servidor **bloqueia só violação do schema**; problemas de regra viram avisos em `characters.validation` (PD-04: o mestre decide).

## Alternativas

- **Importar os `data/*.json` direto no TS:** perde os mapas derivados do script (perícias de template, pré-requisitos, Move) e duplica lógica.
- **Portar o gerador Python para TS já:** elimina o Python, mas é trabalho sem valor imediato e pode divergir; fica para quando atrapalhar.
- **Guardar o catálogo no Postgres:** dados imutáveis por versão; duas fontes para manter em sincronia.
- **Usar os `.js` do v1 por caminho relativo:** acopla a v2 ao protótipo congelado e impede tipar.

## Consequências

- A mesma função calcula a parada no celular offline e no servidor.
- Dados e código de regras andam com a versão do app; cliente com bundle antigo é avisado pelo hash.
- Dependência de Python no build de dados (com fallback).
