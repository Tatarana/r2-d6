---
id: product-spec-v2
status: draft-v2
owner: PM r2-d6
supersedes: docs/product-spec.md (v1 fica como histórico)
related: [docs/visual-direction.md, docs/image-briefs.md, docs/image-manifest.json, docs/ux-platforms.md, docs/rules-decisions.md, docs/backlog.md, docs/architecture.md, docs/adr/]
---

# r2-d6 v2: especificação de produto

Companheiro de mesa para **Star Wars Roleplaying Game: Revised, Expanded and Updated (REUP)**, sistema D6. A v2 parte do protótipo v1 (`app/`, que fica intacto) e muda três coisas: **conta e servidor** no lugar de arquivos JSON, **mesa conectada** (campanha, feed de rolagens, mestre) e **um visual que materializa o universo** (`docs/visual-direction.md`). Stack, backend, login, banco e tempo real são decididos pelo arquiteto em `docs/architecture.md` e `docs/adr/`; este documento define **o quê e por quê**, e os requisitos que a arquitetura precisa atender (seção 10).

Regras do jogo continuam vindo de `data/` com página impressa `(p.N)`; as decisões de regra RD-xx da v1 (`docs/rules-decisions.md`) valem sem mudança. As decisões de produto novas estão na seção 11 e em `docs/rules-decisions.md` (PD-08 em diante).

## 1. O que muda da v1

| Tema | v1 | v2 |
|---|---|---|
| Onde a ficha mora | `localStorage` do aparelho; exportar/importar JSON. | **Servidor, na conta do jogador**, com cache local para jogar sem rede. Sai exportar/importar JSON da interface (PD-05 substituída por PD-09). |
| Identidade | Nenhuma. | **Conta** com login (seção 3). Consulta de regras continua aberta sem conta. |
| Mestre | Recebe a ficha por arquivo. | **Campanha**: convite por link ou QR; o mestre vê as fichas e o estado do grupo em tempo real. |
| Rolagem | Só no aparelho do jogador. | **Feed da mesa** compartilhado; decisão do Wild Die 1 pelo mestre ao vivo; rolagens secretas. |
| Visual | Tema escuro funcional, sem imagens. | Datapad de bordo: vidro, holograma, dados 3D, **568 espaços de imagem** (telas e cada entidade da consulta) com reserva por categoria e placeholder. |
| Pilha | HTML/JS estático, sem build, offline (PD-01). | Monorepo (`apps/web`, `apps/api`, a confirmar pelo arquiteto); PWA continua instalável e com cache offline (PD-08). |

**O que fica** (aprovado pelo usuário): tema escuro; organização em Ficha, Mesa, Consulta, Criar, Mais; navegação por plataforma (lateral no PC, abas/split no tablet, barra inferior no celular); assistente de criação com painel de contexto; modo mesa com round, ações, CP/FP, ferimentos, stuns, munição e calculadoras; consulta com página citada e selos; impressão A4.

**Migração**: na primeira entrada, se o aparelho tiver personagens da v1 no `localStorage`, o app oferece "Trazer N personagens deste aparelho para a sua conta" (sem arquivo, um toque). Ver D-03.

## 2. Personas

| Persona | Contexto | O que a v2 resolve |
|---|---|---|
| **Ana**, jogadora novata | Primeira campanha. | Cria o personagem guiada, entra na campanha pelo QR que a mestra mostrou, rola no celular e a mesa vê; pergunta ao Holocron "posso gastar CP e Force Point juntos?" e recebe a página. |
| **Bruno**, veterano | Joga D6 há anos. | Ficha sempre à mão em qualquer aparelho; modo mesa no tablet com o celular de controle; linha do tempo do personagem entre sessões. |
| **Carla**, mestra | Agora **em escopo como usuária**, não como regras (as regras do mestre, fase 2, continuam não destiladas). | Abre a campanha, convida, vê fichas e o estado do grupo, decide o Wild Die 1 pelo feed, faz testes secretos, concede CP ao fim da aventura, agenda a próxima sessão. |
| **Diego**, jogador eventual | Joga uma vez por mês, esquece tudo. | Resumo da última sessão (diário + feed) e notificação da próxima. |

## 3. Conta e login

### 3.1 Requisitos de produto

