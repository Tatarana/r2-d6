# Usage: python tools/gen_image_briefs.py
# Gera docs/image-manifest.json e docs/image-briefs.md a partir de uma fonte unica.
import json, os, sys, io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OUT_JSON = os.path.join(ROOT, "docs", "image-manifest.json")
OUT_MD = os.path.join(ROOT, "docs", "image-briefs.md")

STYLES = {
    "holo-cinematic": "Pintura digital cinematográfica, alto contraste, céu ou espaço profundo quase preto, luz-chave ciano (#4FD1FF) e contraluz âmbar (#FFB020), leve grão de filme, profundidade atmosférica. Deixar área calma para texto conforme o ponto focal indicado.",
    "portrait-card": "Retrato de busto em 3/4, pintura digital semi-realista, fundo escuro com bruma azul e um anel holográfico ciano atrás da cabeça; iluminação de painel (ciano por baixo, âmbar de recorte). Personagem olhando levemente para fora do quadro. Sem texto na imagem.",
    "blueprint": "Ilustração técnica estilo holograma/planta: traço ciano luminoso sobre azul-noite, linhas de cota, grade fina e ruído de scanline; um objeto central em perspectiva 3/4. Sem texto legível (rótulos apenas como glifos abstratos).",
    "ambient-bg": "Fundo ambiente de baixo contraste para ficar atrás de interface: escuro (luminância média abaixo de 12%), detalhes suaves, sem pontos de alto brilho no centro, cantos ligeiramente vinhetados. Deve funcionar em loop/cortes de proporção diferentes.",
    "spot-illustration": "Ilustração pontual centrada, fundo transparente, silhueta clara e simples, traço holográfico ciano com um único detalhe âmbar; tom leve e com humor discreto. Legível em 160 px.",
    "icon-glyph": "Ícone vetorial monolinha (SVG) em grade de 24 px, traço 1,75 px, cantos arredondados, cor herdada (currentColor). Original, geométrico, sem referência a símbolos registrados.",
    "material": "Textura de material para o dado 3D (mapa de cor 1:1 sem costura), com variante de mapa de emissão para os pips.",
}

PLACEHOLDERS = {
    "default": {"gradient": "linear-gradient(135deg, #0B1A2B 0%, #12324A 55%, #070B12 100%)", "icon": "image", "accent": "#4FD1FF"},
    "hero": {"gradient": "radial-gradient(120% 90% at 70% 20%, #12324A 0%, #0A1422 45%, #05070C 100%)", "icon": "sparkles", "accent": "#4FD1FF"},
    "portrait": {"gradient": "radial-gradient(80% 70% at 50% 35%, #1A2C44 0%, #0C1524 60%, #06090F 100%)", "icon": "user-round", "accent": "#4FD1FF"},
    "template": {"gradient": "radial-gradient(80% 70% at 50% 35%, #2A2412 0%, #141109 60%, #07070A 100%)", "icon": "id-card", "accent": "#FFB020"},
    "blueprint": {"gradient": "linear-gradient(160deg, #0A2238 0%, #0B1B2E 50%, #060C16 100%)", "icon": "scan-line", "accent": "#4FD1FF"},
    "campaign": {"gradient": "radial-gradient(100% 80% at 30% 30%, #251A3D 0%, #120E22 55%, #06060C 100%)", "icon": "orbit", "accent": "#B48CFF"},
    "state": {"gradient": "none (transparente sobre --surface)", "icon": "circle-dashed", "accent": "#7C8AA5"},
    "error": {"gradient": "radial-gradient(90% 70% at 50% 40%, #3A1218 0%, #1A0A0E 60%, #07070A 100%)", "icon": "triangle-alert", "accent": "#FF4D5E"},
    "icon": {"gradient": "none", "icon": "square-dashed", "accent": "currentColor"},
}

HERO_SIZES = {"mobile": "1080x1920 (9:16)", "tablet": "2048x1536 (4:3)", "desktop": "2560x1440 (16:9)"}
BG_SIZES = {"mobile": "1170x2532 (9:19,5)", "tablet": "2048x1536 (4:3)", "desktop": "2560x1440 (16:9)"}
CARD_SIZES = {"all": "1200x1600 (3:4), recorte quadrado 1:1 para miniatura pelo ponto focal"}
BANNER_SIZES = {"all": "1600x900 (16:9); no celular recorte 3:2 pelo ponto focal"}
SPOT_SIZES = {"all": "800x800 (1:1), PNG/WebP com transparência"}
ICON_SIZES = {"all": "SVG 24x24 (viewBox 0 0 24 24)"}

items = []
def add(id, group, screen, component, aspect, sizes, style, placeholder, desc, alt, priority="P1", focal="centro", data_ref=None):
    items.append({
        "id": id, "group": group, "screen": screen, "component": component,
        "aspect": aspect, "sizes": sizes, "style": style, "placeholder": placeholder,
        "focal_point": focal, "priority": priority, "description": desc, "alt": alt,
        "data_ref": data_ref, "file": None, "status": "missing",
    })

# ---- Autenticacao
add("hero.login", "auth", "/entrar", "AuthLayout.hero", "16:9 / 4:3 / 9:16", HERO_SIZES, "holo-cinematic", "hero",
    "Um cargueiro gasto pousado numa plataforma de atracação ao entardecer de um planeta árido de rochas vermelhas, sob um sol grande e baixo; a rampa está aberta e uma luz quente sai do interior. Atmosfera de partida para a aventura, sem personagens reconhecíveis.",
    "Cargueiro com a rampa aberta numa plataforma ao entardecer, pronto para partir.", focal="direita (texto à esquerda no PC; topo livre no celular)")
add("hero.signup", "auth", "/cadastro", "AuthLayout.hero", "16:9 / 4:3 / 9:16", HERO_SIZES, "holo-cinematic", "hero",
    "Vista de dentro de uma cabine de nave no instante do salto ao hiperespaço: as estrelas se esticam em linhas de luz azul e branca através da janela, painéis com luzes âmbar em primeiro plano. Sensação de começo de jornada.",
    "Janela de cabine com as estrelas se esticando em linhas de luz no salto ao hiperespaço.", focal="centro-direita")
add("bg.auth", "auth", "/entrar, /cadastro, /recuperar", "AuthLayout.background", "variável", BG_SIZES, "ambient-bg", "hero",
    "Campo de estrelas profundo com uma nebulosa azul-violeta muito discreta e poeira cósmica; pode receber paralaxe lenta em camadas (estrelas próximas, distantes, nebulosa).",
    "", focal="centro", priority="P2")

# ---- Hangar
add("hero.hangar", "hangar", "/hangar", "HangarHeader.hero", "21:9 (PC) / 16:9 / 3:2", {"mobile": "1080x720 (3:2)", "tablet": "2048x1152 (16:9)", "desktop": "2560x1100 (21:9)"}, "holo-cinematic", "hero",
    "Interior de um hangar de base escondida à noite: baias numeradas com luz ciano no chão, um cargueiro e dois caças de design original em manutenção, técnicos pequenos ao fundo. Atmosfera de base de operações acolhedora.",
    "Hangar noturno com naves em manutenção e baias iluminadas.", focal="centro-baixo; topo livre para saudação")
add("bg.hangar", "hangar", "/hangar", "HangarLayout.background", "variável", BG_SIZES, "ambient-bg", "hero",
    "Piso metálico do hangar visto de cima em perspectiva, com marcações de baia e reflexos de luzes de pista, muito escuro e desfocado nas bordas.",
    "", priority="P2")
add("hangar.bay.empty", "hangar", "/hangar", "CharacterBay (vazia)", "3:4", CARD_SIZES, "blueprint", "blueprint",
    "Baia de atracação vazia vista de frente, com contorno holográfico tracejado de uma silhueta humanoide indefinida e um sinal de mais luminoso no centro, convidando a criar um personagem.",
    "Baia vazia com silhueta holográfica, convite para criar personagem.")

# ---- Criacao
add("hero.create", "creation", "/criar", "CreationIntro.hero", "16:9 / 4:3 / 9:16", HERO_SIZES, "holo-cinematic", "hero",
    "Mesa de projeção holográfica numa sala escura; acima dela gira um holograma de figura humanoide em construção, feito de linhas ciano, com seis anéis de dados orbitando ao redor.",
    "Holograma de um personagem sendo montado sobre uma mesa de projeção.", focal="centro")
add("create.path.template", "creation", "/criar", "PathCard: template", "3:2", {"all": "1200x800 (3:2)"}, "holo-cinematic", "template",
    "Leque de cartões holográficos de identidade abertos sobre uma mesa, cada um com uma silhueta diferente (pilota, caçador, erudito), luz âmbar.",
    "Cartões holográficos de identidade em leque, cada um com uma silhueta.")
add("create.path.scratch", "creation", "/criar", "PathCard: do zero", "3:2", {"all": "1200x800 (3:2)"}, "blueprint", "blueprint",
    "Planta técnica de uma figura humanoide com medidas e seis marcadores de atributo vazios ao redor, como um projeto a preencher.",
    "Planta de uma figura humanoide com marcadores de atributo vazios.")

# ---- Templates (26)
TEMPLATES = [
 ("alien-student-of-the-force", "Ser alienígena de espécie antiga e serena, em vestes simples de meditação, sentado de pernas cruzadas; um pequeno amuleto flutua diante dele envolto em brilho suave.", "Alienígena em meditação com amuleto flutuante."),
 ("armchair-historian", "Ex-burocrata de meia-idade com óculos e uniforme rebelde um pouco largo, abraçando um datapad cheio de anotações; ao fundo, prateleiras de cristais de dados.", "Historiador de óculos e uniforme rebelde com um datapad."),
 ("arrogant-noble", "Nobre jovem de queixo erguido, roupas finas da última moda e capa bordada, segurando com desdém uma pequena pistola ornamentada.", "Nobre altivo com roupas luxuosas e pistola ornamentada."),
 ("bounty-hunter", "Caçador de recompensas jovem com armadura de placas desencontradas e capacete sob o braço, várias armas no cinto, olhar frio de quem segue um código próprio.", "Caçador de recompensas com armadura improvisada e várias armas."),
 ("brash-pilot", "Piloto jovem e confiante, macacão laranja-escuro de voo e capacete de design original no ombro, sorriso de quem acha que é o melhor da galáxia; caças ao fundo.", "Piloto jovem e confiante com capacete no ombro."),
 ("ewok", "Pequeno ser peludo de capuz de couro, segurando uma lança e uma bolsa cheia de objetos brilhantes, curioso diante de uma luz de painel de nave.", "Pequeno ser peludo de capuz, curioso, com lança e objetos brilhantes."),
 ("failed-jedi", "Homem envelhecido de barba por fazer, manto surrado e garrafa na mão, um cabo de sabre de luz esquecido no cinto; sombras pesadas e um leve brilho avermelhado atrás dele.", "Ex-aprendiz Jedi decadente com manto surrado e sabre no cinto."),
 ("gambler", "Apostador elegante numa mesa de cartas de salão espacial, roupas caras, cartas holográficas em leque na mão e um sorriso de quem tem um trunfo.", "Apostador elegante com cartas em leque numa mesa de jogo."),
 ("kid", "Criança de uns doze anos com mochila, estilingue no bolso e olhar determinado, espiando de trás de caixas de carga num porto espacial.", "Criança aventureira espiando de trás de caixas de carga."),
 ("laconic-scout", "Batedora de poucas palavras com poncho, binóculos eletrônicos e mochila, de pé num rochedo diante de um planeta selvagem e vazio ao amanhecer.", "Batedora com poncho e binóculos diante de um planeta selvagem."),
 ("loyal-retainer", "Servidor fiel de casa real, roupas formais impecáveis com um detalhe de brasão original, postura protetora, mão perto de uma pistola discreta.", "Servidor formal de casa real em postura protetora."),
 ("merc", "Mercenário veterano com uniforme da companhia de cor neutra, rifle blaster de design original, cicatriz no rosto e insígnia de unidade inventada.", "Mercenário veterano de uniforme com rifle."),
 ("minor-jedi", "Jovem de túnica simples e olhar cansado, segurando um sabre de luz desligado com reverência; luz azul fria vinda de baixo.", "Jovem de túnica com sabre de luz desligado nas mãos."),
 ("mon-calamari", "Oficial de espécie aquática com cabeça arredondada e olhos grandes laterais, uniforme de frota, diante de janelas de uma ponte de comando de linhas orgânicas.", "Oficial aquático de uniforme numa ponte de comando orgânica."),
 ("old-senatorial", "Senador idoso de cabelos brancos e roupas austeras, mãos apoiadas numa bengala, olhar firme de quem ainda luta pela velha república.", "Senador idoso de roupas austeras com bengala."),
 ("outlaw", "Fora da lei de chapéu de aba e casaco longo empoeirado, pistola pesada no coldre, de costas para um povoado em chamas ao longe.", "Fora da lei de casaco longo com povoado em chamas ao fundo."),
 ("pirate", "Pirata espacial extravagante com roupas coloridas, muitos anéis e um sabre curvo, rindo no convés de uma nave remendada.", "Pirata extravagante com anéis e sabre curvo."),
 ("protocol-droid", "Droide de protocolo humanoide de design original, acabamento metálico prateado-azulado e olhos luminosos, gesticulando com ar preocupado.", "Droide de protocolo de design original gesticulando, preocupado."),
 ("quixotic-jedi", "Aventureiro excêntrico com armadura improvisada de sucata, espada de duelo antiga erguida e capa feita de cortina, convencido de ser um cavaleiro.", "Aventureiro excêntrico com armadura de sucata e espada antiga erguida."),
 ("retired-captain", "Capitão aposentado de bigode grisalho, uniforme naval um pouco fora de moda, contemplando uma janela com estrelas; postura ainda militar.", "Capitão aposentado de uniforme antigo olhando as estrelas."),
 ("smuggler", "Contrabandista de colete e pistola pesada no quadril, encostado na rampa de um cargueiro surrado de design original, sorriso torto.", "Contrabandista encostado na rampa de um cargueiro surrado."),
 ("tongue-tied-engineer", "Engenheira tímida com roupas largas cheias de bolsos, computador de bolso na mão e ferramentas caindo, ao lado de um pequeno droide de manutenção de design original.", "Engenheira tímida com computador de bolso e droide de manutenção."),
 ("tough-native", "Nativo robusto de mundo isolado, roupas extravagantes de outra era, espada e pistola de pólvora, olhando com espanto para uma nave moderna.", "Nativo robusto com espada e pistola de pólvora olhando uma nave."),
 ("wookiee", "Alienígena alto coberto de pelagem castanha densa, bandoleira cruzada e besta de energia de design original, olhar leal e feroz.", "Alienígena alto e peludo com bandoleira e besta de energia."),
 ("young-jedi", "Jovem esperançoso de roupas simples de fazenda, mão estendida fazendo uma pedra pequena flutuar, um pequeno droide astromecânico de design original ao lado.", "Jovem fazendo uma pedra flutuar com um pequeno droide ao lado."),
 ("young-senatorial", "Jovem de família senatorial, roupas elegantes e penteado elaborado, segurando uma mensagem holográfica com expressão decidida.", "Jovem senatorial elegante segurando uma mensagem holográfica."),
]
for tid, d, a in TEMPLATES:
    add(f"template.{tid}", "template", "/criar (passo Template), /personagem/:id (cabeçalho), /consulta/templates", "TemplateCard, SheetHeader.backdrop", "3:4", CARD_SIZES, "portrait-card", "template",
        d, a, focal="rosto no terço superior", data_ref=f"data/templates.json#{tid}")

