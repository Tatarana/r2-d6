---
id: image-briefs
status: draft-v2
owner: PM r2-d6
related: [docs/image-manifest.json, docs/visual-direction.md, docs/product-spec-v2.md]
---

# Espaços de imagem: briefs

Fonte legível dos espaços de imagem do app. O código usa `docs/image-manifest.json` (mesmos `id`s, mais campos técnicos). As duas versões são geradas da mesma lista; ao mudar uma imagem, mude as duas.

**Total: 568 espaços.** Prioridade P1 = necessária para o protótipo parecer pronto; P2 = enriquece depois; P3 = cauda longa (perícias e poderes).

## Regras para quem for criar as imagens

- **Arte original que evoca o universo.** Nada de logotipos, marcas, fontes ou símbolos registrados da Lucasfilm; nada de quadros dos filmes; nada de personagens conhecidos; naves, armaduras e droides devem ser de design próprio (silhuetas e proporções que lembram o gênero, sem copiar modelos). Espécies descritas pelos traços do livro, em interpretação própria.
- **Sem texto dentro da imagem.** Títulos e rótulos são do app (tradução, acessibilidade, legibilidade).
- **Escuro por natureza.** As imagens vivem sobre o tema escuro; evitar fundos claros e brancos estourados. Luz-chave ciano, recorte âmbar (ver `docs/visual-direction.md`).
- **Ponto focal.** Cada imagem indica onde fica o assunto; o app recorta por plataforma a partir dele.
- **Coerência de série.** Templates e espécies são cartas da mesma coleção: mesmo enquadramento (busto 3/4), mesma luz, mesmo anel holográfico atrás da cabeça.
- **Entidades da consulta.** Armas, armaduras, equipamentos, veículos, naves, perícias e poderes têm uma imagem por item (`<família>.<id>`, `data_ref` aponta para o registro). Itens com nome de modelo conhecido dos filmes são descritos pela função e pela silhueta genérica: a arte deve ser um design próprio, nunca a nave, o veículo, a arma ou a armadura dos filmes.
- **Cadeia de reserva.** Enquanto a imagem do item não existe, o app usa a primeira imagem existente da lista `fallback` do item (a reserva da categoria) e, sem ela, o placeholder da família. Por isso as reservas de categoria vêm antes na fila de produção.
- **Ferramenta de geração.** Se usar IA generativa, registrar ferramenta, data e prompt final no manifesto (campo a acrescentar) e verificar os termos de uso comercial da ferramenta. Revisão humana obrigatória antes de `approved`.

## Estilos