- **Entrar sem senha como caminho principal**: link mágico por e-mail e login social (Google; Discord, muito usado por grupos de RPG). Senha tradicional como alternativa. Passkey como evolução (Could). A escolha técnica do provedor é do arquiteto; o produto exige pelo menos e-mail e um login social no protótipo (D-01).
- **Sem conta**: Consulta de regras e Glossário funcionam sem login ("Explorar a base"). Criar personagem pede conta no momento de salvar (o rascunho não se perde: fica local e sobe ao entrar).
- **Convite antes da conta**: quem abre um link de convite sem conta vê a campanha (nome, capa, mestre) e cria a conta no mesmo fluxo; ao terminar, já está na campanha.
- **Sessão longa**: na mesa ninguém quer logar de novo; sessão persistente no aparelho (renovação silenciosa), com "sair de todos os aparelhos" no perfil.
- **LGPD**: consentimento explícito dos termos e da política no cadastro; e-mail só para login e avisos que o usuário ligar; exclusão de conta e **cópia dos meus dados** (portabilidade, art. 18 da LGPD) em Conta. Isso não volta como "exportar JSON" na ficha; é um direito do titular na área de conta (D-02).

### 3.2 Fluxo

```
/entrar ──► [Continuar com Google] [Continuar com Discord] [E-mail]
               │                        │                    │
               └──────────┬─────────────┘          link mágico ou senha
                          ▼
            primeira vez? ──sim──► /cadastro/perfil (nome de exibição, papel preferido: jogar/mestrar/ambos,
                          │                          aceite de termos) ──► migração v1? ──► /hangar (tour de 3 passos)
                          └─não──► voltar para onde estava (deep link, convite) ou /hangar
```

Erros previstos: link expirado (15 min, reenviar); e-mail já usado por login social (oferecer entrar pelo provedor); provedor recusado (voltar com mensagem); sem rede (`error.offline`, a consulta continua).

### 3.3 Perfil (Conta)

Nome de exibição, avatar (upload ou retrato de um personagem), papel preferido, preferências (dados 2D/3D, animações, sons, vibração, tema, modo baixa luz automático na mesa, idioma: PT-BR), notificações, aparelhos conectados, cópia dos meus dados, excluir conta.

### 3.4 O que o jogador vê ao entrar: o Hangar

O Hangar é a nova tela inicial (substitui a lista de personagens da v1, mesma função, mais mundo).

- **Faixa hero** (`hero.hangar`): saudação, **próxima sessão** ("Sábado, 19h: Fuga de Ord Mantell, campanha Os Sem-Bandeira"), botão "Abrir mesa".
- **Baias de personagens**: holocartas com retrato (ou arte do template), nome, espécie, template, ferimento atual, CP e FP, campanha em que está. Toque abre a Ficha; botão rápido "Mesa". Última baia é a vazia (`hangar.bay.empty`): "Criar personagem".
- **Campanhas**: cartões com capa, mestre, número de jogadores, indicador "ao vivo" quando há sessão aberta. Botões "Criar campanha" e "Entrar com código".
- **Atividade**: últimas 5 coisas que aconteceram (CP concedido pela mestra, nota do diário, convite).
- Vazio: `empty.characters` e `empty.campaigns` com ação clara.

O **Holomapa** fica dentro da campanha (seção 6.3), não no Hangar: ele conta a história do grupo, e o Hangar é sobre o jogador.

## 4. Mapa de telas (rotas sugeridas)

| Rota | Tela | Conta? |
|---|---|---|
| `/entrar`, `/cadastro`, `/cadastro/perfil`, `/recuperar` | Autenticação | não |
| `/hangar` | Hangar | sim |
| `/criar` | Assistente de criação (v1, com cartas e imagens) | rascunho sem conta, salvar com |
| `/personagem/:id` | Ficha | sim (ou link público de leitura) |
| `/personagem/:id/mesa` | Modo mesa | sim |
| `/personagem/:id/evolucao` | Evolução guiada (gastar CP) | sim |
| `/personagem/:id/linha-do-tempo` | Linha do tempo e versões | sim |
| `/personagem/:id/notas` | Notas do personagem | sim |
| `/campanhas`, `/campanhas/nova` | Campanhas | sim |
| `/campanha/:id` | Campanha: Grupo, Feed, Holomapa, Diário, Agenda | membro |
| `/campanha/:id/mestre` | Console do mestre | mestre |
| `/convite/:codigo` | Página do convite | não |
| `/consulta/...`, `/glossario` | Consulta (v1) | não |
| `/holocron` | Assistente de regras | sim |
| `/conta` | Perfil e preferências | sim |
| `/p/:slug` | Ficha pública somente leitura | não |

## 5. Funcionalidades avaliadas

Critérios: **valor** para a mesa física e entre sessões (1 a 5), **esforço** (P, M, G, GG), risco e dependências. MoSCoW para a v2 inteira; a coluna "Protótipo v2" diz o que o `smart-coder` implementa agora.