# ---- Especies (48 stat blocks)
SPECIES = [
 ("humans", "humans", "Viajante humana de meia-idade com jaqueta de piloto gasta e olhar atento, iluminada pela luz azul de um painel; diversidade de traços humanos.", "Viajante humana de jaqueta de piloto."),
 ("republic-clone", "republic-clone", "Soldado de rosto marcado e cabelo raspado, armadura branca de design próprio sem capacete; atrás dele, fileiras de rostos idênticos desfocados.", "Soldado clone sem capacete diante de fileiras de rostos iguais."),
 ("anzat", "anzat", "Humanoide de pele pálida e olhos enormes e escuros, com finas probóscides recolhidas nas bochechas; expressão calma e inquietante.", "Humanoide pálido de olhos enormes e expressão inquietante."),
 ("aqualish", "aqualish", "Humanoide de pele coriácea, olhos grandes e escuros e duas presas curvas saindo da boca, postura de brigão de cantina.", "Humanoide de presas curvas e olhos grandes, postura de brigão."),
 ("barabel", "barabel", "Réptil bípede de escamas grossas e escuras, dentes afiados e olhar de caçador, em roupa de couro de expedição.", "Réptil bípede de escamas escuras e dentes afiados."),
 ("bith", "bith", "Ser de cabeça alongada e calva, olhos grandes e negros sem pálpebras e dedos longos segurando um instrumento de sopro.", "Ser de cabeça alongada e olhos negros com instrumento de sopro."),
 ("bothan", "bothan", "Humanoide coberto de pelagem curta, orelhas pontudas e focinho, rosto iluminado por um datapad com informações secretas.", "Humanoide peludo de orelhas pontudas lendo um datapad."),
 ("caamasi", "caamasi", "Humanoide gracioso de penugem dourada com faixas violeta ao redor dos olhos, expressão serena e sábia.", "Humanoide de penugem dourada e faixas violeta ao redor dos olhos."),
 ("cathar", "cathar", "Felinoide de juba farta, presas e olhos âmbar, armadura leve de couro, pose de guerreiro orgulhoso.", "Felinoide de juba com armadura leve."),
 ("cereans", "cereans", "Humanoide de crânio cônico muito alto, barba aparada e túnica de conselheiro, olhar ponderado.", "Humanoide de crânio cônico alto e túnica de conselheiro."),
 ("chadra-fan", "chadra-fan", "Pequeno ser de orelhas enormes em leque, nariz enrugado e olhos brilhantes, mexendo animado num aparelho desmontado.", "Pequeno ser de orelhas enormes mexendo num aparelho."),
 ("chiss", "chiss", "Humanoide de pele azul, olhos vermelhos luminosos e cabelo preto, uniforme sóbrio, expressão de estrategista frio.", "Humanoide de pele azul e olhos vermelhos luminosos."),
 ("defel", "defel", "Silhueta quase invisível na sombra, só se veem olhos vermelhos e presas brancas refletindo uma luz fraca.", "Silhueta na sombra com olhos vermelhos e presas visíveis."),
 ("devaronian", "devaronian", "Humanoide de pele avermelhada com dois chifres curtos na testa e sorriso malandro de viajante incansável.", "Humanoide de pele avermelhada com chifres curtos, sorriso malandro."),
 ("dug", "dug", "Ser que se apoia sobre os braços longos e usa os pés como mãos, rosto com papada, numa oficina de corridas cheia de peças.", "Ser que anda sobre os braços numa oficina de corridas."),
 ("duros", "duros", "Humanoide de pele azul-acinzentada, olhos vermelhos grandes e sem nariz, com chapéu de aba larga de piloto veterano.", "Piloto de pele azul-acinzentada e olhos vermelhos com chapéu de aba larga."),
 ("ewok", "ewok", "Pequeno ser peludo de capuz de couro numa plataforma de madeira entre árvores gigantes, lança na mão e olhar curioso.", "Pequeno ser peludo de capuz entre árvores gigantes."),
 ("falleen", "falleen", "Humanoide reptiliano de pele verde com crista dorsal discreta, beleza aristocrática e leve brilho rosado na pele sugerindo feromônios.", "Humanoide reptiliano de pele verde com porte aristocrático."),
 ("gamorrean", "gamorrean", "Humanoide corpulento de feições suínas e pele esverdeada, machado de guerra apoiado no ombro, de guarda numa porta.", "Guarda corpulento de feições suínas com machado."),
 ("gand", "gand", "Insetoide de exoesqueleto cinzento com respirador e olhos compostos, postura de caçador paciente.", "Insetoide de exoesqueleto com respirador e olhos compostos."),
 ("geonosian-worker", "geonosian", "Insetoide alado de exoesqueleto ocre, sem adornos, trabalhando numa linha de montagem de colmeia de rocha.", "Insetoide alado ocre trabalhando numa colmeia de rocha."),
 ("geonosian-aristocrat", "geonosian", "Insetoide alado de porte esguio com adornos de metal e asas abertas, num balcão esculpido de uma colmeia nobre.", "Insetoide alado nobre com adornos num balcão de colmeia."),
 ("givin", "givin", "Ser de crânio de exoesqueleto com grandes olhos triangulares, cercado por equações holográficas flutuantes.", "Ser de crânio de exoesqueleto cercado por equações holográficas."),
 ("gotal", "gotal", "Humanoide peludo com dois cones sensoriais na cabeça, olhar concentrado como quem sente o ambiente ao redor.", "Humanoide peludo com dois cones sensoriais na cabeça."),
 ("gran", "gran", "Ser de três olhos em pedúnculos e focinho de cabra, expressão pacata e amistosa num mercado.", "Ser de três olhos em pedúnculos num mercado."),
 ("gungan", "gungan", "Anfíbio esguio de orelhas longas pendentes e olhos no alto da cabeça, à beira de um lago com estruturas orgânicas iluminadas.", "Anfíbio de orelhas longas à beira de um lago."),
 ("herglic", "herglic", "Ser enorme de corpo de cetáceo e pele lisa acinzentada, sorrindo diante de uma mesa de apostas.", "Ser enorme de corpo de cetáceo numa mesa de apostas."),
 ("hutt", "hutt", "Criatura gigantesca semelhante a uma lesma, olhos de pálpebras pesadas e sorriso largo, reclinada num estrado cheio de almofadas.", "Criatura gigante semelhante a uma lesma reclinada num estrado."),
 ("iktotchi", "iktotchi", "Humanoide de pele avermelhada com chifres que descem pelas laterais do rosto, olhar distante de quem pressente o futuro, de macacão de piloto.", "Humanoide de chifres descendentes com olhar distante."),
 ("ithorians", "ithorians", "Ser de pescoço longo e curvo e cabeça larga em forma de martelo, cuidando de plantas exóticas numa estufa.", "Ser de cabeça em forma de martelo cuidando de plantas."),
 ("jawa", "jawa", "Pequena figura encapuzada de manto marrom, só se veem dois olhos amarelos luminosos, puxando um aparelho de sucata.", "Pequena figura encapuzada de olhos amarelos puxando sucata."),
 ("kaminoan", "kaminoan", "Ser muito alto e esguio de pescoço longo, pele pálida e olhos grandes e escuros, num laboratório branco e luminoso.", "Ser alto de pescoço longo num laboratório branco."),
 ("kel-dor", "kel-dor", "Humanoide de pele alaranjada com máscara respiratória e óculos protetores escuros, manto de viagem.", "Humanoide de máscara respiratória e óculos protetores."),
 ("mon-calamari", "mon-calamari", "Ser aquático de cabeça arredondada, pele salmão e grandes olhos laterais, diante de janelas de uma nave de linhas orgânicas.", "Ser aquático de olhos laterais grandes numa nave orgânica."),
 ("nautolans", "nautolans", "Humanoide de pele verde com tentáculos grossos caindo da cabeça e olhos negros, emergindo da água.", "Humanoide verde com tentáculos na cabeça emergindo da água."),
 ("quarren", "quarren", "Ser aquático de rosto com tentáculos ao redor da boca e pele rosada, expressão desconfiada.", "Ser aquático de tentáculos ao redor da boca."),
 ("rodians", "rodians", "Humanoide de pele verde, focinho tubular, olhos grandes multifacetados e antenas curtas, com mira de caçador.", "Humanoide de focinho tubular e olhos multifacetados."),
 ("sullustans", "sullustans", "Ser baixo de bochechas pendentes, olhos grandes e negros e orelhas arredondadas, de capacete de navegador.", "Navegador baixo de bochechas pendentes e olhos negros."),
 ("talz", "talz", "Gigante gentil coberto de pelo branco, com dois olhos grandes e dois pequenos e garras enormes, numa paisagem gelada.", "Gigante de pelo branco com quatro olhos numa paisagem gelada."),
 ("togruta", "togruta", "Humanoide de pele alaranjada com padrões faciais brancos, apêndices listrados na cabeça (montrals e lekku), olhar de caçadora.", "Caçadora de pele alaranjada com apêndices listrados na cabeça."),
 ("trandoshans", "trandoshans", "Réptil grande de escamas verdes e olhos amarelos, garras e armadura de caçador.", "Réptil grande de escamas verdes com armadura de caçador."),
 ("twi-leks", "twi-leks", "Humanoide de pele de cor viva com duas caudas cranianas longas (lekku) sobre os ombros, roupa de viajante.", "Humanoide de pele colorida com duas caudas cranianas."),
 ("umbaran", "umbaran", "Humanoide de pele muito pálida e olhos grandes e claros, manto escuro de gola alta, ar de quem conhece segredos.", "Humanoide pálido de olhos claros e manto escuro."),
 ("verpine", "verpine", "Insetoide esguio de exoesqueleto verde, olhos grandes e antenas, montando com precisão uma peça de arma.", "Insetoide verde de antenas montando uma peça."),
 ("weequay", "weequay", "Humanoide de pele enrugada como couro curtido, tranças finas e roupa de pirata do deserto.", "Humanoide de pele enrugada com tranças, pirata do deserto."),
 ("wookiees", "wookiees", "Alienígena muito alto de pelagem castanha densa, bandoleira cruzada, entre troncos de árvores colossais.", "Alienígena alto e peludo entre árvores colossais."),
 ("yuuzhan-vong", "yuuzhan-vong", "Guerreiro de pele cinzenta com escarificações e tatuagens rituais, implantes orgânicos e armadura viva com textura de carapaça.", "Guerreiro escarificado com armadura orgânica viva."),
 ("zabrak", "zabrak", "Humanoide com uma coroa de pequenos chifres no alto da cabeça e tatuagens faciais geométricas, olhar determinado.", "Humanoide com coroa de pequenos chifres e tatuagens faciais."),
]
assert len(SPECIES) == 48
for sid, ref, d, a in SPECIES:
    add(f"species.{sid}", "species", "/criar (passo Espécie), /consulta/especies, /personagem/:id (selo de espécie)", "SpeciesCard", "3:4", CARD_SIZES, "portrait-card", "portrait",
        d, a, focal="rosto no terço superior", data_ref=f"data/species.json#{ref}")

