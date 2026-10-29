# ADR-0007: Offline com IndexedDB + outbox; operações com `inc` e rebase por revisão

- Status: proposto (2026-10-28)

## Contexto

A mesa pode estar sem internet (PD-01). Agora a ficha mora no servidor e o mesmo jogador edita do celular e do tablet; o mestre pode conceder CP ou aplicar ferimento. As edições concorrentes típicas são contadores (munição, CP, FP, créditos) e marcações de estado; edições de texto (história, personalidade) são raras e de uma pessoa só.

## Decisão

- **Leitura local primeiro:** a UI lê fichas do IndexedDB (Dexie); o servidor é a fonte da verdade.
- **Outbox:** cada edição vira uma mutação `{ mutationId, characterId, baseRevision, ops[], deviceId }`, aplicada otimisticamente no local e enviada em ordem (`PATCH` online, `POST /api/sync/batch` ao voltar a rede). `mutationId` garante idempotência.
- **Ops:** subconjunto do JSON Patch (`add`, `remove`, `replace`) mais `inc` para contadores. Itens de lista com chave estável (`_id`; perícias por `skill`) e `match` na op.
- **Servidor:** se `baseRevision` é a atual, aplica; senão faz rebase sobre as ops gravadas em `character_changes` desde a base. `inc` sempre comuta; ops em folhas diferentes são aplicadas; a mesma folha alterada dos dois lados volta como conflito (`409` com o valor do servidor). O resultado passa no Ajv antes de gravar.
- **Cliente:** tela de conflito por campo ("manter o meu" / "manter o do servidor"); nunca descarta mutação sem resposta.
- **`play_state`** (round, ações, stuns): último a escrever vence por campo.
- Pull incremental por `sync_seq`.
- O algoritmo (`apply`, `rebase`, detecção de conflito) fica em `@r2d6/rules/ops.ts`, puro, usado nos dois lados e com testes de propriedade.

## Alternativas

- **CRDT (Yjs, Automerge):** mescla tudo sem conflito, mas guarda estado binário, dificulta validar pelo schema e consultar no Postgres, e é difícil de depurar; o problema real (contadores) se resolve com `inc`.
- **Último a escrever vence no documento inteiro:** simples, mas perde munição e CP marcados no outro aparelho.
- **Bloqueio (só um aparelho edita):** ruim para o caso celular + tablet + mestre.
- **Sync de banco pronto (PowerSync, ElectricSQL, Replicache/Zero):** poderosos, mas adicionam serviço ou licença e modelo próprio; desproporcional para uma tabela de documentos.

## Consequências

- Um formato de mudança serve para sync, tempo real (`character:changed` leva as ops) e auditoria.
- Os componentes da ficha precisam emitir ops (não "salvar o documento inteiro"); helpers em `@r2d6/rules` evitam erro.
- Arrays do schema ganham `_id` (propriedade extra permitida; o v1 ignora).
