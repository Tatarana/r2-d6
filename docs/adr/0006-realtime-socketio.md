# ADR-0006: Tempo real com Socket.IO, só para distribuição

- Status: proposto (2026-10-28)

## Contexto

Rolagens compartilhadas com a mesa, Wild Die 1 resolvido pelo mestre, round avançado pelo mestre, presença e sincronização entre o celular e o tablet do mesmo jogador. O tráfego é quase todo servidor para cliente, com picos durante as sessões. Precisa reconectar bem em Wi-Fi ruim.

## Decisão

- **Socket.IO 4** acoplado ao servidor HTTP do Fastify, no caminho `/socket.io`.
- Autenticação no handshake pelo **mesmo cookie de sessão**; inscrição em salas (`user:<id>`, `campaign:<id>`, `campaign:<id>:gm`, `character:<id>`) só depois de checar a política de autorização.
- **Escrita sempre via REST.** O handler grava no banco e, depois do commit, emite o evento. O socket não aceita mutações.
- Depois de reconectar, o cliente faz pull (`GET /api/sync?since=`) em vez de depender de eventos perdidos.
- Mais de uma instância: `@socket.io/postgres-adapter` (LISTEN/NOTIFY) e sticky sessions; Redis só se o volume exigir.

## Alternativas

- **SSE:** suficiente para servidor → cliente e mais simples no protocolo, mas salas, reconexão com backoff, presença e fan-out entre instâncias teriam de ser escritos à mão.
- **`ws` / `@fastify/websocket` puro:** leve, mas o mesmo trabalho de salas e reconexão.
- **Serviços gerenciados (Ably, Pusher, Supabase Realtime):** sem infraestrutura, mas exigem rede no dev, custo por mensagem e autorização duplicada.
- **Mutação via socket:** latência um pouco menor, mas duplica validação e autorização e complica o outbox offline.

## Consequências

- Um caminho de escrita, uma autorização; eventos são "dicas" e o estado verdadeiro está no banco.
- Exige sticky sessions no balanceador em escala (ou só transporte WebSocket).
- Latência de uma rolagem = requisição REST + emissão, bem abaixo de 500 ms.