# ---- Consulta (11)
REF = [
 ("rules", "/consulta/regras", "Um datapad aberto sobre uma mesa projetando um holograma de seis dados e um diagrama de fluxo de turno, livros de capa gasta ao lado.", "Datapad projetando dados e um diagrama de regras."),
 ("skills", "/consulta/pericias", "Painel com seis setores luminosos (destreza, conhecimento, mecânica, percepção, força, técnica), cada um com um pequeno ícone abstrato, em círculo.", "Painel circular com seis setores de atributos."),
 ("force-powers", "/consulta/poderes", "Mão aberta com pedras pequenas flutuando acima dela e linhas de energia suave entre elas, fundo de templo em ruínas desfocado.", "Mão aberta fazendo pedras flutuarem."),
 ("species", "/consulta/especies", "Mosaico de silhuetas de muitas espécies diferentes contra uma janela com estrelas, em contraluz.", "Silhuetas de várias espécies alienígenas em contraluz."),
 ("weapons", "/consulta/armas", "Planta técnica explodida de uma pistola blaster de design original, peças separadas com linhas de cota.", "Planta explodida de uma pistola blaster de design original."),
 ("armor", "/consulta/armaduras", "Planta técnica de um conjunto de armadura modular de design original em vista frontal e lateral.", "Planta de uma armadura modular em duas vistas."),
 ("gear", "/consulta/equipamentos", "Mochila aberta com equipamentos espalhados: medpac, comlink, binóculos eletrônicos, cordas e rações, vistos de cima.", "Equipamentos de viagem espalhados vistos de cima."),
 ("vehicles", "/consulta/veiculos", "Planta técnica de uma moto flutuante de design original em perspectiva, com indicadores de repulsor sob o casco.", "Planta de uma moto flutuante de design original."),
 ("starships", "/consulta/naves", "Planta técnica de um cargueiro leve de design original visto de cima e de perfil, com seções numeradas por glifos.", "Planta de um cargueiro leve de design original."),
 ("glossary", "/consulta/glossario", "Arquivo de cristais de dados em gavetas luminosas, um cristal destacado emitindo luz.", "Gavetas de cristais de dados com um destacado."),
 ("tables", "/consulta/tabelas", "Grade holográfica de tabelas e gráficos flutuando sobre uma mesa de comando escura.", "Tabelas holográficas sobre uma mesa de comando."),
]
for rid, screen, d, a in REF:
    add(f"ref.{rid}", "reference", screen, "ReferenceCategoryCard, ReferenceHeader", "16:9", BANNER_SIZES, "blueprint", "blueprint", d, a, focal="centro")

# ---- Modo mesa
add("bg.mesa", "mesa", "/personagem/:id/mesa", "TableModeLayout.background", "variável", BG_SIZES, "ambient-bg", "hero",
    "Superfície de mesa de jogo de madeira escura vista de cima, com marcas de copo e leve névoa azul de holograma desligado; quase preta para não competir com os números.",
    "", priority="P1")
add("texture.die.normal", "mesa", "/personagem/:id/mesa (dados 3D)", "Dice3D.material normal", "1:1", {"all": "1024x1024, cor + emissão"}, "material", "default",
    "Material de dado em resina fosca grafite com pips gravados que emitem luz ciano suave.", "", priority="P2")
add("texture.die.wild", "mesa", "/personagem/:id/mesa (dados 3D)", "Dice3D.material Wild Die", "1:1", {"all": "1024x1024, cor + emissão"}, "material", "default",
    "Material de dado em resina âmbar translúcida com veios dourados internos e pips que brilham em branco quente; precisa parecer especial ao lado do dado normal.", "", priority="P2")

# ---- Campanha
add("hero.campaign", "campaign", "/campanha/:id", "CampaignHeader.hero (capa padrão)", "21:9 (PC) / 16:9 / 3:2", {"mobile": "1080x720 (3:2)", "tablet": "2048x1152 (16:9)", "desktop": "2560x1100 (21:9)"}, "holo-cinematic", "campaign",
    "Grupo de quatro aventureiros de costas, silhuetas de espécies diferentes, diante de uma grande janela que mostra um planeta e uma frota distante.",
    "Grupo de aventureiros de costas olhando um planeta por uma janela.", focal="centro; topo livre para o nome da campanha")
add("bg.campaign.holomap", "campaign", "/campanha/:id (Holomapa)", "HoloMap.background", "16:9 e 1:1", {"mobile": "1500x1500 (1:1)", "tablet": "2048x1536 (4:3)", "desktop": "3200x1800 (16:9)"}, "blueprint", "campaign",
    "Mapa galáctico holográfico original: braços espirais em ciano e violeta, regiões em anéis concêntricos, rotas hiperespaciais como linhas pontilhadas, sem nomes reais de planetas.",
    "Mapa galáctico holográfico com rotas pontilhadas.")
COVERS = [
 ("outer-rim", "Planeta desértico com duas luas no céu e um povoado de cúpulas de barro sob o calor, cargueiro chegando.", "Planeta desértico com duas luas e povoado de cúpulas."),
 ("core-worlds", "Cidade-planeta à noite com torres infinitas e tráfego aéreo em faixas de luz, chuva fina.", "Cidade-planeta noturna com tráfego aéreo."),
 ("rebel-cell", "Base escondida numa floresta úmida, antenas camufladas e caças sob redes, luz verde filtrada.", "Base escondida na floresta com caças sob redes."),
 ("smugglers-run", "Cargueiro esquivando-se num campo de asteroides com disparos ao longe.", "Cargueiro passando por um campo de asteroides."),
 ("ancient-ruins", "Ruínas de templo antigo cobertas de musgo, com escadarias e uma luz suave vinda do interior.", "Ruínas de templo antigo com luz interior."),
 ("imperial-shadow", "Silhueta de uma imensa nave de guerra triangular de design original cobrindo o céu de um planeta, sombra sobre a cidade.", "Imensa nave de guerra cobrindo o céu de um planeta."),
]
for cid, d, a in COVERS:
    add(f"campaign.cover.{cid}", "campaign", "/campanhas/nova, /campanha/:id, /hangar (cartão de campanha)", "CampaignCoverPicker, CampaignCard", "16:9", BANNER_SIZES, "holo-cinematic", "campaign", d, a, focal="centro", priority="P2")
add("hero.invite", "campaign", "/convite/:codigo", "InviteLanding.hero", "16:9 / 4:3 / 9:16", HERO_SIZES, "holo-cinematic", "campaign",
    "Mensagem holográfica azul projetada por um pequeno emissor sobre a palma de uma mão: uma figura encapuzada indefinida faz um gesto de chamado.",
    "Mensagem holográfica projetada na palma de uma mão, um chamado.", focal="centro")
add("bg.gm-console", "campaign", "/campanha/:id/mestre", "GMConsole.background", "variável", BG_SIZES, "ambient-bg", "campaign",
    "Console de comando escuro visto de frente, fileiras de pequenas luzes âmbar e violeta e telas apagadas; muito escuro.", "", priority="P2")

# ---- Outros
add("hero.holocron", "holocron", "/holocron", "HolocronAssistant.hero", "1:1 (celular) / 16:9", {"mobile": "1080x1080 (1:1)", "tablet": "2048x1152 (16:9)", "desktop": "2560x1440 (16:9)"}, "holo-cinematic", "hero",
    "Um cubo de cristal antigo flutuando, com faces gravadas em padrões geométricos originais, irradiando luz ciano suave numa sala escura de pedra.",
    "Cubo de cristal antigo flutuando e emitindo luz.", focal="centro", priority="P2")
add("portrait.default", "account", "/hangar, /personagem/:id, /campanha/:id (grupo), feed", "Avatar/Portrait sem upload", "1:1", {"all": "512x512 (1:1); máscara circular ou hexagonal no app"}, "portrait-card", "portrait",
    "Silhueta humanoide neutra em holograma ciano com scanlines, fundo escuro; serve para qualquer espécie.", "Retrato não definido.")
add("og.default", "marketing", "links compartilhados (convite, ficha pública)", "OpenGraph image", "1.91:1", {"all": "1200x630"}, "holo-cinematic", "hero",
    "Seis dados flutuando sobre uma mesa escura, um deles âmbar e brilhante, com um campo de estrelas atrás e espaço à esquerda para o nome do app.",
    "Seis dados flutuando, um âmbar em destaque, sobre fundo estrelado.", focal="direita", priority="P2")
add("app.icon", "marketing", "ícone PWA, favicon, splash", "manifest icons", "1:1", {"all": "1024x1024 mestre; derivados 512, 192, 180, 32; versão maskable com área segura de 80%"}, "icon-glyph", "icon",
    "Um dado de seis faces em perspectiva com bordas luminosas ciano e uma face âmbar com um pip em brilho; sem droide, sem personagem.",
    "Ícone do r2-d6: dado luminoso.")

# ---- Estados vazios (7)
EMPTY = [
 ("characters", "/hangar", "Pequeno droide de manutenção varrendo uma baia vazia, com um balão de pensamento mostrando um capacete de piloto.", "Droide varrendo uma baia vazia."),
 ("campaigns", "/hangar, /campanhas", "Mapa estelar enrolado e ainda fechado sobre uma caixa, com um selo de convite piscando.", "Mapa estelar enrolado, à espera de uma campanha."),
 ("feed", "/campanha/:id (Feed)", "Seis dados dormindo empilhados, um deles âmbar com um olho entreaberto.", "Dados empilhados dormindo, à espera da primeira rolagem."),
 ("search", "/consulta (sem resultados)", "Sonda de reconhecimento flutuante iluminando com um holofote um terreno vazio.", "Sonda iluminando um terreno vazio."),
 ("journal", "/campanha/:id (Diário), /personagem/:id (Notas)", "Datapad em branco com uma caneta luminosa ao lado e uma xícara fumegante.", "Datapad em branco com caneta luminosa."),
 ("timeline", "/personagem/:id/linha-do-tempo", "Linha pontilhada luminosa que começa num pequeno ponto e some no escuro, como uma rota ainda não percorrida.", "Rota pontilhada que começa e some no escuro."),
 ("party", "/campanha/:id (Grupo sem jogadores)", "Mesa redonda com cadeiras vazias e um holoprojetor aceso no centro mostrando um código de convite abstrato.", "Mesa redonda vazia com holoprojetor aceso."),
]
for eid, screen, d, a in EMPTY:
    add(f"empty.{eid}", "state", screen, "EmptyState", "1:1", SPOT_SIZES, "spot-illustration", "state", d, a, focal="centro")

# ---- Erros (6)
ERRORS = [
 ("offline", "qualquer tela sem rede", "Antena parabólica de uma base remota coberta de neve, com uma faísca fraca de sinal.", "Antena coberta de neve sem sinal."),
 ("not-found", "rota inexistente (404)", "Nave pequena perdida numa nebulosa densa, faróis acesos procurando o caminho.", "Nave pequena perdida numa nebulosa."),
 ("server", "erro 5xx", "Droide astromecânico de design original soltando fumaça, com um painel aberto e faíscas.", "Droide soltando fumaça com painel aberto."),
 ("forbidden", "sem permissão (403)", "Porta blindada fechada com uma luz vermelha de acesso negado e um pequeno visor.", "Porta blindada com luz de acesso negado."),
 ("invite-expired", "/convite/:codigo expirado", "Mensagem holográfica falhando e se desfazendo em estática.", "Mensagem holográfica se desfazendo em estática."),
 ("sync-conflict", "ficha editada em dois aparelhos", "Dois hologramas do mesmo personagem sobrepostos e ligeiramente desalinhados, como um eco.", "Dois hologramas do mesmo personagem desalinhados."),
]
for eid, screen, d, a in ERRORS:
    add(f"error.{eid}", "error", screen, "ErrorState", "1:1", SPOT_SIZES, "spot-illustration", "error", d, a, focal="centro")

