---
id: product-spec
status: draft-v1
owner: PM r2-d6
related: [docs/ux-platforms.md, docs/rules-decisions.md, docs/backlog.md, data/INDEX.md]
---

# r2-d6: especificação de produto (protótipo do jogador)

Aplicativo web de apoio ao jogador de **Star Wars Roleplaying Game: Revised, Expanded and Updated (REUP)**, sistema D6. O jogo acontece na mesa física; o app ajuda a preparar, consultar e acompanhar, sem substituir os dados nem o mestre. Regras: `data/` (fase 1, visão do jogador). Decisões de regra: `docs/rules-decisions.md` (RD-xx, PD-xx). Experiência por plataforma: `docs/ux-platforms.md`. Backlog: `docs/backlog.md`.

## 1. Personas

| Persona | Contexto | O que precisa |
|---|---|---|
| **Jogador novato** (Ana) | Primeira campanha; não leu o livro de 500 páginas. | Criar um personagem válido sem errar a conta de dados; entender o que cada número significa; saber o que rolar. |
| **Jogador veterano** (Bruno) | Joga D6 há anos; edições antigas na memória. | Rapidez: ficha limpa, rolador e controle de pontos no celular; confirmar a regra da REUP quando diverge da que ele lembra. |
| **Mestre** (Carla) | Fora do foco desta fase; aprova personagens e decide o Wild Die 1. | Receber a ficha do jogador (exportação/QR), conferir se ela é válida, ver o que é regra da casa. |

## 2. Problemas

1. **Criação de personagem é cheia de contas fáceis de errar**: 18D de atributos, 7D de perícias com teto de 2D, especializações (1D = três), perícias avançadas com pré-requisito, limites por espécie, Force Points iniciais. (p.21-25)
2. **Durante a sessão o jogador perde o controle do estado**: ações declaradas e penalidade, ferimento atual, stuns ativos, CP/FP gastos no round (e a proibição de usar os dois), munição.
3. **Consultar o livro na mesa é lento**: a regra está espalhada em capítulos; termos em inglês; páginas.
4. **A ficha em papel se perde ou fica ilegível**, e passar a ficha para o mestre é manual.

## 3. Visão

> Um companheiro de mesa que cabe no bolso: prepara o personagem no PC, acompanha o round no tablet ou no celular, responde "qual é a regra?" em segundos e sempre diz a página do livro.

Princípios:
- **A mesa manda**: dados físicos são o padrão; o app calcula e lembra. Decisões do mestre aparecem como opções, nunca automáticas (PD-03, PD-04).
- **Citação sempre**: toda regra mostrada traz a página impressa `(p.N)`; leitura provisória e regra da casa têm selo.
- **Offline primeiro**: PWA, sem rede em tempo de execução (PD-01).
- **Cada tela no seu aparelho**: o mesmo app muda de forma, não só de tamanho (`docs/ux-platforms.md`).

## 4. Módulos

| Módulo | Resumo | Plataforma principal |
|---|---|---|
| M1 Assistente de criação | Passo a passo a partir de template ou do zero, com validação ao vivo. | PC, tablet |
| M2 Ficha | Ficha editável, vários personagens, salva localmente, exportação/importação JSON, impressão. | Todas |
| M3 Modo mesa | Round: ações declaradas e penalidade, rolador com Wild Die, CP/FP, ferimentos, stuns, munição, calculadoras (dano x resistência, escala, dificuldade). | Celular, tablet |
| M4 Consulta de regras | Busca nos `rules/*.md` e nas entidades (perícias, poderes, espécies, armas, armaduras, equipamentos, veículos, naves, templates, tabelas), com página. | PC, tablet |
| M5 Glossário | Termos oficiais com link para a regra. | Todas |
| M6 Compartilhar | Exportar JSON, imprimir, QR (depois). | PC, celular |

## 5. Escopo (MoSCoW)

**Must (protótipo)**
- M1: caminho por template (26) e do zero (espécie + 6D); 7D de perícias com teto; especializações; avançadas com pré-requisito simples; Força (sensibilidade, perícias, poderes com pré-requisitos); equipamento inicial do catálogo; resumo e validação.
- M2: CRUD local de vários personagens; edição; exportação/importação JSON validada contra o schema (campos obrigatórios); impressão em A4 com 18 caixas de munição.
- M3: rolador com Wild Die (explosão, 1 com as três opções), parada calculada a partir da ficha (perícia, especialização, penalidades), CP (limite por tipo) e FP (dobra) com exclusão no round, ações declaradas, ferimentos com progressão, stuns, munição, calculadora de dano x resistência com escala.
- M4/M5: busca de texto em regras, entidades e glossário; navegação por categoria; página citada; selos de errata.
- Responsivo real: lateral no PC, abas/split no tablet, barra inferior no celular; modo escuro; offline (service worker).