| ID | Funcionalidade | Valor | Esforço | MoSCoW | Protótipo v2 | Por quê |
|---|---|---|---|---|---|---|
| F-01 | Conta e login (e-mail + social), perfil | 5 | M | **Must** | Sim: e-mail (link mágico ou senha) + 1 provedor social; perfil e preferências | Pré-requisito de tudo. |
| F-02 | Fichas no servidor, salvamento automático, cache offline com fila | 5 | G | **Must** | Sim | Pedido explícito; substitui o JSON. |
| F-03 | Hangar | 4 | M | **Must** | Sim | Tela de entrada; materializa o universo. |
| F-04 | Campanha com convite por link e QR, papéis (mestre, jogador) | 5 | M | **Must** | Sim | Base de toda a mesa conectada. |
| F-05 | Painel do mestre: fichas e estado do grupo ao vivo (ferimentos, CP/FP, ações do round, munição) | 5 | M | **Must** | Sim, leitura + ações do mestre da tabela 6.2 | Carla deixa de perguntar "como você está?" a cada round. |
| F-06 | Feed da mesa: rolagens compartilhadas em tempo real | 5 | G | **Must** | Sim | O momento mais social do jogo. |
| F-07 | Decisão do Wild Die 1 pelo mestre via feed | 5 | P (sobre F-06) | **Must** | Sim | Encaixa a regra (p.73) no fluxo real: o 1 é decisão do mestre (RD-03, PD-04). |
| F-08 | Rolagens secretas: jogador rola só para o mestre; mestre faz testes secretos com as fichas do grupo | 4 | M | **Should** | Sim (as duas, versão simples) | O livro prevê testes secretos do mestre (p.82-83, só no bruto, fase 2 não destilada). |
| F-09 | Dados 3D animados, Wild Die destacado, efeitos de 6 e 1 | 4 | G | **Should** | Sim, com fallback 2D | É o "uau" pedido; com fallback não trava a mesa. |
| F-10 | Modo mesa sincronizado entre aparelhos do mesmo jogador (celular de controle, tablet de painel) | 4 | P (sobre tempo real) | **Should** | Sim | Quase de graça com o tempo real; muito útil na mesa. |
| F-11 | Evolução guiada: gastar CP com custo, tempo de treino e teste de teto de atributo | 4 | M | **Should** | Sim | Lógica já existe (RD-40, B-21); entre sessões é o uso mais frequente. |
| F-12 | Linha do tempo do personagem (CP ganhos e gastos, ferimentos, evolução, marcos) e histórico de versões da ficha | 4 | M | **Should** | Sim: linha do tempo a partir dos eventos + lista de versões com "ver"; restaurar versão fica para depois | Memória da campanha; base para conflito de edição. |
| F-13 | Retrato do personagem (upload com recorte) | 4 | P a M | **Should** | Sim | Materializa o personagem; pedido do usuário (imagens). |
| F-14 | Diário de sessão e notas | 3 | M | **Should** | Sim, simples: notas do personagem (privadas) e diário da campanha (texto do mestre + resumo automático do feed da sessão) | Diego lembra o que aconteceu. |
| F-15 | Tela sempre ligada + modo baixa luz | 4 | P | **Must** | Sim | Barato e decisivo na mesa. |
| F-16 | Agenda da sessão e notificações | 3 | M | **Could** | Agenda sim (data, hora, local, presença "vou/não vou", arquivo .ics); push e e-mail depois | Push exige infraestrutura e permissões. |
| F-17 | Holocron: assistente de regras com IA, só com base em `data/`, citando página | 5 | G | **Should** | Sim, **beta atrás de chave** (se o arquiteto aprovar custo e provedor) | Alto valor; risco de alucinação controlado por "sem citação, sem resposta". |
| F-18 | Ficha pública somente leitura por link (substitui o QR de exportação) | 3 | P | **Should** | Sim | Mostrar a ficha a quem não tem conta. |
| F-19 | Sons e trilha ambiente | 2 | M | **Could** | Só efeitos dos dados (off por padrão); trilha depois | Agrada, mas compete com a mesa real. |
| F-20 | Conquistas e marcos narrativos | 2 | M | **Could** | Não; só "marco" manual na linha do tempo | Risco de gamificar demais um jogo narrativo. |
| F-21 | Holomapa da campanha (sessões como pontos numa galáxia original) | 3 | M | **Could** | Sim, estático: mapa + marcadores por sessão com título e data | Alto efeito visual, esforço moderado. |
| F-22 | Round compartilhado da mesa: mestre abre o round, iniciativa, jogadores declaram ações | 4 | G | **Could** | Não (depois) | Iniciativa é regra de jogador (p.78), mas o fluxo do mestre é fase 2. |
| F-23 | Modo projeção (TV ou tablet no centro da mesa mostra o feed e os dados) | 3 | P | **Could** | Não (depois) | Reaproveita o feed. |
| F-24 | Nave do grupo como ficha compartilhada na campanha | 3 | M | **Could** | Não | B-35; o Smuggler começa com um YT-1300 (p.495). |
| F-25 | Créditos e inventário do grupo | 2 | M | **Could** | Não | |
| F-26 | Ferramentas do mestre com regras (NPCs, criaturas, encontros) | 4 | GG | **Won't (v2)** | Não | Depende da fase 2 da base. |
| F-27 | Mesa online completa (mapa tático, vídeo) | 2 | GG | **Won't** | Não | Fora da visão: o jogo é presencial. |