# ---- Icones (20)
ICONS = [
 ("attr.dexterity", "Mão estilizada com três linhas de movimento rápido.", "Dexterity"),
 ("attr.knowledge", "Cristal de dados com três facetas e um ponto de luz.", "Knowledge"),
 ("attr.mechanical", "Manche de pilotagem visto de cima com um arco de movimento.", "Mechanical"),
 ("attr.perception", "Olho estilizado dentro de um losango.", "Perception"),
 ("attr.strength", "Punho fechado geométrico com uma barra de força.", "Strength"),
 ("attr.technical", "Chave inglesa cruzada com uma linha de circuito.", "Technical"),
 ("force.control", "Círculo com uma linha horizontal estável no centro.", "Force: control"),
 ("force.sense", "Três ondas concêntricas saindo de um ponto.", "Force: sense"),
 ("force.alter", "Pequena pedra com duas setas curvas ao redor, levitando.", "Force: alter"),
 ("points.cp", "Estrela de quatro pontas com um sinal de mais.", "Character Points"),
 ("points.fp", "Chama estilizada dentro de um círculo.", "Force Points"),
 ("points.dsp", "Chama estilizada invertida e partida.", "Dark Side Points"),
 ("wound.stunned", "Estrela pequena girando sobre um círculo.", "Stunned"),
 ("wound.wounded", "Uma barra diagonal sobre um escudo.", "Wounded"),
 ("wound.wounded-twice", "Duas barras diagonais sobre um escudo.", "Wounded twice"),
 ("wound.incapacitated", "Escudo com uma linha horizontal no meio e ponto abaixo.", "Incapacitated"),
 ("wound.mortally-wounded", "Escudo partido ao meio com uma gota.", "Mortally Wounded"),
 ("wound.killed", "Escudo vazio com contorno tracejado.", "Killed"),
 ("die.normal", "Dado de seis faces em contorno com pip central.", "Dado normal"),
 ("die.wild", "Dado em hexágono preenchido com um raio no centro; forma diferente do dado normal para não depender de cor.", "Wild Die"),
]
for iid, d, a in ICONS:
    add(f"icon.{iid}", "icon", "ficha, modo mesa, consulta, feed", "Icon", "1:1", ICON_SIZES, "icon-glyph", "icon", d, a, priority="P1")

# =====================================================================
# Entidades da consulta (v2.1): uma imagem por item + reservas por categoria
# Cadeia de reserva: item -> categoria (campo fallback) -> placeholder da família
# =====================================================================
def load(name, key):
    with open(os.path.join(ROOT, "data", f"{name}.json"), encoding="utf-8") as f:
        return json.load(f)[key]

def slug(s):
    return "".join(c if c.isalnum() else "-" for c in (s or "none").lower()).strip("-").replace("--", "-")

def cap(s):
    return s[0].upper() + s[1:] if s else s

STYLES["blueprint-item"] = STYLES["blueprint"] + " Objeto isolado e centralizado, com sombra projetada suave e um brilho de recorte âmbar numa borda; deve ler bem em miniatura 1:1 de 160 px."
STYLES["holo-craft"] = STYLES["holo-cinematic"] + " Veículo ou nave em movimento no seu ambiente natural, enquadrado inteiro com margem; design próprio inspirado na função e no porte, sem reproduzir os modelos dos filmes (silhueta, pintura e detalhes originais)."
STYLES["scene-spot"] = "Ilustração-cena pequena e simbólica, fundo escuro em vinheta (não transparente), traço pictórico simplificado com luz ciano e um único ponto âmbar; uma ação clara e legível em 160 px, sem texto."

PLACEHOLDERS.update({
    "weapon": {"gradient": "linear-gradient(160deg, #0A2238 0%, #0B1B2E 50%, #060C16 100%)", "icon": "crosshair", "accent": "#4FD1FF"},
    "armor": {"gradient": "linear-gradient(160deg, #0F2433 0%, #0B1824 50%, #060B12 100%)", "icon": "shield", "accent": "#4FD1FF"},
    "gear": {"gradient": "linear-gradient(160deg, #10263A 0%, #0B1A2A 50%, #060C16 100%)", "icon": "backpack", "accent": "#4FD1FF"},
    "vehicle": {"gradient": "radial-gradient(120% 90% at 30% 70%, #2A1E10 0%, #12100C 50%, #05070C 100%)", "icon": "car", "accent": "#FFB020"},
    "starship": {"gradient": "radial-gradient(120% 90% at 70% 30%, #12324A 0%, #0A1422 45%, #05070C 100%)", "icon": "rocket", "accent": "#4FD1FF"},
    "skill": {"gradient": "radial-gradient(90% 80% at 50% 40%, #13263A 0%, #0A1320 60%, #05070C 100%)", "icon": "target", "accent": "#4FD1FF"},
    "power": {"gradient": "radial-gradient(90% 80% at 50% 40%, #22173A 0%, #110C20 60%, #05070C 100%)", "icon": "sparkles", "accent": "#B48CFF"},
})

ITEM_SIZES = {"all": "1600x900 (16:9) para o cabeçalho de EntityDetail; miniatura 1:1 (320x320) recortada pelo ponto focal para a lista"}
SPOT_SCENE_SIZES = {"all": "800x800 (1:1); miniatura 160x160 na lista"}
CAT_SCREEN = "/consulta (reserva quando o item não tem imagem)"

def add_entity(id, group, data_ref, screen, style, placeholder, desc, alt, priority, fallback, sizes=ITEM_SIZES, aspect="16:9 (miniatura 1:1)", component="EntityDetail.header, EntityList.thumbnail", focal="centro"):
    add(id, group, screen, component, aspect, sizes, style, placeholder, desc, alt, priority=priority, focal=focal, data_ref=data_ref)
    items[-1]["fallback"] = fallback

def add_cat(id, group, style, placeholder, desc, alt, priority, sizes=ITEM_SIZES, aspect="16:9 (miniatura 1:1)"):
    add(id, group, CAT_SCREEN, "EntityDetail.header, EntityList.thumbnail (reserva)", aspect, sizes, style, placeholder, desc, alt, priority=priority)
    items[-1]["fallback"] = []

# ---------------- Armas ----------------
WEAPON_CAT = {
 "melee": ("Conjunto de armas brancas e de energia de design próprio dispostas num suporte de parede: lâmina vibratória, bastão elétrico, machado e um cabo de lâmina de energia.", "Armas brancas num suporte de parede."),
 "archaic-ranged": ("Arco, besta, funda e um mosquete antigo sobre uma bancada de madeira escura, iluminados por uma lanterna.", "Armas antigas de projétil sobre uma bancada."),
 "blaster": ("Três blasters de design próprio (pistola, carabina e rifle) em planta holográfica lado a lado, do menor ao maior.", "Pistola, carabina e rifle blaster lado a lado."),
 "miscellaneous": ("Armas especiais de design próprio: pistola de íons com bobinas azuis, lança-chamas compacto e uma besta de energia.", "Armas especiais: íons, chamas e besta de energia."),
 "artillery": ("Torre de artilharia fixa de canos longos sobre um bunker, apontada para o céu ao entardecer.", "Torre de artilharia fixa apontada para o céu."),
 "explosive": ("Granadas, minas e uma carga moldável em planta holográfica, com luzes de armado piscando.", "Granadas, minas e cargas explosivas."),
}
WEAPON = {
 "amphistaff": "bastão orgânico vivo, como uma serpente rígida de escamas escuras, com uma ponta afiada",
 "atlatl": "propulsor de arremesso de madeira entalhada com uma esfera de energia encaixada na ponta",
 "bayonet": "lâmina de baioneta presa sob o cano de um rifle",
 "cesta": "cesta curva de vime trançado presa ao braço, pronta para arremessar esferas de energia",
 "club": "porrete de madeira pesada com tiras de couro no cabo",
 "electrostaff": "bastão metálico longo com pontas que soltam arcos elétricos azuis",
 "force-pike": "lança longa de guarda com ponta vibratória luminosa",
 "gaderffii-stick": "bastão de metal feito à mão, com cabeça de lâminas e espetos rústicos",
 "hatchet": "machadinha de cabo curto com lâmina gasta",
 "knife": "faca de combate com lâmina simples e cabo de couro",
 "spear": "lança de haste longa com ponta de metal batido",
 "staff": "bastão de madeira longo com anéis de metal nas pontas",
 "stun-gauntlets": "par de manoplas com eletrodos nos nós dos dedos crepitando",
 "vibro-ax": "machado de cabo longo com lâmina vibratória que tremula",
 "vibroblade": "faca longa de lâmina vibratória com um leve borrão de movimento",
 "lightsaber": "cabo cilíndrico metálico de design próprio com a lâmina de energia acesa em cor neutra",
 "double-bladed-lightsaber": "cabo longo com uma lâmina de energia acesa em cada ponta",
 "short-lightsaber": "cabo compacto com uma lâmina de energia curta",
 "crossbow": "besta de madeira e metal com a corda armada",
 "longbow": "arco longo de madeira flexível com aljava de flechas",
 "net": "rede de arremesso com pesos nas bordas, aberta no ar",
 "sling": "funda de couro com uma pedra no bolsão",
 "throwing-knife": "trio de facas de arremesso equilibradas em leque",
 "black-powder-pistol": "pistola de pólvora antiga com cano longo e cão armado",
 "musket": "mosquete de pólvora com coronha de madeira e baioneta curta",
 "slugthrower-pistol": "pistola de projéteis sólidos com pente e estojos de metal ao lado",
 "slugthrower-rifle": "rifle de projéteis sólidos com mira de ferro",
 "submachine-gun": "submetralhadora de projéteis compacta com carregador curvo",
 "hold-out-blaster": "pistola blaster minúscula que cabe na palma da mão",
 "sporting-blaster": "pistola blaster leve e elegante de cano fino",
 "blaster-pistol": "pistola blaster de uso comum com aletas de resfriamento no cano",
 "heavy-blaster-pistol": "pistola blaster pesada de cano grosso e empunhadura robusta",
 "hunting-blaster": "blaster de caça com coronha e mira telescópica longa",
 "blaster-carbine": "carabina blaster compacta com coronha dobrável",
 "blaster-rifle": "rifle blaster militar com mira e coronha fixa",
 "heavy-blaster-rifle": "rifle blaster pesado com cano reforçado e bipé",
 "sporting-blaster-rifle": "rifle blaster esportivo leve e polido",
 "light-repeating-blaster": "blaster de repetição leve com bipé e cano de resfriamento",
 "heavy-repeating-blaster": "blaster de repetição pesado com cinta de células de energia",
 "e-web-repeating-blaster": "blaster de repetição pesado sobre tripé, com gerador ao lado, operado por dois",
 "bowcaster": "besta de energia com arco metálico e mira, disparando um dardo luminoso (design próprio)",
 "flamethrower": "lança-chamas com tanque nas costas e bico com chama piloto",
 "ion-pistol": "pistola com bobinas azuis de íons ao longo do cano",
 "ion-rifle": "rifle de íons com bobinas azuis e coronha longa",
 "riot-gun": "arma de controle de tumultos de cano largo",
 "stun-pistol": "pistola compacta com anéis de atordoamento azuis no cano",
 "anti-infantry-laser-battery": "bateria laser antipessoal de dois canos sobre plataforma giratória",
 "anti-vehicle-laser-cannon": "canhão laser antiveículo em base fixa com escudo frontal",
 "heavy-anti-orbital-ion-cannon": "enorme canhão de íons de superfície numa torre cilíndrica apontada para a órbita",
 "turbolaser-battery": "torre de turbolaser fixa de canos longos sobre um bunker",
 "fragmentation-grenade": "granada de fragmentação cilíndrica com anel de ativação",
 "ion-grenade": "granada de íons com faixas azuis luminosas",
 "stun-grenade": "granada de atordoamento com faixas brancas",
 "grenade-launcher": "lançador de granadas de tambor rotativo",
 "rocket-launcher": "lança-foguetes portátil apoiado no ombro",
 "antipersonnel-mine": "mina antipessoal achatada semienterrada com sensor piscando",
 "vehicle-mine": "mina antiveículo larga e pesada enterrada na estrada",
 "explosive-charge": "carga explosiva com fios e um painel de armar",
 "standard-detonator": "detonador padrão: pequeno cilindro com pinos de contato",
 "timer-fuse": "espoleta com mostrador de contagem regressiva",
 "remote-fuse": "espoleta com antena curta e controle remoto",
 "detonite": "barras de explosivo moldável embaladas lado a lado",
 "thermal-detonator": "esfera metálica de detonador com uma luz de armado piscando",
}
WEAPON_CTX = {
 "melee": "Planta holográfica técnica, vista em 3/4, com linhas de cota discretas.",
 "archaic-ranged": "Planta holográfica técnica de uma arma antiga, vista lateral com linhas de cota.",
 "blaster": "Planta holográfica técnica de uma arma de energia de design próprio, vista lateral em 3/4.",
 "miscellaneous": "Planta holográfica técnica, design próprio, vista em 3/4.",
 "artillery": "Planta holográfica de uma instalação de artilharia em escala de veículo, com uma figura humana minúscula para dar escala.",
 "explosive": "Planta holográfica técnica, objeto pequeno ampliado, com luz âmbar de armado.",
}
weapons = load("weapons", "items")
assert set(WEAPON) == {w_["id"] for w_ in weapons}, "armas sem descrição"
for c, (d, a) in WEAPON_CAT.items():
    add_cat(f"weapon-cat.{c}", "weapon-cat", "blueprint-item", "weapon", d, a, "P1")