**Should**
- Evolução de personagem com custo em CP (RD-40) e tempo de treino.
- Contador de rounds Mortally Wounded com a rolagem de 2D (RD-25).
- Tela ligada (Wake Lock) no modo mesa.
- Histórico das últimas rolagens.
- Atalhos de teclado no PC (busca `/`, rolar `R`, próximo round `N`).

**Could**
- QR com a ficha compacta para o mestre.
- Bônus automático de criação do Ewok (RD-38) e vantagens/desvantagens (RD-39) no assistente.
- Rolagem simplificada de paradas grandes (RD-43).
- Combinar ações (líder com command).

**Won't (agora)**
- Ferramentas do mestre (fase 2 não destilada): NPCs, criaturas, droides, encontros, iniciativa de grupo.
- Sincronização em nuvem ou multijogador em tempo real.
- Naves do grupo como ficha própria (só consulta).

## 6. User stories e critérios de aceite

Formato: Dado / Quando / Então. Os exemplos numéricos vêm do livro; a página está entre parênteses.

### Épico E1: rolagem (Wild Die)

**US-01** Como jogador, quero rolar uma perícia com o Wild Die destacado para não confundir o dado especial. (RD-02)
- Dado 5D, quando os dados normais saem 1, 2, 5, 6 e o Wild Die sai 2, então o total é **16** (p.73).
- Dado 5D, quando os normais saem 2, 4, 5, 2 e o Wild Die sai 6, 6, 3, então o total é **28** e a sequência 6, 6, 3 aparece no Wild Die (p.73).
- Dado 1D, quando rolo, então o único dado é o Wild Die.
- Dado 0D (perícia reduzida a 0), quando tento rolar, então o app bloqueia e explica (RD-08).

**US-02** Como jogador, quero que um 1 no Wild Die leve a decisão ao mestre. (RD-03, RD-04)
- Dado 6D, quando os normais saem 3, 4, 2, 5, 3 e o Wild Die sai 1 na primeira rolagem, então o app mostra o total normal 18 e três botões; ao escolher "subtrair o 1 e o maior dado", o total vira **12** (p.73).
- Dado a opção "complicação", então o total continua 18 e o resultado ganha a marca "complicação".
- Dado um Wild Die que saiu 6 e depois 1, então o 1 soma normalmente e **não** abre as opções.
- Dado 1D com Wild Die 1 e opção (c), então o total é igual aos pips, e nunca negativo (selo "regra da casa").

**US-03** Como jogador, quero digitar o resultado dos dados físicos em vez de rolar no app. (PD-03)
- Dado o modo "dados físicos", quando digito os valores dos dados e do Wild Die, então o app calcula o total pelas mesmas regras da US-01 e US-02.

### Épico E2: round, ações múltiplas e pontos

**US-04** Como jogador, quero declarar quantas ações farei no round e ver a penalidade aplicada em toda rolagem. (RD-07, RD-08, RD-09)
- Dado blaster 5D e 2 ações declaradas, então a parada mostrada é **4D**.
- Dado 4 ações declaradas, então a penalidade é **-3D** em toda perícia e atributo (p.78).
- Dado uma rolagem de dano, resistência a dano ou iniciativa, então a penalidade de ações **não** é aplicada.
- Dado 1 ação declarada e uma esquiva como ação extra, então as rolagens seguintes do round recebem -1D.
- Dado dodge com resultado 27 como reação total e ataques de dificuldade 13 e 8, então as novas dificuldades são **40** e **35** (p.91).

**US-05** Como jogador, quero gastar Character Points depois de ver a rolagem. (RD-10, RD-11, RD-12)
- Dado uma rolagem de perícia, quando tento gastar o 3º CP, então o app bloqueia (máximo 2) e mostra o limite (p.85).
- Dado uma rolagem de dodge, de especialização ou de Strength para resistir a dano, então o limite é **5**.
- Dado um dado de CP que sai 6, então ele explode como o Wild Die; dado um dado de CP que sai 1, então soma 1, com selo E-009.
- Dado que gastei 1 CP, então o saldo de CP da ficha diminui 1 e o histórico registra o gasto.

