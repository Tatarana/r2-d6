---
id: visual-direction
status: draft-v2
owner: PM r2-d6
related: [docs/product-spec-v2.md, docs/ux-platforms.md, docs/image-briefs.md, docs/image-manifest.json]
---

# Direção visual v2: "datapad de bordo"

A v1 acertou o tema escuro, a organização e a estrutura; faltou mundo. A v2 mantém a mesma arquitetura de informação (Hangar no lugar da lista de personagens, Ficha, Mesa, Consulta, Mais) e veste tudo como **instrumentação de nave e datapad**: vidro escuro, luz que vem de dentro dos painéis, dados que parecem objetos e imagens que abrem cada tela como uma janela para a galáxia.

## 1. Conceito

Três camadas, sempre na mesma ordem de profundidade:

1. **Janela** (fundo): imagem ou campo de estrelas, escurecida e com paralaxe leve. É o "lado de fora da nave".
2. **Vidro** (painéis): superfícies translúcidas escuras com borda de luz fina, cantos chanfrados num canto (não arredondados nos quatro), marcações de canto tipo mira. É o cockpit.
3. **Holograma** (dados vivos): números, dados, ferimentos e pontos em luz ciano/âmbar, com brilho suave e scanlines sutis. É o que o jogador lê na mesa.

Referências de linguagem (não de arte): HUDs de cockpit, consoles de ponte, datapads, plantas técnicas, mensagens holográficas com estática. Tudo **original**: nenhum logotipo, fonte, símbolo, quadro de filme ou design exato de nave, armadura ou droide da Lucasfilm. O nome "Star Wars" só aparece em texto descritivo ("compatível com o Star Wars Roleplaying Game REUP"), nunca como marca gráfica (ver decisão aberta D-07 em `docs/product-spec-v2.md`).

Princípio que não muda: **na mesa, legibilidade vence espetáculo**. Todo efeito tem versão calma (modo mesa, `prefers-reduced-motion`, modo baixa luz).

## 2. Paleta (tokens)

Tema escuro é o padrão e a identidade. O tema claro continua existindo como "modo papel" (impressão e luz do dia forte), com os mesmos papéis de cor.

| Token | Valor | Uso |
|---|---|---|
| `--void` | `#05070C` | Fundo absoluto, atrás das imagens. |
| `--space` | `#0A0F1A` | Fundo de tela sem imagem. |
| `--glass` | `rgba(14, 22, 36, .72)` + `backdrop-filter: blur(14px) saturate(120%)` | Painéis. Sem suporte a blur: `#0F1724` sólido. |
| `--glass-2` | `rgba(22, 34, 54, .80)` | Painel elevado, menu, folha (sheet). |
| `--line` | `rgba(120, 170, 220, .18)` | Bordas e divisores. |
| `--line-strong` | `rgba(79, 209, 255, .45)` | Borda de foco e de seleção. |
| `--text` | `#E8F1FA` | Texto principal (contraste > 12:1 sobre `--space`). |
| `--muted` | `#8FA3BA` | Texto secundário (AA sobre `--glass`). |
| `--holo` | `#4FD1FF` | Ação primária, links, dados normais, brilho principal. |
| `--ion` | `#3A7BFF` | Estado ativo, progresso, gradientes com `--holo`. |
| `--wild` | `#FFB020` | **Exclusivo do Wild Die** e de recortes de luz em imagens. |
| `--wild-hot` | `#FFE08A` | Explosão de 6 (núcleo do brilho). |
| `--cp` | `#B48CFF` | Character Points. |
| `--fp` | `#FFF1C9` com halo `--wild` | Force Points (luz branca quente). |
| `--dark` | `#FF4D5E` | Dark Side Points, falha do Wild Die 1, perigo, Killed. |
| `--ok` | `#48E5A4` | Sucesso, sincronizado, saúde. |
| `--warn` | `#FFC85C` | Aviso, leitura provisória (selo E-0xx). |
| `--house` | `#7FE3D0` | Selo "regra da casa". |

Gradientes de assinatura: `--grad-holo: linear-gradient(90deg, #3A7BFF, #4FD1FF)` (botão primário, barra de progresso); `--grad-wild: radial-gradient(circle, #FFE08A 0%, #FFB020 45%, rgba(255,176,32,0) 70%)` (halo do Wild Die).