for it in weapons:
    s = WEAPON[it["id"]]
    add_entity(f"weapon.{it['id']}", "weapon", f"data/weapons.json#{it['id']}", "/consulta/armas, /consulta/armas/:id, ficha (equipamento)", "blueprint-item", "weapon",
        f"{cap(s)}. {WEAPON_CTX[it['category']]}", cap(s) + ".", "P1", [f"weapon-cat.{it['category']}"])

# ---------------- Armaduras ----------------
ARMOR_CAT = {
 "light": ("Colete, capacete e macacão acolchoado de design próprio em planta holográfica, vistos de frente.", "Proteções leves: colete, capacete e macacão."),
 "military": ("Manequim de armadura militar de placas de design próprio, vista de frente e de perfil.", "Armadura militar de placas em duas vistas."),
 "heavy": ("Armadura pesada moldada de design próprio, com placas grossas e juntas reforçadas, sobre um suporte de manutenção.", "Armadura pesada num suporte de manutenção."),
}
ARMOR = {
 "armored-spacesuit": ("heavy", "traje espacial blindado de abordagem com mochila de foguete e capacete selado"),
 "medium-battle-armor": ("military", "armadura de combate média de placas sobre tecido reforçado"),
 "heavy-battle-armor": ("heavy", "armadura de combate pesada moldada, resistente a impacto, com ombreiras largas"),
 "blast-helmet": ("light", "capacete de combate com viseira e proteção de nuca"),
 "blast-vest": ("light", "colete de proteção acolchoado com placas no peito"),
 "royal-guard-armor": ("military", "armadura cerimonial de guarda de honra com elmo alto e manto longo de cor sóbria (design próprio)"),
 "combat-jumpsuit": ("light", "macacão de combate leve com reforços nos joelhos e cotovelos"),
 "corellian-powersuit": ("heavy", "exoesqueleto de carga reforçado adaptado como armadura, com braços servoassistidos"),
 "armored-flight-suit": ("light", "macacão de voo blindado com placas no peito e capacete de piloto"),
 "padded-flight-suit": ("light", "macacão de voo acolchoado com mangueiras de suporte de vida"),
 "clone-trooper-armor": ("military", "armadura de placas branca com faixas de unidade coloridas e capacete de viseira em T estreita (design próprio)"),
 "stormtrooper-armor": ("military", "armadura branca de placas para tropas de choque, capacete fechado de lentes escuras (design próprio)"),
 "scout-trooper-armor": ("military", "armadura leve de batedor, placas mínimas e capacete de viseira estreita"),
 "snowtrooper-armor": ("military", "armadura para clima frio com manto, saia térmica e respirador no capacete"),
 "vonduun-crabshell-armor": ("heavy", "carapaça orgânica viva de placas sobrepostas, como a casca de um crustáceo"),
}
armor = load("armor", "items")
assert set(ARMOR) == {a_["id"] for a_ in armor}, "armaduras sem descrição"
for c, (d, a) in ARMOR_CAT.items():
    add_cat(f"armor-cat.{c}", "armor-cat", "blueprint-item", "armor", d, a, "P2")
for it in armor:
    c, s = ARMOR[it["id"]]
    add_entity(f"armor.{it['id']}", "armor", f"data/armor.json#{it['id']}", "/consulta/armaduras, /consulta/armaduras/:id, ficha (equipamento)", "blueprint-item", "armor",
        f"{cap(s)}. Planta holográfica em manequim, vista de frente com uma vista de perfil menor ao lado.", cap(s) + ".", "P2", [f"armor-cat.{c}"])

# ---------------- Equipamentos ----------------
GEAR_CAT = {
 "communications": ("Comunicadores de mão, um transceptor de mesa e uma antena de mochila em planta holográfica.", "Aparelhos de comunicação."),
 "computers": ("Datapad, cartões de dados e um terminal portátil abertos sobre uma mesa escura.", "Datapad, cartões de dados e terminal."),
 "detection": ("Binóculos eletrônicos, lanterna e um sensor portátil emitindo uma varredura em leque.", "Binóculos, lanterna e sensor portátil."),
 "life-support": ("Traje de vácuo e máscara respiratória pendurados num armário de câmara de descompressão.", "Traje de vácuo e máscara respiratória."),
 "medical": ("Kit médico aberto com injetores, ataduras e um frasco de líquido curativo azul.", "Kit médico aberto."),
 "cybernetics": ("Braço protético mecânico de design próprio sobre uma bancada de cirurgia, com fios expostos.", "Braço protético sobre uma bancada."),
 "survival": ("Mochila de sobrevivência, corda, rações e um manto térmico sobre uma rocha.", "Equipamento de sobrevivência sobre uma rocha."),
 "tools": ("Caixa de ferramentas aberta com chaves, soldador e células de energia.", "Caixa de ferramentas aberta."),
 "accessories": ("Cinto de utilidades, coldre e bandoleira com uma mira eletrônica encaixada.", "Cinto, coldre, bandoleira e mira."),
}
GEAR = {
 "personal-comlink": "comunicador de mão pequeno com antena retrátil",
 "military-comlink": "comunicador militar robusto com capa emborrachada",
 "vehicle-comlink": "conjunto de comunicação de alta potência montado numa mochila com antena alta",
 "subspace-transceiver-small": "rádio de subespaço de mesa com tela e teclado",
 "subspace-transceiver-large": "estação de rádio de subespaço de alta potência com antena parabólica",
 "pocket-scrambler": "pequeno embaralhador de dados que se acopla ao comunicador",
 "jammer-pack": "mochila interferidora de comunicações com antenas curtas",
 "alien-enhancer-vox-box": "caixa de voz que reproduz sons de outras espécies, com alto-falante em grade",
 "transliterator": "tradutor portátil de idiomas com tela de glifos abstratos",
 "code-cylinder": "cilindro de código de segurança preso a um bolso de uniforme",
 "credit-chip": "chip de crédito fino e brilhante entre dois dedos",
 "datacard": "cartão de dados translúcido com circuitos visíveis",
 "datapad": "datapad portátil aceso com gráficos holográficos",
 "mainframe": "computador central em gabinetes altos com luzes piscando",
 "portable-computer": "computador portátil dobrável sobre uma caixa de carga",
 "personal-computer": "terminal pessoal de mesa com teclado e tela curva",
 "macrobinoculars": "binóculos eletrônicos com tela de aproximação",
 "glow-rod": "bastão luminoso cilíndrico projetando um feixe de luz",
 "fusion-lantern": "lanterna de fusão que ilumina e aquece um acampamento",
 "recording-rod": "bastão gravador de áudio com uma luz vermelha de gravação",
 "portable-sensor-pack": "sensor portátil com antena giratória e tela de varredura",
 "military-sensor-pack": "sensor militar reforçado com tela de alvos",
 "aquata-breather": "respirador aquático compacto preso à boca, soltando bolhas",
 "breath-mask": "máscara respiratória com filtros laterais",
 "vacuum-suit": "traje de vácuo leve com capacete transparente",
 "space-suit": "traje espacial completo com mochila de suporte de vida",
 "bacta-tank": "tanque cilíndrico de líquido curativo azul com um paciente de máscara flutuando",
 "customized-medical-backpack": "mochila médica avançada aberta com compartimentos e injetores",
 "medpac": "kit de primeiros socorros compacto aberto",
 "surgery-kit": "kit cirúrgico com instrumentos de precisão em estojo",
 "replacement-prosthetics": "mão protética mecânica de design próprio com articulações à mostra",
 "all-temperature-cloak": "manto térmico de tecido sintético esvoaçando no vento",
 "chain": "corrente pesada de elos metálicos enrolada",
 "field-kit": "mochila de sobrevivência com abrigo dobrável e cantil",
 "jet-pack": "mochila a jato com dois bocais e chamas curtas",
 "liquid-cable-dispenser": "disparador de cabo líquido lançando uma linha que endurece no ar",
 "ration-pack": "pacote de rações desidratadas aberto com barras compactas",
 "rocket-pack": "mochila foguete de bocal único com rastro de fumaça",
 "syntherope": "rolo de corda sintética fina e resistente",
 "binder-cuffs": "algemas magnéticas com luz de trava",
 "energy-cell": "célula de energia cilíndrica com indicador de carga",
 "fire-extinguisher": "extintor compacto soltando uma nuvem branca",
 "mesh-tape": "rolo de fita adesiva de malha metálica",
 "blaster-power-pack": "carregador de energia para blaster com indicador de carga",
 "power-recharger": "recarregador portátil com células encaixadas",
 "security-kit": "estojo de invasão com sondas e um decodificador de fechadura",
 "standard-tool-kit": "caixa de ferramentas padrão com chaves e hidrospanner",
 "enhanced-tool-kit": "caixa de ferramentas avançada com diagnóstico eletrônico",
 "utility-belt": "cinto de utilidades com bolsos e um gancho",
 "bandolier": "bandoleira de couro com células de energia e granadas",
 "helmet-package": "capacete com sistema de mira e viseira holográfica",
 "holster": "coldre de couro com uma pistola blaster",
 "standard-scope": "mira eletrônica para blaster com retículo luminoso",
 "enhanced-macroscope": "mira de ampliação montada em rifle, com lente longa",
}
gear = load("gear", "items")
assert set(GEAR) == {g_["id"] for g_ in gear}, "equipamentos sem descrição"
for c, (d, a) in GEAR_CAT.items():
    add_cat(f"gear-cat.{c}", "gear-cat", "blueprint-item", "gear", d, a, "P2")
for it in gear:
    s = GEAR[it["id"]]
    add_entity(f"gear.{it['id']}", "gear", f"data/gear.json#{it['id']}", "/consulta/equipamentos, /consulta/equipamentos/:id, ficha (equipamento)", "blueprint-item", "gear",
        f"{cap(s)}. Planta holográfica de objeto isolado, vista em 3/4.", cap(s) + ".", "P2", [f"gear-cat.{it['category']}"])