### 5.1 Corte do protótipo v2

**Entra**: F-01 a F-15, F-17 (beta), F-18, F-21 (estático), agenda de F-16, efeitos de som dos dados de F-19.
**Fica para depois**: notificações push/e-mail (F-16), trilha ambiente (F-19), conquistas (F-20), round compartilhado (F-22), modo projeção (F-23), nave do grupo (F-24), inventário do grupo (F-25), restaurar versão (F-12), ferramentas de mestre com regras (F-26).

## 6. Detalhe das funcionalidades do protótipo

### 6.1 Ficha no servidor (F-02)

- **Salvamento automático** a cada alteração (debounce de 800 ms), com o indicador de sincronia (`SyncIndicator`): "sincronizado", "transmitindo", "na fila (n)" quando offline, "conflito".
- **Offline**: ficha, modo mesa e consulta funcionam sem rede com o último estado; alterações vão para uma fila e sobem quando a rede volta, na ordem.
- **Conflito** (mesma ficha editada em dois aparelhos offline): campos de estado de mesa (ferimento, stuns, ações, munição, round) usam o mais recente por campo; campos de ficha (atributos, perícias, equipamento) não se fundem em silêncio: o app mostra as duas versões (`error.sync-conflict`) e o jogador escolhe. Versão nova sempre gera entrada no histórico (F-12).
- **Validação**: o servidor valida a ficha contra `character-sheet.schema.json` (campos obrigatórios e formato dos dados); as regras de criação continuam como avisos, não bloqueios (o mestre decide, como na v1).
- **Impressão A4** continua (US-14 da v1).

### 6.2 Campanha, papéis e privacidade (F-04, F-05)

- Criar campanha: nome, capa (`campaign.cover.*` ou upload), descrição curta, regras da casa adotadas (lista de RD marcadas como CASA, com padrão "as propostas do app"), opção do Wild Die 1 preferida da mesa (ainda decidida caso a caso pelo mestre, RD-03).
- **Convite**: link `/convite/:codigo` e QR do mesmo link, com validade (padrão 7 dias) e limite de usos opcional; o mestre pode revogar. Ao aceitar, o jogador escolhe qual personagem leva (ou cria um).
- Um personagem participa de **no máximo uma campanha** por vez (D-05).
- **Papéis**: mestre (pode haver co-mestre, Could) e jogador.

Matriz de visibilidade:

| Dado | Dono | Outros jogadores | Mestre | Link público |
|---|---|---|---|---|
| Ficha (atributos, perícias, equipamento) | edita | vê (D-06) | vê | vê, se o dono ligar |
| Estado de mesa (ferimento, stuns, CP/FP, ações, munição) | edita | vê | vê; pode ajustar ferimento e stuns (com registro) | não |
| Notas do personagem | edita | não | não | não |
| Rolagem pública | cria | vê | vê | não |
| Rolagem "só para o mestre" | cria | vê que houve uma rolagem secreta, sem valores | vê | não |
| Teste secreto do mestre | não vê | não vê | cria e vê | não |
| Dark Side Points | edita | não (D-06) | vê | não |
| Diário da campanha | lê | lê | edita | não |

Ações do mestre no protótipo: conceder CP (com motivo: "fim da aventura", p.25) a um ou a todos; ajustar ferimento e stuns; decidir Wild Die 1; aprovar a ficha (selo "aprovada pela mestra" com data, perde o selo se a ficha mudar); fazer teste secreto; abrir/fechar sessão; escrever o diário; agendar. Toda ação do mestre sobre uma ficha aparece na linha do tempo do personagem.

### 6.3 Feed da mesa e rolagens (F-06, F-07, F-08, F-09)

- **Sessão aberta**: o mestre abre a sessão; o feed fica "ao vivo"; ao fechar, o feed da sessão vira o resumo automático no Diário.
- **Item de rolagem** no feed: retrato e nome do personagem, o que rolou (perícia, código final e explicação da parada: base, -1D por ação extra, -1D por ferimento, +FP, CP gastos), dados normais, Wild Die destacado com a sequência de explosão, total, e um **selo de origem**:
  - "rolado no servidor" (o servidor gera os valores; padrão em campanha, para a mesa confiar),
  - "dados físicos" (valores digitados pelo jogador, PD-03),
  - "offline" (rolado localmente sem rede e enviado depois, com a hora original).
