---
id: ux-platforms
status: draft-v2
owner: PM r2-d6
related: [docs/product-spec.md, docs/product-spec-v2.md, docs/visual-direction.md]
---

# Experiência por plataforma e apoio à mesa física

> **v2**: as faixas e a lógica por plataforma continuam. Mudanças da v2 marcadas com **(v2)**; a seção "Mudanças da v2" no fim resume tudo. Visual em `docs/visual-direction.md`.

O mesmo app, três formas. A forma depende da largura **e** do tipo de ponteiro (`pointer: coarse` = toque), não só do tamanho da janela.

| Faixa | Forma | Navegação |
|---|---|---|
| >= 1100 px, ponteiro fino | **PC** | Barra lateral fixa à esquerda; conteúdo em até 3 painéis. |
| 700 a 1099 px, ou toque em tela grande | **Tablet** | Abas no topo; modo split (dois painéis lado a lado) em paisagem. |
| < 700 px | **Celular** | Barra inferior com 5 destinos; conteúdo em uma coluna. **(v2)** Destinos: Hangar, Ficha, Mesa, Campanha, Consulta; "Rolar" vira botão flutuante dentro de Mesa e Campanha; "Mais" vai para o menu do avatar (Conta, Glossário, Holocron, Sair). |

## PC: preparação e criação

Momento de uso: antes da sessão, em casa, com tempo; o jogador está montando ou evoluindo o personagem e lendo regras.

- **Assistente em multipainel**: à esquerda os passos; ao centro o passo atual; à direita um **painel de contexto** que mostra a regra do passo (com página) e o personagem parcial atualizado ao vivo. Clicar numa perícia abre a descrição dela no painel de contexto.
- **Busca com teclado**: `/` ou `Ctrl+K` abre a busca de qualquer tela; setas navegam; `Enter` abre; `Esc` fecha. Resultados agrupados (Regras, Perícias, Poderes, Espécies, Itens, Glossário).
- **Atalhos**: `R` rolar a perícia selecionada, `N` próximo round, `1`-`9` definir ações declaradas, `?` lista de atalhos.
- **Tabelas largas** (armas, naves) em grade ordenável, com colunas completas.
- **Impressão**: ficha em A4 (CSS de impressão, preto e branco, 2 páginas como a do livro). **(v2)** Sem exportar/importar JSON: a ficha mora na conta (PD-09).
- **(v2) Console do mestre no PC**: grade com um cartão por personagem (estado ao vivo), feed à direita, ações do mestre no topo; atalho `S` abre teste secreto.
- **(v2) Imagens grandes**: hero lateral (60%) nas telas de entrada; galerias de cartas com virar no hover.

## Tablet: companheiro na mesa

Momento de uso: na mesa, apoiado, várias horas; o jogador consulta e anota sem tirar os olhos do jogo por muito tempo.

- **Ficha em paisagem** em duas colunas (atributos e perícias à esquerda; pontos, ferimentos, armas à direita).
- **Split ficha + regras**: em paisagem, a ficha (ou o modo mesa) fica à esquerda e a consulta à direita; tocar no nome de uma regra/perícia na ficha abre a regra no painel direito sem perder a ficha.
- **Toque grande**: alvos de pelo menos 44 px; +/- grandes para pontos, munição e ações; sem dependência de hover.
- **Retrato**: abas no topo (Hangar, Ficha, Mesa, Campanha, Consulta), uma coluna. **(v2)**
- **(v2) Painel da mesa**: em paisagem, tablet apoiado mostra ficha + estado + feed da campanha; o celular do mesmo jogador pode virar controle (F-10). Dados 3D em bandeja de meia tela.
- **(v2) Tablet da mestra**: console do mestre em duas colunas (grupo à esquerda, feed e decisões do Wild Die à direita).

## Celular: durante a sessão

Momento de uso: na mão, durante o round, muitas vezes com a outra mão segurando dados; luz baixa.

- **Barra inferior** ao alcance do polegar; ações principais na metade de baixo da tela (uso com uma mão).
- **Rolador rápido**: lista das perícias do personagem como botões grandes; um toque rola (ou abre o modo "dados físicos" para digitar os valores). Wild Die em outra cor e com forma diferente (não só cor, por acessibilidade).
- **Controle de estado** em uma tela: ações declaradas (+/-), penalidade total visível, ferimento (botões com o próximo estado), stuns, CP e FP (com bloqueio no mesmo round), munição por arma (toque = 1 tiro; segurar = recarregar).
- **Consulta rápida**: busca no topo da aba Regras; cartões curtos com a regra e a página.
- **Modo escuro** é o padrão e a identidade **(v2)**; "modo papel" claro alternável; contraste alto.
- **(v2) Modo baixa luz**: paleta vermelha de cockpit no modo mesa (US-35).
- **(v2) Feed no celular**: aba Campanha abre no feed; rolagem com Wild Die 1 aguardando a mestra fica fixa no topo até a decisão.
- **Tela ligada**: Wake Lock no modo mesa quando suportado, com interruptor. **(v2: Must)**
- **Vibração curta** no Wild Die 6 (30 ms) ou 1 (20-40-20 ms), se `navigator.vibrate` existir; desligável.

