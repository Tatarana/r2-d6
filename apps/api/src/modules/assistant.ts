// assistant.ts - Holocron: assistente de regras com Claude, fundamentado em data/ (ADR-0011).
// Atras de feature flag: sem ANTHROPIC_API_KEY a rota responde 503 e a UI mostra "em breve".
import Anthropic from '@anthropic-ai/sdk';
import { and, eq, gte, sql } from 'drizzle-orm';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { askBody } from '@r2d6/contracts';
import { ROOT } from '../config';
import type { AppCtx } from '../ctx';
import { schema } from '../db/client';
import { HttpError } from '../lib/http';

let corpusCache: string | null = null;

/** Corpus estavel (regras destiladas, glossario, errata, decisoes): vai no prompt de sistema com cache de prompt. */
export function loadCorpus(): string {
  if (corpusCache) return corpusCache;
  const parts: string[] = [];
  const dir = join(ROOT, 'data', 'rules');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) parts.push(`# ARQUIVO data/rules/${f}\n${readFileSync(join(dir, f), 'utf8')}`);
  for (const f of ['glossary.md', 'errata.md']) { const p = join(ROOT, 'data', f); if (existsSync(p)) parts.push(`# ARQUIVO data/${f}\n${readFileSync(p, 'utf8')}`); }
  const rd = join(ROOT, 'docs', 'rules-decisions.md');
  if (existsSync(rd)) parts.push(`# ARQUIVO docs/rules-decisions.md (decisões de regra do projeto)\n${readFileSync(rd, 'utf8')}`);
  corpusCache = parts.join('\n\n');
  return corpusCache;
}

export const INSTRUCTIONS = `Você é o Holocron, assistente de regras do Star Wars Roleplaying Game REUP (sistema D6) dentro de um app de mesa.
Regras de resposta:
- Responda em português do Brasil, curto e direto, usando APENAS o material de referência fornecido abaixo.
- TODA afirmação de regra deve terminar com a página impressa entre parênteses, no formato (p.N), tirada do material. Se não houver página no material, diga que não há citação disponível.
- Marque "regra da casa" (CASA) e "leitura provisória" (PROV/E-0xx) quando o material assim indicar.
- Se o livro não cobre a pergunta, diga "o livro não cobre; decisão do mestre". Nunca invente regras.
- Não reproduza trechos longos do livro; resuma com suas palavras.
- Você não tem acesso a dados de jogadores nem a ferramentas.`;

export function registerAssistantRoutes(app: FastifyInstance, ctx: AppCtx) {
  const { assistantQueries } = schema;
  app.post('/api/assistant/ask', { preHandler: app.requireUser }, async (req, reply) => {
    if (!ctx.cfg.features.assistant) throw new HttpError(503, 'Assistente desligado', 'O Holocron está desligado: configure ANTHROPIC_API_KEY no servidor.');
    const { question } = askBody.parse(req.body);
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const [{ n }] = await ctx.db.select({ n: sql<number>`count(*)::int` }).from(assistantQueries).where(and(eq(assistantQueries.userId, req.user!.id), gte(assistantQueries.createdAt, since)));
    if (n >= ctx.cfg.ASSISTANT_DAILY_LIMIT) throw new HttpError(429, 'Limite diário', `Você atingiu o limite de ${ctx.cfg.ASSISTANT_DAILY_LIMIT} perguntas por dia.`);

    const client = new Anthropic({ apiKey: ctx.cfg.ANTHROPIC_API_KEY });
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    let answer = '';
    try {
      const stream = client.messages.stream({
        model: ctx.cfg.ASSISTANT_MODEL, max_tokens: 1024,
        system: [
          { type: 'text', text: INSTRUCTIONS },
          { type: 'text', text: `MATERIAL DE REFERÊNCIA\n\n${loadCorpus()}`, cache_control: { type: 'ephemeral' } },
        ],
        messages: [{ role: 'user', content: question }],
      });
      stream.on('text', (t) => { answer += t; send('delta', { text: t }); });
      const final = await stream.finalMessage();
      const cited = /\(p\.\s*\d+/.test(answer);
      if (!cited) send('delta', { text: '\n\n(Sem citação de página: trate como não confirmado.)' });
      await ctx.db.insert(assistantQueries).values({
        userId: req.user!.id, question, answer, model: ctx.cfg.ASSISTANT_MODEL,
        inputTokens: final.usage.input_tokens, cachedTokens: (final.usage as any).cache_read_input_tokens ?? 0, outputTokens: final.usage.output_tokens,
      });
      send('done', { cited });
    } catch (e: any) {
      send('error', { message: 'O Holocron não conseguiu responder agora.' });
      req.log.error({ err: e?.message }, 'assistant failed');
    } finally {
      res.end();
    }
  });
}