- **Wild Die 1 (F-07)**: o item entra "aguardando a mestra" com o total normal riscado em espera. A mestra vê o cartão com as três opções (RD-03): somar normal, complicação, subtrair o 1 e o maior dado. A escolha aparece no feed para todos, com o novo total. Sem mestre online, o jogador pode aplicar a opção que a mesa combinou e o item ganha o selo "decidido na mesa".
- **CP depois da rolagem**: o jogador gasta CP no item já publicado (limite RD-11); os dados extras aparecem no mesmo item. FP e CP no mesmo round continuam bloqueados (RD-12).
- **Rolagem só para o mestre (F-08)**: o jogador marca "secreta"; os outros veem "Ana fez uma rolagem secreta".
- **Teste secreto do mestre (F-08)**: o mestre escolhe personagens e uma perícia ou atributo da ficha deles; o servidor rola com o código de cada um (com Wild Die) e só o mestre vê. O livro sugere ao mestre rolar antes da sessão para cada código de dado e manter as fichas dos jogadores à mão (p.82-83, capítulo 5, parte de mestre não destilada); o app faz isso no momento, sem que os jogadores saibam. Diferença assumida como decisão de produto, não de regra.
- **Dados 3D (F-09)**: ver `docs/visual-direction.md` seção 6. O resultado é sempre calculado pela lógica de `rules.js`/`dice.js` (ou pelo servidor); a animação apenas mostra os valores já definidos (nunca a física decide o número).
- Reações no feed (emoji fixo: "Uau", "Ai", "Ha ha") como Could.

### 6.4 Modo mesa sincronizado (F-10)

O mesmo personagem aberto em dois aparelhos do mesmo jogador fica espelhado (estado de mesa em menos de 1 s). Sugestão de uso exibida no tablet: "Use o celular como controle": no celular, o rolador e os botões de CP/FP/ação; no tablet, a ficha e o painel de estado. Sem campanha, funciona igual (é a mesma conta).

### 6.5 Evolução guiada (F-11)

Tela `/personagem/:id/evolucao`: o jogador escolhe o que melhorar e vê custo (RD-40, p.25-28), tempo de treino (com ou sem professor; "usada na última aventura" zera o tempo, p.26) e saldo de CP. Ao confirmar, o personagem entra "em treino" até o jogador marcar "treino concluído" (o app não controla o calendário do jogo). Para **atributo**, o app conduz o teste de teto da espécie (p.27): o jogador rola o novo código; o mestre rola o máximo da espécie (no feed, se houver campanha). Se o jogador tirar mais, não sobe e metade dos CP volta.

### 6.6 Linha do tempo e versões (F-12)

Eventos: criado, aprovado pela mestra, CP recebido (motivo), CP gasto (em quê), FP gasto, Dark Side Point recebido (com a rolagem de RD-41), ferimento e cura, evolução concluída, entrou/saiu de campanha, sessões jogadas, marco manual ("Salvou o senador em Alderaan"). Cada edição de ficha gera uma versão com autor e data; o protótipo lista versões e mostra uma versão antiga; restaurar fica para depois.

### 6.7 Retrato (F-13)

Upload de imagem (JPEG, PNG, WebP; até 5 MB), recorte quadrado com ponto focal, moldura hexagonal ou circular. Sem retrato, usa a arte do template ou da espécie; sem ambas, `portrait.default`. Moderação: termos de uso proíbem conteúdo impróprio; denúncia pelo mestre (Could).

### 6.8 Holocron, assistente de regras (F-17, beta)

- Pergunta em linguagem natural; resposta curta em PT-BR com o termo oficial em inglês e **pelo menos uma citação** `(p.N)` com link para a seção da Consulta.
- **Só responde com base em `data/`** (regras destiladas, entidades, errata, glossário). Sem trecho que sustente a resposta, diz que não encontrou e sugere a busca.
- Se a regra tocar um item `open` do errata, mostra o selo "leitura provisória E-0xx"; se for uma regra da casa do app, o selo CASA.
- Temas da fase 2 (mestre) respondem "ainda não destilado" com a página do capítulo bruto.
- Não lê nem altera fichas no protótipo (Could: "o que eu rolo para pular este abismo com a ficha da Ana?").
- Limite de uso por conta e por dia (custo); feedback "útil / errado" em cada resposta para curadoria.

### 6.9 Mesa física: baixa luz e tela ligada (F-15)

