# ADR-0009: Rolagens compartilhadas sorteadas no servidor

- Status: proposto (2026-10-28)

## Contexto

Com rolagens visíveis ao grupo, a pergunta "quem garante que o dado foi honesto?" aparece. O Wild Die 1 é decisão do mestre (RD-03, PD-04). Os dados físicos continuam sendo o padrão (PD-03). CP são gastos depois de ver a rolagem (US-05), com limite por tipo e exclusão com FP (RD-10 a RD-12).

## Decisão

- Rolagem digital com rede: o cliente pede (`POST /api/rolls` com tipo, perícia e contexto); o **servidor** calcula a parada a partir da ficha e do `play_state` (`effectivePool`) e sorteia com `crypto.randomInt(1, 7)`. O feed mostra o selo "sorteada no servidor" e a explicação da parada.
- CP depois da rolagem: `POST /api/rolls/:id/cp`, sorteado no servidor, com limite e exclusão validados e desconto na ficha na mesma transação.
- Wild Die 1: `total` fica pendente e o mestre escolhe (ou o jogador, se a campanha configurar).
- Modo "dados físicos": o jogador digita os valores; o servidor calcula e grava `mode=physical`.
- Sem rede: sorteio local (`rng=client`), enviado depois com selo "offline".

## Alternativas

- **Sorteio no cliente sempre:** mais simples e instantâneo, mas qualquer um pode forjar o resultado.
- **Commit-reveal criptográfico:** prova mais forte, complexidade sem demanda numa mesa entre amigos.

## Consequências

- Rolagem compartilhada exige rede (a latência é de uma requisição).
- O servidor depende do `@r2d6/rules` para calcular paradas: regras corrigidas valem para todos ao mesmo tempo.
