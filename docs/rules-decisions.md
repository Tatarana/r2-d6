---
id: rules-decisions
status: draft-v1
owner: PM r2-d6
scope: protótipo web do jogador (fase 1)
---

# Decisões de regra e de produto

Cada decisão diz **de onde vem** (página impressa do livro REUP, arquivo da base, ID do errata) e **de que tipo é**:

- **RAW** (rules as written): o livro diz isso; o app só implementa.
- **PROV**: o app segue a leitura provisória de um item `open` de `data/errata.md`; a tela mostra o selo "leitura provisória E-0xx".
- **CASA**: o livro é omisso ou ambíguo; é uma **decisão de regra da casa** recomendada pelo PM, nunca regra oficial. A tela mostra o selo "regra da casa" e, quando faz sentido, um ajuste para desligar.
- **PROD**: decisão de produto (não é regra do jogo).

Status: `proposta` (aguarda o usuário), `aceita`, `rejeitada`. Tudo começa como `proposta` neste protótipo.

## Regras (RD)

| ID | Tema | Decisão | Tipo | Fonte | Status |
|---|---|---|---|---|---|
| RD-01 | Códigos de dados | Código = `{dice, pips}`; ao somar ou distribuir, 3 pips viram 1D (2D+2 +1 pip = 3D). Exibição `ND+P`. | RAW | p.8-9, p.23; `rules/core-mechanics.md#die-codes` | proposta |
| RD-02 | Wild Die | Sempre que a parada tem 1D ou mais, **um** dos dados é o Wild Die (não é dado extra). 2 a 5 soma; 6 soma e rola de novo, enquanto sair 6. Com dois tipos de dados juntos (perícia + manobrabilidade), um só Wild Die. | RAW | p.73 | proposta |
| RD-03 | Wild Die com 1 | Só na **primeira** rolagem do Wild Die (um 1 depois de um 6 explodido soma 1). O app **não decide**: mostra o total "normal" e três botões para o mestre: (a) somar normal, (b) somar normal + complicação, (c) subtrair o 1 **e** o maior dos outros dados. Exemplo do livro: 3,4,2,5,3 + Wild 1, opção (c) = 12. | RAW | p.73 | proposta |
| RD-04 | Wild Die com 1 numa parada de 1D | Opção (c) sem outro dado: subtrai só o 1; o total fica igual aos pips. Total nunca abaixo de 0. | CASA | p.73 é omisso | proposta |
| RD-05 | Sucesso | Total **>=** dificuldade. Teste resistido: empate vence quem iniciou. Para ataques o livro diz "maior que" uma vez (p.89): o app usa ">=" com selo. | RAW + PROV E-023 | p.75-76, p.89 | proposta |
| RD-06 | Dificuldades | Very Easy 1-5, Easy 6-10, Moderate 11-15, Difficult 16-20, Very Difficult 21-30, Heroic 31+. O app mostra a faixa; o número exato é do mestre. | RAW | p.75-76; `tables/difficulty-numbers.json` | proposta |
| RD-07 | Ações múltiplas | Declaradas N ações no round: **-(N-1)D** em toda rolagem de perícia e atributo do round. **Não** se aplica a dano, resistência a dano (Strength) nem iniciativa. | RAW | p.78; `tables/character-force-point-limits.json` | proposta |
| RD-08 | Código reduzido a 0D | Se as penalidades levam os **dados** a 0 ou menos, a perícia não pode ser usada (pips restantes não contam: 1D+2 com -1D = não rola). | RAW (p.78) + CASA (tratamento dos pips) | p.78 | proposta |
| RD-09 | Reação como ação extra | Esquiva/aparar pode usar uma ação já declarada ou ser **ação extra**, que aumenta a penalidade pelo resto do round. Reação normal **substitui** a dificuldade do atacante; reação total (única ação do round) **soma** à dificuldade (27 em 13 e 8 = 40 e 35). | RAW | p.79, p.90-91; E-022 aceito | proposta |
| RD-10 | Character Points (CP) | Cada CP = +1 dado rolado **à parte**, que explode em 6. Um 1 num dado de CP vale 1, sem complicação. | RAW + PROV E-009 | p.84-85 | proposta |
| RD-11 | Limite de CP por rolagem | 2 em perícia/atributo; 2 em dano de ataque; 5 em especialização; 5 em acrobatics/dodge/parries (inclui lightsaber e esquiva de veículo); 5 em Strength para resistir a dano. O app aplica o limite pelo tipo de rolagem escolhido. Nunca em ação de outro personagem. | RAW | p.85 | proposta |
| RD-12 | CP e FP no mesmo round | **Não** é permitido gastar CP e Force Point (nem invocar o dark side) no mesmo round ou cena. No modo mesa, gastar um bloqueia o outro até "próximo round". Um FP por round. | RAW | p.78, p.84-85 | proposta |
| RD-13 | Force Point | Dobra todos os códigos de perícia, atributo e habilidade especial **do personagem** pelo resto do round, **dados e pips** (3D+2 vira 6D+4, sem renormalizar). Não dobra dano de arma, casco etc. Dano corpo a corpo: dobra só a Strength (STR 3D+2 + vibro-ax 2D = 6D+4 + 2D). Busca 4D vira 8D. | RAW | p.85 | proposta |
| RD-14 | Ordem FP x penalidades | O livro não diz se as penalidades (ações, ferimentos) entram antes ou depois de dobrar. App: **dobra o código e depois subtrai as penalidades** (4D, 2 ações, FP = 8D-1D = 7D). | CASA | p.85 omisso | proposta |
| RD-15 | Limite de FP guardados | Não sensível à Força: máximo 5. Sensível: sem limite. Todo personagem jogador começa com pelo menos 1. Fim da aventura: uso maligno (perde + 1 Dark Side Point), não heroico (perde), heroico (volta), heroico no momento dramático (volta + 1). | RAW | p.85-86 | proposta |
| RD-16 | Iniciativa | Rolagem de Perception; não aceita CP nem FP; penalidade de ferimento vale; penalidade de ações múltiplas não. | RAW | p.78 | proposta |
| RD-17 | Ferimentos: tabela | Dano - resistência: 1-3 Stunned, 4-8 Wounded, 9-12 Incapacitated, 13-15 Mortally Wounded, 16+ Killed. Resultado <= 0: sem efeito (inclui empate). | RAW | p.100; `tables/damage-healing.json` | proposta |
| RD-18 | Ferimentos: progressão | Wounded + Wounded = Wounded twice; Wounded twice + Wounded = Incapacitated; Incapacitated + Wounded ou Incapacitated = Mortally Wounded; Mortally Wounded + Incapacitated ou Mortally = Killed. Fora disso, fica o pior entre o estado atual e o novo. | RAW | p.100-101 | proposta |
| RD-19 | Mortally Wounded + Wounded | O livro não cobre. App: **Killed** (por analogia: cada novo ferimento sobre um estado grave sobe um degrau). Alternativa: permanece Mortally Wounded. | CASA | p.101 omisso | proposta |
| RD-20 | Penalidade de ferimento | Wounded -1D; Wounded twice -2D; Incapacitated, Mortally Wounded e Killed não agem. Stunned -1D no round do atordoamento e no seguinte. | RAW | p.100-101 | proposta |
| RD-21 | Stun + ferimento e vários stuns | O livro não diz se somam. App: **somam** (Wounded + 1 stun ativo = -2D; dois stuns no round = -2D). | CASA | p.100 omisso | proposta |
| RD-22 | Inconsciência por stun | Número de stuns "afetando" (30 min, ou até descansar 1 min) igual ao número antes do D da Strength: inconsciente 2D minutos. O app conta os stuns e avisa. | RAW | p.100 | proposta |
| RD-23 | Resistência a dano | Sempre com a Strength **cheia** (sem penalidade de ferimento nem de ações), mais armadura (física ou energia), mais até 5 CP, ou dobrada por FP. | RAW | p.80, p.85, p.94, p.100 | proposta |
| RD-24 | Escala | Modificador da escala: character 0, speeder 2D, walker 4D, starfighter 6D, capital 12D, Death Star 24D; usa-se a diferença. Menor ataca maior: atacante soma no ataque, alvo soma na resistência. Maior ataca menor: alvo soma na esquiva, atacante soma no dano. | RAW | p.95; `tables/combat-modifiers.json` | proposta |
| RD-25 | Morte do Mortally Wounded | Ao fim de cada round, rolar 2D; se for **menor** que o número de rounds em Mortally Wounded, morre. O app conta os rounds e oferece a rolagem. | RAW | p.101 | proposta |
| RD-26 | Stun de arma | Arma em stun: qualquer resultado pior que Stunned vira inconsciência por 2D minutos (não registra ferimento). | RAW | p.101 | proposta |
| RD-27 | Munição | Cada tiro marca 1; com tiros = munição da arma (`weapons.json` campo `ammo`), recarregar (uma ação). A ficha tem 18 caixas por arma; o app usa o número real e mostra as 18 caixas só na impressão. | RAW + PROD | p.92, p.502 | proposta |
| RD-28 | Criação: 7D de perícias | 7D distribuídos em perícias **listadas no template**, +1D ou +2D cada (dados inteiros), no máximo 2D por perícia. Perícia não listada só com "permissão do mestre" (interruptor por perícia). | RAW | p.21; `tables/character-creation-advancement.json` | proposta |
| RD-29 | Criação: pips nas perícias | O livro fala em "1D ou 2D". O app trabalha em dados inteiros; um ajuste "permitir pips (regra da casa)" libera +1 pip. Desligado por padrão. | CASA | p.21 | proposta |
| RD-30 | Especializações | 1D das perícias compra **três** especializações, cada uma +1D sobre a perícia (ou sobre o atributo se a perícia não foi melhorada). Pode-se gastar mais de 1D (6, 9... especializações). Bloco incompleto gera aviso. Exemplos do livro: blaster 5D, blaster pistol 6D; alien species: Wookiees 3D+2 com Knowledge 2D+2. | RAW (+ CASA para mais de um bloco) | p.21-22 | proposta |
| RD-31 | Perícias avançadas (A) | Só se o pré-requisito estiver cumprido; começa em **1D** (não no atributo); recebe 1D ou 2D. Pré-requisito simples ("Requires 5D in first aid") é verificado; pré-requisitos compostos mostram o texto e pedem confirmação do mestre. | RAW + PROD | p.22; `skills.json` `prerequisites_text` | proposta |
| RD-32 | Perícias da Força na criação | Só podem receber dados se o template já as lista (`force_skills`); contam nos 7D, mesmo teto de 2D. Template com Força exige "sensível à Força = sim". | RAW | p.21-22 | proposta |
| RD-33 | Total de atributos | Template humano: atributos + perícias da Força = 18D (Young Jedi 15D + 3D). Novo template: Attribute Dice da espécie + 6D, cada atributo entre o mínimo e o máximo da espécie, perícia da Força custa 1D de atributo por 1D (com permissão do mestre). | RAW | p.23-24; `species.json` | proposta |
| RD-34 | Espécie de cada template | Os templates não têm campo de espécie. App: Ewok = `ewok`, Wookiee = `wookiees`, Mon Calamari = `mon-calamari`, Protocol Droid = droide (sem espécie; regra própria de 17D, máx. 2D por perícia), Alien Student of the Force = escolha livre; os demais = `humans`. Limites da espécie só geram **aviso** em template (o livro é a fonte dos números do template). | PROD | p.475-500 | proposta |
| RD-35 | Nomes de perícias nos templates | "Droid prgrm." = droid programming, "Demolition" = demolitions, "Archaic weapons" = archaic guns, "Space transport repair" = space transports repair, "Culture" = cultures. "Glider" e "Primitive construction" do Ewok são perícias especiais da espécie (sem id). | PROV E-061, E-016 | p.475-500 | proposta |
| RD-36 | Pontos iniciais | 5 Character Points; Force Points: 2 se sensível, 1 se não. | RAW | p.21-22 | proposta |
| RD-37 | Créditos iniciais | Template: o texto do equipamento é exibido e o jogador confirma o valor em créditos. Novo template (opcional, mestre): 2D x 100 / 250 / 400 (Poor / Average / Wealthy), rolável no app. | RAW + PROD | p.22, p.24 | proposta |
| RD-38 | Bônus de criação de espécie (Ewok) | Ewok recebe 2D para cada 1D posto em hide, search e sneak (só na criação) e não pode pôr dados em veículo (exceto glider), nave ou reparo. No protótipo: o texto aparece como aviso no passo de perícias; o cálculo automático fica para depois. | RAW (aviso) + PROD (adiado) | p.289 | proposta |
| RD-39 | Vantagens e desvantagens | Opcional (mestre). Total dos modificadores soma ou tira dados de perícia. Delusions of Grandeur +1D (E-011), Phobia +1D a +3D (E-012), Sixth Sense -2D (E-013), Motion Sickness usa stamina (E-014). | RAW + PROV | p.28-30 | proposta |
| RD-40 | Custos de evolução | Perícia +1 pip = número antes do D (3D+2 para 4D custa 3); especialização = metade arredondada para cima (5D+2 para 6D custa 3); avançada = 2x; atributo = 10x (4D para 4D+1 custa 40); Move +1 = Move atual; tornar-se sensível = 20. | RAW | p.25-28 | proposta |
| RD-41 | Dark Side Points | Ao ganhar um, rolar 1D: menor que o total de pontos = virou para o dark side; 6 pontos = caído. | RAW + PROV E-044 | p.86-87 | proposta |
| RD-42 | Movimento padrão | Move inicial = primeiro número da espécie ("10/12" = 10). Formatos irregulares ("8-10", "9/12 (walking)") usam o primeiro número e mostram o texto original. | PROD | p.24; `species.json` | proposta |
| RD-43 | Rolagem simplificada de paradas grandes | Opcional do livro; fora do protótipo. | RAW (adiado) | p.75 | proposta |