Interruptor "Baixa luz" no modo mesa (paleta vermelha de cockpit, `docs/visual-direction.md` seção 9); opção "ligar baixa luz automaticamente na mesa". Wake Lock com indicador.

## 7. User stories e critérios de aceite (novidades do protótipo)

Stories da v1 (US-01 a US-15) continuam válidas, exceto **US-13 (exportar/importar JSON), removida**. Numeração nova a partir de US-20.

### Épico E7: conta e login

**US-20** Como jogadora novata, quero criar a conta com Google ou e-mail para guardar meus personagens.
- Dado que não tenho conta, quando toco "Continuar com Google" e autorizo, então volto ao app em `/cadastro/perfil` com o nome do provedor preenchido e, ao aceitar os termos, chego ao Hangar.
- Dado que informo um e-mail, quando peço o link, então recebo um link válido por 15 minutos; ao abrir no mesmo ou em outro aparelho, entro na conta.
- Dado um link expirado, quando o abro, então vejo "Link expirado" e o botão "Enviar outro".
- Dado que não aceitei os termos, então o botão "Continuar" fica desabilitado.
- Dado que já entrei, quando fecho e reabro o app no mesmo aparelho, então continuo logada (sem pedir login).

**US-21** Como jogador, quero usar a consulta sem conta.
- Dado que não estou logado, quando abro `/consulta` e busco "wild die", então vejo a seção do Wild Die com (p.73), como na v1.
- Dado que não estou logado, quando toco "Salvar" no fim do assistente, então o app pede login e, depois de entrar, o personagem é salvo com tudo que preenchi.

**US-22** Como jogador da v1, quero trazer meus personagens do aparelho para a conta.
- Dado 2 personagens no `localStorage` da v1, quando entro pela primeira vez neste aparelho, então vejo "Trazer 2 personagens para a sua conta"; ao confirmar, os dois aparecem no Hangar com os mesmos valores (atributos, perícias, CP, FP, ferimento).
- Dado que recuso, então a oferta não volta, mas fica disponível em Conta.

### Épico E8: ficha no servidor

**US-23** Como jogador, quero que a ficha salve sozinha no servidor.
- Dado a ficha aberta, quando mudo blaster de 4D para 4D+1, então em até 2 s o indicador mostra "sincronizado" e, ao abrir a ficha em outro aparelho logado, vejo 4D+1.
- Dado que estou sem rede, quando marco 1 tiro e Wounded, então o indicador mostra "na fila (2)"; quando a rede volta, as duas mudanças sobem na ordem e o indicador vai a "sincronizado".
- Dado que recarrego a página sem rede, então a última versão da ficha aparece e o modo mesa funciona.

**US-24** Como jogador, quero resolver quando a ficha foi editada em dois lugares.
- Dado a ficha editada offline no celular (Dex 3D+1 para 3D+2) e no PC (Dex 3D+1 para 4D), quando os dois sincronizam, então o segundo a chegar vê a tela de conflito com as duas versões e escolhe uma; a outra fica no histórico de versões.
- Dado que só o estado de mesa divergiu (munição 3 no celular, ferimento Wounded no tablet), então os dois valores são mantidos (mais recente por campo), sem tela de conflito.

**US-25** Como jogador, quero ver a linha do tempo do personagem.
- Dado que gastei 3 CP para levar blaster de 3D+2 a 4D (RD-40, p.25), então a linha do tempo mostra "Evolução: blaster 3D+2 → 4D, 3 CP" com a data e o saldo de CP cai 3.
- Dado que a mestra concedeu 5 CP com motivo "fim da aventura", então aparece "CP recebido: +5 (mestra Carla, fim da aventura)".

### Épico E9: campanha

**US-26** Como mestra, quero criar uma campanha e convidar por link ou QR.
- Dado que crio "Os Sem-Bandeira" com a capa `campaign.cover.outer-rim`, então recebo um link `/convite/:codigo` e um QR do mesmo link, válidos por 7 dias.
- Dado que um jogador sem conta abre o link, então vê o nome, a capa e a mestra; cria a conta e, ao terminar, está no Grupo da campanha.
- Dado que o jogador tem personagens livres, então escolhe um; se o personagem já está em outra campanha, o app avisa e não permite (D-05).
- Dado que revogo o convite, quando alguém abre o link, então vê `error.invite-expired`.

**US-27** Como mestra, quero ver o estado do grupo em tempo real.
- Dado 3 jogadores na sessão aberta, quando Ana marca Wounded no celular dela, então em até 1 s o cartão dela no meu console mostra Wounded e "-1D".
- Dado que Bruno declara 3 ações, então o cartão dele mostra "3 ações, -2D" (p.78).
- Dado que Bruno ativa um Force Point, então o cartão mostra "FP ativo neste round" e os códigos dele aparecem dobrados (p.85).
- Dado que concedo 5 CP a todos, então o saldo de cada um aumenta 5 e cada linha do tempo registra.

