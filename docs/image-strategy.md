# Estratégia de produção de imagens (cotas gratuitas)

Status: proposta, não executada. Base: `docs/image-manifest.json` v2 (568 espaços) e `docs/image-briefs.md`.
Cotas levantadas em out/2026 a partir de fontes secundárias; mudam com frequência, então confira na própria ferramenta antes de cada onda.

## 1. Princípio: nem todo espaço precisa de imagem própria

Os espaços já têm uma cadeia de reserva (item → categoria → placeholder). Com **47 imagens de categoria** o app inteiro deixa de mostrar placeholder. O resto é refinamento.

| Bloco | Espaços | Recomendação |
|---|---|---|
| Telas (login, hangar, campanha, estados, erros, consulta...) | 50 | Gerar (onda 1) |
| Ícones (`icon.*`) | 20 | **Não usar IA**: SVG vetorial, mais nítido e consistente |
| Categorias (`*-cat`, `starship-scale`, `skill-attr`, `power-skill`) | 47 | Gerar primeiro (onda 1) |
| Itens P1: espécies 48, templates 26, armas 63, veículos 24, naves 34 | 195 | Onda 2 |
| Itens P2: armaduras 15, equipamentos 54 | 69 | Onda 3 |
| Itens P3: perícias 110, poderes 77 | 187 | **Adiar**: a reserva por atributo e por perícia da Força já cobre; no máximo ~20 poderes marcantes |

Total realista: **~360 imagens finais** (ondas 1 a 3), não 568.

## 2. Ondas

0. **Bíblia de estilo (1 a 2 dias).** Uma imagem-âncora aprovada para cada estilo do manifesto (`portrait-card`, `blueprint-item`, `holo-craft`, `holo-cinematic`, `scene-spot`, `spot-illustration`, `blueprint`). Cada âncora fixa um prefixo de prompt, a paleta (âmbar `--wild`, ciano holográfico, fundo `--void`) e uma lista do que evitar. Todas as imagens seguintes partem dessas âncoras.
1. **"O app parece pronto" (~97 imagens, ~1 semana).** As 47 categorias e as 50 telas.
2. **Itens P1 (~195, ~2 semanas).** Espécies e templates primeiro, porque aparecem na criação de personagem.
3. **Itens P2 (~69, ~1 semana).**
4. **P3 seletivo (opcional).**

## 3. Qual ferramenta para qual estilo

| Ferramenta | Cota grátis (aprox.) | Ponto forte | Usar para |
|---|---|---|---|
| **Gemini / Nano Banana** | ~20 por dia no app (último número publicado; o Google parou de divulgar); saída em 1K | Consistência e edição a partir de imagem de referência | `portrait-card` (espécies e templates): manda a âncora e pede "mesmo estilo, outra espécie" |
| **Bing Image Creator** (MAI-Image, GPT-4o, DALL-E 3) | ~15 rápidas por dia ou semana (as fontes divergem) e depois fila lenta sem limite | Segue bem prompts estruturados; volume na fila lenta | `blueprint-item` e `blueprint` (armas, equipamentos, armaduras em planta holográfica) |
| **Leonardo** | ~150 tokens por dia | Maior volume grátis; cenas e veículos | `holo-craft` (veículos e naves) e `scene-spot` |
| **Adobe Firefly** | Poucos créditos por mês | Termos de uso mais seguros | `holo-cinematic` (heróis do login e do marketing), poucas e caprichadas |
| **Ideogram** | ~10 por semana | Texto dentro da imagem | Reserva; o projeto não usa texto nas imagens |
| **Local** (Flux / SDXL na sua GPU) | Sem limite | Controle total, sem marca d'água | Plano B, se houver placa de vídeo; exige instalar ferramentas |

**Ritmo estimado:** ~55 a 65 gerações por dia somando as cotas, com ~2,5 tentativas por imagem aprovada, dá **~20 imagens finais por dia** no máximo. Com uma sessão de 1 hora por dia, conte com ~15. Ondas 1 a 3: **4 a 5 semanas**.