Regras:
- **Âmbar é sagrado**: só Wild Die, Force Points (halo) e a luz de recorte das imagens. Nenhum botão comum é âmbar. O olho do jogador aprende que âmbar = "o dado especial".
- Cor nunca é o único sinal: Wild Die tem forma hexagonal e rótulo; ferimentos têm ícone e texto; selos têm texto.
- Contraste mínimo AA (4,5:1) para texto; números do modo mesa AAA (7:1).

## 3. Tipografia (Google Fonts, licença OFL)

| Papel | Fonte | Uso |
|---|---|---|
| Display | **Chakra Petch** 600/700 | Títulos de tela, nome do personagem, rótulos de painel em caixa alta com `letter-spacing: .08em`. Angular, técnica, legível em PT-BR. |
| Texto e UI | **Exo 2** 400/500/600 | Corpo, botões, formulários. Arredondada o bastante para leitura longa nas regras. |
| Números e códigos | **JetBrains Mono** 500/700, `font-variant-numeric: tabular-nums` | Códigos de dado (`4D+2`), totais, pips, páginas `(p.73)`, contadores. Zero com traço evita confusão 0/O. |

Escala (rem, base 16 px): 0,75 / 0,875 / 1 / 1,125 / 1,375 / 1,75 / 2,25 / 3. No modo mesa, total da rolagem a **4 rem** no celular e **5 rem** no tablet; código da perícia a 1,375 rem.

Proibido: fontes que imitam o logotipo ou letreiros dos filmes, e alfabetos ficcionais dos filmes. Decoração textual, quando houver, usa glifos abstratos originais (traços e pontos) e é `aria-hidden`.

## 4. Texturas, brilho e materiais

- **Scanlines**: `repeating-linear-gradient(0deg, rgba(79,209,255,.04) 0 1px, transparent 1px 3px)` sobre hologramas e placeholders. Desligadas no modo mesa e no baixa luz.
- **Ruído de filme**: PNG 128 px em `opacity: .035`, só sobre imagens hero.
- **Borda de luz**: painel com `border: 1px solid var(--line)` e um gradiente de 1 px no topo (`--holo` a 35% sumindo para os lados), como luz refletida no vidro.
- **Cantos**: `clip-path` com chanfro de 10 px no canto superior direito dos painéis principais; cartas (template, espécie) com chanfro em dois cantos opostos. Botões mantêm raio de 8 px (toque).
- **Marcas de mira**: quatro cantoneiras de 8 px nos cards selecionados e no dado ativo.
- **Brilho (glow)**: `box-shadow: 0 0 0 1px var(--line-strong), 0 0 24px rgba(79,209,255,.25)` em foco e seleção; `text-shadow: 0 0 12px currentColor` em números holográficos (desligado no modo baixa luz).
- **Profundidade**: fundo com paralaxe de 2 a 3 camadas (estrelas distantes, próximas, imagem) controlada por rolagem no PC e por giroscópio opcional no celular (off por padrão).

## 5. Microanimações e transições

Durações: 120 ms (toque, hover), 220 ms (painel, aba), 380 ms (troca de tela), 600 a 1.400 ms (rolagem de dados). Easing padrão `cubic-bezier(.2,.8,.2,1)`.

| Momento | Animação |
|---|---|
| Entrar no app | Tela de login: campo de estrelas em paralaxe; ao autenticar, "salto": estrelas se esticam em 380 ms e o Hangar acende de dentro para fora. |
| Troca de tela | Painéis entram com fade + translação de 12 px; o fundo faz cross-fade de 380 ms. Sem salto de layout (placeholders com proporção fixa). |
| Holograma acendendo | Números e cartas surgem com "flicker" curto (2 quadros de opacidade 0,4 → 1) e varredura de scanline de cima para baixo em 240 ms. |
| Toque em botão | Pressão (scale .97) + anel de luz que se expande 6 px e some. |
| Salvar no servidor | Indicador no topo: ponto `--holo` pulsando "transmitindo" → `--ok` "sincronizado" com check; offline: `--warn` "na fila (n)". |
| Ferimento | Ao piorar o estado, o painel de saúde pisca `--dark` uma vez e treme 2 px (60 ms). Ao curar, varredura `--ok`. |
| CP/FP | Gastar CP: partícula violeta voa do saldo até o dado extra. Ativar FP: halo branco-quente cresce no cartão da parada e os códigos dobram com contagem animada (4D → 8D). |
| Novo item no feed | Entra pela base com brilho da cor do autor; rolagem do Wild Die com 1 pulsa até o mestre decidir. |
| Convite aceito | Novo retrato "materializa" no grupo com efeito de holograma. |