**US-06** Como jogador, quero gastar um Force Point e ver os códigos dobrados até o fim do round. (RD-12, RD-13, RD-14, RD-15)
- Dado search 4D, quando ativo o FP, então a parada é **8D** (p.85).
- Dado Strength 3D+2 e vibro-ax STR+2D, quando ativo o FP no dano, então a parada é **6D+4 + 2D** (p.85).
- Dado FP ativo no round, quando tento gastar CP, então o app bloqueia com a citação (p.78, p.84); e vice-versa.
- Dado FP já gasto neste round, quando tento outro, então o app bloqueia (um por round).
- Dado dano de blaster 4D com FP ativo, então o dano continua 4D (não é do personagem).
- Dado 4D, 2 ações e FP, então a parada é 7D (selo "regra da casa", RD-14).
- Dado um personagem não sensível com 5 FP, quando tento somar o 6º, então o app avisa o limite (p.85).
- Dado "próximo round", então FP e CP ficam liberados de novo e as ações declaradas voltam a 1.

### Épico E3: ferimentos e dano

**US-07** Como jogador, quero calcular o resultado de um ferimento a partir do dano e da minha resistência. (RD-17, RD-23, RD-24)
- Dado dano 18 e resistência 14, então a diferença 4 resulta em **Wounded**; diferença 3 em Stunned; 9 em Incapacitated; 13 em Mortally Wounded; 16 em Killed; 0 ou negativa sem efeito.
- Dado que o personagem está Wounded, quando rolo a resistência, então a Strength é a **cheia** (sem -1D) mais armadura (física ou energia, conforme o ataque).
- Dado um ataque de escala starfighter (6D) contra um speeder (2D), então a calculadora diz: ajuste 4D; maior ataca menor; alvo soma 4D na esquiva; atacante soma 4D no dano (p.95).
- Dado um ataque de character contra speeder, então: ajuste 2D; atacante soma 2D no ataque; alvo soma 2D na resistência.

**US-08** Como jogador, quero marcar o ferimento e ver a penalidade nas rolagens. (RD-18 a RD-22, RD-25, RD-26)
- Dado Wounded, quando recebo outro Wounded, então passo a **Wounded twice** e a penalidade é -2D.
- Dado Wounded twice, quando recebo Wounded, então passo a **Incapacitated** e o app bloqueia ações.
- Dado Incapacitated, quando recebo Wounded ou Incapacitated, então passo a **Mortally Wounded**; dado Mortally Wounded, quando recebo Incapacitated ou Mortally, então **Killed**.
- Dado Mortally Wounded e um novo Wounded, então **Killed** (regra da casa RD-19, com selo).
- Dado Strength 3D e 3 stuns ativos, então o app avisa "inconsciente 2D minutos" (p.100).
- Dado Wounded e 1 stun ativo, então a penalidade é -2D (regra da casa RD-21).
- Dado Mortally Wounded há 3 rounds, quando rolo 2D e sai 2, então o app indica morte (2 < 3) (p.101).
- Dado uma arma em stun e resultado Wounded, então o app marca "inconsciente 2D minutos" e não registra ferimento (p.101).

### Épico E4: criação de personagem

**US-09** Como jogador novato, quero criar um personagem a partir de um template sem errar as contas. (RD-28 a RD-37)
- Dado o template Smuggler (Dex 3D+1, Kno 2D+1, Mec 3D+2, Per 3D, Str 3D, Tec 2D+2; total 18D; p.495), então o assistente mostra os atributos do template e o total 18D.
- Dado 7D de perícias, quando ponho +1D em blaster, então blaster = **4D+1** (Dex 3D+1 + 1D) e restam 6D.
- Dado uma perícia com +2D, quando tento +1D a mais, então o app bloqueia (teto 2D, p.21).
- Dado uma perícia não listada no template, então ela só aceita dados com "permissão do mestre" marcada.
- Dado 1D gasto em especializações, então o app pede três nomes; cada uma = perícia base + 1D (ou atributo + 1D se a perícia não foi melhorada): Knowledge 2D+2 → alien species: Wookiees **3D+2** (p.21).
- Dado (A) medicine, quando first aid < 5D, então o app bloqueia; com first aid 5D, (A) medicine começa em **1D** (p.22).
- Dado 7D não totalmente gastos, então o resumo mostra "dados não gastos" como aviso (não bloqueia salvar, o mestre decide).
- Dado sensível à Força = sim, então Force Points = 2; não = 1; Character Points = 5 (p.21-22).
- Dado o template Young Jedi (15D de atributos + control, sense, alter 1D), então o total conferido é **18D** e o personagem é obrigatoriamente sensível; o app pede **3** poderes e só oferece poderes cujas perícias o personagem tem e cujos poderes exigidos já foram escolhidos.
- Dado o template Bounty Hunter (impresso "No"), então a sensibilidade fica "não" e não pode ser alterada sem aviso.