## 4. Regras de prompt

- Prompts em **inglês**, gerados a partir da `description` do manifesto, com o prefixo do estilo e a proporção.
- **Nunca** citar "Star Wars", filmes, personagens ou nomes de naves e veículos de filme. Descreva pela forma: "worn disc-shaped light freighter" em vez do nome da nave do filme. Os geradores costumam recusar nomes da franquia, e o projeto exige design original.
- Espécies pelo visual (pelagem, tentáculos, cor da pele), sem copiar personagens conhecidos.
- Composição respeitando o `focal_point` do manifesto, com margem para o recorte em várias proporções.
- Sem texto e sem logotipos na imagem.
- **Revisão de propriedade intelectual: manual, feita pelo Fernando ao final.** Os agentes não rejeitam imagens por semelhança com a franquia; os próprios geradores (Gemini, Bing) já filtram. O agente só rejeita por qualidade: assunto errado, texto legível, tarjas pretas, formas deformadas, estilo ou paleta fora da âncora.

### Lições da Onda 0
- Sempre incluir "filling the entire frame, no black bars"; sem isso o Gemini às vezes devolve tarjas.
- Bing oferece só 1:1, 3:2 e 2:3: espaços 16:9 saem em 3:2, e o app recorta.
- Para armas, dizer explicitamente "energy weapons, emitter nozzles, no scopes, no magazines, nothing like real-world firearms", senão saem fuzis reais.
- Salvar sem diálogo: o agente lê a URL da imagem na página e grava pelo terminal; nunca usar o botão de download (abre "Save As").
- Haiku basta para conduzir o navegador e foi bem mais rápido que o Sonnet com downloads pelo navegador.

## 5. Fluxo de trabalho (a construir quando a estratégia for aprovada)

1. **Pacote de prompts por onda:** um script lê o manifesto e gera `docs/prompts/onda-N.csv` (id, ferramenta, prompt, proporção, âncora a anexar).
2. **Geração manual por você**, nas suas contas. Automatizar as interfaces grátis por script viola os termos dessas ferramentas, e as contas são suas.
3. **Caixa de entrada:** salve cada imagem como `art-inbox/<id>.png`. Fica fora do Git; os originais vão para um Drive.
4. **Processamento automático:** um script recorta pelo `focal_point` nos tamanhos do manifesto, converte para WebP, grava em `apps/web/public/art/` e atualiza o manifesto (`status`, ferramenta, data, prompt).
5. **Revisão em `/dev/art`:** a página já mostra o que falta, o que usa reserva e o que tem arte.
6. **Ampliação** só para os heróis (2560 px), com um ampliador local gratuito. As cotas grátis entregam ~1024 px.

## 6. Licença e procedência

- O repositório é público: registre no manifesto a ferramenta e a data de cada imagem e diga no README que as imagens foram geradas com IA.
- Defina uma licença para a arte separada da do código, por exemplo **CC BY-NC 4.0**, coerente com o projeto sem fins comerciais.
- **Bing:** os termos falam em uso pessoal. Um projeto aberto e não comercial tende a ser aceitável, mas é zona cinzenta. Prefira o Bing para itens e o Firefly para as imagens de vitrine.
- **Leonardo:** imagens do plano grátis ficam públicas na galeria deles.
- **Gemini:** as imagens trazem marca d'água invisível (SynthID) e, no plano grátis, podem vir com marca visível. Não remova a marca se os termos proibirem: componha com margem ou use outra ferramenta para aquele espaço.
- **Tamanho do repo:** ~360 WebP de ~150 KB somam ~55 MB, aceitável no Git normal. Os originais ficam fora.

## 7. Decisões pendentes

1. Aprovar as ondas e o corte de perícias e poderes (P3).
2. Licença da arte (sugestão: CC BY-NC 4.0).
3. Ícones em SVG em vez de IA.
4. Existe GPU local para o plano B?
5. Quem gera: você, nas suas contas. Eu preparo os prompts e processo o resultado.