Tudo respeita `prefers-reduced-motion: reduce` (troca por fade simples de 120 ms) e o interruptor "Animações" em Conta.

## 6. Tratamento do Wild Die e dos dados

O dado é o herói do produto. Dois modos, escolhidos em Conta e alternáveis no modo mesa:

**Dados 3D (padrão no tablet e PC, opcional no celular)**
- Física leve: os dados são lançados de baixo (gesto de arrastar para cima no toque, botão ou tecla `R`), quicam numa bandeja de vidro escuro e param. 600 a 1.400 ms.
- Dado normal: resina grafite fosca, pips com emissão ciano (`texture.die.normal`).
- **Wild Die**: resina âmbar translúcida com veios dourados (`texture.die.wild`), levemente maior (110%), com halo `--grad-wild` permanente. Rótulo "WILD" em mono abaixo dele quando para.
- **Explodiu 6**: o Wild Die pulsa, solta um anel de luz `--wild-hot`, e um novo Wild Die "nasce" do brilho e é lançado. A sequência aparece como trilha `6 → 6 → 3` ligada por setas. Som opcional "carga de capacitor". Vibração 30 ms.
- **Saiu 1 na primeira rolagem**: o dado fica vermelho `--dark` por dentro, rachadura luminosa, um "glitch" de 2 quadros na bandeja. O total aparece **riscado em espera** e o cartão "Decisão do mestre" abre com as três opções (RD-03, p.73). Na campanha, o pedido vai ao mestre pelo feed. Vibração dupla 20-40-20 ms.
- **Dado de CP**: violeta, explode no 6 como o Wild Die (RD-10, leitura provisória E-009), sem o tratamento de 1.
- Resultado: os dados se alinham numa régua abaixo da bandeja (normais em ordem, Wild Die por último) e o total sobe em contagem de 200 ms em JetBrains Mono.

**Dados 2D (padrão no celular e no modo baixa luz)**
- Fileira de dados chapados: normal = quadrado com borda ciano; Wild Die = **hexágono** âmbar preenchido. Animação de "giro" de 300 ms (faces trocando). Mesmos sinais de 6 e 1, mais discretos.

**Dados físicos (sempre disponível, PD-03)**: teclado numérico grande com um campo destacado em hexágono âmbar para o Wild Die; os mesmos efeitos de 6 e 1 disparam ao digitar.

## 7. Imagens por tela

Todos os espaços estão em `docs/image-briefs.md` e `docs/image-manifest.json` (568 espaços: 144 de telas e 424 de entidades da consulta, com reservas por categoria). Resumo de como cada tela usa imagem:

| Tela | Imagem | Tratamento |
|---|---|---|
| Entrar / Cadastro | `hero.login`, `hero.signup`, `bg.auth` | PC: imagem ocupa 60% à direita, formulário em vidro à esquerda. Tablet: imagem de fundo inteira, formulário centrado. Celular: imagem no terço superior com gradiente para `--void`, formulário abaixo. |
| Hangar | `hero.hangar`, `bg.hangar`, `hangar.bay.empty`, retratos | Faixa hero com saudação ("Bem-vinda de volta, Ana") e a próxima sessão. Personagens como **holocartas** em baias (retrato ou template ao fundo, espécie em selo, ferimento atual e CP em chips). Campanhas como cartões com capa. |
| Criar | `hero.create`, `create.path.*`, `template.*`, `species.*` | Escolha de caminho em dois cartões grandes. Templates e espécies em **galeria de cartas** 3:4 com virar (frente: arte e nome; verso: atributos e página). |
| Ficha | retrato do jogador ou `template.*`, `icon.attr.*` | Cabeçalho com a arte do personagem desfocada atrás (backdrop) e o retrato nítido em moldura hexagonal; atributos com ícone; perícias em lista densa sem imagem (legibilidade). |
| Modo mesa | `bg.mesa`, texturas dos dados, `icon.wound.*`, `icon.points.*` | Fundo quase preto; nenhuma imagem compete com os números. Retrato pequeno no canto. |
| Consulta | `ref.*`, `species.*`, `weapon.*`, `armor.*`, `gear.*`, `vehicle.*`, `starship.*`, `skill.*`, `power.*` e as reservas `*-cat.*`, `starship-scale.*`, `skill-attr.*`, `power-skill.*` | Cartões de categoria com planta holográfica; listas com miniatura 1:1 por item; a página do item (`EntityDetail`) abre com a imagem 16:9 (armas, armaduras e equipamentos em planta; veículos e naves em cena cinematográfica) ou cena 1:1 (perícias e poderes). Sem imagem do item, usa a reserva da categoria e depois o placeholder da família. |
| Campanha | `hero.campaign` ou `campaign.cover.*`, `bg.campaign.holomap`, retratos | Capa escolhida pelo mestre; aba Holomapa com o mapa galáctico original e marcadores das sessões; Grupo com retratos em anel. |
| Convite | `hero.invite`, `og.default` | Página pública com a mensagem holográfica e o nome da campanha. |
| Mestre | `bg.gm-console` | Console escuro com cartões dos personagens. |
| Holocron | `hero.holocron` | Cubo de cristal no topo; respostas como "fragmentos" com citação de página. |
| Vazio / erro | `empty.*`, `error.*` | Ilustração pontual 160 a 240 px, uma frase com humor leve e uma ação. |