**US-10** Como jogador, quero criar um template novo a partir de uma espécie. (RD-33, RD-42)
- Dado humano (12D, 2D/4D), então tenho **18D** para distribuir e cada atributo fica entre 2D e 4D; 3 pips viram 1D.
- Dado Wookiee, então os limites mínimo/máximo são os do `species.json` e Move inicial é o primeiro número de "11/15".
- Dado que compro control 1D com permissão do mestre, então restam 17D para os atributos e nenhum atributo pode ficar abaixo do mínimo.
- Dado a Republic Clone (attribute dice em texto), então o app pede a distribuição manual e mostra o texto da espécie.

**US-11** Como jogador, quero escolher equipamento inicial do catálogo com os créditos que tenho.
- Dado 2.000 créditos e uma blaster pistol de 500, quando adiciono, então restam 1.500 e a arma vai para a ficha com dano 4D, alcance 3-10/30/120 e munição 100 (p.351).
- Dado um item sem preço numérico, então ele entra sem descontar e com aviso "preço a combinar com o mestre".

### Épico E5: ficha

**US-12** Como jogador, quero vários personagens salvos no aparelho.
- Dado um personagem criado, quando recarrego a página, então ele continua lá com todos os valores.
- Dado dois personagens, quando troco o ativo, então o modo mesa usa o personagem escolhido.

**US-13** Como jogador, quero exportar e importar a ficha em JSON.
- Dado exportar, então o arquivo segue `character-sheet.schema.json` (dados como `{dice, pips, text}`, ids das perícias), com extensões em `x_app`.
- Dado importar um JSON sem `name` ou `attributes`, então o app recusa e diz quais campos faltam.

**US-14** Como jogador, quero imprimir a ficha.
- Dado imprimir, então sai uma ficha em A4, preto e branco, com atributos, perícias, Force, pontos, caixas de ferimento (Stunned 1, Wounded 2, Incapacitated 1, Mortally 1), armas com 18 caixas de munição e equipamento (p.501-502).

### Épico E6: consulta

**US-15** Como jogador, quero buscar uma regra por palavra.
- Dado a busca "wild die", então o primeiro resultado é a seção do Wild Die com (p.73).
- Dado a busca "AT-AT", então aparece o veículo com sua página.
- Dado uma regra ligada a um item `open` do errata, então aparece o selo "leitura provisória E-0xx" com a leitura.

## 7. Especificação técnica do protótipo

- **Pilha**: HTML + CSS + JavaScript (ES modules), sem build, sem bibliotecas externas, sem rede em tempo de execução. PWA: `manifest.webmanifest` + `sw.js` (cache do app e do bundle).
- **Dados**: `tools/build_app_data.py` lê `data/*.json`, `data/tables/*.json`, `data/rules/*.md`, `data/glossary.md` e o registro de `data/errata.md` e grava `app/data/bundle.json`. Ele também gera: mapa nome de perícia do template → id (RD-35), espécie do template (RD-34), pré-requisitos simples das perícias avançadas (RD-31), mapa nome → id dos poderes exigidos, Move inicial numérico (RD-42), seções das regras com âncora e páginas, e o índice de busca. Ele relata o que não conseguiu mapear.
- **Lógica pura e testável**: `app/js/dice.js` (códigos, soma, normalização, Wild Die com RNG injetável), `app/js/rules.js` (penalidades, CP/FP, ferimentos, escala, validação de criação, custos de evolução). Testes com `node --test` em `app/tests/`.
- **Armazenamento**: `localStorage`, chave por personagem; exportação/importação JSON.
- **Servir**: `python -m http.server 8080 --directory app` e abrir `http://localhost:8080/`.