# ---------------- Veículos ----------------
VEH_CAT = {
 "walkers": ("Andador blindado de pernas mecânicas de design próprio avançando por uma planície enevoada.", "Andador blindado avançando na névoa."),
 "landspeeders": ("Landspeeder aberto de design próprio flutuando baixo sobre uma estrada de terra ao pôr do sol.", "Landspeeder flutuando sobre uma estrada de terra."),
 "speeder-bikes": ("Moto flutuante de design próprio em alta velocidade entre troncos de floresta.", "Moto flutuante entre árvores."),
 "swoops": ("Swoop de corrida de design próprio, motor enorme e assento mínimo, cruzando um cânion.", "Swoop de corrida cruzando um cânion."),
 "armored-assault-vehicles": ("Tanque flutuante blindado de design próprio avançando com poeira atrás.", "Tanque flutuante blindado."),
 "airspeeders": ("Aerospeeder de design próprio voando baixo entre torres de uma cidade.", "Aerospeeder voando entre torres."),
 "cloud-cars": ("Carro de nuvens de design próprio cruzando nuvens alaranjadas.", "Carro de nuvens entre nuvens alaranjadas."),
 "podracers": ("Cabine de corrida puxada por dois motores de design próprio deixando rastros de calor.", "Cabine puxada por dois motores de corrida."),
 "sail-barges": ("Barcaça flutuante com velas de design próprio sobre dunas.", "Barcaça com velas sobre dunas."),
 "skiffs": ("Plataforma de carga flutuante aberta de design próprio num porto.", "Plataforma de carga flutuante."),
 "ground-vehicles": ("Veículo terrestre pesado de rodas de design próprio cruzando lama.", "Veículo terrestre pesado na lama."),
 "hover-vehicles": ("Hidrofólio de design próprio deslizando sobre ondas.", "Hidrofólio sobre ondas."),
}
VEHICLE = {
 "at-at": "andador de assalto quadrúpede gigantesco e blindado atravessando um campo de neve, tropas minúsculas ao lado para dar escala",
 "at-pt": "andador leve bípede de um tripulante, cabine aberta, numa trilha de floresta",
 "at-st": "andador bípede médio de cabine elevada patrulhando uma floresta",
 "at-te": "andador de seis pernas subindo uma encosta rochosa com tropas",
 "ubrikkian-9000-z004": "landspeeder esportivo aberto e baixo, com para-brisa curvo, numa avenida de cidade",
 "v-35-courier": "landspeeder utilitário de cabine fechada estacionado num povoado de fazenda",
 "x-34-landspeeder": "landspeeder aberto de dois lugares com turbinas traseiras sobre um deserto",
 "aratech-74-z-military-speeder-bike": "moto flutuante militar com aletas dianteiras entre árvores gigantes",
 "ikas-adno-nightfalcon": "moto flutuante esportiva de linhas aerodinâmicas numa rua noturna iluminada",
 "razalon-fc-20": "moto flutuante robusta de patrulha num posto de fronteira",
 "stap": "pequena plataforma voadora individual com o piloto de pé, sobre uma planície",
 "air-2-racing-swoop": "swoop de corrida: motor enorme com assento minúsculo, inclinado numa curva",
 "flare-s": "swoop de corrida com carenagem lisa deixando um rastro de luz",
 "aat-1": "tanque flutuante blindado com canhão principal e proa inclinada, numa campina",
 "multi-troop-transport": "transporte de tropas flutuante enorme e blindado com portas frontais abertas",
 "incom-t-47i-airspeeder": "aerospeeder utilitário de dois lugares com cabine envidraçada sobre uma cidade",
 "laat-i-gunship": "canhoneira de transporte de tropas com portas laterais abertas e torres de disparo, sobre um campo de batalha",
 "rebel-alliance-combat-snowspeeder": "aerospeeder de combate de dois tripulantes adaptado para o frio, voando rente à neve",
 "bespin-motors-storm-iv": "carro de nuvens de dois casulos ligados por um motor central entre nuvens alaranjadas",
 "radon-ulzer-podracer": "dois motores de corrida enormes puxando por cabos uma pequena cabine sobre a areia",
 "sail-barge": "barcaça flutuante de luxo com velas e convés de festa sobre dunas",
 "cargo-skiff": "plataforma de carga flutuante aberta com corrimões, sobre um mar de areia",
 "a5-juggernaut": "veículo de assalto pesado de muitas rodas com uma torre alta de observação",
 "waveskimmer": "hidrofólio de ataque deslizando sobre ondas com borrifos",
}
vehicles = load("vehicles", "items")
assert set(VEHICLE) == {v_["id"] for v_ in vehicles}, "veículos sem descrição"
for c, (d, a) in VEH_CAT.items():
    add_cat(f"vehicle-cat.{c}", "vehicle-cat", "holo-craft", "vehicle", d, a, "P1")
for it in vehicles:
    s = VEHICLE[it["id"]]
    c = slug(it["category"])
    assert c in VEH_CAT, c
    add_entity(f"vehicle.{it['id']}", "vehicle", f"data/vehicles.json#{it['id']}", "/consulta/veiculos, /consulta/veiculos/:id", "holo-craft", "vehicle",
        f"{cap(s)}. Escala {it['scale']}; design próprio, sem reproduzir o veículo dos filmes.", cap(s.split(',')[0]) + ".", "P1", [f"vehicle-cat.{c}"], focal="veículo no terço central, espaço livre acima para o nome")

# ---------------- Naves ----------------
SHIP_SCALE = {
 "starfighter": ("Pequenas naves de design próprio (um caça e um cargueiro leve) cruzando um campo de estrelas perto de um planeta.", "Caça e cargueiro leve cruzando as estrelas."),
 "capital": ("Grande nave de guerra de design próprio em órbita de um planeta, com naves menores ao redor para dar escala.", "Grande nave de guerra em órbita."),
 "personal-starship": ("Iate estelar pequeno e elegante de design próprio saindo de um hangar particular.", "Iate estelar pequeno saindo de um hangar."),
}
STARSHIP = {
 "delta-7-aethersprite-starfighter": "interceptador pequeno em forma de cunha achatada com cabine para um piloto",
 "arc-170": "caça pesado de asas que se abrem em duas camadas, com canhões longos",
 "a-wing": "interceptador compacto em cunha com dois motores laterais grandes",
 "b-wing": "caça de assalto de asa longa vertical com cabine na ponta",
 "vulture-class-droid-starfighter": "caça droide de asas dobráveis que vira andador",
 "tri-fighter": "caça droide de três braços com um sensor central",
 "eta-2-actis-interceptor": "interceptador minúsculo de painéis de asa abertos",
 "n-1-royal-starfighter": "caça elegante cromado de motores alongados",
 "tie-fighter": "caça leve de produção em massa com cabine central e grandes painéis laterais",
 "tie-bomber": "bombardeiro leve de dois casulos lado a lado entre painéis",
 "tie-interceptor": "interceptador de painéis laterais angulosos e pontiagudos",
 "x-wing": "caça de superioridade de quatro asas que se abrem em formação de ataque",
 "y-wing-s3": "caça de ataque de estrutura exposta e dois motores longos",
 "y-wing-a4": "caça de ataque de estrutura exposta, dois motores longos e torre de canhão",
 "z-95-headhunter": "caça polivalente antigo de asas fixas e cabine em bolha",
 "acclamator-assault-ship": "nave de assalto de casco em cunha desembarcando tropas",
 "banking-clan-frigate": "fragata de casco estreito com um núcleo esférico",
 "corellian-corvette": "corveta longa com uma fileira de motores brilhando na popa",
 "imperial-star-destroyer": "imensa nave de guerra em forma de cunha com torre de comando",
 "interdictor-cruiser": "cruzador pesado com grandes projetores esféricos no casco",
 "mon-calamari-mc80-star-cruiser": "cruzador de casco orgânico, bulboso e irregular",
 "nebulon-b-frigate": "fragata de escolta com casco dividido por um braço estreito",
 "republic-cruiser": "cruzador diplomático de casco vermelho e linhas suaves",
 "trade-federation-battleship": "nave de batalha em anel com uma esfera central",
 "venator-star-destroyer": "destróier estelar em cunha com um longo convés de voo",
 "firespray-patrol-attack-craft": "nave de patrulha de casco ovalado que voa na vertical",
 "ghtroc-720-freighter": "cargueiro leve de cabine lateral e casco robusto",
 "j-type-star-skiff": "iate estelar cromado de linhas suaves e asas curtas",
 "lambda-shuttle": "lançadeira de três asas, as laterais dobrando no pouso",
 "gallofree-medium-transport": "transporte médio de casco modular e motores na popa",
 "guardian-light-cruiser": "cruzador leve de alfândega com casco compacto e torres",
 "yt-1300-transport": "cargueiro leve de casco achatado e arredondado, cabine deslocada para o lado",
 "yt-2000-transport": "cargueiro leve de casco achatado com duas cabines simétricas",
 "yt-2400-transport": "cargueiro leve de casco circular com cabine num braço lateral",
}
starships = load("starships", "items")
assert set(STARSHIP) == {s_["id"] for s_ in starships}, "naves sem descrição"
for c, (d, a) in SHIP_SCALE.items():
    add_cat(f"starship-scale.{c}", "starship-scale", "holo-craft", "starship", d, a, "P1")
SHIP_SET = {"Starfighters": "num combate entre asteroides", "Capital Ships": "em órbita de um planeta, com naves menores ao redor para dar escala", "Space Transports": "saindo do hiperespaço perto de uma estação"}
for it in starships:
    s = STARSHIP[it["id"]]
    sc = slug(it["scale"])
    assert sc in SHIP_SCALE, sc
    add_entity(f"starship.{it['id']}", "starship", f"data/starships.json#{it['id']}", "/consulta/naves, /consulta/naves/:id", "holo-craft", "starship",
        f"{cap(s)}, {SHIP_SET.get(it['category'], 'no espaço')}. Escala {it['scale']}; design próprio, sem reproduzir a nave dos filmes.", cap(s) + ".", "P1", [f"starship-scale.{sc}"], focal="nave no terço central, espaço livre acima para o nome")