## Apoio à mesa física

O app ajuda sem substituir os dados físicos nem o mestre.

| Recurso | O que faz | Protótipo? |
|---|---|---|
| Rolador digital opcional | Rola a parada com Wild Die destacado, explosão do 6 e as 3 opções do 1. | **Sim** |
| Modo "dados físicos" | O jogador digita os dados que rolou na mesa; o app soma e aplica as regras do Wild Die. | **Sim** |
| Calculadora de parada | Perícia ou especialização + penalidades de ações e ferimentos + CP + FP = parada final, com explicação linha a linha. | **Sim** |
| Contador de round e ações declaradas | Round atual, ações declaradas, "próximo round" libera CP/FP e zera as ações. | **Sim** |
| Rastreador de ferimentos e stuns | Estado, progressão, penalidade, contagem de stuns e de rounds em Mortally Wounded. | **Sim** |
| Rastreador de pontos | CP, FP e Dark Side Points com histórico do que foi gasto. | **Sim** |
| Munição | Contador por arma com base na munição do catálogo. | **Sim** |
| Calculadora de dano x resistência | Dano, Strength + armadura, escala; mostra o resultado na tabela de ferimentos. | **Sim** |
| Referência de dificuldade | Faixas de dificuldade e modificadores de alcance e cobertura. | **Sim** |
| Referência rápida de combate | Cartão com os passos do ataque, reações, cobertura, escala. | **Sim** |
| Imprimir ficha | A4. (Exportar JSON saiu na v2.) | **Sim** |
| Funcionamento offline | Service worker; instalável como app. **(v2)** Com fila de alterações e rolagens que sobe quando a rede volta. | **Sim** |
| QR da ficha para o mestre | **(v2)** Substituído por convite da campanha (link/QR) e ficha pública por link. | Sim (v2) |
| Tela ligada (Wake Lock) | Mantém a tela acesa no modo mesa. | Sim, se o navegador suportar |
| Histórico de rolagens | Últimas 20 rolagens com explicação; **(v2)** na campanha, o feed da sessão inteira vira resumo no Diário. | Sim |
| Iniciativa do grupo e cartas do mestre | Ferramentas de mestre. | Depois (fase 2) |
| Combinar ações (command) | Bônus +1D por 3 personagens. | Depois |
| Compartilhamento em tempo real | **(v2)** Feed da mesa, estado do grupo para o mestre, Wild Die 1 decidido pelo mestre, rolagens secretas. | **Sim (v2)** |
| Aparelhos sincronizados | **(v2)** Celular como controle e tablet como painel do mesmo personagem. | **Sim (v2)** |
| Dados 3D | **(v2)** Bandeja com Wild Die âmbar, efeitos de 6 e 1; 2D por padrão no celular e na baixa luz. | **Sim (v2)** |
| Modo baixa luz | **(v2)** Paleta vermelha que preserva a visão no escuro da mesa. | **Sim (v2)** |
| Assistente de regras (Holocron) | **(v2)** Pergunta em português, resposta com página. | Beta (v2) |

## Acessibilidade e conforto

- Contraste AA nos dois temas; foco visível; navegação completa por teclado no PC.
- Wild Die identificado por forma e rótulo, não só por cor.
- Fonte base 16 px; números grandes no modo mesa.
- Movimento reduzido respeita `prefers-reduced-motion`; **(v2)** interruptor "Animações" em Conta.
- **(v2)** Toda imagem tem texto alternativo no manifesto (`docs/image-manifest.json`); imagens decorativas têm alt vazio.
- **(v2)** Âmbar reservado ao Wild Die; nenhum estado depende só de cor (forma, ícone e texto).

## Mudanças da v2 (resumo)

| Área | Celular | Tablet | PC |
|---|---|---|---|
| Entrada | Login com hero no terço superior; Hangar em uma coluna com carrossel de personagens. | Hero de fundo, formulário centrado; Hangar em grade de 3. | Hero lateral; Hangar em grade de 5 a 6 com campanhas ao lado. |
| Campanha | Abre no feed; console do mestre simplificado (lista de cartões). | Console do mestre em duas colunas; feed ao lado da ficha em paisagem. | Console do mestre completo; atalhos. |
| Mesa | Controle (rolador, CP/FP, ações), dados 2D, baixa luz rápida. | Painel (ficha, estado, feed), dados 3D. | Bandeja 3D lateral, tecla `R`. |
| Sem rede | Ficha, mesa, rolador e consulta funcionam; indicador "na fila (n)". | Igual. | Igual. |