## Onde o app mostra leituras provisórias (itens `open` do errata)

| Item | Onde aparece no app |
|---|---|
| E-009 | Rolador: dados de CP com 1 |
| E-011, E-012, E-013, E-014 | Assistente: passo opcional de vantagens/desvantagens; consulta da tabela |
| E-023 | Rolador e referência de combate: acerto com ">=" |
| E-025, E-026 | Referência de combate: hit locations |
| E-027 | Consulta: martial arts, Foot Sweep |
| E-028 | Referência de combate: esquivar de granada (precisa ser maior) |
| E-033, E-034 | Consulta: movimento e perseguições |
| E-036 | Consulta e ficha: perícias de pilotagem caem no Mechanical |
| E-037 | Consulta: espaço |
| E-043, E-044, E-045 | Ficha e consulta: Dark Side Points |
| E-053 | Consulta: espécie Aqualish |
| E-054 | Consulta: lightsaber (autoferimento) |
| E-061 | Assistente: nomes de perícias dos templates |

Regra geral do app: qualquer entidade ou seção de regra cujo texto cite um `E-0xx` aberto recebe o selo automaticamente (o script de dados cruza o registro do errata).

## Decisões de produto (PD)

| ID | Decisão | Motivo |
|---|---|---|
| PD-01 | **(v1; substituída por PD-08 na v2)** Web estática, sem build e sem rede em tempo de execução; PWA instalável e offline. | A mesa pode não ter internet; zero instalação. |
| PD-02 | Os dados do app são gerados de `data/` por `tools/build_app_data.py` (um `bundle.json`); nenhuma regra é digitada à mão no app, exceto a lógica de cálculo, que cita a RD correspondente no código. | Fonte única da verdade. |
| PD-03 | Os dados físicos são o padrão; o rolador digital é opcional e o modo mesa funciona também como "calculadora" (o jogador digita o total que rolou). | O jogo acontece na mesa. |
| PD-04 | O app não decide o que é do mestre (opção do Wild Die 1, número exato da dificuldade, permissões); mostra as opções e registra a escolha. | Autoridade do mestre (p.73, p.77). |
| PD-05 | **(v1; substituída por PD-09 na v2)** Armazenamento local (localStorage) com exportação/importação JSON conforme `character-sheet.schema.json`; extensões do app ficam em `x_app` para não quebrar o schema. | Privacidade e offline. |
| PD-06 | Interface em português do Brasil; nomes de regras, perícias, poderes e itens ficam em inglês, como no livro. | Coerência com a mesa e com o livro. |
| PD-07 | Texto do livro: só o que já está destilado em `data/` (resumos). Nada de trechos longos copiados do PDF. | Licença/IP. |
| PD-08 | **v2**: app com backend (pilha em `docs/architecture.md`), mas **offline primeiro**: ficha, modo mesa, rolador e consulta funcionam sem rede com cache e fila de alterações; PWA instalável. | A mesa pode não ter internet; o servidor não pode virar ponto único de falha da sessão. |
| PD-09 | **v2**: a ficha mora na conta do jogador, no servidor, validada contra `character-sheet.schema.json` (extensões em `x_app`). Sai exportar/importar JSON da interface; fica a "cópia dos meus dados" em Conta (LGPD, D-02) e a impressão A4. | Pedido do usuário; acesso de qualquer aparelho e pelo mestre. |
| PD-10 | **v2**: rolagens de campanha são geradas no servidor por padrão e levam selo de origem ("rolado no servidor", "dados físicos", "offline"). A animação 3D só mostra valores já definidos. | Confiança da mesa sem tirar os dados físicos (PD-03). |
| PD-11 | **v2**: a decisão do Wild Die 1 vai para o mestre pelo feed; sem mestre conectado, o jogador aplica a opção combinada e o item recebe o selo "decidido na mesa". | PD-04 levado à mesa conectada (p.73). |
| PD-12 | **v2**: teste secreto do mestre rola na hora com os códigos das fichas, visível só ao mestre; é ferramenta de produto inspirada na orientação do livro de rolar antes da sessão (p.82-83, parte de mestre não destilada), não uma regra nova. | Fase 2 ainda não destilada; não inventar regra. |
| PD-13 | **v2**: o Holocron (assistente de IA) só responde com base em `data/` e com pelo menos uma citação `(p.N)`; sem base, recusa. Selos de errata e de regra da casa aparecem nas respostas. | Citação sempre (princípio da v1). |
| PD-14 | **v2**: imagens e ícones são arte original que evoca o universo, sem logotipos, fontes, marcas, quadros dos filmes ou designs exatos da Lucasfilm; espaços definidos em `docs/image-manifest.json` com placeholder até a arte existir. | Propriedade intelectual. |