### Épico E10: rolagem compartilhada

**US-28** Como jogadora, quero que minha rolagem apareça no feed da mesa.
- Dado blaster 5D e sessão aberta, quando rolo no app e o servidor gera normais 1, 2, 5, 6 e Wild Die 2, então o feed de todos mostra o item com total **16** (p.73), selo "rolado no servidor", em até 1 s.
- Dado normais 2, 4, 5, 2 e Wild Die 6, 6, 3, então o item mostra a sequência 6 → 6 → 3 no Wild Die e total **28** (p.73).
- Dado que declarei 2 ações, então o item diz "blaster 5D - 1D (2 ações) = 4D" e só 4 dados são rolados (RD-07).
- Dado que digito os dados físicos, então o item tem o selo "dados físicos" e o total é calculado pelas mesmas regras.
- Dado que estou offline, quando rolo, então o item fica na fila com a hora da rolagem e entra no feed com o selo "offline" quando a rede volta.

**US-29** Como mestra, quero decidir o Wild Die 1 pelo feed.
- Dado 6D de Ana com normais 3, 4, 2, 5, 3 e Wild Die 1 na primeira rolagem, então o item entra "aguardando a mestra" com o total 18 em espera e eu recebo as três opções.
- Quando escolho "subtrair o 1 e o maior dado", então o item mostra **12** para todos (p.73) com a marca "decisão da mestra".
- Quando escolho "complicação", então o total fica 18 com a marca "complicação".
- Dado um Wild Die 6 seguido de 1, então o 1 soma e o item não pede decisão (RD-03).
- Dado que não há mestre conectado, quando Ana aplica a opção combinada, então o item recebe o selo "decidido na mesa".

**US-30** Como jogador, quero gastar CP depois de ver a rolagem no feed.
- Dado o item publicado de uma rolagem de perícia, quando gasto 1 CP e depois outro, então os dois dados extras aparecem no mesmo item e o total é atualizado; o terceiro é bloqueado (limite 2, p.85).
- Dado uma rolagem de dodge, então o limite é 5 (RD-11).
- Dado FP ativo neste round, quando tento gastar CP, então o app bloqueia com a citação (p.78, p.84) (RD-12).

**US-31** Como mestra, quero fazer um teste secreto de Perception do grupo.
- Dado Ana com Perception 3D+1 e Bruno com search 4D, quando peço um teste secreto de search, então o servidor rola 3D+1 para Ana (search não melhorada usa o atributo) e 4D para Bruno, cada um com Wild Die, e só eu vejo os totais.
- Então os jogadores não recebem nenhum sinal no feed nem na ficha.
- Dado um Wild Die 1 num teste secreto, então eu vejo as três opções e decido em silêncio.

**US-32** Como jogador, quero fazer uma rolagem só para o mestre.
- Dado que marco "secreta" e rolo sneak, então a mestra vê valores e total; os outros jogadores veem apenas "Bruno fez uma rolagem secreta".

### Épico E11: na mesa

**US-33** Como jogador, quero usar o celular como controle e o tablet como painel.
- Dado o mesmo personagem aberto no celular e no tablet, quando gasto 1 CP no celular, então o saldo no tablet muda em até 1 s.
- Dado que a rede cai num dos aparelhos, então ele mostra "na fila" e se acerta quando volta (US-23).

**US-34** Como jogador, quero dados 3D com o Wild Die destacado.
- Dado 4D, quando rolo, então vejo 3 dados grafite e 1 Wild Die âmbar maior; os valores mostrados são os do resultado calculado (a animação não decide).
- Dado que o Wild Die sai 6, então ele brilha, um novo Wild Die é lançado e a trilha 6 → n aparece.
- Dado `prefers-reduced-motion` ou "Animações: desligadas", então os dados aparecem em 2D sem lançamento.

**US-35** Como jogador, quero o modo baixa luz.
- Dado o modo mesa, quando ligo "Baixa luz", então o fundo fica preto, o texto vermelho, as imagens somem e só o Wild Die mantém o âmbar; o total segue legível (contraste >= 7:1).

### Épico E12: Holocron (beta)

**US-36** Como jogadora novata, quero perguntar uma regra em português e receber a página.
- Dado a pergunta "posso gastar Character Point e Force Point na mesma rodada?", então a resposta diz que não, cita (p.78) e (p.84-85) e liga para a seção da Consulta.
- Dado uma pergunta sem base em `data/` ("qual a cor do sabre do mestre Yoda?"), então o Holocron diz que não encontrou isso nas regras e sugere a busca.
- Dado uma pergunta sobre um tema da fase 2 ("como criar um droide?"), então diz que a parte de mestre ainda não foi destilada e indica o capítulo bruto.