# ---------------- Perícias ----------------
SKILL_ATTR = {
 "dexterity": ("Figura em movimento rápido esquivando de um disparo, com rastros de luz.", "Figura esquivando de um disparo."),
 "knowledge": ("Arquivo de cristais de dados e mapas estelares projetados sobre uma mesa.", "Cristais de dados e mapas estelares."),
 "mechanical": ("Mãos num manche de pilotagem com o painel da cabine aceso.", "Mãos no manche de uma cabine."),
 "perception": ("Olhar atento refletindo uma cena distante numa viseira.", "Olhar atento refletido numa viseira."),
 "strength": ("Figura erguendo uma caixa de carga pesada com esforço.", "Figura erguendo uma caixa pesada."),
 "technical": ("Mãos com ferramentas abrindo um painel de circuitos que solta faíscas.", "Mãos consertando um painel com faíscas."),
}
SKILL = {
 "acrobatics": "figura dando um salto mortal sobre uma grade",
 "aquatic-vehicle-engineering-advanced": "projeto de um barco de design próprio sobre a prancheta holográfica",
 "aquatic-vehicle-operation": "piloto conduzindo um barco veloz entre ondas",
 "aquatic-vehicle-repair": "mecânico consertando o motor de um barco num cais",
 "archaic-guns": "atirador carregando um mosquete com pólvora",
 "archaic-starship-piloting": "piloto numa cabine antiga cheia de alavancas e mostradores",
 "armor-engineering-advanced": "projeto de armadura em camadas sobre a prancheta holográfica",
 "armor-repair": "técnico martelando uma placa de armadura amassada",
 "alien-species": "viajante consultando um guia ilustrado de seres alienígenas",
 "artillery": "artilheiro ajustando a mira de um canhão pesado",
 "astrogation": "navegador traçando uma rota de salto num mapa estelar",
 "bargain": "duas mãos regateando sobre uma pilha de créditos num balcão",
 "beast-riding": "cavaleiro montado numa criatura de carga de design próprio",
 "blaster": "atirador disparando uma pistola blaster com um raio de luz",
 "blaster-artillery": "operador de uma bateria blaster em plataforma fixa",
 "blaster-repair": "pistola blaster desmontada numa bancada com ferramentas",
 "bowcaster": "atirador alto mirando uma besta de energia",
 "bows": "arqueiro tensionando um arco longo",
 "brawling": "dois punhos se cruzando numa briga de cantina",
 "brawling-parry": "antebraço bloqueando um soco",
 "bureaucracy": "pilha de formulários e carimbos numa repartição",
 "business": "negociante fechando um contrato holográfico com aperto de mãos",
 "capital-ship-engineering-advanced": "planta de uma nave de guerra de design próprio sobre a prancheta",
 "capital-ship-gunnery": "artilheiro numa torre de turbolaser de nave grande",
 "capital-ship-piloting": "timoneiro na ponte de comando de uma nave enorme",
 "capital-ship-repair": "equipe consertando uma seção de casco de nave grande",
 "capital-ship-shields": "operador ajustando a cúpula de escudo de uma nave grande",
 "capital-ship-weapon-repair": "técnicos consertando um canhão de nave de guerra",
 "civil-industrial-engineering-advanced": "projeto de uma cidade e suas torres na prancheta holográfica",
 "climbing-jumping": "figura escalando uma parede rochosa e saltando para a borda",
 "command": "líder apontando o caminho para um grupo",
 "communications": "operador de fones ajustando frequências num console",
 "computer-engineering-advanced": "projeto de um núcleo de computador na prancheta holográfica",
 "computer-programming-repair": "mãos digitando código num terminal aberto",
 "con": "trapaceiro sorrindo enquanto esconde uma carta na manga",
 "cultures": "viajante observando um festival de outra cultura",
 "demolitions": "mãos instalando uma carga explosiva numa coluna",
 "dodge": "figura se jogando para o lado enquanto raios passam",
 "droid-engineering-advanced": "projeto de um droide de design próprio na prancheta holográfica",
 "droid-programming": "técnico ligando um cabo de dados num pequeno droide",
 "droid-repair": "pequeno droide aberto numa bancada recebendo conserto",
 "equipment-engineering-advanced": "projeto de um aparelho portátil na prancheta holográfica",
 "equipment-repair": "técnico consertando um comunicador com uma pinça",
 "firearms": "atirador disparando um rifle de projéteis",
 "first-aid": "mãos aplicando um curativo num braço ferido",
 "flamethrower": "jato de chamas iluminando um corredor escuro",
 "forgery": "falsificador copiando um selo com uma lente de aumento",
 "gambling": "dados e cartas sobre uma mesa de apostas",
 "grenade": "braço arremessando uma granada em arco",
 "ground-vehicle-engineering-advanced": "projeto de um veículo de rodas na prancheta holográfica",
 "ground-vehicle-operation": "motorista conduzindo um veículo de rodas por terreno acidentado",
 "ground-vehicle-repair": "mecânico deitado sob um veículo de rodas",
 "hide": "objeto sendo escondido num compartimento secreto",
 "hover-vehicle-engineering-advanced": "projeto de um veículo flutuante na prancheta holográfica",
 "hover-vehicle-operation": "piloto conduzindo um veículo flutuante sobre um pântano",
 "hover-vehicle-repair": "mecânico ajustando o colchão de ar de um veículo flutuante",
 "installation-engineering-advanced": "projeto de uma base fortificada na prancheta holográfica",
 "intimidation": "figura grande se inclinando ameaçadora sobre outra",
 "investigation": "investigador examinando pegadas com uma lanterna",
 "jet-pack-operation": "figura voando com mochila a jato entre plataformas",
 "languages": "balões de fala com glifos de vários alfabetos inventados",
 "law-enforcement": "distintivo de agente da lei e algemas sobre uma mesa",
 "lifting": "figura erguendo uma viga de metal",
 "lightsaber": "lâmina de energia acesa bloqueando um raio",
 "lightsaber-repair-engineering": "cabo de lâmina de energia desmontado com um cristal ao lado",
 "medicine-advanced": "médico operando com instrumentos de precisão sob luz branca",
 "melee-combat": "dois combatentes cruzando lâminas vibratórias",
 "melee-parry": "lâmina aparando um golpe de bastão",
 "missile-weapons": "lança-foguetes disparando com rastro de fumaça",
 "persuasion": "orador convencendo uma pequena plateia",
 "pick-pocket": "mão leve tirando um chip de crédito de um bolso",
 "planetary-systems": "planetas em órbita num holograma de sistema estelar",
 "podracer-operation": "piloto numa cabine minúscula puxada por dois motores",
 "powersuit-operation": "operador dentro de um exoesqueleto de carga erguendo um contêiner",
 "repulsorlift-engineering-advanced": "projeto de um motor repulsor na prancheta holográfica",
 "repulsorlift-operation": "piloto de landspeeder fazendo uma curva fechada",
 "repulsorlift-repair": "mecânico ajustando um motor repulsor",
 "rocket-pack-operation": "figura subindo com mochila foguete deixando fumaça",
 "running": "figura correndo por uma passarela",
 "scholar": "estudioso entre pilhas de cristais de dados antigos",
 "search": "figura vasculhando caixas com uma lanterna",
 "security": "mãos abrindo uma fechadura eletrônica com uma sonda",
 "sensors": "operador observando uma tela de radar com pontos de contato",
 "sneak": "figura passando pelas sombras na ponta dos pés",
 "space-transports": "piloto na cabine de um cargueiro leve com estrelas à frente",
 "space-transport-engineering-advanced": "projeto de um cargueiro na prancheta holográfica",
 "space-transports-repair": "mecânico consertando o motor de um cargueiro na doca",
 "stamina": "figura exausta continuando a marcha sob o sol",
 "starfighter-engineering-advanced": "projeto de um caça na prancheta holográfica",
 "starfighter-piloting": "piloto de caça em manobra com o horizonte inclinado",
 "starfighter-repair": "técnico sobre a asa de um caça com ferramentas",
 "starship-gunnery": "artilheiro numa torre de canhão de nave pequena mirando",
 "starship-shields": "operador desviando energia para os escudos num painel",
 "starship-weapon-repair": "técnico consertando um canhão laser de nave",
 "streetwise": "figura de capuz conversando num beco iluminado por neon",
 "submersible-vehicle-engineering-advanced": "projeto de um submarino na prancheta holográfica",
 "submersible-vehicle-operation": "piloto de submarino entre recifes escuros",
 "submersible-vehicle-repair": "técnico selando uma escotilha de submarino",
 "survival": "acampamento improvisado numa paisagem selvagem com fogueira",
 "swimming": "figura nadando contra a correnteza",
 "swoop-operation": "piloto de swoop rente ao chão em alta velocidade",
 "tactics": "peças de estratégia sobre um mapa holográfico de batalha",
 "thrown-weapons": "faca de arremesso girando no ar rumo a um alvo",
 "value": "joia sendo avaliada com uma lente sob uma luz",
 "vehicle-blasters": "artilheiro disparando o canhão de um veículo",
 "walker-engineering-advanced": "projeto de um andador na prancheta holográfica",
 "walker-operation": "piloto nos controles de um andador com vista elevada",
 "walker-repair": "mecânico consertando a junta da perna de um andador",
 "weapon-engineering-advanced": "projeto de uma arma de energia na prancheta holográfica",
 "willpower": "figura firme diante de uma tempestade, de olhos fechados",
}
skills = load("skills", "skills")
assert set(SKILL) == {s_["id"] for s_ in skills}, "perícias sem descrição"
for c, (d, a) in SKILL_ATTR.items():
    add_cat(f"skill-attr.{c}", "skill-attr", "scene-spot", "skill", d, a, "P3", sizes=SPOT_SCENE_SIZES, aspect="1:1")
for it in skills:
    s = SKILL[it["id"]]
    adv = " Perícia avançada: um selo discreto com a letra A no canto." if it.get("advanced") else ""
    add_entity(f"skill.{it['id']}", "skill", f"data/skills.json#{it['id']}", "/consulta/pericias, /consulta/pericias/:id, ficha (detalhe da perícia), assistente (perícias)", "scene-spot", "skill",
        f"Cena simbólica: {s}.{adv}", cap(s) + ".", "P3", [f"skill-attr.{it['attribute']}"], sizes=SPOT_SCENE_SIZES, aspect="1:1")

# ---------------- Poderes da Força ----------------
POWER_SKILL = {
 "control": ("Figura meditando de pernas cruzadas envolta num halo branco-azulado calmo.", "Figura meditando envolta em luz calma."),
 "sense": ("Ondas violeta saindo de uma figura de olhos fechados e tocando formas de vida ao redor.", "Ondas violeta tocando seres ao redor."),
 "alter": ("Mão estendida fazendo pedras flutuarem com energia ciano em movimento.", "Mão estendida fazendo pedras flutuarem."),
 "control-sense": ("Figura meditando com um halo calmo e ondas violeta se espalhando.", "Figura meditando com halo e ondas violeta."),
 "control-alter": ("Figura concentrada com halo calmo enquanto energia ciano se move a partir das mãos.", "Figura com halo calmo movendo energia."),
 "sense-alter": ("Ondas violeta e energia ciano formando uma cúpula ao redor de uma figura.", "Cúpula de energia ao redor de uma figura."),
 "control-sense-alter": ("Três círculos de luz (branco, violeta e ciano) entrelaçados em torno de uma figura serena.", "Três círculos de luz em torno de uma figura."),
 "none": ("Figura soltando um grito que ondula o ar ao redor em tom escuro.", "Grito ondulando o ar ao redor."),
}
DARK = {"injure-kill", "force-lightning", "inflict-pain", "feed-on-dark-side", "drain-life-essence", "telekinetic-kill", "create-force-storms", "force-scream", "rage", "control-mind"}
POWER = {
 "absorb-dissipate-energy": "mão aberta absorvendo um raio de energia que se dissolve em faíscas",
 "accelerate-healing": "ferida se fechando sob um brilho suave numa figura em repouso",
 "burst-of-speed": "figura correndo com rastros de luz atrás de si",
 "concentration": "figura de olhos fechados com tudo ao redor desfocado",
 "contort-escape": "figura se soltando de algemas ao contorcer as mãos",
 "control-disease": "figura febril envolta num brilho que afasta a doença",
 "control-pain": "figura ferida de pé com expressão serena",
 "detoxify-poison": "gotas escuras saindo de uma mão e se dissolvendo em luz",
 "emptiness": "figura imóvel em meditação profunda num vazio escuro",
 "enhance-attribute": "músculos de um braço iluminados por veios de luz",
 "force-of-will": "figura firme diante de uma onda de sombra",
 "hibernation-trance": "figura deitada em transe com a respiração visível como névoa lenta",
 "instinctive-astrogation-control": "piloto de olhos fechados com rotas estelares brilhando à frente",
 "rage": "figura tomada por uma aura vermelha furiosa",
 "reduce-injury": "golpe atingindo uma figura e se dissipando em luz",
 "remain-conscious": "figura caída lutando para ficar de olhos abertos",
 "remove-fatigue": "andarilho cansado recuperando a postura sob um brilho",
 "resist-stun": "faíscas azuis de atordoamento escorrendo pelo corpo sem efeito",
 "short-term-memory-enhancement": "imagens de memória flutuando ao redor da cabeça",
 "up-the-walls": "figura correndo pela parede de um corredor",
 "beast-languages": "figura de mãos estendidas conversando com uma criatura selvagem",
 "combat-sense": "figura cercada de oponentes com linhas de ataque previstas em luz",
 "danger-sense": "silhueta virando a cabeça a tempo de ver uma sombra atrás",
 "direction-sense": "figura numa floresta com uma linha de luz apontando o caminho",
 "instinctive-astrogation": "navegador sentindo uma rota estelar como um fio luminoso",
 "life-detection": "pontos de luz vivos aparecendo atrás de uma parede",
 "life-sense": "figura seguindo um fio de luz até uma pessoa distante",
 "life-web": "teia de fios luminosos ligando muitos seres vivos",
 "magnify-senses": "olho e ouvido ampliados com ondas de som e luz",
 "merge-senses": "figura vendo pelos olhos de um pássaro em voo",
 "postcognition": "figura tocando um objeto e vendo uma cena do passado em sépia",
 "predict-natural-disaster": "figura olhando um vulcão adormecido com rachaduras de luz",
 "receptive-telepathy": "ondas de pensamento chegando até uma figura de olhos fechados",
 "sense-force": "lugar antigo pulsando com uma aura ao redor",
 "sense-force-potential": "criança com um brilho discreto vista por uma figura atenta",
 "sense-path": "figura diante de dois caminhos, um iluminado e outro sombrio",
 "shift-sense": "olho vendo em faixas de calor e frequência",
 "translation": "glifos desconhecidos se reorganizando em sentido diante de uma figura",
 "weather-sense": "figura sentindo o vento com nuvens de tempestade ao longe",
 "force-push": "onda invisível derrubando caixas para trás",
 "injure-kill": "mão erguida com energia escura apontada para uma sombra",
 "kinetic-combat": "armas flutuando e se movendo ao redor de uma figura em luta",
 "telekinesis": "objeto pesado flutuando acima de uma mão estendida",
 "farseeing": "figura de olhos fechados vendo uma cena distante num círculo de luz",
 "life-bond": "duas figuras ligadas por um fio de luz constante",
 "lifemerge": "figura se fundindo à luz de uma floresta viva",
 "lightsaber-combat": "lâmina de energia antecipando e bloqueando vários raios",
 "projective-telepathy": "pensamento sendo enviado como uma onda até outra mente",
 "accelerate-another-s-healing": "mãos sobre um ferido emitindo um brilho curativo",
 "control-another-s-disease": "mão sobre a testa de um doente afastando a febre",
 "control-another-s-pain": "mão no ombro de um ferido aliviando sua dor",
 "control-breathing": "figura respirando debaixo d'água com uma bolha de calma",
 "detoxify-another-s-poison": "veneno escuro sendo puxado do braço de outra pessoa",
 "feed-on-dark-side": "figura absorvendo uma névoa vermelha que sai de outros",
 "force-jump": "figura saltando muito alto sobre um abismo",
 "force-lightning": "raios arroxeados saindo dos dedos de uma figura encapuzada sombria",
 "inflict-pain": "mão fechando-se enquanto uma aura vermelha cerca a vítima distante",
 "place-another-in-hibernation-trance": "mão sobre um ferido que adormece em transe",
 "redirect-energy": "raio de energia sendo desviado por uma mão de volta ao atirador",
 "remove-another-s-fatigue": "mão revigorando um companheiro cansado",
 "return-another-to-consciousness": "figura desmaiada abrindo os olhos sob um toque de luz",
 "transfer-force": "luz passando de uma figura para outra caída",
 "dim-another-s-senses": "guarda com a visão embaçada enquanto uma figura passa",
 "greater-force-shield": "grande cúpula de energia protegendo um grupo",
 "lesser-force-shield": "pequena cúpula de energia ao redor de uma figura",
 "affect-mind": "guarda confuso olhando para o lado errado",
 "battle-meditation": "figura em meditação com aliados brilhando num campo de batalha ao fundo",
 "control-mind": "figura sombria guiando outra como marionete com fios de luz",
 "create-force-storms": "tempestade de energia rodopiando no espaço",
 "doppleganger": "figura e uma cópia luminosa idêntica lado a lado",
 "drain-life-essence": "plantas murchando ao redor de uma figura sombria",
 "enhanced-coordination": "esquadrão movendo-se em sincronia perfeita, ligado por fios de luz",
 "force-harmony": "círculo de figuras de mãos dadas com uma luz compartilhada",
 "projected-fighting": "golpe à distância atingindo um oponente sem contato",
 "telekinetic-kill": "mão erguida e uma sombra vermelha apertando o ar",
 "transfer-life": "essência luminosa passando de um corpo para outro",
 "force-scream": "figura gritando com ondas escuras se espalhando",
}
powers = load("force-powers", "powers")
assert set(POWER) == {p_["id"] for p_ in powers}, "poderes sem descrição"
for c, (d, a) in POWER_SKILL.items():
    add_cat(f"power-skill.{c}", "power-skill", "scene-spot", "power", d, a, "P3", sizes=SPOT_SCENE_SIZES, aspect="1:1")