| Estilo | Descrição (sufixo do prompt) |
|---|---|
| `holo-cinematic` | Pintura digital cinematográfica, alto contraste, céu ou espaço profundo quase preto, luz-chave ciano (#4FD1FF) e contraluz âmbar (#FFB020), leve grão de filme, profundidade atmosférica. Deixar área calma para texto conforme o ponto focal indicado. |
| `portrait-card` | Retrato de busto em 3/4, pintura digital semi-realista, fundo escuro com bruma azul e um anel holográfico ciano atrás da cabeça; iluminação de painel (ciano por baixo, âmbar de recorte). Personagem olhando levemente para fora do quadro. Sem texto na imagem. |
| `blueprint` | Ilustração técnica estilo holograma/planta: traço ciano luminoso sobre azul-noite, linhas de cota, grade fina e ruído de scanline; um objeto central em perspectiva 3/4. Sem texto legível (rótulos apenas como glifos abstratos). |
| `ambient-bg` | Fundo ambiente de baixo contraste para ficar atrás de interface: escuro (luminância média abaixo de 12%), detalhes suaves, sem pontos de alto brilho no centro, cantos ligeiramente vinhetados. Deve funcionar em loop/cortes de proporção diferentes. |
| `spot-illustration` | Ilustração pontual centrada, fundo transparente, silhueta clara e simples, traço holográfico ciano com um único detalhe âmbar; tom leve e com humor discreto. Legível em 160 px. |
| `icon-glyph` | Ícone vetorial monolinha (SVG) em grade de 24 px, traço 1,75 px, cantos arredondados, cor herdada (currentColor). Original, geométrico, sem referência a símbolos registrados. |
| `material` | Textura de material para o dado 3D (mapa de cor 1:1 sem costura), com variante de mapa de emissão para os pips. |
| `blueprint-item` | Ilustração técnica estilo holograma/planta: traço ciano luminoso sobre azul-noite, linhas de cota, grade fina e ruído de scanline; um objeto central em perspectiva 3/4. Sem texto legível (rótulos apenas como glifos abstratos). Objeto isolado e centralizado, com sombra projetada suave e um brilho de recorte âmbar numa borda; deve ler bem em miniatura 1:1 de 160 px. |
| `holo-craft` | Pintura digital cinematográfica, alto contraste, céu ou espaço profundo quase preto, luz-chave ciano (#4FD1FF) e contraluz âmbar (#FFB020), leve grão de filme, profundidade atmosférica. Deixar área calma para texto conforme o ponto focal indicado. Veículo ou nave em movimento no seu ambiente natural, enquadrado inteiro com margem; design próprio inspirado na função e no porte, sem reproduzir os modelos dos filmes (silhueta, pintura e detalhes originais). |
| `scene-spot` | Ilustração-cena pequena e simbólica, fundo escuro em vinheta (não transparente), traço pictórico simplificado com luz ciano e um único ponto âmbar; uma ação clara e legível em 160 px, sem texto. |

## Placeholder padrão (enquanto a imagem não existe)

Enquanto file for null, o componente desenha o placeholder do campo placeholder: o gradiente, uma sobreposição de scanlines (repeating-linear-gradient 0deg, rgba(79,209,255,.05) 0 1px, transparente 1px 3px), o ícone (nomes do conjunto Lucide) centralizado em accent a 45% de opacidade e, só em ambiente de desenvolvimento, o id em fonte mono 11 px no canto inferior. A proporção é a mesma da imagem final para não haver salto de layout.

| Placeholder | Gradiente | Ícone | Cor de destaque |
|---|---|---|---|
| `default` | `linear-gradient(135deg, #0B1A2B 0%, #12324A 55%, #070B12 100%)` | `image` | `#4FD1FF` |
| `hero` | `radial-gradient(120% 90% at 70% 20%, #12324A 0%, #0A1422 45%, #05070C 100%)` | `sparkles` | `#4FD1FF` |
| `portrait` | `radial-gradient(80% 70% at 50% 35%, #1A2C44 0%, #0C1524 60%, #06090F 100%)` | `user-round` | `#4FD1FF` |
| `template` | `radial-gradient(80% 70% at 50% 35%, #2A2412 0%, #141109 60%, #07070A 100%)` | `id-card` | `#FFB020` |
| `blueprint` | `linear-gradient(160deg, #0A2238 0%, #0B1B2E 50%, #060C16 100%)` | `scan-line` | `#4FD1FF` |
| `campaign` | `radial-gradient(100% 80% at 30% 30%, #251A3D 0%, #120E22 55%, #06060C 100%)` | `orbit` | `#B48CFF` |
| `state` | `none (transparente sobre --surface)` | `circle-dashed` | `#7C8AA5` |
| `error` | `radial-gradient(90% 70% at 50% 40%, #3A1218 0%, #1A0A0E 60%, #07070A 100%)` | `triangle-alert` | `#FF4D5E` |
| `icon` | `none` | `square-dashed` | `currentColor` |
| `weapon` | `linear-gradient(160deg, #0A2238 0%, #0B1B2E 50%, #060C16 100%)` | `crosshair` | `#4FD1FF` |
| `armor` | `linear-gradient(160deg, #0F2433 0%, #0B1824 50%, #060B12 100%)` | `shield` | `#4FD1FF` |
| `gear` | `linear-gradient(160deg, #10263A 0%, #0B1A2A 50%, #060C16 100%)` | `backpack` | `#4FD1FF` |
| `vehicle` | `radial-gradient(120% 90% at 30% 70%, #2A1E10 0%, #12100C 50%, #05070C 100%)` | `car` | `#FFB020` |
| `starship` | `radial-gradient(120% 90% at 70% 30%, #12324A 0%, #0A1422 45%, #05070C 100%)` | `rocket` | `#4FD1FF` |
| `skill` | `radial-gradient(90% 80% at 50% 40%, #13263A 0%, #0A1320 60%, #05070C 100%)` | `target` | `#4FD1FF` |
| `power` | `radial-gradient(90% 80% at 50% 40%, #22173A 0%, #110C20 60%, #05070C 100%)` | `sparkles` | `#B48CFF` |

## Login e cadastro

### `hero.login`

- **Onde**: /entrar, componente `AuthLayout.hero`
- **Proporção e tamanho**: 16:9 / 4:3 / 9:16; mobile: 1080x1920 (9:16); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `holo-cinematic`; placeholder `hero`; ponto focal: direita (texto à esquerda no PC; topo livre no celular); prioridade P1
- **Descrição**: Um cargueiro gasto pousado numa plataforma de atracação ao entardecer de um planeta árido de rochas vermelhas, sob um sol grande e baixo; a rampa está aberta e uma luz quente sai do interior. Atmosfera de partida para a aventura, sem personagens reconhecíveis.
- **Alt**: Cargueiro com a rampa aberta numa plataforma ao entardecer, pronto para partir.

### `hero.signup`

- **Onde**: /cadastro, componente `AuthLayout.hero`
- **Proporção e tamanho**: 16:9 / 4:3 / 9:16; mobile: 1080x1920 (9:16); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `holo-cinematic`; placeholder `hero`; ponto focal: centro-direita; prioridade P1
- **Descrição**: Vista de dentro de uma cabine de nave no instante do salto ao hiperespaço: as estrelas se esticam em linhas de luz azul e branca através da janela, painéis com luzes âmbar em primeiro plano. Sensação de começo de jornada.
- **Alt**: Janela de cabine com as estrelas se esticando em linhas de luz no salto ao hiperespaço.

### `bg.auth`

- **Onde**: /entrar, /cadastro, /recuperar, componente `AuthLayout.background`
- **Proporção e tamanho**: variável; mobile: 1170x2532 (9:19,5); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `ambient-bg`; placeholder `hero`; ponto focal: centro; prioridade P2
- **Descrição**: Campo de estrelas profundo com uma nebulosa azul-violeta muito discreta e poeira cósmica; pode receber paralaxe lenta em camadas (estrelas próximas, distantes, nebulosa).
- **Alt**: (decorativa, alt vazio)

## Hangar (painel inicial)

### `hero.hangar`

- **Onde**: /hangar, componente `HangarHeader.hero`
- **Proporção e tamanho**: 21:9 (PC) / 16:9 / 3:2; mobile: 1080x720 (3:2); tablet: 2048x1152 (16:9); desktop: 2560x1100 (21:9)
- **Estilo**: `holo-cinematic`; placeholder `hero`; ponto focal: centro-baixo; topo livre para saudação; prioridade P1
- **Descrição**: Interior de um hangar de base escondida à noite: baias numeradas com luz ciano no chão, um cargueiro e dois caças de design original em manutenção, técnicos pequenos ao fundo. Atmosfera de base de operações acolhedora.
- **Alt**: Hangar noturno com naves em manutenção e baias iluminadas.

### `bg.hangar`

- **Onde**: /hangar, componente `HangarLayout.background`
- **Proporção e tamanho**: variável; mobile: 1170x2532 (9:19,5); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `ambient-bg`; placeholder `hero`; ponto focal: centro; prioridade P2
- **Descrição**: Piso metálico do hangar visto de cima em perspectiva, com marcações de baia e reflexos de luzes de pista, muito escuro e desfocado nas bordas.
- **Alt**: (decorativa, alt vazio)

### `hangar.bay.empty`

- **Onde**: /hangar, componente `CharacterBay (vazia)`
- **Proporção e tamanho**: 3:4; all: 1200x1600 (3:4), recorte quadrado 1:1 para miniatura pelo ponto focal
- **Estilo**: `blueprint`; placeholder `blueprint`; ponto focal: centro; prioridade P1
- **Descrição**: Baia de atracação vazia vista de frente, com contorno holográfico tracejado de uma silhueta humanoide indefinida e um sinal de mais luminoso no centro, convidando a criar um personagem.
- **Alt**: Baia vazia com silhueta holográfica, convite para criar personagem.

## Criação de personagem

### `hero.create`

- **Onde**: /criar, componente `CreationIntro.hero`
- **Proporção e tamanho**: 16:9 / 4:3 / 9:16; mobile: 1080x1920 (9:16); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `holo-cinematic`; placeholder `hero`; ponto focal: centro; prioridade P1
- **Descrição**: Mesa de projeção holográfica numa sala escura; acima dela gira um holograma de figura humanoide em construção, feito de linhas ciano, com seis anéis de dados orbitando ao redor.
- **Alt**: Holograma de um personagem sendo montado sobre uma mesa de projeção.

### `create.path.template`

- **Onde**: /criar, componente `PathCard: template`
- **Proporção e tamanho**: 3:2; all: 1200x800 (3:2)
- **Estilo**: `holo-cinematic`; placeholder `template`; ponto focal: centro; prioridade P1
- **Descrição**: Leque de cartões holográficos de identidade abertos sobre uma mesa, cada um com uma silhueta diferente (pilota, caçador, erudito), luz âmbar.
- **Alt**: Cartões holográficos de identidade em leque, cada um com uma silhueta.

### `create.path.scratch`

- **Onde**: /criar, componente `PathCard: do zero`
- **Proporção e tamanho**: 3:2; all: 1200x800 (3:2)
- **Estilo**: `blueprint`; placeholder `blueprint`; ponto focal: centro; prioridade P1
- **Descrição**: Planta técnica de uma figura humanoide com medidas e seis marcadores de atributo vazios ao redor, como um projeto a preencher.
- **Alt**: Planta de uma figura humanoide com marcadores de atributo vazios.

## Templates (26)

Comum a todos: aparece em /criar (passo Template), /personagem/:id (cabeçalho), /consulta/templates (`TemplateCard, SheetHeader.backdrop`); proporção 3:4; tamanho all: 1200x1600 (3:4), recorte quadrado 1:1 para miniatura pelo ponto focal; estilo `portrait-card`; placeholder `template`; ponto focal: rosto no terço superior.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `template.alien-student-of-the-force` | Ser alienígena de espécie antiga e serena, em vestes simples de meditação, sentado de pernas cruzadas; um pequeno amuleto flutua diante dele envolto em brilho suave. Dados: `data/templates.json#alien-student-of-the-force`. | Alienígena em meditação com amuleto flutuante. | P1 |
| `template.armchair-historian` | Ex-burocrata de meia-idade com óculos e uniforme rebelde um pouco largo, abraçando um datapad cheio de anotações; ao fundo, prateleiras de cristais de dados. Dados: `data/templates.json#armchair-historian`. | Historiador de óculos e uniforme rebelde com um datapad. | P1 |
| `template.arrogant-noble` | Nobre jovem de queixo erguido, roupas finas da última moda e capa bordada, segurando com desdém uma pequena pistola ornamentada. Dados: `data/templates.json#arrogant-noble`. | Nobre altivo com roupas luxuosas e pistola ornamentada. | P1 |
| `template.bounty-hunter` | Caçador de recompensas jovem com armadura de placas desencontradas e capacete sob o braço, várias armas no cinto, olhar frio de quem segue um código próprio. Dados: `data/templates.json#bounty-hunter`. | Caçador de recompensas com armadura improvisada e várias armas. | P1 |
| `template.brash-pilot` | Piloto jovem e confiante, macacão laranja-escuro de voo e capacete de design original no ombro, sorriso de quem acha que é o melhor da galáxia; caças ao fundo. Dados: `data/templates.json#brash-pilot`. | Piloto jovem e confiante com capacete no ombro. | P1 |
| `template.ewok` | Pequeno ser peludo de capuz de couro, segurando uma lança e uma bolsa cheia de objetos brilhantes, curioso diante de uma luz de painel de nave. Dados: `data/templates.json#ewok`. | Pequeno ser peludo de capuz, curioso, com lança e objetos brilhantes. | P1 |
| `template.failed-jedi` | Homem envelhecido de barba por fazer, manto surrado e garrafa na mão, um cabo de sabre de luz esquecido no cinto; sombras pesadas e um leve brilho avermelhado atrás dele. Dados: `data/templates.json#failed-jedi`. | Ex-aprendiz Jedi decadente com manto surrado e sabre no cinto. | P1 |
| `template.gambler` | Apostador elegante numa mesa de cartas de salão espacial, roupas caras, cartas holográficas em leque na mão e um sorriso de quem tem um trunfo. Dados: `data/templates.json#gambler`. | Apostador elegante com cartas em leque numa mesa de jogo. | P1 |
| `template.kid` | Criança de uns doze anos com mochila, estilingue no bolso e olhar determinado, espiando de trás de caixas de carga num porto espacial. Dados: `data/templates.json#kid`. | Criança aventureira espiando de trás de caixas de carga. | P1 |
| `template.laconic-scout` | Batedora de poucas palavras com poncho, binóculos eletrônicos e mochila, de pé num rochedo diante de um planeta selvagem e vazio ao amanhecer. Dados: `data/templates.json#laconic-scout`. | Batedora com poncho e binóculos diante de um planeta selvagem. | P1 |
| `template.loyal-retainer` | Servidor fiel de casa real, roupas formais impecáveis com um detalhe de brasão original, postura protetora, mão perto de uma pistola discreta. Dados: `data/templates.json#loyal-retainer`. | Servidor formal de casa real em postura protetora. | P1 |
| `template.merc` | Mercenário veterano com uniforme da companhia de cor neutra, rifle blaster de design original, cicatriz no rosto e insígnia de unidade inventada. Dados: `data/templates.json#merc`. | Mercenário veterano de uniforme com rifle. | P1 |
| `template.minor-jedi` | Jovem de túnica simples e olhar cansado, segurando um sabre de luz desligado com reverência; luz azul fria vinda de baixo. Dados: `data/templates.json#minor-jedi`. | Jovem de túnica com sabre de luz desligado nas mãos. | P1 |
| `template.mon-calamari` | Oficial de espécie aquática com cabeça arredondada e olhos grandes laterais, uniforme de frota, diante de janelas de uma ponte de comando de linhas orgânicas. Dados: `data/templates.json#mon-calamari`. | Oficial aquático de uniforme numa ponte de comando orgânica. | P1 |
| `template.old-senatorial` | Senador idoso de cabelos brancos e roupas austeras, mãos apoiadas numa bengala, olhar firme de quem ainda luta pela velha república. Dados: `data/templates.json#old-senatorial`. | Senador idoso de roupas austeras com bengala. | P1 |
| `template.outlaw` | Fora da lei de chapéu de aba e casaco longo empoeirado, pistola pesada no coldre, de costas para um povoado em chamas ao longe. Dados: `data/templates.json#outlaw`. | Fora da lei de casaco longo com povoado em chamas ao fundo. | P1 |
| `template.pirate` | Pirata espacial extravagante com roupas coloridas, muitos anéis e um sabre curvo, rindo no convés de uma nave remendada. Dados: `data/templates.json#pirate`. | Pirata extravagante com anéis e sabre curvo. | P1 |
| `template.protocol-droid` | Droide de protocolo humanoide de design original, acabamento metálico prateado-azulado e olhos luminosos, gesticulando com ar preocupado. Dados: `data/templates.json#protocol-droid`. | Droide de protocolo de design original gesticulando, preocupado. | P1 |
| `template.quixotic-jedi` | Aventureiro excêntrico com armadura improvisada de sucata, espada de duelo antiga erguida e capa feita de cortina, convencido de ser um cavaleiro. Dados: `data/templates.json#quixotic-jedi`. | Aventureiro excêntrico com armadura de sucata e espada antiga erguida. | P1 |
| `template.retired-captain` | Capitão aposentado de bigode grisalho, uniforme naval um pouco fora de moda, contemplando uma janela com estrelas; postura ainda militar. Dados: `data/templates.json#retired-captain`. | Capitão aposentado de uniforme antigo olhando as estrelas. | P1 |
| `template.smuggler` | Contrabandista de colete e pistola pesada no quadril, encostado na rampa de um cargueiro surrado de design original, sorriso torto. Dados: `data/templates.json#smuggler`. | Contrabandista encostado na rampa de um cargueiro surrado. | P1 |
| `template.tongue-tied-engineer` | Engenheira tímida com roupas largas cheias de bolsos, computador de bolso na mão e ferramentas caindo, ao lado de um pequeno droide de manutenção de design original. Dados: `data/templates.json#tongue-tied-engineer`. | Engenheira tímida com computador de bolso e droide de manutenção. | P1 |
| `template.tough-native` | Nativo robusto de mundo isolado, roupas extravagantes de outra era, espada e pistola de pólvora, olhando com espanto para uma nave moderna. Dados: `data/templates.json#tough-native`. | Nativo robusto com espada e pistola de pólvora olhando uma nave. | P1 |
| `template.wookiee` | Alienígena alto coberto de pelagem castanha densa, bandoleira cruzada e besta de energia de design original, olhar leal e feroz. Dados: `data/templates.json#wookiee`. | Alienígena alto e peludo com bandoleira e besta de energia. | P1 |
| `template.young-jedi` | Jovem esperançoso de roupas simples de fazenda, mão estendida fazendo uma pedra pequena flutuar, um pequeno droide astromecânico de design original ao lado. Dados: `data/templates.json#young-jedi`. | Jovem fazendo uma pedra flutuar com um pequeno droide ao lado. | P1 |
| `template.young-senatorial` | Jovem de família senatorial, roupas elegantes e penteado elaborado, segurando uma mensagem holográfica com expressão decidida. Dados: `data/templates.json#young-senatorial`. | Jovem senatorial elegante segurando uma mensagem holográfica. | P1 |

## Espécies (48 stat blocks de 47 espécies)

Comum a todos: aparece em /criar (passo Espécie), /consulta/especies, /personagem/:id (selo de espécie) (`SpeciesCard`); proporção 3:4; tamanho all: 1200x1600 (3:4), recorte quadrado 1:1 para miniatura pelo ponto focal; estilo `portrait-card`; placeholder `portrait`; ponto focal: rosto no terço superior.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `species.humans` | Viajante humana de meia-idade com jaqueta de piloto gasta e olhar atento, iluminada pela luz azul de um painel; diversidade de traços humanos. Dados: `data/species.json#humans`. | Viajante humana de jaqueta de piloto. | P1 |
| `species.republic-clone` | Soldado de rosto marcado e cabelo raspado, armadura branca de design próprio sem capacete; atrás dele, fileiras de rostos idênticos desfocados. Dados: `data/species.json#republic-clone`. | Soldado clone sem capacete diante de fileiras de rostos iguais. | P1 |
| `species.anzat` | Humanoide de pele pálida e olhos enormes e escuros, com finas probóscides recolhidas nas bochechas; expressão calma e inquietante. Dados: `data/species.json#anzat`. | Humanoide pálido de olhos enormes e expressão inquietante. | P1 |
| `species.aqualish` | Humanoide de pele coriácea, olhos grandes e escuros e duas presas curvas saindo da boca, postura de brigão de cantina. Dados: `data/species.json#aqualish`. | Humanoide de presas curvas e olhos grandes, postura de brigão. | P1 |
| `species.barabel` | Réptil bípede de escamas grossas e escuras, dentes afiados e olhar de caçador, em roupa de couro de expedição. Dados: `data/species.json#barabel`. | Réptil bípede de escamas escuras e dentes afiados. | P1 |
| `species.bith` | Ser de cabeça alongada e calva, olhos grandes e negros sem pálpebras e dedos longos segurando um instrumento de sopro. Dados: `data/species.json#bith`. | Ser de cabeça alongada e olhos negros com instrumento de sopro. | P1 |
| `species.bothan` | Humanoide coberto de pelagem curta, orelhas pontudas e focinho, rosto iluminado por um datapad com informações secretas. Dados: `data/species.json#bothan`. | Humanoide peludo de orelhas pontudas lendo um datapad. | P1 |
| `species.caamasi` | Humanoide gracioso de penugem dourada com faixas violeta ao redor dos olhos, expressão serena e sábia. Dados: `data/species.json#caamasi`. | Humanoide de penugem dourada e faixas violeta ao redor dos olhos. | P1 |
| `species.cathar` | Felinoide de juba farta, presas e olhos âmbar, armadura leve de couro, pose de guerreiro orgulhoso. Dados: `data/species.json#cathar`. | Felinoide de juba com armadura leve. | P1 |
| `species.cereans` | Humanoide de crânio cônico muito alto, barba aparada e túnica de conselheiro, olhar ponderado. Dados: `data/species.json#cereans`. | Humanoide de crânio cônico alto e túnica de conselheiro. | P1 |
| `species.chadra-fan` | Pequeno ser de orelhas enormes em leque, nariz enrugado e olhos brilhantes, mexendo animado num aparelho desmontado. Dados: `data/species.json#chadra-fan`. | Pequeno ser de orelhas enormes mexendo num aparelho. | P1 |
| `species.chiss` | Humanoide de pele azul, olhos vermelhos luminosos e cabelo preto, uniforme sóbrio, expressão de estrategista frio. Dados: `data/species.json#chiss`. | Humanoide de pele azul e olhos vermelhos luminosos. | P1 |
| `species.defel` | Silhueta quase invisível na sombra, só se veem olhos vermelhos e presas brancas refletindo uma luz fraca. Dados: `data/species.json#defel`. | Silhueta na sombra com olhos vermelhos e presas visíveis. | P1 |
| `species.devaronian` | Humanoide de pele avermelhada com dois chifres curtos na testa e sorriso malandro de viajante incansável. Dados: `data/species.json#devaronian`. | Humanoide de pele avermelhada com chifres curtos, sorriso malandro. | P1 |
| `species.dug` | Ser que se apoia sobre os braços longos e usa os pés como mãos, rosto com papada, numa oficina de corridas cheia de peças. Dados: `data/species.json#dug`. | Ser que anda sobre os braços numa oficina de corridas. | P1 |
| `species.duros` | Humanoide de pele azul-acinzentada, olhos vermelhos grandes e sem nariz, com chapéu de aba larga de piloto veterano. Dados: `data/species.json#duros`. | Piloto de pele azul-acinzentada e olhos vermelhos com chapéu de aba larga. | P1 |
| `species.ewok` | Pequeno ser peludo de capuz de couro numa plataforma de madeira entre árvores gigantes, lança na mão e olhar curioso. Dados: `data/species.json#ewok`. | Pequeno ser peludo de capuz entre árvores gigantes. | P1 |
| `species.falleen` | Humanoide reptiliano de pele verde com crista dorsal discreta, beleza aristocrática e leve brilho rosado na pele sugerindo feromônios. Dados: `data/species.json#falleen`. | Humanoide reptiliano de pele verde com porte aristocrático. | P1 |
| `species.gamorrean` | Humanoide corpulento de feições suínas e pele esverdeada, machado de guerra apoiado no ombro, de guarda numa porta. Dados: `data/species.json#gamorrean`. | Guarda corpulento de feições suínas com machado. | P1 |
| `species.gand` | Insetoide de exoesqueleto cinzento com respirador e olhos compostos, postura de caçador paciente. Dados: `data/species.json#gand`. | Insetoide de exoesqueleto com respirador e olhos compostos. | P1 |
| `species.geonosian-worker` | Insetoide alado de exoesqueleto ocre, sem adornos, trabalhando numa linha de montagem de colmeia de rocha. Dados: `data/species.json#geonosian`. | Insetoide alado ocre trabalhando numa colmeia de rocha. | P1 |
| `species.geonosian-aristocrat` | Insetoide alado de porte esguio com adornos de metal e asas abertas, num balcão esculpido de uma colmeia nobre. Dados: `data/species.json#geonosian`. | Insetoide alado nobre com adornos num balcão de colmeia. | P1 |
| `species.givin` | Ser de crânio de exoesqueleto com grandes olhos triangulares, cercado por equações holográficas flutuantes. Dados: `data/species.json#givin`. | Ser de crânio de exoesqueleto cercado por equações holográficas. | P1 |
| `species.gotal` | Humanoide peludo com dois cones sensoriais na cabeça, olhar concentrado como quem sente o ambiente ao redor. Dados: `data/species.json#gotal`. | Humanoide peludo com dois cones sensoriais na cabeça. | P1 |
| `species.gran` | Ser de três olhos em pedúnculos e focinho de cabra, expressão pacata e amistosa num mercado. Dados: `data/species.json#gran`. | Ser de três olhos em pedúnculos num mercado. | P1 |
| `species.gungan` | Anfíbio esguio de orelhas longas pendentes e olhos no alto da cabeça, à beira de um lago com estruturas orgânicas iluminadas. Dados: `data/species.json#gungan`. | Anfíbio de orelhas longas à beira de um lago. | P1 |
| `species.herglic` | Ser enorme de corpo de cetáceo e pele lisa acinzentada, sorrindo diante de uma mesa de apostas. Dados: `data/species.json#herglic`. | Ser enorme de corpo de cetáceo numa mesa de apostas. | P1 |
| `species.hutt` | Criatura gigantesca semelhante a uma lesma, olhos de pálpebras pesadas e sorriso largo, reclinada num estrado cheio de almofadas. Dados: `data/species.json#hutt`. | Criatura gigante semelhante a uma lesma reclinada num estrado. | P1 |
| `species.iktotchi` | Humanoide de pele avermelhada com chifres que descem pelas laterais do rosto, olhar distante de quem pressente o futuro, de macacão de piloto. Dados: `data/species.json#iktotchi`. | Humanoide de chifres descendentes com olhar distante. | P1 |
| `species.ithorians` | Ser de pescoço longo e curvo e cabeça larga em forma de martelo, cuidando de plantas exóticas numa estufa. Dados: `data/species.json#ithorians`. | Ser de cabeça em forma de martelo cuidando de plantas. | P1 |
| `species.jawa` | Pequena figura encapuzada de manto marrom, só se veem dois olhos amarelos luminosos, puxando um aparelho de sucata. Dados: `data/species.json#jawa`. | Pequena figura encapuzada de olhos amarelos puxando sucata. | P1 |
| `species.kaminoan` | Ser muito alto e esguio de pescoço longo, pele pálida e olhos grandes e escuros, num laboratório branco e luminoso. Dados: `data/species.json#kaminoan`. | Ser alto de pescoço longo num laboratório branco. | P1 |
| `species.kel-dor` | Humanoide de pele alaranjada com máscara respiratória e óculos protetores escuros, manto de viagem. Dados: `data/species.json#kel-dor`. | Humanoide de máscara respiratória e óculos protetores. | P1 |
| `species.mon-calamari` | Ser aquático de cabeça arredondada, pele salmão e grandes olhos laterais, diante de janelas de uma nave de linhas orgânicas. Dados: `data/species.json#mon-calamari`. | Ser aquático de olhos laterais grandes numa nave orgânica. | P1 |
| `species.nautolans` | Humanoide de pele verde com tentáculos grossos caindo da cabeça e olhos negros, emergindo da água. Dados: `data/species.json#nautolans`. | Humanoide verde com tentáculos na cabeça emergindo da água. | P1 |
| `species.quarren` | Ser aquático de rosto com tentáculos ao redor da boca e pele rosada, expressão desconfiada. Dados: `data/species.json#quarren`. | Ser aquático de tentáculos ao redor da boca. | P1 |
| `species.rodians` | Humanoide de pele verde, focinho tubular, olhos grandes multifacetados e antenas curtas, com mira de caçador. Dados: `data/species.json#rodians`. | Humanoide de focinho tubular e olhos multifacetados. | P1 |
| `species.sullustans` | Ser baixo de bochechas pendentes, olhos grandes e negros e orelhas arredondadas, de capacete de navegador. Dados: `data/species.json#sullustans`. | Navegador baixo de bochechas pendentes e olhos negros. | P1 |
| `species.talz` | Gigante gentil coberto de pelo branco, com dois olhos grandes e dois pequenos e garras enormes, numa paisagem gelada. Dados: `data/species.json#talz`. | Gigante de pelo branco com quatro olhos numa paisagem gelada. | P1 |
| `species.togruta` | Humanoide de pele alaranjada com padrões faciais brancos, apêndices listrados na cabeça (montrals e lekku), olhar de caçadora. Dados: `data/species.json#togruta`. | Caçadora de pele alaranjada com apêndices listrados na cabeça. | P1 |
| `species.trandoshans` | Réptil grande de escamas verdes e olhos amarelos, garras e armadura de caçador. Dados: `data/species.json#trandoshans`. | Réptil grande de escamas verdes com armadura de caçador. | P1 |
| `species.twi-leks` | Humanoide de pele de cor viva com duas caudas cranianas longas (lekku) sobre os ombros, roupa de viajante. Dados: `data/species.json#twi-leks`. | Humanoide de pele colorida com duas caudas cranianas. | P1 |
| `species.umbaran` | Humanoide de pele muito pálida e olhos grandes e claros, manto escuro de gola alta, ar de quem conhece segredos. Dados: `data/species.json#umbaran`. | Humanoide pálido de olhos claros e manto escuro. | P1 |
| `species.verpine` | Insetoide esguio de exoesqueleto verde, olhos grandes e antenas, montando com precisão uma peça de arma. Dados: `data/species.json#verpine`. | Insetoide verde de antenas montando uma peça. | P1 |
| `species.weequay` | Humanoide de pele enrugada como couro curtido, tranças finas e roupa de pirata do deserto. Dados: `data/species.json#weequay`. | Humanoide de pele enrugada com tranças, pirata do deserto. | P1 |
| `species.wookiees` | Alienígena muito alto de pelagem castanha densa, bandoleira cruzada, entre troncos de árvores colossais. Dados: `data/species.json#wookiees`. | Alienígena alto e peludo entre árvores colossais. | P1 |
| `species.yuuzhan-vong` | Guerreiro de pele cinzenta com escarificações e tatuagens rituais, implantes orgânicos e armadura viva com textura de carapaça. Dados: `data/species.json#yuuzhan-vong`. | Guerreiro escarificado com armadura orgânica viva. | P1 |
| `species.zabrak` | Humanoide com uma coroa de pequenos chifres no alto da cabeça e tatuagens faciais geométricas, olhar determinado. Dados: `data/species.json#zabrak`. | Humanoide com coroa de pequenos chifres e tatuagens faciais. | P1 |

## Consulta: categorias

Comum a todos: aparece em /consulta/regras (`ReferenceCategoryCard, ReferenceHeader`); proporção 16:9; tamanho all: 1600x900 (16:9); no celular recorte 3:2 pelo ponto focal; estilo `blueprint`; placeholder `blueprint`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `ref.rules` | Um datapad aberto sobre uma mesa projetando um holograma de seis dados e um diagrama de fluxo de turno, livros de capa gasta ao lado. | Datapad projetando dados e um diagrama de regras. | P1 |
| `ref.skills` | Painel com seis setores luminosos (destreza, conhecimento, mecânica, percepção, força, técnica), cada um com um pequeno ícone abstrato, em círculo. | Painel circular com seis setores de atributos. | P1 |
| `ref.force-powers` | Mão aberta com pedras pequenas flutuando acima dela e linhas de energia suave entre elas, fundo de templo em ruínas desfocado. | Mão aberta fazendo pedras flutuarem. | P1 |
| `ref.species` | Mosaico de silhuetas de muitas espécies diferentes contra uma janela com estrelas, em contraluz. | Silhuetas de várias espécies alienígenas em contraluz. | P1 |
| `ref.weapons` | Planta técnica explodida de uma pistola blaster de design original, peças separadas com linhas de cota. | Planta explodida de uma pistola blaster de design original. | P1 |
| `ref.armor` | Planta técnica de um conjunto de armadura modular de design original em vista frontal e lateral. | Planta de uma armadura modular em duas vistas. | P1 |
| `ref.gear` | Mochila aberta com equipamentos espalhados: medpac, comlink, binóculos eletrônicos, cordas e rações, vistos de cima. | Equipamentos de viagem espalhados vistos de cima. | P1 |
| `ref.vehicles` | Planta técnica de uma moto flutuante de design original em perspectiva, com indicadores de repulsor sob o casco. | Planta de uma moto flutuante de design original. | P1 |
| `ref.starships` | Planta técnica de um cargueiro leve de design original visto de cima e de perfil, com seções numeradas por glifos. | Planta de um cargueiro leve de design original. | P1 |
| `ref.glossary` | Arquivo de cristais de dados em gavetas luminosas, um cristal destacado emitindo luz. | Gavetas de cristais de dados com um destacado. | P1 |
| `ref.tables` | Grade holográfica de tabelas e gráficos flutuando sobre uma mesa de comando escura. | Tabelas holográficas sobre uma mesa de comando. | P1 |

## Modo mesa

### `bg.mesa`

- **Onde**: /personagem/:id/mesa, componente `TableModeLayout.background`
- **Proporção e tamanho**: variável; mobile: 1170x2532 (9:19,5); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `ambient-bg`; placeholder `hero`; ponto focal: centro; prioridade P1
- **Descrição**: Superfície de mesa de jogo de madeira escura vista de cima, com marcas de copo e leve névoa azul de holograma desligado; quase preta para não competir com os números.
- **Alt**: (decorativa, alt vazio)

### `texture.die.normal`

- **Onde**: /personagem/:id/mesa (dados 3D), componente `Dice3D.material normal`
- **Proporção e tamanho**: 1:1; all: 1024x1024, cor + emissão
- **Estilo**: `material`; placeholder `default`; ponto focal: centro; prioridade P2
- **Descrição**: Material de dado em resina fosca grafite com pips gravados que emitem luz ciano suave.
- **Alt**: (decorativa, alt vazio)

### `texture.die.wild`

- **Onde**: /personagem/:id/mesa (dados 3D), componente `Dice3D.material Wild Die`
- **Proporção e tamanho**: 1:1; all: 1024x1024, cor + emissão
- **Estilo**: `material`; placeholder `default`; ponto focal: centro; prioridade P2
- **Descrição**: Material de dado em resina âmbar translúcida com veios dourados internos e pips que brilham em branco quente; precisa parecer especial ao lado do dado normal.
- **Alt**: (decorativa, alt vazio)

## Campanha, convite e mestre

### `hero.campaign`

- **Onde**: /campanha/:id, componente `CampaignHeader.hero (capa padrão)`
- **Proporção e tamanho**: 21:9 (PC) / 16:9 / 3:2; mobile: 1080x720 (3:2); tablet: 2048x1152 (16:9); desktop: 2560x1100 (21:9)
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; topo livre para o nome da campanha; prioridade P1
- **Descrição**: Grupo de quatro aventureiros de costas, silhuetas de espécies diferentes, diante de uma grande janela que mostra um planeta e uma frota distante.
- **Alt**: Grupo de aventureiros de costas olhando um planeta por uma janela.

### `bg.campaign.holomap`

- **Onde**: /campanha/:id (Holomapa), componente `HoloMap.background`
- **Proporção e tamanho**: 16:9 e 1:1; mobile: 1500x1500 (1:1); tablet: 2048x1536 (4:3); desktop: 3200x1800 (16:9)
- **Estilo**: `blueprint`; placeholder `campaign`; ponto focal: centro; prioridade P1
- **Descrição**: Mapa galáctico holográfico original: braços espirais em ciano e violeta, regiões em anéis concêntricos, rotas hiperespaciais como linhas pontilhadas, sem nomes reais de planetas.
- **Alt**: Mapa galáctico holográfico com rotas pontilhadas.

### `campaign.cover.outer-rim`

- **Onde**: /campanhas/nova, /campanha/:id, /hangar (cartão de campanha), componente `CampaignCoverPicker, CampaignCard`
- **Proporção e tamanho**: 16:9; all: 1600x900 (16:9); no celular recorte 3:2 pelo ponto focal
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; prioridade P2
- **Descrição**: Planeta desértico com duas luas no céu e um povoado de cúpulas de barro sob o calor, cargueiro chegando.
- **Alt**: Planeta desértico com duas luas e povoado de cúpulas.

### `campaign.cover.core-worlds`

- **Onde**: /campanhas/nova, /campanha/:id, /hangar (cartão de campanha), componente `CampaignCoverPicker, CampaignCard`
- **Proporção e tamanho**: 16:9; all: 1600x900 (16:9); no celular recorte 3:2 pelo ponto focal
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; prioridade P2
- **Descrição**: Cidade-planeta à noite com torres infinitas e tráfego aéreo em faixas de luz, chuva fina.
- **Alt**: Cidade-planeta noturna com tráfego aéreo.

### `campaign.cover.rebel-cell`

- **Onde**: /campanhas/nova, /campanha/:id, /hangar (cartão de campanha), componente `CampaignCoverPicker, CampaignCard`
- **Proporção e tamanho**: 16:9; all: 1600x900 (16:9); no celular recorte 3:2 pelo ponto focal
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; prioridade P2
- **Descrição**: Base escondida numa floresta úmida, antenas camufladas e caças sob redes, luz verde filtrada.
- **Alt**: Base escondida na floresta com caças sob redes.

### `campaign.cover.smugglers-run`

- **Onde**: /campanhas/nova, /campanha/:id, /hangar (cartão de campanha), componente `CampaignCoverPicker, CampaignCard`
- **Proporção e tamanho**: 16:9; all: 1600x900 (16:9); no celular recorte 3:2 pelo ponto focal
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; prioridade P2
- **Descrição**: Cargueiro esquivando-se num campo de asteroides com disparos ao longe.
- **Alt**: Cargueiro passando por um campo de asteroides.

### `campaign.cover.ancient-ruins`

- **Onde**: /campanhas/nova, /campanha/:id, /hangar (cartão de campanha), componente `CampaignCoverPicker, CampaignCard`
- **Proporção e tamanho**: 16:9; all: 1600x900 (16:9); no celular recorte 3:2 pelo ponto focal
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; prioridade P2
- **Descrição**: Ruínas de templo antigo cobertas de musgo, com escadarias e uma luz suave vinda do interior.
- **Alt**: Ruínas de templo antigo com luz interior.

### `campaign.cover.imperial-shadow`

- **Onde**: /campanhas/nova, /campanha/:id, /hangar (cartão de campanha), componente `CampaignCoverPicker, CampaignCard`
- **Proporção e tamanho**: 16:9; all: 1600x900 (16:9); no celular recorte 3:2 pelo ponto focal
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; prioridade P2
- **Descrição**: Silhueta de uma imensa nave de guerra triangular de design original cobrindo o céu de um planeta, sombra sobre a cidade.
- **Alt**: Imensa nave de guerra cobrindo o céu de um planeta.

### `hero.invite`

- **Onde**: /convite/:codigo, componente `InviteLanding.hero`
- **Proporção e tamanho**: 16:9 / 4:3 / 9:16; mobile: 1080x1920 (9:16); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `holo-cinematic`; placeholder `campaign`; ponto focal: centro; prioridade P1
- **Descrição**: Mensagem holográfica azul projetada por um pequeno emissor sobre a palma de uma mão: uma figura encapuzada indefinida faz um gesto de chamado.
- **Alt**: Mensagem holográfica projetada na palma de uma mão, um chamado.

### `bg.gm-console`

- **Onde**: /campanha/:id/mestre, componente `GMConsole.background`
- **Proporção e tamanho**: variável; mobile: 1170x2532 (9:19,5); tablet: 2048x1536 (4:3); desktop: 2560x1440 (16:9)
- **Estilo**: `ambient-bg`; placeholder `campaign`; ponto focal: centro; prioridade P2
- **Descrição**: Console de comando escuro visto de frente, fileiras de pequenas luzes âmbar e violeta e telas apagadas; muito escuro.
- **Alt**: (decorativa, alt vazio)

## Holocron (assistente de regras)

### `hero.holocron`

- **Onde**: /holocron, componente `HolocronAssistant.hero`
- **Proporção e tamanho**: 1:1 (celular) / 16:9; mobile: 1080x1080 (1:1); tablet: 2048x1152 (16:9); desktop: 2560x1440 (16:9)
- **Estilo**: `holo-cinematic`; placeholder `hero`; ponto focal: centro; prioridade P2
- **Descrição**: Um cubo de cristal antigo flutuando, com faces gravadas em padrões geométricos originais, irradiando luz ciano suave numa sala escura de pedra.
- **Alt**: Cubo de cristal antigo flutuando e emitindo luz.

## Conta e retrato

### `portrait.default`

- **Onde**: /hangar, /personagem/:id, /campanha/:id (grupo), feed, componente `Avatar/Portrait sem upload`
- **Proporção e tamanho**: 1:1; all: 512x512 (1:1); máscara circular ou hexagonal no app
- **Estilo**: `portrait-card`; placeholder `portrait`; ponto focal: centro; prioridade P1
- **Descrição**: Silhueta humanoide neutra em holograma ciano com scanlines, fundo escuro; serve para qualquer espécie.
- **Alt**: Retrato não definido.

## Ícone do app e compartilhamento

### `og.default`

- **Onde**: links compartilhados (convite, ficha pública), componente `OpenGraph image`
- **Proporção e tamanho**: 1.91:1; all: 1200x630
- **Estilo**: `holo-cinematic`; placeholder `hero`; ponto focal: direita; prioridade P2
- **Descrição**: Seis dados flutuando sobre uma mesa escura, um deles âmbar e brilhante, com um campo de estrelas atrás e espaço à esquerda para o nome do app.
- **Alt**: Seis dados flutuando, um âmbar em destaque, sobre fundo estrelado.

### `app.icon`

- **Onde**: ícone PWA, favicon, splash, componente `manifest icons`
- **Proporção e tamanho**: 1:1; all: 1024x1024 mestre; derivados 512, 192, 180, 32; versão maskable com área segura de 80%
- **Estilo**: `icon-glyph`; placeholder `icon`; ponto focal: centro; prioridade P1
- **Descrição**: Um dado de seis faces em perspectiva com bordas luminosas ciano e uma face âmbar com um pip em brilho; sem droide, sem personagem.
- **Alt**: Ícone do r2-d6: dado luminoso.

## Estados vazios

Comum a todos: aparece em /hangar (`EmptyState`); proporção 1:1; tamanho all: 800x800 (1:1), PNG/WebP com transparência; estilo `spot-illustration`; placeholder `state`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `empty.characters` | Pequeno droide de manutenção varrendo uma baia vazia, com um balão de pensamento mostrando um capacete de piloto. | Droide varrendo uma baia vazia. | P1 |
| `empty.campaigns` | Mapa estelar enrolado e ainda fechado sobre uma caixa, com um selo de convite piscando. | Mapa estelar enrolado, à espera de uma campanha. | P1 |
| `empty.feed` | Seis dados dormindo empilhados, um deles âmbar com um olho entreaberto. | Dados empilhados dormindo, à espera da primeira rolagem. | P1 |
| `empty.search` | Sonda de reconhecimento flutuante iluminando com um holofote um terreno vazio. | Sonda iluminando um terreno vazio. | P1 |
| `empty.journal` | Datapad em branco com uma caneta luminosa ao lado e uma xícara fumegante. | Datapad em branco com caneta luminosa. | P1 |
| `empty.timeline` | Linha pontilhada luminosa que começa num pequeno ponto e some no escuro, como uma rota ainda não percorrida. | Rota pontilhada que começa e some no escuro. | P1 |
| `empty.party` | Mesa redonda com cadeiras vazias e um holoprojetor aceso no centro mostrando um código de convite abstrato. | Mesa redonda vazia com holoprojetor aceso. | P1 |

## Erros

Comum a todos: aparece em qualquer tela sem rede (`ErrorState`); proporção 1:1; tamanho all: 800x800 (1:1), PNG/WebP com transparência; estilo `spot-illustration`; placeholder `error`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `error.offline` | Antena parabólica de uma base remota coberta de neve, com uma faísca fraca de sinal. | Antena coberta de neve sem sinal. | P1 |
| `error.not-found` | Nave pequena perdida numa nebulosa densa, faróis acesos procurando o caminho. | Nave pequena perdida numa nebulosa. | P1 |
| `error.server` | Droide astromecânico de design original soltando fumaça, com um painel aberto e faíscas. | Droide soltando fumaça com painel aberto. | P1 |
| `error.forbidden` | Porta blindada fechada com uma luz vermelha de acesso negado e um pequeno visor. | Porta blindada com luz de acesso negado. | P1 |
| `error.invite-expired` | Mensagem holográfica falhando e se desfazendo em estática. | Mensagem holográfica se desfazendo em estática. | P1 |
| `error.sync-conflict` | Dois hologramas do mesmo personagem sobrepostos e ligeiramente desalinhados, como um eco. | Dois hologramas do mesmo personagem desalinhados. | P1 |

## Ícones (SVG)

Comum a todos: aparece em ficha, modo mesa, consulta, feed (`Icon`); proporção 1:1; tamanho all: SVG 24x24 (viewBox 0 0 24 24); estilo `icon-glyph`; placeholder `icon`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `icon.attr.dexterity` | Mão estilizada com três linhas de movimento rápido. | Dexterity | P1 |
| `icon.attr.knowledge` | Cristal de dados com três facetas e um ponto de luz. | Knowledge | P1 |
| `icon.attr.mechanical` | Manche de pilotagem visto de cima com um arco de movimento. | Mechanical | P1 |
| `icon.attr.perception` | Olho estilizado dentro de um losango. | Perception | P1 |
| `icon.attr.strength` | Punho fechado geométrico com uma barra de força. | Strength | P1 |
| `icon.attr.technical` | Chave inglesa cruzada com uma linha de circuito. | Technical | P1 |
| `icon.force.control` | Círculo com uma linha horizontal estável no centro. | Force: control | P1 |
| `icon.force.sense` | Três ondas concêntricas saindo de um ponto. | Force: sense | P1 |
| `icon.force.alter` | Pequena pedra com duas setas curvas ao redor, levitando. | Force: alter | P1 |
| `icon.points.cp` | Estrela de quatro pontas com um sinal de mais. | Character Points | P1 |
| `icon.points.fp` | Chama estilizada dentro de um círculo. | Force Points | P1 |
| `icon.points.dsp` | Chama estilizada invertida e partida. | Dark Side Points | P1 |
| `icon.wound.stunned` | Estrela pequena girando sobre um círculo. | Stunned | P1 |
| `icon.wound.wounded` | Uma barra diagonal sobre um escudo. | Wounded | P1 |
| `icon.wound.wounded-twice` | Duas barras diagonais sobre um escudo. | Wounded twice | P1 |
| `icon.wound.incapacitated` | Escudo com uma linha horizontal no meio e ponto abaixo. | Incapacitated | P1 |
| `icon.wound.mortally-wounded` | Escudo partido ao meio com uma gota. | Mortally Wounded | P1 |
| `icon.wound.killed` | Escudo vazio com contorno tracejado. | Killed | P1 |
| `icon.die.normal` | Dado de seis faces em contorno com pip central. | Dado normal | P1 |
| `icon.die.wild` | Dado em hexágono preenchido com um raio no centro; forma diferente do dado normal para não depender de cor. | Wild Die | P1 |

## Armas: reservas por categoria

Comum a todos: aparece em /consulta (reserva quando o item não tem imagem) (`EntityDetail.header, EntityList.thumbnail (reserva)`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `blueprint-item`; placeholder `weapon`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `weapon-cat.melee` | Conjunto de armas brancas e de energia de design próprio dispostas num suporte de parede: lâmina vibratória, bastão elétrico, machado e um cabo de lâmina de energia. | Armas brancas num suporte de parede. | P1 |
| `weapon-cat.archaic-ranged` | Arco, besta, funda e um mosquete antigo sobre uma bancada de madeira escura, iluminados por uma lanterna. | Armas antigas de projétil sobre uma bancada. | P1 |
| `weapon-cat.blaster` | Três blasters de design próprio (pistola, carabina e rifle) em planta holográfica lado a lado, do menor ao maior. | Pistola, carabina e rifle blaster lado a lado. | P1 |
| `weapon-cat.miscellaneous` | Armas especiais de design próprio: pistola de íons com bobinas azuis, lança-chamas compacto e uma besta de energia. | Armas especiais: íons, chamas e besta de energia. | P1 |
| `weapon-cat.artillery` | Torre de artilharia fixa de canos longos sobre um bunker, apontada para o céu ao entardecer. | Torre de artilharia fixa apontada para o céu. | P1 |
| `weapon-cat.explosive` | Granadas, minas e uma carga moldável em planta holográfica, com luzes de armado piscando. | Granadas, minas e cargas explosivas. | P1 |

## Armas (63)

Comum a todos: aparece em /consulta/armas, /consulta/armas/:id, ficha (equipamento) (`EntityDetail.header, EntityList.thumbnail`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `blueprint-item`; placeholder `weapon`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio | Reserva |
|---|---|---|---|---|
| `weapon.amphistaff` | Bastão orgânico vivo, como uma serpente rígida de escamas escuras, com uma ponta afiada. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#amphistaff`. | Bastão orgânico vivo, como uma serpente rígida de escamas escuras, com uma ponta afiada. | P1 | `weapon-cat.melee` |
| `weapon.atlatl` | Propulsor de arremesso de madeira entalhada com uma esfera de energia encaixada na ponta. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#atlatl`. | Propulsor de arremesso de madeira entalhada com uma esfera de energia encaixada na ponta. | P1 | `weapon-cat.melee` |
| `weapon.bayonet` | Lâmina de baioneta presa sob o cano de um rifle. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#bayonet`. | Lâmina de baioneta presa sob o cano de um rifle. | P1 | `weapon-cat.melee` |
| `weapon.cesta` | Cesta curva de vime trançado presa ao braço, pronta para arremessar esferas de energia. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#cesta`. | Cesta curva de vime trançado presa ao braço, pronta para arremessar esferas de energia. | P1 | `weapon-cat.melee` |
| `weapon.club` | Porrete de madeira pesada com tiras de couro no cabo. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#club`. | Porrete de madeira pesada com tiras de couro no cabo. | P1 | `weapon-cat.melee` |
| `weapon.electrostaff` | Bastão metálico longo com pontas que soltam arcos elétricos azuis. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#electrostaff`. | Bastão metálico longo com pontas que soltam arcos elétricos azuis. | P1 | `weapon-cat.melee` |
| `weapon.force-pike` | Lança longa de guarda com ponta vibratória luminosa. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#force-pike`. | Lança longa de guarda com ponta vibratória luminosa. | P1 | `weapon-cat.melee` |
| `weapon.gaderffii-stick` | Bastão de metal feito à mão, com cabeça de lâminas e espetos rústicos. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#gaderffii-stick`. | Bastão de metal feito à mão, com cabeça de lâminas e espetos rústicos. | P1 | `weapon-cat.melee` |
| `weapon.hatchet` | Machadinha de cabo curto com lâmina gasta. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#hatchet`. | Machadinha de cabo curto com lâmina gasta. | P1 | `weapon-cat.melee` |
| `weapon.knife` | Faca de combate com lâmina simples e cabo de couro. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#knife`. | Faca de combate com lâmina simples e cabo de couro. | P1 | `weapon-cat.melee` |
| `weapon.spear` | Lança de haste longa com ponta de metal batido. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#spear`. | Lança de haste longa com ponta de metal batido. | P1 | `weapon-cat.melee` |
| `weapon.staff` | Bastão de madeira longo com anéis de metal nas pontas. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#staff`. | Bastão de madeira longo com anéis de metal nas pontas. | P1 | `weapon-cat.melee` |
| `weapon.stun-gauntlets` | Par de manoplas com eletrodos nos nós dos dedos crepitando. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#stun-gauntlets`. | Par de manoplas com eletrodos nos nós dos dedos crepitando. | P1 | `weapon-cat.melee` |
| `weapon.vibro-ax` | Machado de cabo longo com lâmina vibratória que tremula. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#vibro-ax`. | Machado de cabo longo com lâmina vibratória que tremula. | P1 | `weapon-cat.melee` |
| `weapon.vibroblade` | Faca longa de lâmina vibratória com um leve borrão de movimento. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#vibroblade`. | Faca longa de lâmina vibratória com um leve borrão de movimento. | P1 | `weapon-cat.melee` |
| `weapon.lightsaber` | Cabo cilíndrico metálico de design próprio com a lâmina de energia acesa em cor neutra. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#lightsaber`. | Cabo cilíndrico metálico de design próprio com a lâmina de energia acesa em cor neutra. | P1 | `weapon-cat.melee` |
| `weapon.double-bladed-lightsaber` | Cabo longo com uma lâmina de energia acesa em cada ponta. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#double-bladed-lightsaber`. | Cabo longo com uma lâmina de energia acesa em cada ponta. | P1 | `weapon-cat.melee` |
| `weapon.short-lightsaber` | Cabo compacto com uma lâmina de energia curta. Planta holográfica técnica, vista em 3/4, com linhas de cota discretas. Dados: `data/weapons.json#short-lightsaber`. | Cabo compacto com uma lâmina de energia curta. | P1 | `weapon-cat.melee` |
| `weapon.crossbow` | Besta de madeira e metal com a corda armada. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#crossbow`. | Besta de madeira e metal com a corda armada. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.longbow` | Arco longo de madeira flexível com aljava de flechas. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#longbow`. | Arco longo de madeira flexível com aljava de flechas. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.net` | Rede de arremesso com pesos nas bordas, aberta no ar. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#net`. | Rede de arremesso com pesos nas bordas, aberta no ar. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.sling` | Funda de couro com uma pedra no bolsão. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#sling`. | Funda de couro com uma pedra no bolsão. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.throwing-knife` | Trio de facas de arremesso equilibradas em leque. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#throwing-knife`. | Trio de facas de arremesso equilibradas em leque. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.black-powder-pistol` | Pistola de pólvora antiga com cano longo e cão armado. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#black-powder-pistol`. | Pistola de pólvora antiga com cano longo e cão armado. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.musket` | Mosquete de pólvora com coronha de madeira e baioneta curta. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#musket`. | Mosquete de pólvora com coronha de madeira e baioneta curta. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.slugthrower-pistol` | Pistola de projéteis sólidos com pente e estojos de metal ao lado. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#slugthrower-pistol`. | Pistola de projéteis sólidos com pente e estojos de metal ao lado. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.slugthrower-rifle` | Rifle de projéteis sólidos com mira de ferro. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#slugthrower-rifle`. | Rifle de projéteis sólidos com mira de ferro. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.submachine-gun` | Submetralhadora de projéteis compacta com carregador curvo. Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota. Dados: `data/weapons.json#submachine-gun`. | Submetralhadora de projéteis compacta com carregador curvo. | P1 | `weapon-cat.archaic-ranged` |
| `weapon.hold-out-blaster` | Pistola blaster minúscula que cabe na palma da mão. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#hold-out-blaster`. | Pistola blaster minúscula que cabe na palma da mão. | P1 | `weapon-cat.blaster` |
| `weapon.sporting-blaster` | Pistola blaster leve e elegante de cano fino. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#sporting-blaster`. | Pistola blaster leve e elegante de cano fino. | P1 | `weapon-cat.blaster` |
| `weapon.blaster-pistol` | Pistola blaster de uso comum com aletas de resfriamento no cano. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#blaster-pistol`. | Pistola blaster de uso comum com aletas de resfriamento no cano. | P1 | `weapon-cat.blaster` |
| `weapon.heavy-blaster-pistol` | Pistola blaster pesada de cano grosso e empunhadura robusta. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#heavy-blaster-pistol`. | Pistola blaster pesada de cano grosso e empunhadura robusta. | P1 | `weapon-cat.blaster` |
| `weapon.hunting-blaster` | Blaster de caça com coronha e mira telescópica longa. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#hunting-blaster`. | Blaster de caça com coronha e mira telescópica longa. | P1 | `weapon-cat.blaster` |
| `weapon.blaster-carbine` | Carabina blaster compacta com coronha dobrável. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#blaster-carbine`. | Carabina blaster compacta com coronha dobrável. | P1 | `weapon-cat.blaster` |
| `weapon.blaster-rifle` | Rifle blaster militar com mira e coronha fixa. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#blaster-rifle`. | Rifle blaster militar com mira e coronha fixa. | P1 | `weapon-cat.blaster` |
| `weapon.heavy-blaster-rifle` | Rifle blaster pesado com cano reforçado e bipé. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#heavy-blaster-rifle`. | Rifle blaster pesado com cano reforçado e bipé. | P1 | `weapon-cat.blaster` |
| `weapon.sporting-blaster-rifle` | Rifle blaster esportivo leve e polido. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#sporting-blaster-rifle`. | Rifle blaster esportivo leve e polido. | P1 | `weapon-cat.blaster` |
| `weapon.light-repeating-blaster` | Blaster de repetição leve com bipé e cano de resfriamento. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#light-repeating-blaster`. | Blaster de repetição leve com bipé e cano de resfriamento. | P1 | `weapon-cat.blaster` |
| `weapon.heavy-repeating-blaster` | Blaster de repetição pesado com cinta de células de energia. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#heavy-repeating-blaster`. | Blaster de repetição pesado com cinta de células de energia. | P1 | `weapon-cat.blaster` |
| `weapon.e-web-repeating-blaster` | Blaster de repetição pesado sobre tripé, com gerador ao lado, operado por dois. Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4. Dados: `data/weapons.json#e-web-repeating-blaster`. | Blaster de repetição pesado sobre tripé, com gerador ao lado, operado por dois. | P1 | `weapon-cat.blaster` |
| `weapon.bowcaster` | Besta de energia com arco metálico e mira, disparando um dardo luminoso (design próprio). Planta holográfica técnica, design próprio, vista em 3/4. Dados: `data/weapons.json#bowcaster`. | Besta de energia com arco metálico e mira, disparando um dardo luminoso (design próprio). | P1 | `weapon-cat.miscellaneous` |
| `weapon.flamethrower` | Lança-chamas com tanque nas costas e bico com chama piloto. Planta holográfica técnica, design próprio, vista em 3/4. Dados: `data/weapons.json#flamethrower`. | Lança-chamas com tanque nas costas e bico com chama piloto. | P1 | `weapon-cat.miscellaneous` |
| `weapon.ion-pistol` | Pistola com bobinas azuis de íons ao longo do cano. Planta holográfica técnica, design próprio, vista em 3/4. Dados: `data/weapons.json#ion-pistol`. | Pistola com bobinas azuis de íons ao longo do cano. | P1 | `weapon-cat.miscellaneous` |
| `weapon.ion-rifle` | Rifle de íons com bobinas azuis e coronha longa. Planta holográfica técnica, design próprio, vista em 3/4. Dados: `data/weapons.json#ion-rifle`. | Rifle de íons com bobinas azuis e coronha longa. | P1 | `weapon-cat.miscellaneous` |
| `weapon.riot-gun` | Arma de controle de tumultos de cano largo. Planta holográfica técnica, design próprio, vista em 3/4. Dados: `data/weapons.json#riot-gun`. | Arma de controle de tumultos de cano largo. | P1 | `weapon-cat.miscellaneous` |
| `weapon.stun-pistol` | Pistola compacta com anéis de atordoamento azuis no cano. Planta holográfica técnica, design próprio, vista em 3/4. Dados: `data/weapons.json#stun-pistol`. | Pistola compacta com anéis de atordoamento azuis no cano. | P1 | `weapon-cat.miscellaneous` |
| `weapon.anti-infantry-laser-battery` | Bateria laser antipessoal de dois canos sobre plataforma giratória. Planta holográfica de uma instalação de artilharia em escala de veículo, com uma figura humana minúscula para dar escala. Dados: `data/weapons.json#anti-infantry-laser-battery`. | Bateria laser antipessoal de dois canos sobre plataforma giratória. | P1 | `weapon-cat.artillery` |
| `weapon.anti-vehicle-laser-cannon` | Canhão laser antiveículo em base fixa com escudo frontal. Planta holográfica de uma instalação de artilharia em escala de veículo, com uma figura humana minúscula para dar escala. Dados: `data/weapons.json#anti-vehicle-laser-cannon`. | Canhão laser antiveículo em base fixa com escudo frontal. | P1 | `weapon-cat.artillery` |
| `weapon.heavy-anti-orbital-ion-cannon` | Enorme canhão de íons de superfície numa torre cilíndrica apontada para a órbita. Planta holográfica de uma instalação de artilharia em escala de veículo, com uma figura humana minúscula para dar escala. Dados: `data/weapons.json#heavy-anti-orbital-ion-cannon`. | Enorme canhão de íons de superfície numa torre cilíndrica apontada para a órbita. | P1 | `weapon-cat.artillery` |
| `weapon.turbolaser-battery` | Torre de turbolaser fixa de canos longos sobre um bunker. Planta holográfica de uma instalação de artilharia em escala de veículo, com uma figura humana minúscula para dar escala. Dados: `data/weapons.json#turbolaser-battery`. | Torre de turbolaser fixa de canos longos sobre um bunker. | P1 | `weapon-cat.artillery` |
| `weapon.fragmentation-grenade` | Granada de fragmentação cilíndrica com anel de ativação. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#fragmentation-grenade`. | Granada de fragmentação cilíndrica com anel de ativação. | P1 | `weapon-cat.explosive` |
| `weapon.ion-grenade` | Granada de íons com faixas azuis luminosas. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#ion-grenade`. | Granada de íons com faixas azuis luminosas. | P1 | `weapon-cat.explosive` |
| `weapon.stun-grenade` | Granada de atordoamento com faixas brancas. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#stun-grenade`. | Granada de atordoamento com faixas brancas. | P1 | `weapon-cat.explosive` |
| `weapon.grenade-launcher` | Lançador de granadas de tambor rotativo. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#grenade-launcher`. | Lançador de granadas de tambor rotativo. | P1 | `weapon-cat.explosive` |
| `weapon.rocket-launcher` | Lança-foguetes portátil apoiado no ombro. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#rocket-launcher`. | Lança-foguetes portátil apoiado no ombro. | P1 | `weapon-cat.explosive` |
| `weapon.antipersonnel-mine` | Mina antipessoal achatada semienterrada com sensor piscando. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#antipersonnel-mine`. | Mina antipessoal achatada semienterrada com sensor piscando. | P1 | `weapon-cat.explosive` |
| `weapon.vehicle-mine` | Mina antiveículo larga e pesada enterrada na estrada. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#vehicle-mine`. | Mina antiveículo larga e pesada enterrada na estrada. | P1 | `weapon-cat.explosive` |
| `weapon.explosive-charge` | Carga explosiva com fios e um painel de armar. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#explosive-charge`. | Carga explosiva com fios e um painel de armar. | P1 | `weapon-cat.explosive` |
| `weapon.standard-detonator` | Detonador padrão: pequeno cilindro com pinos de contato. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#standard-detonator`. | Detonador padrão: pequeno cilindro com pinos de contato. | P1 | `weapon-cat.explosive` |
| `weapon.timer-fuse` | Espoleta com mostrador de contagem regressiva. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#timer-fuse`. | Espoleta com mostrador de contagem regressiva. | P1 | `weapon-cat.explosive` |
| `weapon.remote-fuse` | Espoleta com antena curta e controle remoto. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#remote-fuse`. | Espoleta com antena curta e controle remoto. | P1 | `weapon-cat.explosive` |
| `weapon.detonite` | Barras de explosivo moldável embaladas lado a lado. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#detonite`. | Barras de explosivo moldável embaladas lado a lado. | P1 | `weapon-cat.explosive` |
| `weapon.thermal-detonator` | Esfera metálica de detonador com uma luz de armado piscando. Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado. Dados: `data/weapons.json#thermal-detonator`. | Esfera metálica de detonador com uma luz de armado piscando. | P1 | `weapon-cat.explosive` |

## Armaduras: reservas por categoria

### `armor-cat.light`

- **Onde**: /consulta (reserva quando o item não tem imagem), componente `EntityDetail.header, EntityList.thumbnail (reserva)`
- **Proporção e tamanho**: 16:9 (miniatura 1:1); all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista
- **Estilo**: `blueprint-item`; placeholder `armor`; ponto focal: centro; prioridade P2
- **Descrição**: Colete, capacete e macacão acolchoado de design próprio em planta holográfica, vistos de frente.
- **Alt**: Proteções leves: colete, capacete e macacão.

### `armor-cat.military`

- **Onde**: /consulta (reserva quando o item não tem imagem), componente `EntityDetail.header, EntityList.thumbnail (reserva)`
- **Proporção e tamanho**: 16:9 (miniatura 1:1); all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista
- **Estilo**: `blueprint-item`; placeholder `armor`; ponto focal: centro; prioridade P2
- **Descrição**: Manequim de armadura militar de placas de design próprio, vista de frente e de perfil.
- **Alt**: Armadura militar de placas em duas vistas.

### `armor-cat.heavy`

- **Onde**: /consulta (reserva quando o item não tem imagem), componente `EntityDetail.header, EntityList.thumbnail (reserva)`
- **Proporção e tamanho**: 16:9 (miniatura 1:1); all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista
- **Estilo**: `blueprint-item`; placeholder `armor`; ponto focal: centro; prioridade P2
- **Descrição**: Armadura pesada moldada de design próprio, com placas grossas e juntas reforçadas, sobre um suporte de manutenção.
- **Alt**: Armadura pesada num suporte de manutenção.

## Armaduras (15)

Comum a todos: aparece em /consulta/armaduras, /consulta/armaduras/:id, ficha (equipamento) (`EntityDetail.header, EntityList.thumbnail`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `blueprint-item`; placeholder `armor`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio | Reserva |
|---|---|---|---|---|
| `armor.armored-spacesuit` | Traje espacial blindado de abordagem com mochila de foguete e capacete selado. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#armored-spacesuit`. | Traje espacial blindado de abordagem com mochila de foguete e capacete selado. | P2 | `armor-cat.heavy` |
| `armor.medium-battle-armor` | Armadura de combate média de placas sobre tecido reforçado. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#medium-battle-armor`. | Armadura de combate média de placas sobre tecido reforçado. | P2 | `armor-cat.military` |
| `armor.heavy-battle-armor` | Armadura de combate pesada moldada, resistente a impacto, com ombreiras largas. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#heavy-battle-armor`. | Armadura de combate pesada moldada, resistente a impacto, com ombreiras largas. | P2 | `armor-cat.heavy` |
| `armor.blast-helmet` | Capacete de combate com viseira e proteção de nuca. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#blast-helmet`. | Capacete de combate com viseira e proteção de nuca. | P2 | `armor-cat.light` |
| `armor.blast-vest` | Colete de proteção acolchoado com placas no peito. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#blast-vest`. | Colete de proteção acolchoado com placas no peito. | P2 | `armor-cat.light` |
| `armor.royal-guard-armor` | Armadura cerimonial de guarda de honra com elmo alto e manto longo de cor sóbria (design próprio). Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#royal-guard-armor`. | Armadura cerimonial de guarda de honra com elmo alto e manto longo de cor sóbria (design próprio). | P2 | `armor-cat.military` |
| `armor.combat-jumpsuit` | Macacão de combate leve com reforços nos joelhos e cotovelos. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#combat-jumpsuit`. | Macacão de combate leve com reforços nos joelhos e cotovelos. | P2 | `armor-cat.light` |
| `armor.corellian-powersuit` | Exoesqueleto de carga reforçado adaptado como armadura, com braços servoassistidos. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#corellian-powersuit`. | Exoesqueleto de carga reforçado adaptado como armadura, com braços servoassistidos. | P2 | `armor-cat.heavy` |
| `armor.armored-flight-suit` | Macacão de voo blindado com placas no peito e capacete de piloto. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#armored-flight-suit`. | Macacão de voo blindado com placas no peito e capacete de piloto. | P2 | `armor-cat.light` |
| `armor.padded-flight-suit` | Macacão de voo acolchoado com mangueiras de suporte de vida. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#padded-flight-suit`. | Macacão de voo acolchoado com mangueiras de suporte de vida. | P2 | `armor-cat.light` |
| `armor.clone-trooper-armor` | Armadura de placas branca com faixas de unidade coloridas e capacete de viseira em T estreita (design próprio). Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#clone-trooper-armor`. | Armadura de placas branca com faixas de unidade coloridas e capacete de viseira em T estreita (design próprio). | P2 | `armor-cat.military` |
| `armor.stormtrooper-armor` | Armadura branca de placas para tropas de choque, capacete fechado de lentes escuras (design próprio). Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#stormtrooper-armor`. | Armadura branca de placas para tropas de choque, capacete fechado de lentes escuras (design próprio). | P2 | `armor-cat.military` |
| `armor.scout-trooper-armor` | Armadura leve de batedor, placas mínimas e capacete de viseira estreita. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#scout-trooper-armor`. | Armadura leve de batedor, placas mínimas e capacete de viseira estreita. | P2 | `armor-cat.military` |
| `armor.snowtrooper-armor` | Armadura para clima frio com manto, saia térmica e respirador no capacete. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#snowtrooper-armor`. | Armadura para clima frio com manto, saia térmica e respirador no capacete. | P2 | `armor-cat.military` |
| `armor.vonduun-crabshell-armor` | Carapaça orgânica viva de placas sobrepostas, como a casca de um crustáceo. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado. Dados: `data/armor.json#vonduun-crabshell-armor`. | Carapaça orgânica viva de placas sobrepostas, como a casca de um crustáceo. | P2 | `armor-cat.heavy` |

## Equipamentos: reservas por categoria

Comum a todos: aparece em /consulta (reserva quando o item não tem imagem) (`EntityDetail.header, EntityList.thumbnail (reserva)`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `blueprint-item`; placeholder `gear`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `gear-cat.communications` | Comunicadores de mão, um transceptor de mesa e uma antena de mochila em planta holográfica. | Aparelhos de comunicação. | P2 |
| `gear-cat.computers` | Datapad, cartões de dados e um terminal portátil abertos sobre uma mesa escura. | Datapad, cartões de dados e terminal. | P2 |
| `gear-cat.detection` | Binóculos eletrônicos, lanterna e um sensor portátil emitindo uma varredura em leque. | Binóculos, lanterna e sensor portátil. | P2 |
| `gear-cat.life-support` | Traje de vácuo e máscara respiratória pendurados num armário de câmara de descompressão. | Traje de vácuo e máscara respiratória. | P2 |
| `gear-cat.medical` | Kit médico aberto com injetores, ataduras e um frasco de líquido curativo azul. | Kit médico aberto. | P2 |
| `gear-cat.cybernetics` | Braço protético mecânico de design próprio sobre uma bancada de cirurgia, com fios expostos. | Braço protético sobre uma bancada. | P2 |
| `gear-cat.survival` | Mochila de sobrevivência, corda, rações e um manto térmico sobre uma rocha. | Equipamento de sobrevivência sobre uma rocha. | P2 |
| `gear-cat.tools` | Caixa de ferramentas aberta com chaves, soldador e células de energia. | Caixa de ferramentas aberta. | P2 |
| `gear-cat.accessories` | Cinto de utilidades, coldre e bandoleira com uma mira eletrônica encaixada. | Cinto, coldre, bandoleira e mira. | P2 |

## Equipamentos (54)

Comum a todos: aparece em /consulta/equipamentos, /consulta/equipamentos/:id, ficha (equipamento) (`EntityDetail.header, EntityList.thumbnail`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `blueprint-item`; placeholder `gear`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio | Reserva |
|---|---|---|---|---|
| `gear.personal-comlink` | Comunicador de mão pequeno com antena retrátil. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#personal-comlink`. | Comunicador de mão pequeno com antena retrátil. | P2 | `gear-cat.communications` |
| `gear.military-comlink` | Comunicador militar robusto com capa emborrachada. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#military-comlink`. | Comunicador militar robusto com capa emborrachada. | P2 | `gear-cat.communications` |
| `gear.vehicle-comlink` | Conjunto de comunicação de alta potência montado numa mochila com antena alta. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#vehicle-comlink`. | Conjunto de comunicação de alta potência montado numa mochila com antena alta. | P2 | `gear-cat.communications` |
| `gear.subspace-transceiver-small` | Rádio de subespaço de mesa com tela e teclado. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#subspace-transceiver-small`. | Rádio de subespaço de mesa com tela e teclado. | P2 | `gear-cat.communications` |
| `gear.subspace-transceiver-large` | Estação de rádio de subespaço de alta potência com antena parabólica. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#subspace-transceiver-large`. | Estação de rádio de subespaço de alta potência com antena parabólica. | P2 | `gear-cat.communications` |
| `gear.pocket-scrambler` | Pequeno embaralhador de dados que se acopla ao comunicador. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#pocket-scrambler`. | Pequeno embaralhador de dados que se acopla ao comunicador. | P2 | `gear-cat.communications` |
| `gear.jammer-pack` | Mochila interferidora de comunicações com antenas curtas. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#jammer-pack`. | Mochila interferidora de comunicações com antenas curtas. | P2 | `gear-cat.communications` |
| `gear.alien-enhancer-vox-box` | Caixa de voz que reproduz sons de outras espécies, com alto-falante em grade. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#alien-enhancer-vox-box`. | Caixa de voz que reproduz sons de outras espécies, com alto-falante em grade. | P2 | `gear-cat.communications` |
| `gear.transliterator` | Tradutor portátil de idiomas com tela de glifos abstratos. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#transliterator`. | Tradutor portátil de idiomas com tela de glifos abstratos. | P2 | `gear-cat.communications` |
| `gear.code-cylinder` | Cilindro de código de segurança preso a um bolso de uniforme. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#code-cylinder`. | Cilindro de código de segurança preso a um bolso de uniforme. | P2 | `gear-cat.computers` |
| `gear.credit-chip` | Chip de crédito fino e brilhante entre dois dedos. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#credit-chip`. | Chip de crédito fino e brilhante entre dois dedos. | P2 | `gear-cat.computers` |
| `gear.datacard` | Cartão de dados translúcido com circuitos visíveis. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#datacard`. | Cartão de dados translúcido com circuitos visíveis. | P2 | `gear-cat.computers` |
| `gear.datapad` | Datapad portátil aceso com gráficos holográficos. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#datapad`. | Datapad portátil aceso com gráficos holográficos. | P2 | `gear-cat.computers` |
| `gear.mainframe` | Computador central em gabinetes altos com luzes piscando. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#mainframe`. | Computador central em gabinetes altos com luzes piscando. | P2 | `gear-cat.computers` |
| `gear.portable-computer` | Computador portátil dobrável sobre uma caixa de carga. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#portable-computer`. | Computador portátil dobrável sobre uma caixa de carga. | P2 | `gear-cat.computers` |
| `gear.personal-computer` | Terminal pessoal de mesa com teclado e tela curva. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#personal-computer`. | Terminal pessoal de mesa com teclado e tela curva. | P2 | `gear-cat.computers` |
| `gear.macrobinoculars` | Binóculos eletrônicos com tela de aproximação. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#macrobinoculars`. | Binóculos eletrônicos com tela de aproximação. | P2 | `gear-cat.detection` |
| `gear.glow-rod` | Bastão luminoso cilíndrico projetando um feixe de luz. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#glow-rod`. | Bastão luminoso cilíndrico projetando um feixe de luz. | P2 | `gear-cat.detection` |
| `gear.fusion-lantern` | Lanterna de fusão que ilumina e aquece um acampamento. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#fusion-lantern`. | Lanterna de fusão que ilumina e aquece um acampamento. | P2 | `gear-cat.detection` |
| `gear.recording-rod` | Bastão gravador de áudio com uma luz vermelha de gravação. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#recording-rod`. | Bastão gravador de áudio com uma luz vermelha de gravação. | P2 | `gear-cat.detection` |
| `gear.portable-sensor-pack` | Sensor portátil com antena giratória e tela de varredura. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#portable-sensor-pack`. | Sensor portátil com antena giratória e tela de varredura. | P2 | `gear-cat.detection` |
| `gear.military-sensor-pack` | Sensor militar reforçado com tela de alvos. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#military-sensor-pack`. | Sensor militar reforçado com tela de alvos. | P2 | `gear-cat.detection` |
| `gear.aquata-breather` | Respirador aquático compacto preso à boca, soltando bolhas. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#aquata-breather`. | Respirador aquático compacto preso à boca, soltando bolhas. | P2 | `gear-cat.life-support` |
| `gear.breath-mask` | Máscara respiratória com filtros laterais. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#breath-mask`. | Máscara respiratória com filtros laterais. | P2 | `gear-cat.life-support` |
| `gear.vacuum-suit` | Traje de vácuo leve com capacete transparente. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#vacuum-suit`. | Traje de vácuo leve com capacete transparente. | P2 | `gear-cat.life-support` |
| `gear.space-suit` | Traje espacial completo com mochila de suporte de vida. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#space-suit`. | Traje espacial completo com mochila de suporte de vida. | P2 | `gear-cat.life-support` |
| `gear.bacta-tank` | Tanque cilíndrico de líquido curativo azul com um paciente de máscara flutuando. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#bacta-tank`. | Tanque cilíndrico de líquido curativo azul com um paciente de máscara flutuando. | P2 | `gear-cat.medical` |
| `gear.customized-medical-backpack` | Mochila médica avançada aberta com compartimentos e injetores. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#customized-medical-backpack`. | Mochila médica avançada aberta com compartimentos e injetores. | P2 | `gear-cat.medical` |
| `gear.medpac` | Kit de primeiros socorros compacto aberto. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#medpac`. | Kit de primeiros socorros compacto aberto. | P2 | `gear-cat.medical` |
| `gear.surgery-kit` | Kit cirúrgico com instrumentos de precisão em estojo. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#surgery-kit`. | Kit cirúrgico com instrumentos de precisão em estojo. | P2 | `gear-cat.medical` |
| `gear.replacement-prosthetics` | Mão protética mecânica de design próprio com articulações à mostra. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#replacement-prosthetics`. | Mão protética mecânica de design próprio com articulações à mostra. | P2 | `gear-cat.cybernetics` |
| `gear.all-temperature-cloak` | Manto térmico de tecido sintético esvoaçando no vento. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#all-temperature-cloak`. | Manto térmico de tecido sintético esvoaçando no vento. | P2 | `gear-cat.survival` |
| `gear.chain` | Corrente pesada de elos metálicos enrolada. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#chain`. | Corrente pesada de elos metálicos enrolada. | P2 | `gear-cat.survival` |
| `gear.field-kit` | Mochila de sobrevivência com abrigo dobrável e cantil. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#field-kit`. | Mochila de sobrevivência com abrigo dobrável e cantil. | P2 | `gear-cat.survival` |
| `gear.jet-pack` | Mochila a jato com dois bocais e chamas curtas. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#jet-pack`. | Mochila a jato com dois bocais e chamas curtas. | P2 | `gear-cat.survival` |
| `gear.liquid-cable-dispenser` | Disparador de cabo líquido lançando uma linha que endurece no ar. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#liquid-cable-dispenser`. | Disparador de cabo líquido lançando uma linha que endurece no ar. | P2 | `gear-cat.survival` |
| `gear.ration-pack` | Pacote de rações desidratadas aberto com barras compactas. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#ration-pack`. | Pacote de rações desidratadas aberto com barras compactas. | P2 | `gear-cat.survival` |
| `gear.rocket-pack` | Mochila foguete de bocal único com rastro de fumaça. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#rocket-pack`. | Mochila foguete de bocal único com rastro de fumaça. | P2 | `gear-cat.survival` |
| `gear.syntherope` | Rolo de corda sintética fina e resistente. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#syntherope`. | Rolo de corda sintética fina e resistente. | P2 | `gear-cat.survival` |
| `gear.binder-cuffs` | Algemas magnéticas com luz de trava. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#binder-cuffs`. | Algemas magnéticas com luz de trava. | P2 | `gear-cat.tools` |
| `gear.energy-cell` | Célula de energia cilíndrica com indicador de carga. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#energy-cell`. | Célula de energia cilíndrica com indicador de carga. | P2 | `gear-cat.tools` |
| `gear.fire-extinguisher` | Extintor compacto soltando uma nuvem branca. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#fire-extinguisher`. | Extintor compacto soltando uma nuvem branca. | P2 | `gear-cat.tools` |
| `gear.mesh-tape` | Rolo de fita adesiva de malha metálica. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#mesh-tape`. | Rolo de fita adesiva de malha metálica. | P2 | `gear-cat.tools` |
| `gear.blaster-power-pack` | Carregador de energia para blaster com indicador de carga. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#blaster-power-pack`. | Carregador de energia para blaster com indicador de carga. | P2 | `gear-cat.tools` |
| `gear.power-recharger` | Recarregador portátil com células encaixadas. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#power-recharger`. | Recarregador portátil com células encaixadas. | P2 | `gear-cat.tools` |
| `gear.security-kit` | Estojo de invasão com sondas e um decodificador de fechadura. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#security-kit`. | Estojo de invasão com sondas e um decodificador de fechadura. | P2 | `gear-cat.tools` |
| `gear.standard-tool-kit` | Caixa de ferramentas padrão com chaves e hidrospanner. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#standard-tool-kit`. | Caixa de ferramentas padrão com chaves e hidrospanner. | P2 | `gear-cat.tools` |
| `gear.enhanced-tool-kit` | Caixa de ferramentas avançada com diagnóstico eletrônico. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#enhanced-tool-kit`. | Caixa de ferramentas avançada com diagnóstico eletrônico. | P2 | `gear-cat.tools` |
| `gear.utility-belt` | Cinto de utilidades com bolsos e um gancho. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#utility-belt`. | Cinto de utilidades com bolsos e um gancho. | P2 | `gear-cat.tools` |
| `gear.bandolier` | Bandoleira de couro com células de energia e granadas. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#bandolier`. | Bandoleira de couro com células de energia e granadas. | P2 | `gear-cat.accessories` |
| `gear.helmet-package` | Capacete com sistema de mira e viseira holográfica. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#helmet-package`. | Capacete com sistema de mira e viseira holográfica. | P2 | `gear-cat.accessories` |
| `gear.holster` | Coldre de couro com uma pistola blaster. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#holster`. | Coldre de couro com uma pistola blaster. | P2 | `gear-cat.accessories` |
| `gear.standard-scope` | Mira eletrônica para blaster com retículo luminoso. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#standard-scope`. | Mira eletrônica para blaster com retículo luminoso. | P2 | `gear-cat.accessories` |
| `gear.enhanced-macroscope` | Mira de ampliação montada em rifle, com lente longa. Planta holográfica de objeto isolado, vista em 3/4. Dados: `data/gear.json#enhanced-macroscope`. | Mira de ampliação montada em rifle, com lente longa. | P2 | `gear-cat.accessories` |

## Veículos: reservas por categoria

Comum a todos: aparece em /consulta (reserva quando o item não tem imagem) (`EntityDetail.header, EntityList.thumbnail (reserva)`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `holo-craft`; placeholder `vehicle`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `vehicle-cat.walkers` | Andador blindado de pernas mecânicas de design próprio avançando por uma planície enevoada. | Andador blindado avançando na névoa. | P1 |
| `vehicle-cat.landspeeders` | Landspeeder aberto de design próprio flutuando baixo sobre uma estrada de terra ao pôr do sol. | Landspeeder flutuando sobre uma estrada de terra. | P1 |
| `vehicle-cat.speeder-bikes` | Moto flutuante de design próprio em alta velocidade entre troncos de floresta. | Moto flutuante entre árvores. | P1 |
| `vehicle-cat.swoops` | Swoop de corrida de design próprio, motor enorme e assento mínimo, cruzando um cânion. | Swoop de corrida cruzando um cânion. | P1 |
| `vehicle-cat.armored-assault-vehicles` | Tanque flutuante blindado de design próprio avançando com poeira atrás. | Tanque flutuante blindado. | P1 |
| `vehicle-cat.airspeeders` | Aerospeeder de design próprio voando baixo entre torres de uma cidade. | Aerospeeder voando entre torres. | P1 |
| `vehicle-cat.cloud-cars` | Carro de nuvens de design próprio cruzando nuvens alaranjadas. | Carro de nuvens entre nuvens alaranjadas. | P1 |
| `vehicle-cat.podracers` | Cabine de corrida puxada por dois motores de design próprio deixando rastros de calor. | Cabine puxada por dois motores de corrida. | P1 |
| `vehicle-cat.sail-barges` | Barcaça flutuante com velas de design próprio sobre dunas. | Barcaça com velas sobre dunas. | P1 |
| `vehicle-cat.skiffs` | Plataforma de carga flutuante aberta de design próprio num porto. | Plataforma de carga flutuante. | P1 |
| `vehicle-cat.ground-vehicles` | Veículo terrestre pesado de rodas de design próprio cruzando lama. | Veículo terrestre pesado na lama. | P1 |
| `vehicle-cat.hover-vehicles` | Hidrofólio de design próprio deslizando sobre ondas. | Hidrofólio sobre ondas. | P1 |

## Veículos (24)

Comum a todos: aparece em /consulta/veiculos, /consulta/veiculos/:id (`EntityDetail.header, EntityList.thumbnail`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `holo-craft`; placeholder `vehicle`; ponto focal: veículo no terço central, espaço livre acima para o nome.

| id | Descrição (prompt) | Texto alternativo | Prio | Reserva |
|---|---|---|---|---|
| `vehicle.at-at` | Andador de assalto quadrúpede gigantesco e blindado atravessando um campo de neve, tropas minúsculas ao lado para dar escala. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#at-at`. | Andador de assalto quadrúpede gigantesco e blindado atravessando um campo de neve. | P1 | `vehicle-cat.walkers` |
| `vehicle.at-pt` | Andador leve bípede de um tripulante, cabine aberta, numa trilha de floresta. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#at-pt`. | Andador leve bípede de um tripulante. | P1 | `vehicle-cat.walkers` |
| `vehicle.at-st` | Andador bípede médio de cabine elevada patrulhando uma floresta. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#at-st`. | Andador bípede médio de cabine elevada patrulhando uma floresta. | P1 | `vehicle-cat.walkers` |
| `vehicle.at-te` | Andador de seis pernas subindo uma encosta rochosa com tropas. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#at-te`. | Andador de seis pernas subindo uma encosta rochosa com tropas. | P1 | `vehicle-cat.walkers` |
| `vehicle.ubrikkian-9000-z004` | Landspeeder esportivo aberto e baixo, com para-brisa curvo, numa avenida de cidade. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#ubrikkian-9000-z004`. | Landspeeder esportivo aberto e baixo. | P1 | `vehicle-cat.landspeeders` |
| `vehicle.v-35-courier` | Landspeeder utilitário de cabine fechada estacionado num povoado de fazenda. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#v-35-courier`. | Landspeeder utilitário de cabine fechada estacionado num povoado de fazenda. | P1 | `vehicle-cat.landspeeders` |
| `vehicle.x-34-landspeeder` | Landspeeder aberto de dois lugares com turbinas traseiras sobre um deserto. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#x-34-landspeeder`. | Landspeeder aberto de dois lugares com turbinas traseiras sobre um deserto. | P1 | `vehicle-cat.landspeeders` |
| `vehicle.aratech-74-z-military-speeder-bike` | Moto flutuante militar com aletas dianteiras entre árvores gigantes. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#aratech-74-z-military-speeder-bike`. | Moto flutuante militar com aletas dianteiras entre árvores gigantes. | P1 | `vehicle-cat.speeder-bikes` |
| `vehicle.ikas-adno-nightfalcon` | Moto flutuante esportiva de linhas aerodinâmicas numa rua noturna iluminada. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#ikas-adno-nightfalcon`. | Moto flutuante esportiva de linhas aerodinâmicas numa rua noturna iluminada. | P1 | `vehicle-cat.speeder-bikes` |
| `vehicle.razalon-fc-20` | Moto flutuante robusta de patrulha num posto de fronteira. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#razalon-fc-20`. | Moto flutuante robusta de patrulha num posto de fronteira. | P1 | `vehicle-cat.speeder-bikes` |
| `vehicle.stap` | Pequena plataforma voadora individual com o piloto de pé, sobre uma planície. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#stap`. | Pequena plataforma voadora individual com o piloto de pé. | P1 | `vehicle-cat.speeder-bikes` |
| `vehicle.air-2-racing-swoop` | Swoop de corrida: motor enorme com assento minúsculo, inclinado numa curva. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#air-2-racing-swoop`. | Swoop de corrida: motor enorme com assento minúsculo. | P1 | `vehicle-cat.swoops` |
| `vehicle.flare-s` | Swoop de corrida com carenagem lisa deixando um rastro de luz. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#flare-s`. | Swoop de corrida com carenagem lisa deixando um rastro de luz. | P1 | `vehicle-cat.swoops` |
| `vehicle.aat-1` | Tanque flutuante blindado com canhão principal e proa inclinada, numa campina. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#aat-1`. | Tanque flutuante blindado com canhão principal e proa inclinada. | P1 | `vehicle-cat.armored-assault-vehicles` |
| `vehicle.multi-troop-transport` | Transporte de tropas flutuante enorme e blindado com portas frontais abertas. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#multi-troop-transport`. | Transporte de tropas flutuante enorme e blindado com portas frontais abertas. | P1 | `vehicle-cat.armored-assault-vehicles` |
| `vehicle.incom-t-47i-airspeeder` | Aerospeeder utilitário de dois lugares com cabine envidraçada sobre uma cidade. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#incom-t-47i-airspeeder`. | Aerospeeder utilitário de dois lugares com cabine envidraçada sobre uma cidade. | P1 | `vehicle-cat.airspeeders` |
| `vehicle.laat-i-gunship` | Canhoneira de transporte de tropas com portas laterais abertas e torres de disparo, sobre um campo de batalha. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#laat-i-gunship`. | Canhoneira de transporte de tropas com portas laterais abertas e torres de disparo. | P1 | `vehicle-cat.airspeeders` |
| `vehicle.rebel-alliance-combat-snowspeeder` | Aerospeeder de combate de dois tripulantes adaptado para o frio, voando rente à neve. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#rebel-alliance-combat-snowspeeder`. | Aerospeeder de combate de dois tripulantes adaptado para o frio. | P1 | `vehicle-cat.airspeeders` |
| `vehicle.bespin-motors-storm-iv` | Carro de nuvens de dois casulos ligados por um motor central entre nuvens alaranjadas. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#bespin-motors-storm-iv`. | Carro de nuvens de dois casulos ligados por um motor central entre nuvens alaranjadas. | P1 | `vehicle-cat.cloud-cars` |
| `vehicle.radon-ulzer-podracer` | Dois motores de corrida enormes puxando por cabos uma pequena cabine sobre a areia. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#radon-ulzer-podracer`. | Dois motores de corrida enormes puxando por cabos uma pequena cabine sobre a areia. | P1 | `vehicle-cat.podracers` |
| `vehicle.sail-barge` | Barcaça flutuante de luxo com velas e convés de festa sobre dunas. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#sail-barge`. | Barcaça flutuante de luxo com velas e convés de festa sobre dunas. | P1 | `vehicle-cat.sail-barges` |
| `vehicle.cargo-skiff` | Plataforma de carga flutuante aberta com corrimões, sobre um mar de areia. Escala Speeder; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#cargo-skiff`. | Plataforma de carga flutuante aberta com corrimões. | P1 | `vehicle-cat.skiffs` |
| `vehicle.a5-juggernaut` | Veículo de assalto pesado de muitas rodas com uma torre alta de observação. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#a5-juggernaut`. | Veículo de assalto pesado de muitas rodas com uma torre alta de observação. | P1 | `vehicle-cat.ground-vehicles` |
| `vehicle.waveskimmer` | Hidrofólio de ataque deslizando sobre ondas com borrifos. Escala Walker; design próprio, sem reproduzir o veículo dos filmes. Dados: `data/vehicles.json#waveskimmer`. | Hidrofólio de ataque deslizando sobre ondas com borrifos. | P1 | `vehicle-cat.hover-vehicles` |

## Naves: reservas por escala

### `starship-scale.starfighter`

- **Onde**: /consulta (reserva quando o item não tem imagem), componente `EntityDetail.header, EntityList.thumbnail (reserva)`
- **Proporção e tamanho**: 16:9 (miniatura 1:1); all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista
- **Estilo**: `holo-craft`; placeholder `starship`; ponto focal: centro; prioridade P1
- **Descrição**: Pequenas naves de design próprio (um caça e um cargueiro leve) cruzando um campo de estrelas perto de um planeta.
- **Alt**: Caça e cargueiro leve cruzando as estrelas.

### `starship-scale.capital`

- **Onde**: /consulta (reserva quando o item não tem imagem), componente `EntityDetail.header, EntityList.thumbnail (reserva)`
- **Proporção e tamanho**: 16:9 (miniatura 1:1); all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista
- **Estilo**: `holo-craft`; placeholder `starship`; ponto focal: centro; prioridade P1
- **Descrição**: Grande nave de guerra de design próprio em órbita de um planeta, com naves menores ao redor para dar escala.
- **Alt**: Grande nave de guerra em órbita.

### `starship-scale.personal-starship`

- **Onde**: /consulta (reserva quando o item não tem imagem), componente `EntityDetail.header, EntityList.thumbnail (reserva)`
- **Proporção e tamanho**: 16:9 (miniatura 1:1); all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista
- **Estilo**: `holo-craft`; placeholder `starship`; ponto focal: centro; prioridade P1
- **Descrição**: Iate estelar pequeno e elegante de design próprio saindo de um hangar particular.
- **Alt**: Iate estelar pequeno saindo de um hangar.

## Naves (34)

Comum a todos: aparece em /consulta/naves, /consulta/naves/:id (`EntityDetail.header, EntityList.thumbnail`); proporção 16:9 (miniatura 1:1); tamanho all: 1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista; estilo `holo-craft`; placeholder `starship`; ponto focal: nave no terço central, espaço livre acima para o nome.

| id | Descrição (prompt) | Texto alternativo | Prio | Reserva |
|---|---|---|---|---|
| `starship.delta-7-aethersprite-starfighter` | Interceptador pequeno em forma de cunha achatada com cabine para um piloto, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#delta-7-aethersprite-starfighter`. | Interceptador pequeno em forma de cunha achatada com cabine para um piloto. | P1 | `starship-scale.starfighter` |
| `starship.arc-170` | Caça pesado de asas que se abrem em duas camadas, com canhões longos, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#arc-170`. | Caça pesado de asas que se abrem em duas camadas, com canhões longos. | P1 | `starship-scale.starfighter` |
| `starship.a-wing` | Interceptador compacto em cunha com dois motores laterais grandes, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#a-wing`. | Interceptador compacto em cunha com dois motores laterais grandes. | P1 | `starship-scale.starfighter` |
| `starship.b-wing` | Caça de assalto de asa longa vertical com cabine na ponta, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#b-wing`. | Caça de assalto de asa longa vertical com cabine na ponta. | P1 | `starship-scale.starfighter` |
| `starship.vulture-class-droid-starfighter` | Caça droide de asas dobráveis que vira andador, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#vulture-class-droid-starfighter`. | Caça droide de asas dobráveis que vira andador. | P1 | `starship-scale.starfighter` |
| `starship.tri-fighter` | Caça droide de três braços com um sensor central, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#tri-fighter`. | Caça droide de três braços com um sensor central. | P1 | `starship-scale.starfighter` |
| `starship.eta-2-actis-interceptor` | Interceptador minúsculo de painéis de asa abertos, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#eta-2-actis-interceptor`. | Interceptador minúsculo de painéis de asa abertos. | P1 | `starship-scale.starfighter` |
| `starship.n-1-royal-starfighter` | Caça elegante cromado de motores alongados, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#n-1-royal-starfighter`. | Caça elegante cromado de motores alongados. | P1 | `starship-scale.starfighter` |
| `starship.tie-fighter` | Caça leve de produção em massa com cabine central e grandes painéis laterais, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#tie-fighter`. | Caça leve de produção em massa com cabine central e grandes painéis laterais. | P1 | `starship-scale.starfighter` |
| `starship.tie-bomber` | Bombardeiro leve de dois casulos lado a lado entre painéis, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#tie-bomber`. | Bombardeiro leve de dois casulos lado a lado entre painéis. | P1 | `starship-scale.starfighter` |
| `starship.tie-interceptor` | Interceptador de painéis laterais angulosos e pontiagudos, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#tie-interceptor`. | Interceptador de painéis laterais angulosos e pontiagudos. | P1 | `starship-scale.starfighter` |
| `starship.x-wing` | Caça de superioridade de quatro asas que se abrem em formação de ataque, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#x-wing`. | Caça de superioridade de quatro asas que se abrem em formação de ataque. | P1 | `starship-scale.starfighter` |
| `starship.y-wing-s3` | Caça de ataque de estrutura exposta e dois motores longos, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#y-wing-s3`. | Caça de ataque de estrutura exposta e dois motores longos. | P1 | `starship-scale.starfighter` |
| `starship.y-wing-a4` | Caça de ataque de estrutura exposta, dois motores longos e torre de canhão, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#y-wing-a4`. | Caça de ataque de estrutura exposta, dois motores longos e torre de canhão. | P1 | `starship-scale.starfighter` |
| `starship.z-95-headhunter` | Caça polivalente antigo de asas fixas e cabine em bolha, num combate entre asteroides. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#z-95-headhunter`. | Caça polivalente antigo de asas fixas e cabine em bolha. | P1 | `starship-scale.starfighter` |
| `starship.acclamator-assault-ship` | Nave de assalto de casco em cunha desembarcando tropas, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#acclamator-assault-ship`. | Nave de assalto de casco em cunha desembarcando tropas. | P1 | `starship-scale.capital` |
| `starship.banking-clan-frigate` | Fragata de casco estreito com um núcleo esférico, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#banking-clan-frigate`. | Fragata de casco estreito com um núcleo esférico. | P1 | `starship-scale.capital` |
| `starship.corellian-corvette` | Corveta longa com uma fileira de motores brilhando na popa, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#corellian-corvette`. | Corveta longa com uma fileira de motores brilhando na popa. | P1 | `starship-scale.capital` |
| `starship.imperial-star-destroyer` | Imensa nave de guerra em forma de cunha com torre de comando, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#imperial-star-destroyer`. | Imensa nave de guerra em forma de cunha com torre de comando. | P1 | `starship-scale.capital` |
| `starship.interdictor-cruiser` | Cruzador pesado com grandes projetores esféricos no casco, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#interdictor-cruiser`. | Cruzador pesado com grandes projetores esféricos no casco. | P1 | `starship-scale.capital` |
| `starship.mon-calamari-mc80-star-cruiser` | Cruzador de casco orgânico, bulboso e irregular, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#mon-calamari-mc80-star-cruiser`. | Cruzador de casco orgânico, bulboso e irregular. | P1 | `starship-scale.capital` |
| `starship.nebulon-b-frigate` | Fragata de escolta com casco dividido por um braço estreito, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#nebulon-b-frigate`. | Fragata de escolta com casco dividido por um braço estreito. | P1 | `starship-scale.capital` |
| `starship.republic-cruiser` | Cruzador diplomático de casco vermelho e linhas suaves, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#republic-cruiser`. | Cruzador diplomático de casco vermelho e linhas suaves. | P1 | `starship-scale.capital` |
| `starship.trade-federation-battleship` | Nave de batalha em anel com uma esfera central, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#trade-federation-battleship`. | Nave de batalha em anel com uma esfera central. | P1 | `starship-scale.capital` |
| `starship.venator-star-destroyer` | Destróier estelar em cunha com um longo convés de voo, em órbita de um planeta, com naves menores ao redor para dar escala. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#venator-star-destroyer`. | Destróier estelar em cunha com um longo convés de voo. | P1 | `starship-scale.capital` |
| `starship.firespray-patrol-attack-craft` | Nave de patrulha de casco ovalado que voa na vertical, saindo do hiperespaço perto de uma estação. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#firespray-patrol-attack-craft`. | Nave de patrulha de casco ovalado que voa na vertical. | P1 | `starship-scale.starfighter` |
| `starship.ghtroc-720-freighter` | Cargueiro leve de cabine lateral e casco robusto, saindo do hiperespaço perto de uma estação. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#ghtroc-720-freighter`. | Cargueiro leve de cabine lateral e casco robusto. | P1 | `starship-scale.starfighter` |
| `starship.j-type-star-skiff` | Iate estelar cromado de linhas suaves e asas curtas, saindo do hiperespaço perto de uma estação. Escala Personal Starship; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#j-type-star-skiff`. | Iate estelar cromado de linhas suaves e asas curtas. | P1 | `starship-scale.personal-starship` |
| `starship.lambda-shuttle` | Lançadeira de três asas, as laterais dobrando no pouso, saindo do hiperespaço perto de uma estação. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#lambda-shuttle`. | Lançadeira de três asas, as laterais dobrando no pouso. | P1 | `starship-scale.starfighter` |
| `starship.gallofree-medium-transport` | Transporte médio de casco modular e motores na popa, saindo do hiperespaço perto de uma estação. Escala Capital; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#gallofree-medium-transport`. | Transporte médio de casco modular e motores na popa. | P1 | `starship-scale.capital` |
| `starship.guardian-light-cruiser` | Cruzador leve de alfândega com casco compacto e torres, saindo do hiperespaço perto de uma estação. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#guardian-light-cruiser`. | Cruzador leve de alfândega com casco compacto e torres. | P1 | `starship-scale.starfighter` |
| `starship.yt-1300-transport` | Cargueiro leve de casco achatado e arredondado, cabine deslocada para o lado, saindo do hiperespaço perto de uma estação. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#yt-1300-transport`. | Cargueiro leve de casco achatado e arredondado, cabine deslocada para o lado. | P1 | `starship-scale.starfighter` |
| `starship.yt-2000-transport` | Cargueiro leve de casco achatado com duas cabines simétricas, saindo do hiperespaço perto de uma estação. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#yt-2000-transport`. | Cargueiro leve de casco achatado com duas cabines simétricas. | P1 | `starship-scale.starfighter` |
| `starship.yt-2400-transport` | Cargueiro leve de casco circular com cabine num braço lateral, saindo do hiperespaço perto de uma estação. Escala Starfighter; design próprio, sem reproduzir a nave dos filmes. Dados: `data/starships.json#yt-2400-transport`. | Cargueiro leve de casco circular com cabine num braço lateral. | P1 | `starship-scale.starfighter` |

## Perícias: reservas por atributo

Comum a todos: aparece em /consulta (reserva quando o item não tem imagem) (`EntityDetail.header, EntityList.thumbnail (reserva)`); proporção 1:1; tamanho all: 800x800 (1:1); miniatura 160x160 na lista; estilo `scene-spot`; placeholder `skill`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `skill-attr.dexterity` | Figura em movimento rápido esquivando de um disparo, com rastros de luz. | Figura esquivando de um disparo. | P3 |
| `skill-attr.knowledge` | Arquivo de cristais de dados e mapas estelares projetados sobre uma mesa. | Cristais de dados e mapas estelares. | P3 |
| `skill-attr.mechanical` | Mãos num manche de pilotagem com o painel da cabine aceso. | Mãos no manche de uma cabine. | P3 |
| `skill-attr.perception` | Olhar atento refletindo uma cena distante numa viseira. | Olhar atento refletido numa viseira. | P3 |
| `skill-attr.strength` | Figura erguendo uma caixa de carga pesada com esforço. | Figura erguendo uma caixa pesada. | P3 |
| `skill-attr.technical` | Mãos com ferramentas abrindo um painel de circuitos que solta faíscas. | Mãos consertando um painel com faíscas. | P3 |

## Perícias (110)

Comum a todos: aparece em /consulta/pericias, /consulta/pericias/:id, ficha (detalhe da perícia), assistente (perícias) (`EntityDetail.header, EntityList.thumbnail`); proporção 1:1; tamanho all: 800x800 (1:1); miniatura 160x160 na lista; estilo `scene-spot`; placeholder `skill`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio | Reserva |
|---|---|---|---|---|
| `skill.acrobatics` | Cena simbólica: figura dando um salto mortal sobre uma grade. Dados: `data/skills.json#acrobatics`. | Figura dando um salto mortal sobre uma grade. | P3 | `skill-attr.dexterity` |
| `skill.aquatic-vehicle-engineering-advanced` | Cena simbólica: projeto de um barco de design próprio sobre a prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#aquatic-vehicle-engineering-advanced`. | Projeto de um barco de design próprio sobre a prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.aquatic-vehicle-operation` | Cena simbólica: piloto conduzindo um barco veloz entre ondas. Dados: `data/skills.json#aquatic-vehicle-operation`. | Piloto conduzindo um barco veloz entre ondas. | P3 | `skill-attr.mechanical` |
| `skill.aquatic-vehicle-repair` | Cena simbólica: mecânico consertando o motor de um barco num cais. Dados: `data/skills.json#aquatic-vehicle-repair`. | Mecânico consertando o motor de um barco num cais. | P3 | `skill-attr.technical` |
| `skill.archaic-guns` | Cena simbólica: atirador carregando um mosquete com pólvora. Dados: `data/skills.json#archaic-guns`. | Atirador carregando um mosquete com pólvora. | P3 | `skill-attr.dexterity` |
| `skill.archaic-starship-piloting` | Cena simbólica: piloto numa cabine antiga cheia de alavancas e mostradores. Dados: `data/skills.json#archaic-starship-piloting`. | Piloto numa cabine antiga cheia de alavancas e mostradores. | P3 | `skill-attr.mechanical` |
| `skill.armor-engineering-advanced` | Cena simbólica: projeto de armadura em camadas sobre a prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#armor-engineering-advanced`. | Projeto de armadura em camadas sobre a prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.armor-repair` | Cena simbólica: técnico martelando uma placa de armadura amassada. Dados: `data/skills.json#armor-repair`. | Técnico martelando uma placa de armadura amassada. | P3 | `skill-attr.technical` |
| `skill.alien-species` | Cena simbólica: viajante consultando um guia ilustrado de seres alienígenas. Dados: `data/skills.json#alien-species`. | Viajante consultando um guia ilustrado de seres alienígenas. | P3 | `skill-attr.knowledge` |
| `skill.artillery` | Cena simbólica: artilheiro ajustando a mira de um canhão pesado. Dados: `data/skills.json#artillery`. | Artilheiro ajustando a mira de um canhão pesado. | P3 | `skill-attr.dexterity` |
| `skill.astrogation` | Cena simbólica: navegador traçando uma rota de salto num mapa estelar. Dados: `data/skills.json#astrogation`. | Navegador traçando uma rota de salto num mapa estelar. | P3 | `skill-attr.mechanical` |
| `skill.bargain` | Cena simbólica: duas mãos regateando sobre uma pilha de créditos num balcão. Dados: `data/skills.json#bargain`. | Duas mãos regateando sobre uma pilha de créditos num balcão. | P3 | `skill-attr.perception` |
| `skill.beast-riding` | Cena simbólica: cavaleiro montado numa criatura de carga de design próprio. Dados: `data/skills.json#beast-riding`. | Cavaleiro montado numa criatura de carga de design próprio. | P3 | `skill-attr.mechanical` |
| `skill.blaster` | Cena simbólica: atirador disparando uma pistola blaster com um raio de luz. Dados: `data/skills.json#blaster`. | Atirador disparando uma pistola blaster com um raio de luz. | P3 | `skill-attr.dexterity` |
| `skill.blaster-artillery` | Cena simbólica: operador de uma bateria blaster em plataforma fixa. Dados: `data/skills.json#blaster-artillery`. | Operador de uma bateria blaster em plataforma fixa. | P3 | `skill-attr.dexterity` |
| `skill.blaster-repair` | Cena simbólica: pistola blaster desmontada numa bancada com ferramentas. Dados: `data/skills.json#blaster-repair`. | Pistola blaster desmontada numa bancada com ferramentas. | P3 | `skill-attr.technical` |
| `skill.bowcaster` | Cena simbólica: atirador alto mirando uma besta de energia. Dados: `data/skills.json#bowcaster`. | Atirador alto mirando uma besta de energia. | P3 | `skill-attr.dexterity` |
| `skill.bows` | Cena simbólica: arqueiro tensionando um arco longo. Dados: `data/skills.json#bows`. | Arqueiro tensionando um arco longo. | P3 | `skill-attr.dexterity` |
| `skill.brawling` | Cena simbólica: dois punhos se cruzando numa briga de cantina. Dados: `data/skills.json#brawling`. | Dois punhos se cruzando numa briga de cantina. | P3 | `skill-attr.strength` |
| `skill.brawling-parry` | Cena simbólica: antebraço bloqueando um soco. Dados: `data/skills.json#brawling-parry`. | Antebraço bloqueando um soco. | P3 | `skill-attr.dexterity` |
| `skill.bureaucracy` | Cena simbólica: pilha de formulários e carimbos numa repartição. Dados: `data/skills.json#bureaucracy`. | Pilha de formulários e carimbos numa repartição. | P3 | `skill-attr.knowledge` |
| `skill.business` | Cena simbólica: negociante fechando um contrato holográfico com aperto de mãos. Dados: `data/skills.json#business`. | Negociante fechando um contrato holográfico com aperto de mãos. | P3 | `skill-attr.knowledge` |
| `skill.capital-ship-engineering-advanced` | Cena simbólica: planta de uma nave de guerra de design próprio sobre a prancheta. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#capital-ship-engineering-advanced`. | Planta de uma nave de guerra de design próprio sobre a prancheta. | P3 | `skill-attr.technical` |
| `skill.capital-ship-gunnery` | Cena simbólica: artilheiro numa torre de turbolaser de nave grande. Dados: `data/skills.json#capital-ship-gunnery`. | Artilheiro numa torre de turbolaser de nave grande. | P3 | `skill-attr.mechanical` |
| `skill.capital-ship-piloting` | Cena simbólica: timoneiro na ponte de comando de uma nave enorme. Dados: `data/skills.json#capital-ship-piloting`. | Timoneiro na ponte de comando de uma nave enorme. | P3 | `skill-attr.mechanical` |
| `skill.capital-ship-repair` | Cena simbólica: equipe consertando uma seção de casco de nave grande. Dados: `data/skills.json#capital-ship-repair`. | Equipe consertando uma seção de casco de nave grande. | P3 | `skill-attr.technical` |
| `skill.capital-ship-shields` | Cena simbólica: operador ajustando a cúpula de escudo de uma nave grande. Dados: `data/skills.json#capital-ship-shields`. | Operador ajustando a cúpula de escudo de uma nave grande. | P3 | `skill-attr.mechanical` |
| `skill.capital-ship-weapon-repair` | Cena simbólica: técnicos consertando um canhão de nave de guerra. Dados: `data/skills.json#capital-ship-weapon-repair`. | Técnicos consertando um canhão de nave de guerra. | P3 | `skill-attr.technical` |
| `skill.civil-industrial-engineering-advanced` | Cena simbólica: projeto de uma cidade e suas torres na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#civil-industrial-engineering-advanced`. | Projeto de uma cidade e suas torres na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.climbing-jumping` | Cena simbólica: figura escalando uma parede rochosa e saltando para a borda. Dados: `data/skills.json#climbing-jumping`. | Figura escalando uma parede rochosa e saltando para a borda. | P3 | `skill-attr.strength` |
| `skill.command` | Cena simbólica: líder apontando o caminho para um grupo. Dados: `data/skills.json#command`. | Líder apontando o caminho para um grupo. | P3 | `skill-attr.perception` |
| `skill.communications` | Cena simbólica: operador de fones ajustando frequências num console. Dados: `data/skills.json#communications`. | Operador de fones ajustando frequências num console. | P3 | `skill-attr.mechanical` |
| `skill.computer-engineering-advanced` | Cena simbólica: projeto de um núcleo de computador na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#computer-engineering-advanced`. | Projeto de um núcleo de computador na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.computer-programming-repair` | Cena simbólica: mãos digitando código num terminal aberto. Dados: `data/skills.json#computer-programming-repair`. | Mãos digitando código num terminal aberto. | P3 | `skill-attr.technical` |
| `skill.con` | Cena simbólica: trapaceiro sorrindo enquanto esconde uma carta na manga. Dados: `data/skills.json#con`. | Trapaceiro sorrindo enquanto esconde uma carta na manga. | P3 | `skill-attr.perception` |
| `skill.cultures` | Cena simbólica: viajante observando um festival de outra cultura. Dados: `data/skills.json#cultures`. | Viajante observando um festival de outra cultura. | P3 | `skill-attr.knowledge` |
| `skill.demolitions` | Cena simbólica: mãos instalando uma carga explosiva numa coluna. Dados: `data/skills.json#demolitions`. | Mãos instalando uma carga explosiva numa coluna. | P3 | `skill-attr.technical` |
| `skill.dodge` | Cena simbólica: figura se jogando para o lado enquanto raios passam. Dados: `data/skills.json#dodge`. | Figura se jogando para o lado enquanto raios passam. | P3 | `skill-attr.dexterity` |
| `skill.droid-engineering-advanced` | Cena simbólica: projeto de um droide de design próprio na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#droid-engineering-advanced`. | Projeto de um droide de design próprio na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.droid-programming` | Cena simbólica: técnico ligando um cabo de dados num pequeno droide. Dados: `data/skills.json#droid-programming`. | Técnico ligando um cabo de dados num pequeno droide. | P3 | `skill-attr.technical` |
| `skill.droid-repair` | Cena simbólica: pequeno droide aberto numa bancada recebendo conserto. Dados: `data/skills.json#droid-repair`. | Pequeno droide aberto numa bancada recebendo conserto. | P3 | `skill-attr.technical` |
| `skill.equipment-engineering-advanced` | Cena simbólica: projeto de um aparelho portátil na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#equipment-engineering-advanced`. | Projeto de um aparelho portátil na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.equipment-repair` | Cena simbólica: técnico consertando um comunicador com uma pinça. Dados: `data/skills.json#equipment-repair`. | Técnico consertando um comunicador com uma pinça. | P3 | `skill-attr.technical` |
| `skill.firearms` | Cena simbólica: atirador disparando um rifle de projéteis. Dados: `data/skills.json#firearms`. | Atirador disparando um rifle de projéteis. | P3 | `skill-attr.dexterity` |
| `skill.first-aid` | Cena simbólica: mãos aplicando um curativo num braço ferido. Dados: `data/skills.json#first-aid`. | Mãos aplicando um curativo num braço ferido. | P3 | `skill-attr.technical` |
| `skill.flamethrower` | Cena simbólica: jato de chamas iluminando um corredor escuro. Dados: `data/skills.json#flamethrower`. | Jato de chamas iluminando um corredor escuro. | P3 | `skill-attr.dexterity` |
| `skill.forgery` | Cena simbólica: falsificador copiando um selo com uma lente de aumento. Dados: `data/skills.json#forgery`. | Falsificador copiando um selo com uma lente de aumento. | P3 | `skill-attr.perception` |
| `skill.gambling` | Cena simbólica: dados e cartas sobre uma mesa de apostas. Dados: `data/skills.json#gambling`. | Dados e cartas sobre uma mesa de apostas. | P3 | `skill-attr.perception` |
| `skill.grenade` | Cena simbólica: braço arremessando uma granada em arco. Dados: `data/skills.json#grenade`. | Braço arremessando uma granada em arco. | P3 | `skill-attr.dexterity` |
| `skill.ground-vehicle-engineering-advanced` | Cena simbólica: projeto de um veículo de rodas na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#ground-vehicle-engineering-advanced`. | Projeto de um veículo de rodas na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.ground-vehicle-operation` | Cena simbólica: motorista conduzindo um veículo de rodas por terreno acidentado. Dados: `data/skills.json#ground-vehicle-operation`. | Motorista conduzindo um veículo de rodas por terreno acidentado. | P3 | `skill-attr.mechanical` |
| `skill.ground-vehicle-repair` | Cena simbólica: mecânico deitado sob um veículo de rodas. Dados: `data/skills.json#ground-vehicle-repair`. | Mecânico deitado sob um veículo de rodas. | P3 | `skill-attr.technical` |
| `skill.hide` | Cena simbólica: objeto sendo escondido num compartimento secreto. Dados: `data/skills.json#hide`. | Objeto sendo escondido num compartimento secreto. | P3 | `skill-attr.perception` |
| `skill.hover-vehicle-engineering-advanced` | Cena simbólica: projeto de um veículo flutuante na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#hover-vehicle-engineering-advanced`. | Projeto de um veículo flutuante na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.hover-vehicle-operation` | Cena simbólica: piloto conduzindo um veículo flutuante sobre um pântano. Dados: `data/skills.json#hover-vehicle-operation`. | Piloto conduzindo um veículo flutuante sobre um pântano. | P3 | `skill-attr.mechanical` |
| `skill.hover-vehicle-repair` | Cena simbólica: mecânico ajustando o colchão de ar de um veículo flutuante. Dados: `data/skills.json#hover-vehicle-repair`. | Mecânico ajustando o colchão de ar de um veículo flutuante. | P3 | `skill-attr.technical` |
| `skill.installation-engineering-advanced` | Cena simbólica: projeto de uma base fortificada na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#installation-engineering-advanced`. | Projeto de uma base fortificada na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.intimidation` | Cena simbólica: figura grande se inclinando ameaçadora sobre outra. Dados: `data/skills.json#intimidation`. | Figura grande se inclinando ameaçadora sobre outra. | P3 | `skill-attr.knowledge` |
| `skill.investigation` | Cena simbólica: investigador examinando pegadas com uma lanterna. Dados: `data/skills.json#investigation`. | Investigador examinando pegadas com uma lanterna. | P3 | `skill-attr.perception` |
| `skill.jet-pack-operation` | Cena simbólica: figura voando com mochila a jato entre plataformas. Dados: `data/skills.json#jet-pack-operation`. | Figura voando com mochila a jato entre plataformas. | P3 | `skill-attr.mechanical` |
| `skill.languages` | Cena simbólica: balões de fala com glifos de vários alfabetos inventados. Dados: `data/skills.json#languages`. | Balões de fala com glifos de vários alfabetos inventados. | P3 | `skill-attr.knowledge` |
| `skill.law-enforcement` | Cena simbólica: distintivo de agente da lei e algemas sobre uma mesa. Dados: `data/skills.json#law-enforcement`. | Distintivo de agente da lei e algemas sobre uma mesa. | P3 | `skill-attr.knowledge` |
| `skill.lifting` | Cena simbólica: figura erguendo uma viga de metal. Dados: `data/skills.json#lifting`. | Figura erguendo uma viga de metal. | P3 | `skill-attr.strength` |
| `skill.lightsaber` | Cena simbólica: lâmina de energia acesa bloqueando um raio. Dados: `data/skills.json#lightsaber`. | Lâmina de energia acesa bloqueando um raio. | P3 | `skill-attr.dexterity` |
| `skill.lightsaber-repair-engineering` | Cena simbólica: cabo de lâmina de energia desmontado com um cristal ao lado. Dados: `data/skills.json#lightsaber-repair-engineering`. | Cabo de lâmina de energia desmontado com um cristal ao lado. | P3 | `skill-attr.technical` |
| `skill.medicine-advanced` | Cena simbólica: médico operando com instrumentos de precisão sob luz branca. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#medicine-advanced`. | Médico operando com instrumentos de precisão sob luz branca. | P3 | `skill-attr.technical` |
| `skill.melee-combat` | Cena simbólica: dois combatentes cruzando lâminas vibratórias. Dados: `data/skills.json#melee-combat`. | Dois combatentes cruzando lâminas vibratórias. | P3 | `skill-attr.dexterity` |
| `skill.melee-parry` | Cena simbólica: lâmina aparando um golpe de bastão. Dados: `data/skills.json#melee-parry`. | Lâmina aparando um golpe de bastão. | P3 | `skill-attr.dexterity` |
| `skill.missile-weapons` | Cena simbólica: lança-foguetes disparando com rastro de fumaça. Dados: `data/skills.json#missile-weapons`. | Lança-foguetes disparando com rastro de fumaça. | P3 | `skill-attr.dexterity` |
| `skill.persuasion` | Cena simbólica: orador convencendo uma pequena plateia. Dados: `data/skills.json#persuasion`. | Orador convencendo uma pequena plateia. | P3 | `skill-attr.perception` |
| `skill.pick-pocket` | Cena simbólica: mão leve tirando um chip de crédito de um bolso. Dados: `data/skills.json#pick-pocket`. | Mão leve tirando um chip de crédito de um bolso. | P3 | `skill-attr.dexterity` |
| `skill.planetary-systems` | Cena simbólica: planetas em órbita num holograma de sistema estelar. Dados: `data/skills.json#planetary-systems`. | Planetas em órbita num holograma de sistema estelar. | P3 | `skill-attr.knowledge` |
| `skill.podracer-operation` | Cena simbólica: piloto numa cabine minúscula puxada por dois motores. Dados: `data/skills.json#podracer-operation`. | Piloto numa cabine minúscula puxada por dois motores. | P3 | `skill-attr.mechanical` |
| `skill.powersuit-operation` | Cena simbólica: operador dentro de um exoesqueleto de carga erguendo um contêiner. Dados: `data/skills.json#powersuit-operation`. | Operador dentro de um exoesqueleto de carga erguendo um contêiner. | P3 | `skill-attr.mechanical` |
| `skill.repulsorlift-engineering-advanced` | Cena simbólica: projeto de um motor repulsor na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#repulsorlift-engineering-advanced`. | Projeto de um motor repulsor na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.repulsorlift-operation` | Cena simbólica: piloto de landspeeder fazendo uma curva fechada. Dados: `data/skills.json#repulsorlift-operation`. | Piloto de landspeeder fazendo uma curva fechada. | P3 | `skill-attr.mechanical` |
| `skill.repulsorlift-repair` | Cena simbólica: mecânico ajustando um motor repulsor. Dados: `data/skills.json#repulsorlift-repair`. | Mecânico ajustando um motor repulsor. | P3 | `skill-attr.technical` |
| `skill.rocket-pack-operation` | Cena simbólica: figura subindo com mochila foguete deixando fumaça. Dados: `data/skills.json#rocket-pack-operation`. | Figura subindo com mochila foguete deixando fumaça. | P3 | `skill-attr.mechanical` |
| `skill.running` | Cena simbólica: figura correndo por uma passarela. Dados: `data/skills.json#running`. | Figura correndo por uma passarela. | P3 | `skill-attr.dexterity` |
| `skill.scholar` | Cena simbólica: estudioso entre pilhas de cristais de dados antigos. Dados: `data/skills.json#scholar`. | Estudioso entre pilhas de cristais de dados antigos. | P3 | `skill-attr.knowledge` |
| `skill.search` | Cena simbólica: figura vasculhando caixas com uma lanterna. Dados: `data/skills.json#search`. | Figura vasculhando caixas com uma lanterna. | P3 | `skill-attr.perception` |
| `skill.security` | Cena simbólica: mãos abrindo uma fechadura eletrônica com uma sonda. Dados: `data/skills.json#security`. | Mãos abrindo uma fechadura eletrônica com uma sonda. | P3 | `skill-attr.technical` |
| `skill.sensors` | Cena simbólica: operador observando uma tela de radar com pontos de contato. Dados: `data/skills.json#sensors`. | Operador observando uma tela de radar com pontos de contato. | P3 | `skill-attr.mechanical` |
| `skill.sneak` | Cena simbólica: figura passando pelas sombras na ponta dos pés. Dados: `data/skills.json#sneak`. | Figura passando pelas sombras na ponta dos pés. | P3 | `skill-attr.perception` |
| `skill.space-transports` | Cena simbólica: piloto na cabine de um cargueiro leve com estrelas à frente. Dados: `data/skills.json#space-transports`. | Piloto na cabine de um cargueiro leve com estrelas à frente. | P3 | `skill-attr.mechanical` |
| `skill.space-transport-engineering-advanced` | Cena simbólica: projeto de um cargueiro na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#space-transport-engineering-advanced`. | Projeto de um cargueiro na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.space-transports-repair` | Cena simbólica: mecânico consertando o motor de um cargueiro na doca. Dados: `data/skills.json#space-transports-repair`. | Mecânico consertando o motor de um cargueiro na doca. | P3 | `skill-attr.technical` |
| `skill.stamina` | Cena simbólica: figura exausta continuando a marcha sob o sol. Dados: `data/skills.json#stamina`. | Figura exausta continuando a marcha sob o sol. | P3 | `skill-attr.strength` |
| `skill.starfighter-engineering-advanced` | Cena simbólica: projeto de um caça na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#starfighter-engineering-advanced`. | Projeto de um caça na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.starfighter-piloting` | Cena simbólica: piloto de caça em manobra com o horizonte inclinado. Dados: `data/skills.json#starfighter-piloting`. | Piloto de caça em manobra com o horizonte inclinado. | P3 | `skill-attr.mechanical` |
| `skill.starfighter-repair` | Cena simbólica: técnico sobre a asa de um caça com ferramentas. Dados: `data/skills.json#starfighter-repair`. | Técnico sobre a asa de um caça com ferramentas. | P3 | `skill-attr.technical` |
| `skill.starship-gunnery` | Cena simbólica: artilheiro numa torre de canhão de nave pequena mirando. Dados: `data/skills.json#starship-gunnery`. | Artilheiro numa torre de canhão de nave pequena mirando. | P3 | `skill-attr.mechanical` |
| `skill.starship-shields` | Cena simbólica: operador desviando energia para os escudos num painel. Dados: `data/skills.json#starship-shields`. | Operador desviando energia para os escudos num painel. | P3 | `skill-attr.mechanical` |
| `skill.starship-weapon-repair` | Cena simbólica: técnico consertando um canhão laser de nave. Dados: `data/skills.json#starship-weapon-repair`. | Técnico consertando um canhão laser de nave. | P3 | `skill-attr.technical` |
| `skill.streetwise` | Cena simbólica: figura de capuz conversando num beco iluminado por neon. Dados: `data/skills.json#streetwise`. | Figura de capuz conversando num beco iluminado por neon. | P3 | `skill-attr.knowledge` |
| `skill.submersible-vehicle-engineering-advanced` | Cena simbólica: projeto de um submarino na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#submersible-vehicle-engineering-advanced`. | Projeto de um submarino na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.submersible-vehicle-operation` | Cena simbólica: piloto de submarino entre recifes escuros. Dados: `data/skills.json#submersible-vehicle-operation`. | Piloto de submarino entre recifes escuros. | P3 | `skill-attr.mechanical` |
| `skill.submersible-vehicle-repair` | Cena simbólica: técnico selando uma escotilha de submarino. Dados: `data/skills.json#submersible-vehicle-repair`. | Técnico selando uma escotilha de submarino. | P3 | `skill-attr.technical` |
| `skill.survival` | Cena simbólica: acampamento improvisado numa paisagem selvagem com fogueira. Dados: `data/skills.json#survival`. | Acampamento improvisado numa paisagem selvagem com fogueira. | P3 | `skill-attr.knowledge` |
| `skill.swimming` | Cena simbólica: figura nadando contra a correnteza. Dados: `data/skills.json#swimming`. | Figura nadando contra a correnteza. | P3 | `skill-attr.strength` |
| `skill.swoop-operation` | Cena simbólica: piloto de swoop rente ao chão em alta velocidade. Dados: `data/skills.json#swoop-operation`. | Piloto de swoop rente ao chão em alta velocidade. | P3 | `skill-attr.mechanical` |
| `skill.tactics` | Cena simbólica: peças de estratégia sobre um mapa holográfico de batalha. Dados: `data/skills.json#tactics`. | Peças de estratégia sobre um mapa holográfico de batalha. | P3 | `skill-attr.knowledge` |
| `skill.thrown-weapons` | Cena simbólica: faca de arremesso girando no ar rumo a um alvo. Dados: `data/skills.json#thrown-weapons`. | Faca de arremesso girando no ar rumo a um alvo. | P3 | `skill-attr.dexterity` |
| `skill.value` | Cena simbólica: joia sendo avaliada com uma lente sob uma luz. Dados: `data/skills.json#value`. | Joia sendo avaliada com uma lente sob uma luz. | P3 | `skill-attr.knowledge` |
| `skill.vehicle-blasters` | Cena simbólica: artilheiro disparando o canhão de um veículo. Dados: `data/skills.json#vehicle-blasters`. | Artilheiro disparando o canhão de um veículo. | P3 | `skill-attr.dexterity` |
| `skill.walker-engineering-advanced` | Cena simbólica: projeto de um andador na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#walker-engineering-advanced`. | Projeto de um andador na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.walker-operation` | Cena simbólica: piloto nos controles de um andador com vista elevada. Dados: `data/skills.json#walker-operation`. | Piloto nos controles de um andador com vista elevada. | P3 | `skill-attr.mechanical` |
| `skill.walker-repair` | Cena simbólica: mecânico consertando a junta da perna de um andador. Dados: `data/skills.json#walker-repair`. | Mecânico consertando a junta da perna de um andador. | P3 | `skill-attr.technical` |
| `skill.weapon-engineering-advanced` | Cena simbólica: projeto de uma arma de energia na prancheta holográfica. Perícia avançada: um selo discreto com a letra A no canto. Dados: `data/skills.json#weapon-engineering-advanced`. | Projeto de uma arma de energia na prancheta holográfica. | P3 | `skill-attr.technical` |
| `skill.willpower` | Cena simbólica: figura firme diante de uma tempestade, de olhos fechados. Dados: `data/skills.json#willpower`. | Figura firme diante de uma tempestade, de olhos fechados. | P3 | `skill-attr.knowledge` |

## Poderes da Força: reservas por perícia da Força

Comum a todos: aparece em /consulta (reserva quando o item não tem imagem) (`EntityDetail.header, EntityList.thumbnail (reserva)`); proporção 1:1; tamanho all: 800x800 (1:1); miniatura 160x160 na lista; estilo `scene-spot`; placeholder `power`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio |
|---|---|---|---|
| `power-skill.control` | Figura meditando de pernas cruzadas envolta num halo branco-azulado calmo. | Figura meditando envolta em luz calma. | P3 |
| `power-skill.sense` | Ondas violeta saindo de uma figura de olhos fechados e tocando formas de vida ao redor. | Ondas violeta tocando seres ao redor. | P3 |
| `power-skill.alter` | Mão estendida fazendo pedras flutuarem com energia ciano em movimento. | Mão estendida fazendo pedras flutuarem. | P3 |
| `power-skill.control-sense` | Figura meditando com um halo calmo e ondas violeta se espalhando. | Figura meditando com halo e ondas violeta. | P3 |
| `power-skill.control-alter` | Figura concentrada com halo calmo enquanto energia ciano se move a partir das mãos. | Figura com halo calmo movendo energia. | P3 |
| `power-skill.sense-alter` | Ondas violeta e energia ciano formando uma cúpula ao redor de uma figura. | Cúpula de energia ao redor de uma figura. | P3 |
| `power-skill.control-sense-alter` | Três círculos de luz (branco, violeta e ciano) entrelaçados em torno de uma figura serena. | Três círculos de luz em torno de uma figura. | P3 |
| `power-skill.none` | Figura soltando um grito que ondula o ar ao redor em tom escuro. | Grito ondulando o ar ao redor. | P3 |

## Poderes da Força (77)

Comum a todos: aparece em /consulta/poderes, /consulta/poderes/:id, ficha (poderes), assistente (Força) (`EntityDetail.header, EntityList.thumbnail`); proporção 1:1; tamanho all: 800x800 (1:1); miniatura 160x160 na lista; estilo `scene-spot`; placeholder `power`; ponto focal: centro.

| id | Descrição (prompt) | Texto alternativo | Prio | Reserva |
|---|---|---|---|---|
| `power.absorb-dissipate-energy` | Cena simbólica: mão aberta absorvendo um raio de energia que se dissolve em faíscas. Tom sereno. Dados: `data/force-powers.json#absorb-dissipate-energy`. | Mão aberta absorvendo um raio de energia que se dissolve em faíscas. | P3 | `power-skill.control` |
| `power.accelerate-healing` | Cena simbólica: ferida se fechando sob um brilho suave numa figura em repouso. Tom sereno. Dados: `data/force-powers.json#accelerate-healing`. | Ferida se fechando sob um brilho suave numa figura em repouso. | P3 | `power-skill.control` |
| `power.burst-of-speed` | Cena simbólica: figura correndo com rastros de luz atrás de si. Tom sereno. Dados: `data/force-powers.json#burst-of-speed`. | Figura correndo com rastros de luz atrás de si. | P3 | `power-skill.control` |
| `power.concentration` | Cena simbólica: figura de olhos fechados com tudo ao redor desfocado. Tom sereno. Dados: `data/force-powers.json#concentration`. | Figura de olhos fechados com tudo ao redor desfocado. | P3 | `power-skill.control` |
| `power.contort-escape` | Cena simbólica: figura se soltando de algemas ao contorcer as mãos. Tom sereno. Dados: `data/force-powers.json#contort-escape`. | Figura se soltando de algemas ao contorcer as mãos. | P3 | `power-skill.control` |
| `power.control-disease` | Cena simbólica: figura febril envolta num brilho que afasta a doença. Tom sereno. Dados: `data/force-powers.json#control-disease`. | Figura febril envolta num brilho que afasta a doença. | P3 | `power-skill.control` |
| `power.control-pain` | Cena simbólica: figura ferida de pé com expressão serena. Tom sereno. Dados: `data/force-powers.json#control-pain`. | Figura ferida de pé com expressão serena. | P3 | `power-skill.control` |
| `power.detoxify-poison` | Cena simbólica: gotas escuras saindo de uma mão e se dissolvendo em luz. Tom sereno. Dados: `data/force-powers.json#detoxify-poison`. | Gotas escuras saindo de uma mão e se dissolvendo em luz. | P3 | `power-skill.control` |
| `power.emptiness` | Cena simbólica: figura imóvel em meditação profunda num vazio escuro. Tom sereno. Dados: `data/force-powers.json#emptiness`. | Figura imóvel em meditação profunda num vazio escuro. | P3 | `power-skill.control` |
| `power.enhance-attribute` | Cena simbólica: músculos de um braço iluminados por veios de luz. Tom sereno. Dados: `data/force-powers.json#enhance-attribute`. | Músculos de um braço iluminados por veios de luz. | P3 | `power-skill.control` |
| `power.force-of-will` | Cena simbólica: figura firme diante de uma onda de sombra. Tom sereno. Dados: `data/force-powers.json#force-of-will`. | Figura firme diante de uma onda de sombra. | P3 | `power-skill.control` |
| `power.hibernation-trance` | Cena simbólica: figura deitada em transe com a respiração visível como névoa lenta. Tom sereno. Dados: `data/force-powers.json#hibernation-trance`. | Figura deitada em transe com a respiração visível como névoa lenta. | P3 | `power-skill.control` |
| `power.instinctive-astrogation-control` | Cena simbólica: piloto de olhos fechados com rotas estelares brilhando à frente. Tom sereno. Dados: `data/force-powers.json#instinctive-astrogation-control`. | Piloto de olhos fechados com rotas estelares brilhando à frente. | P3 | `power-skill.control` |
| `power.rage` | Cena simbólica: figura tomada por uma aura vermelha furiosa. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#rage`. | Figura tomada por uma aura vermelha furiosa. | P3 | `power-skill.control` |
| `power.reduce-injury` | Cena simbólica: golpe atingindo uma figura e se dissipando em luz. Tom sereno. Dados: `data/force-powers.json#reduce-injury`. | Golpe atingindo uma figura e se dissipando em luz. | P3 | `power-skill.control` |
| `power.remain-conscious` | Cena simbólica: figura caída lutando para ficar de olhos abertos. Tom sereno. Dados: `data/force-powers.json#remain-conscious`. | Figura caída lutando para ficar de olhos abertos. | P3 | `power-skill.control` |
| `power.remove-fatigue` | Cena simbólica: andarilho cansado recuperando a postura sob um brilho. Tom sereno. Dados: `data/force-powers.json#remove-fatigue`. | Andarilho cansado recuperando a postura sob um brilho. | P3 | `power-skill.control` |
| `power.resist-stun` | Cena simbólica: faíscas azuis de atordoamento escorrendo pelo corpo sem efeito. Tom sereno. Dados: `data/force-powers.json#resist-stun`. | Faíscas azuis de atordoamento escorrendo pelo corpo sem efeito. | P3 | `power-skill.control` |
| `power.short-term-memory-enhancement` | Cena simbólica: imagens de memória flutuando ao redor da cabeça. Tom sereno. Dados: `data/force-powers.json#short-term-memory-enhancement`. | Imagens de memória flutuando ao redor da cabeça. | P3 | `power-skill.control` |
| `power.up-the-walls` | Cena simbólica: figura correndo pela parede de um corredor. Tom sereno. Dados: `data/force-powers.json#up-the-walls`. | Figura correndo pela parede de um corredor. | P3 | `power-skill.control` |
| `power.beast-languages` | Cena simbólica: figura de mãos estendidas conversando com uma criatura selvagem. Tom sereno. Dados: `data/force-powers.json#beast-languages`. | Figura de mãos estendidas conversando com uma criatura selvagem. | P3 | `power-skill.sense` |
| `power.combat-sense` | Cena simbólica: figura cercada de oponentes com linhas de ataque previstas em luz. Tom sereno. Dados: `data/force-powers.json#combat-sense`. | Figura cercada de oponentes com linhas de ataque previstas em luz. | P3 | `power-skill.sense` |
| `power.danger-sense` | Cena simbólica: silhueta virando a cabeça a tempo de ver uma sombra atrás. Tom sereno. Dados: `data/force-powers.json#danger-sense`. | Silhueta virando a cabeça a tempo de ver uma sombra atrás. | P3 | `power-skill.sense` |
| `power.direction-sense` | Cena simbólica: figura numa floresta com uma linha de luz apontando o caminho. Tom sereno. Dados: `data/force-powers.json#direction-sense`. | Figura numa floresta com uma linha de luz apontando o caminho. | P3 | `power-skill.sense` |
| `power.instinctive-astrogation` | Cena simbólica: navegador sentindo uma rota estelar como um fio luminoso. Tom sereno. Dados: `data/force-powers.json#instinctive-astrogation`. | Navegador sentindo uma rota estelar como um fio luminoso. | P3 | `power-skill.sense` |
| `power.life-detection` | Cena simbólica: pontos de luz vivos aparecendo atrás de uma parede. Tom sereno. Dados: `data/force-powers.json#life-detection`. | Pontos de luz vivos aparecendo atrás de uma parede. | P3 | `power-skill.sense` |
| `power.life-sense` | Cena simbólica: figura seguindo um fio de luz até uma pessoa distante. Tom sereno. Dados: `data/force-powers.json#life-sense`. | Figura seguindo um fio de luz até uma pessoa distante. | P3 | `power-skill.sense` |
| `power.life-web` | Cena simbólica: teia de fios luminosos ligando muitos seres vivos. Tom sereno. Dados: `data/force-powers.json#life-web`. | Teia de fios luminosos ligando muitos seres vivos. | P3 | `power-skill.sense` |
| `power.magnify-senses` | Cena simbólica: olho e ouvido ampliados com ondas de som e luz. Tom sereno. Dados: `data/force-powers.json#magnify-senses`. | Olho e ouvido ampliados com ondas de som e luz. | P3 | `power-skill.sense` |
| `power.merge-senses` | Cena simbólica: figura vendo pelos olhos de um pássaro em voo. Tom sereno. Dados: `data/force-powers.json#merge-senses`. | Figura vendo pelos olhos de um pássaro em voo. | P3 | `power-skill.sense` |
| `power.postcognition` | Cena simbólica: figura tocando um objeto e vendo uma cena do passado em sépia. Tom sereno. Dados: `data/force-powers.json#postcognition`. | Figura tocando um objeto e vendo uma cena do passado em sépia. | P3 | `power-skill.sense` |
| `power.predict-natural-disaster` | Cena simbólica: figura olhando um vulcão adormecido com rachaduras de luz. Tom sereno. Dados: `data/force-powers.json#predict-natural-disaster`. | Figura olhando um vulcão adormecido com rachaduras de luz. | P3 | `power-skill.sense` |
| `power.receptive-telepathy` | Cena simbólica: ondas de pensamento chegando até uma figura de olhos fechados. Tom sereno. Dados: `data/force-powers.json#receptive-telepathy`. | Ondas de pensamento chegando até uma figura de olhos fechados. | P3 | `power-skill.sense` |
| `power.sense-force` | Cena simbólica: lugar antigo pulsando com uma aura ao redor. Tom sereno. Dados: `data/force-powers.json#sense-force`. | Lugar antigo pulsando com uma aura ao redor. | P3 | `power-skill.sense` |
| `power.sense-force-potential` | Cena simbólica: criança com um brilho discreto vista por uma figura atenta. Tom sereno. Dados: `data/force-powers.json#sense-force-potential`. | Criança com um brilho discreto vista por uma figura atenta. | P3 | `power-skill.sense` |
| `power.sense-path` | Cena simbólica: figura diante de dois caminhos, um iluminado e outro sombrio. Tom sereno. Dados: `data/force-powers.json#sense-path`. | Figura diante de dois caminhos, um iluminado e outro sombrio. | P3 | `power-skill.sense` |
| `power.shift-sense` | Cena simbólica: olho vendo em faixas de calor e frequência. Tom sereno. Dados: `data/force-powers.json#shift-sense`. | Olho vendo em faixas de calor e frequência. | P3 | `power-skill.sense` |
| `power.translation` | Cena simbólica: glifos desconhecidos se reorganizando em sentido diante de uma figura. Tom sereno. Dados: `data/force-powers.json#translation`. | Glifos desconhecidos se reorganizando em sentido diante de uma figura. | P3 | `power-skill.sense` |
| `power.weather-sense` | Cena simbólica: figura sentindo o vento com nuvens de tempestade ao longe. Tom sereno. Dados: `data/force-powers.json#weather-sense`. | Figura sentindo o vento com nuvens de tempestade ao longe. | P3 | `power-skill.sense` |
| `power.force-push` | Cena simbólica: onda invisível derrubando caixas para trás. Tom sereno. Dados: `data/force-powers.json#force-push`. | Onda invisível derrubando caixas para trás. | P3 | `power-skill.alter` |
| `power.injure-kill` | Cena simbólica: mão erguida com energia escura apontada para uma sombra. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#injure-kill`. | Mão erguida com energia escura apontada para uma sombra. | P3 | `power-skill.alter` |
| `power.kinetic-combat` | Cena simbólica: armas flutuando e se movendo ao redor de uma figura em luta. Tom sereno. Dados: `data/force-powers.json#kinetic-combat`. | Armas flutuando e se movendo ao redor de uma figura em luta. | P3 | `power-skill.alter` |
| `power.telekinesis` | Cena simbólica: objeto pesado flutuando acima de uma mão estendida. Tom sereno. Dados: `data/force-powers.json#telekinesis`. | Objeto pesado flutuando acima de uma mão estendida. | P3 | `power-skill.alter` |
| `power.farseeing` | Cena simbólica: figura de olhos fechados vendo uma cena distante num círculo de luz. Tom sereno. Dados: `data/force-powers.json#farseeing`. | Figura de olhos fechados vendo uma cena distante num círculo de luz. | P3 | `power-skill.control-sense` |
| `power.life-bond` | Cena simbólica: duas figuras ligadas por um fio de luz constante. Tom sereno. Dados: `data/force-powers.json#life-bond`. | Duas figuras ligadas por um fio de luz constante. | P3 | `power-skill.control-sense` |
| `power.lifemerge` | Cena simbólica: figura se fundindo à luz de uma floresta viva. Tom sereno. Dados: `data/force-powers.json#lifemerge`. | Figura se fundindo à luz de uma floresta viva. | P3 | `power-skill.control-sense` |
| `power.lightsaber-combat` | Cena simbólica: lâmina de energia antecipando e bloqueando vários raios. Tom sereno. Dados: `data/force-powers.json#lightsaber-combat`. | Lâmina de energia antecipando e bloqueando vários raios. | P3 | `power-skill.control-sense` |
| `power.projective-telepathy` | Cena simbólica: pensamento sendo enviado como uma onda até outra mente. Tom sereno. Dados: `data/force-powers.json#projective-telepathy`. | Pensamento sendo enviado como uma onda até outra mente. | P3 | `power-skill.control-sense` |
| `power.accelerate-another-s-healing` | Cena simbólica: mãos sobre um ferido emitindo um brilho curativo. Tom sereno. Dados: `data/force-powers.json#accelerate-another-s-healing`. | Mãos sobre um ferido emitindo um brilho curativo. | P3 | `power-skill.control-alter` |
| `power.control-another-s-disease` | Cena simbólica: mão sobre a testa de um doente afastando a febre. Tom sereno. Dados: `data/force-powers.json#control-another-s-disease`. | Mão sobre a testa de um doente afastando a febre. | P3 | `power-skill.control-alter` |
| `power.control-another-s-pain` | Cena simbólica: mão no ombro de um ferido aliviando sua dor. Tom sereno. Dados: `data/force-powers.json#control-another-s-pain`. | Mão no ombro de um ferido aliviando sua dor. | P3 | `power-skill.control-alter` |
| `power.control-breathing` | Cena simbólica: figura respirando debaixo d'água com uma bolha de calma. Tom sereno. Dados: `data/force-powers.json#control-breathing`. | Figura respirando debaixo d'água com uma bolha de calma. | P3 | `power-skill.control-alter` |
| `power.detoxify-another-s-poison` | Cena simbólica: veneno escuro sendo puxado do braço de outra pessoa. Tom sereno. Dados: `data/force-powers.json#detoxify-another-s-poison`. | Veneno escuro sendo puxado do braço de outra pessoa. | P3 | `power-skill.control-alter` |
| `power.feed-on-dark-side` | Cena simbólica: figura absorvendo uma névoa vermelha que sai de outros. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#feed-on-dark-side`. | Figura absorvendo uma névoa vermelha que sai de outros. | P3 | `power-skill.control-alter` |
| `power.force-jump` | Cena simbólica: figura saltando muito alto sobre um abismo. Tom sereno. Dados: `data/force-powers.json#force-jump`. | Figura saltando muito alto sobre um abismo. | P3 | `power-skill.control-alter` |
| `power.force-lightning` | Cena simbólica: raios arroxeados saindo dos dedos de uma figura encapuzada sombria. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#force-lightning`. | Raios arroxeados saindo dos dedos de uma figura encapuzada sombria. | P3 | `power-skill.control-alter` |
| `power.inflict-pain` | Cena simbólica: mão fechando-se enquanto uma aura vermelha cerca a vítima distante. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#inflict-pain`. | Mão fechando-se enquanto uma aura vermelha cerca a vítima distante. | P3 | `power-skill.control-alter` |
| `power.place-another-in-hibernation-trance` | Cena simbólica: mão sobre um ferido que adormece em transe. Tom sereno. Dados: `data/force-powers.json#place-another-in-hibernation-trance`. | Mão sobre um ferido que adormece em transe. | P3 | `power-skill.control-alter` |
| `power.redirect-energy` | Cena simbólica: raio de energia sendo desviado por uma mão de volta ao atirador. Tom sereno. Dados: `data/force-powers.json#redirect-energy`. | Raio de energia sendo desviado por uma mão de volta ao atirador. | P3 | `power-skill.control-alter` |
| `power.remove-another-s-fatigue` | Cena simbólica: mão revigorando um companheiro cansado. Tom sereno. Dados: `data/force-powers.json#remove-another-s-fatigue`. | Mão revigorando um companheiro cansado. | P3 | `power-skill.control-alter` |
| `power.return-another-to-consciousness` | Cena simbólica: figura desmaiada abrindo os olhos sob um toque de luz. Tom sereno. Dados: `data/force-powers.json#return-another-to-consciousness`. | Figura desmaiada abrindo os olhos sob um toque de luz. | P3 | `power-skill.control-alter` |
| `power.transfer-force` | Cena simbólica: luz passando de uma figura para outra caída. Tom sereno. Dados: `data/force-powers.json#transfer-force`. | Luz passando de uma figura para outra caída. | P3 | `power-skill.control-alter` |
| `power.dim-another-s-senses` | Cena simbólica: guarda com a visão embaçada enquanto uma figura passa. Tom sereno. Dados: `data/force-powers.json#dim-another-s-senses`. | Guarda com a visão embaçada enquanto uma figura passa. | P3 | `power-skill.sense-alter` |
| `power.greater-force-shield` | Cena simbólica: grande cúpula de energia protegendo um grupo. Tom sereno. Dados: `data/force-powers.json#greater-force-shield`. | Grande cúpula de energia protegendo um grupo. | P3 | `power-skill.sense-alter` |
| `power.lesser-force-shield` | Cena simbólica: pequena cúpula de energia ao redor de uma figura. Tom sereno. Dados: `data/force-powers.json#lesser-force-shield`. | Pequena cúpula de energia ao redor de uma figura. | P3 | `power-skill.sense-alter` |
| `power.affect-mind` | Cena simbólica: guarda confuso olhando para o lado errado. Tom sereno. Dados: `data/force-powers.json#affect-mind`. | Guarda confuso olhando para o lado errado. | P3 | `power-skill.control-sense-alter` |
| `power.battle-meditation` | Cena simbólica: figura em meditação com aliados brilhando num campo de batalha ao fundo. Tom sereno. Dados: `data/force-powers.json#battle-meditation`. | Figura em meditação com aliados brilhando num campo de batalha ao fundo. | P3 | `power-skill.control-sense-alter` |
| `power.control-mind` | Cena simbólica: figura sombria guiando outra como marionete com fios de luz. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#control-mind`. | Figura sombria guiando outra como marionete com fios de luz. | P3 | `power-skill.control-sense-alter` |
| `power.create-force-storms` | Cena simbólica: tempestade de energia rodopiando no espaço. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#create-force-storms`. | Tempestade de energia rodopiando no espaço. | P3 | `power-skill.control-sense-alter` |
| `power.doppleganger` | Cena simbólica: figura e uma cópia luminosa idêntica lado a lado. Tom sereno. Dados: `data/force-powers.json#doppleganger`. | Figura e uma cópia luminosa idêntica lado a lado. | P3 | `power-skill.control-sense-alter` |
| `power.drain-life-essence` | Cena simbólica: plantas murchando ao redor de uma figura sombria. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#drain-life-essence`. | Plantas murchando ao redor de uma figura sombria. | P3 | `power-skill.control-sense-alter` |
| `power.enhanced-coordination` | Cena simbólica: esquadrão movendo-se em sincronia perfeita, ligado por fios de luz. Tom sereno. Dados: `data/force-powers.json#enhanced-coordination`. | Esquadrão movendo-se em sincronia perfeita, ligado por fios de luz. | P3 | `power-skill.control-sense-alter` |
| `power.force-harmony` | Cena simbólica: círculo de figuras de mãos dadas com uma luz compartilhada. Tom sereno. Dados: `data/force-powers.json#force-harmony`. | Círculo de figuras de mãos dadas com uma luz compartilhada. | P3 | `power-skill.control-sense-alter` |
| `power.projected-fighting` | Cena simbólica: golpe à distância atingindo um oponente sem contato. Tom sereno. Dados: `data/force-powers.json#projected-fighting`. | Golpe à distância atingindo um oponente sem contato. | P3 | `power-skill.control-sense-alter` |
| `power.telekinetic-kill` | Cena simbólica: mão erguida e uma sombra vermelha apertando o ar. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#telekinetic-kill`. | Mão erguida e uma sombra vermelha apertando o ar. | P3 | `power-skill.control-sense-alter` |
| `power.transfer-life` | Cena simbólica: essência luminosa passando de um corpo para outro. Tom sereno. Dados: `data/force-powers.json#transfer-life`. | Essência luminosa passando de um corpo para outro. | P3 | `power-skill.control-sense-alter` |
| `power.force-scream` | Cena simbólica: figura gritando com ondas escuras se espalhando. Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio). Dados: `data/force-powers.json#force-scream`. | Figura gritando com ondas escuras se espalhando. | P3 | `power-skill.none` |