## 8. O que o arquiteto precisa saber (sem decidir por ele)

Requisitos não funcionais derivados do produto, para `docs/architecture.md`:

1. **Offline primeiro continua**: ficha, modo mesa, rolador e consulta funcionam sem rede; fila de alterações e de rolagens com hora original.
2. **Tempo real**: estado do grupo e feed em até 1 s (p95) numa mesa de até 8 pessoas; reconexão automática.
3. **Rolagem no servidor** com RNG criptograficamente seguro para rolagens de campanha; a mesma lógica de `dice.js`/`rules.js` no cliente e no servidor (um pacote compartilhado de regras, testado com os exemplos do livro).
4. **Eventos**: linha do tempo, versões e feed sugerem um registro de eventos por personagem e por campanha.
5. **Autorização por papel** conforme a matriz da seção 6.2, inclusive em tempo real (rolagem secreta não pode vazar no canal do grupo).
6. **Arquivos**: retratos e capas (upload, redimensionamento, WebP/AVIF) e as imagens do `image-manifest.json`.
7. **IA**: Holocron com recuperação sobre `data/` e citação obrigatória; limite de uso; possibilidade de desligar por chave.
8. **LGPD**: exclusão de conta, cópia dos dados, registro de consentimento.
9. **Custo baixo**: grupo pequeno de amigos é o caso típico; o produto não precisa de escala massiva no início.

## 9. Métricas de sucesso do protótipo

- Mesa de teste (1 mestre + 3 jogadores) joga uma sessão de 3 h usando feed e console sem voltar para papel.
- Tempo do convite até o jogador estar no Grupo com personagem: < 3 min.
- Zero perda de alteração de ficha numa sessão com queda de rede simulada.
- 90% das respostas do Holocron avaliadas como corretas e com página certa num conjunto de 30 perguntas de teste.

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Propriedade intelectual: "Star Wars", nomes de espécies, naves e o próprio nome "r2-d6" (lembra um droide dos filmes) | Arte original (`docs/image-briefs.md`), sem marca gráfica; avaliar renomear antes de qualquer publicação (D-07). |
| Efeitos visuais atrapalham a mesa | Modo mesa calmo, baixa luz, 2D por padrão no celular, interruptores. |
| Holocron erra regra | Citação obrigatória, recusa sem base, selo beta, feedback, conjunto de perguntas de teste. |
| Tempo real e offline juntos geram conflito | Política por tipo de campo (6.1) e versão em toda edição. |
| Escopo grande para um protótipo | Corte da seção 5.1; Could e Won't explícitos. |
| Custos de IA, armazenamento e envio de e-mail | Limites por conta, chave para desligar a IA, imagens otimizadas. |

## 11. Decisões que precisam do usuário

| ID | Pergunta | Recomendação |
|---|---|---|
| D-01 | Quais logins no protótipo? | E-mail (link mágico) + Google; Discord logo depois. |
| D-02 | Manter "cópia dos meus dados" em Conta (LGPD), mesmo sem exportar JSON na ficha? | Sim; é direito do titular e não polui a ficha. |
| D-03 | Oferecer migração automática dos personagens da v1 (localStorage)? | Sim, um toque, sem arquivo. |
| D-04 | Rolagem de campanha no servidor por padrão (confiança da mesa) ou no aparelho? | Servidor por padrão; dados físicos e offline sempre permitidos com selo. |
| D-05 | Um personagem em mais de uma campanha? | Não no protótipo (o estado de mesa ficaria ambíguo). |
| D-06 | Outros jogadores veem a ficha completa e os Dark Side Points dos colegas? | Ficha sim; Dark Side Points só dono e mestre (tema dramático). Configurável pela mestra depois. |
| D-07 | O nome "r2-d6" e o uso de "Star Wars" no app: manter para uso privado entre amigos ou planejar outro nome para publicar? | Uso privado agora; escolher nome próprio antes de publicar ou abrir cadastro público. |
| D-08 | Holocron entra no protótipo (custo de IA) ou espera? | Entrar como beta atrás de chave, com limite diário. |
| D-09 | Geração das 568 imagens (273 P1, 94 P2, 201 P3): IA generativa com revisão humana, artista, ou misto? | Misto: IA para estados vazios, erros e fundos; artista ou IA com curadoria forte para templates e espécies (a coleção que mais aparece). Verificar os termos comerciais da ferramenta. |
| D-10 | O mestre pode ajustar ferimento e stuns na ficha do jogador? | Sim, com registro na linha do tempo e aviso ao jogador. |