Enquanto a imagem não existe, o componente desenha o **placeholder padrão** do manifesto (gradiente da família, scanlines, ícone Lucide a 45%), com a proporção final, para o layout não mudar quando a arte chegar.

Retratos enviados pelo jogador (upload) substituem a arte do template na ficha, no Hangar, no grupo e no feed. Recorte circular ou hexagonal, ponto focal ajustável no upload.

## 8. Plataformas

| | Celular (< 700 px) | Tablet (700 a 1099 px) | PC (>= 1100 px) |
|---|---|---|---|
| Imagens | Hero no terço superior (9:16 recortado), cartas em carrossel horizontal. | Hero de fundo inteiro em telas de entrada; cartas em grade de 3 a 4. | Hero lateral ou faixa 21:9; cartas em grade de 5 a 6 com virar no hover. |
| Vidro | Blur reduzido (8 px) por desempenho; sem paralaxe por padrão. | Blur 14 px. | Blur 14 px, paralaxe de rolagem. |
| Dados | 2D por padrão, 3D opcional. | 3D com bandeja ocupando meia tela em paisagem. | 3D numa bandeja lateral do modo mesa; tecla `R`. |
| Navegação | Barra inferior com 5 destinos e ícones originais. | Abas no topo; split em paisagem. | Barra lateral em vidro, colapsável. |

## 9. Uso na mesa: legibilidade e baixa luz

- **Modo mesa = modo calmo**: sem scanlines, sem paralaxe, sem flicker; fundo `bg.mesa` a 40% de brilho; números grandes; toque de 56 px.
- **Modo baixa luz** (interruptor no modo mesa e na barra rápida): paleta "luz vermelha de cockpit" que preserva a adaptação ao escuro da mesa e não ilumina o rosto dos outros jogadores. Fundo `#000`, texto `#FF6A5A` a 85%, destaque `#FFB020` só no Wild Die, sem brilhos, imagens escondidas ou a 15% em monocromático, brilho da tela sugerido no mínimo. Alternativa "âmbar suave" para quem não gosta de vermelho.
- **Tela sempre ligada** (Wake Lock) com indicador discreto no topo.
- **Leitura de longe**: no tablet apoiado, o total da última rolagem e o estado de ferimento ficam legíveis a 1 m (número >= 5 rem, peso 700).
- **Sem som por padrão**; sons e trilha são opt-in e têm volume próprio.

## 10. Entregáveis de design para o smart-coder

- Tokens acima em CSS custom properties (e no tema do framework que o arquiteto escolher), com `:root[data-theme]` e `data-mode="mesa|lowlight"`.
- Componentes base: `GlassPanel`, `HoloNumber`, `DiceTray3D`, `DiceRow2D`, `WildDieBadge`, `HoloCard` (template/espécie com virar), `PortraitFrame` (hex/círculo), `ImageSlot` (lê o manifesto e desenha placeholder), `SyncIndicator`, `Seal` (RAW/CASA/PROV), `FeedItem`, `EmptyState`, `ErrorState`.
- `ImageSlot` recebe só o `id` do manifesto; o componente resolve arquivo, recorte por ponto focal, `srcset`, alt e placeholder.