for it in powers:
    s = POWER[it["id"]]
    key = "-".join(it["skills"]) if it["skills"] else "none"
    assert key in POWER_SKILL, key
    tone = " Tom sombrio, luz vermelha de recorte no lugar do âmbar (lado sombrio)." if it["id"] in DARK else " Tom sereno."
    add_entity(f"power.{it['id']}", "power", f"data/force-powers.json#{it['id']}", "/consulta/poderes, /consulta/poderes/:id, ficha (poderes), assistente (Força)", "scene-spot", "power",
        f"Cena simbólica: {s}.{tone}", cap(s) + ".", "P3", [f"power-skill.{key}"], sizes=SPOT_SCENE_SIZES, aspect="1:1")

for i in items:
    i.setdefault("fallback", [])

ids = [i["id"] for i in items]
assert len(ids) == len(set(ids)), "ids duplicados"
known = set(ids)
for i in items:
    for f_ in i["fallback"]:
        assert f_ in known, f"reserva inexistente: {f_}"

manifest = {
    "id": "image-manifest", "version": 2, "updated": "2026-10-29",
    "owner": "PM r2-d6", "related": ["docs/image-briefs.md", "docs/visual-direction.md"],
    "conventions": {
        "id": "estável, minúsculo, ponto separa grupo e nome; nunca reutilizar um id para outra imagem",
        "file": "null enquanto não existe; quando existir, caminho relativo à pasta pública do app web, ex.: img/species/wookiees.webp (o arquiteto define a raiz)",
        "status": "missing | draft | approved | rejected",
        "formats": "AVIF + WebP com fallback JPEG para fotos e pinturas; PNG/WebP com alfa para spot-illustration; SVG para icon-glyph",
        "focal_point": "onde o recorte deve preservar o assunto; o app usa object-position a partir dele",
        "ip": "Arte original que evoca o universo. Proibido: logotipos, marcas, fontes da Lucasfilm, quadros ou personagens dos filmes, designs exatos de naves, armaduras e droides dos filmes.",
        "entity_ids": "Entidades da consulta usam <família>.<id do registro em data/>: weapon.<id> (data/weapons.json), armor.<id> (data/armor.json), gear.<id> (data/gear.json), vehicle.<id> (data/vehicles.json), starship.<id> (data/starships.json), skill.<id> (data/skills.json), power.<id> (data/force-powers.json), species.<id> (data/species.json; Geonosian tem geonosian-worker e geonosian-aristocrat), template.<id> (data/templates.json). data_ref aponta para o registro.",
        "category_ids": "Reservas por categoria: weapon-cat.<category>, armor-cat.<light|military|heavy> (agrupamento do produto; o mapeamento está no campo fallback de cada armadura), gear-cat.<category>, vehicle-cat.<slug de category> (ex.: Speeder Bikes -> speeder-bikes), starship-scale.<slug de scale> (Starfighter -> starfighter, Capital -> capital, Personal Starship -> personal-starship), skill-attr.<attribute>, power-skill.<skills unidos por hífen na ordem control, sense, alter> (ex.: control-sense-alter; sem perícia -> none).",
        "fallback": "Cadeia de reserva: 1) a imagem do próprio item (file do id); 2) os ids do campo fallback, em ordem, usando o primeiro com file preenchido; 3) o placeholder do campo placeholder do item (placeholder da família). O código deve ler o campo fallback em vez de derivar a categoria. Itens sem reserva têm fallback vazio e vão direto ao placeholder. Reservas de categoria não têm reserva própria.",
    },
    "styles": STYLES,
    "placeholders": PLACEHOLDERS,
    "placeholder_rule": "Enquanto file for null, o componente desenha o placeholder do campo placeholder: o gradiente, uma sobreposição de scanlines (repeating-linear-gradient 0deg, rgba(79,209,255,.05) 0 1px, transparente 1px 3px), o ícone (nomes do conjunto Lucide) centralizado em accent a 45% de opacidade e, só em ambiente de desenvolvimento, o id em fonte mono 11 px no canto inferior. A proporção é a mesma da imagem final para não haver salto de layout.",
    "count": len(items),
    "items": items,
}
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

# ---- Markdown
groups = [
 ("auth", "Login e cadastro"), ("hangar", "Hangar (painel inicial)"), ("creation", "Criação de personagem"),
 ("template", "Templates (26)"), ("species", "Espécies (48 stat blocks de 47 espécies)"), ("reference", "Consulta: categorias"),
 ("mesa", "Modo mesa"), ("campaign", "Campanha, convite e mestre"), ("holocron", "Holocron (assistente de regras)"),
 ("account", "Conta e retrato"), ("marketing", "Ícone do app e compartilhamento"), ("state", "Estados vazios"),
 ("error", "Erros"), ("icon", "Ícones (SVG)"),
 ("weapon-cat", "Armas: reservas por categoria"), ("weapon", "Armas (63)"),
 ("armor-cat", "Armaduras: reservas por categoria"), ("armor", "Armaduras (15)"),
 ("gear-cat", "Equipamentos: reservas por categoria"), ("gear", "Equipamentos (54)"),
 ("vehicle-cat", "Veículos: reservas por categoria"), ("vehicle", "Veículos (24)"),
 ("starship-scale", "Naves: reservas por escala"), ("starship", "Naves (34)"),
 ("skill-attr", "Perícias: reservas por atributo"), ("skill", "Perícias (110)"),
 ("power-skill", "Poderes da Força: reservas por perícia da Força"), ("power", "Poderes da Força (77)"),
]
assert {g for g, _ in groups} == {i["group"] for i in items}, "grupo sem seção no markdown"
out = io.StringIO()
w = out.write
w("---\nid: image-briefs\nstatus: draft-v2\nowner: PM r2-d6\nrelated: [docs/image-manifest.json, docs/visual-direction.md, docs/product-spec-v2.md]\n---\n\n")
w("# Espaços de imagem: briefs\n\n")
w("Fonte legível dos espaços de imagem do app. O código usa `docs/image-manifest.json` (mesmos `id`s, mais campos técnicos). As duas versões são geradas da mesma lista; ao mudar uma imagem, mude as duas.\n\n")
w(f"**Total: {len(items)} espaços.** Prioridade P1 = necessária para o protótipo parecer pronto; P2 = enriquece depois; P3 = cauda longa (perícias e poderes).\n\n")
w("## Regras para quem for criar as imagens\n\n")
w("- **Arte original que evoca o universo.** Nada de logotipos, marcas, fontes ou símbolos registrados da Lucasfilm; nada de quadros dos filmes; nada de personagens conhecidos; naves, armaduras e droides devem ser de design próprio (silhuetas e proporções que lembram o gênero, sem copiar modelos). Espécies descritas pelos traços do livro, em interpretação própria.\n")
w("- **Sem texto dentro da imagem.** Títulos e rótulos são do app (tradução, acessibilidade, legibilidade).\n")
w("- **Escuro por natureza.** As imagens vivem sobre o tema escuro; evitar fundos claros e brancos estourados. Luz-chave ciano, recorte âmbar (ver `docs/visual-direction.md`).\n")
w("- **Ponto focal.** Cada imagem indica onde fica o assunto; o app recorta por plataforma a partir dele.\n")
w("- **Coerência de série.** Templates e espécies são cartas da mesma coleção: mesmo enquadramento (busto 3/4), mesma luz, mesmo anel holográfico atrás da cabeça.\n")
w("- **Entidades da consulta.** Armas, armaduras, equipamentos, veículos, naves, perícias e poderes têm uma imagem por item (`<família>.<id>`, `data_ref` aponta para o registro). Itens com nome de modelo conhecido dos filmes são descritos pela função e pela silhueta genérica: a arte deve ser um design próprio, nunca a nave, o veículo, a arma ou a armadura dos filmes.\n")
w("- **Cadeia de reserva.** Enquanto a imagem do item não existe, o app usa a primeira imagem existente da lista `fallback` do item (a reserva da categoria) e, sem ela, o placeholder da família. Por isso as reservas de categoria vêm antes na fila de produção.\n")
w("- **Ferramenta de geração.** Se usar IA generativa, registrar ferramenta, data e prompt final no manifesto (campo a acrescentar) e verificar os termos de uso comercial da ferramenta. Revisão humana obrigatória antes de `approved`.\n\n")
w("## Estilos\n\n| Estilo | Descrição (sufixo do prompt) |\n|---|---|\n")
for k, v in STYLES.items(): w(f"| `{k}` | {v} |\n")
w("\n## Placeholder padrão (enquanto a imagem não existe)\n\n")
w(manifest["placeholder_rule"] + "\n\n| Placeholder | Gradiente | Ícone | Cor de destaque |\n|---|---|---|---|\n")
for k, v in PLACEHOLDERS.items(): w(f"| `{k}` | `{v['gradient']}` | `{v['icon']}` | `{v['accent']}` |\n")
w("\n")
for g, title in groups:
    gi = [i for i in items if i["group"] == g]
    if not gi: continue
    w(f"## {title}\n\n")
    first = gi[0]
    same = all(i["sizes"] == first["sizes"] and i["style"] == first["style"] and i["component"] == first["component"] for i in gi) and len(gi) > 3
    if same:
        sz = "; ".join(f"{k}: {v}" for k, v in first["sizes"].items())
        w(f"Comum a todos: aparece em {first['screen']} (`{first['component']}`); proporção {first['aspect']}; tamanho {sz}; estilo `{first['style']}`; placeholder `{first['placeholder']}`; ponto focal: {first['focal_point']}.\n\n")
        has_fb = any(i.get("fallback") for i in gi)
        w("| id | Descrição (prompt) | Texto alternativo | Prio |" + (" Reserva |" if has_fb else "") + "\n|---|---|---|---|" + ("---|" if has_fb else "") + "\n")
        for i in gi:
            ref = f" Dados: `{i['data_ref']}`." if i["data_ref"] else ""
            fb = (" " + ", ".join(f"`{x}`" for x in i["fallback"]) + " |") if has_fb else ""
            w(f"| `{i['id']}` | {i['description']}{ref} | {i['alt'] or '(decorativa, alt vazio)'} | {i['priority']} |{fb}\n")
        w("\n")
    else:
        for i in gi:
            sz = "; ".join(f"{k}: {v}" for k, v in i["sizes"].items())
            w(f"### `{i['id']}`\n\n")
            w(f"- **Onde**: {i['screen']}, componente `{i['component']}`\n")
            w(f"- **Proporção e tamanho**: {i['aspect']}; {sz}\n")
            w(f"- **Estilo**: `{i['style']}`; placeholder `{i['placeholder']}`; ponto focal: {i['focal_point']}; prioridade {i['priority']}\n")
            w(f"- **Descrição**: {i['description']}\n")
            w(f"- **Alt**: {i['alt'] or '(decorativa, alt vazio)'}\n\n")
with open(OUT_MD, "w", encoding="utf-8") as f:
    f.write(out.getvalue())
print(len(items))
from collections import Counter
print(Counter(i["group"] for i in items))
