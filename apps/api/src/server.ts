// server.ts - sobe a API (porta 3000) com desligamento gracioso.
import { buildApp } from './app';
import { loadConfig } from './config';

const cfg = loadConfig();
const app = await buildApp({ cfg });

const stop = async (sig: string) => {
  app.log.info(`${sig}: encerrando`);
  await app.close();
  process.exit(0);
};
process.on('SIGINT', () => void stop('SIGINT'));
process.on('SIGTERM', () => void stop('SIGTERM'));

try {
  await app.listen({ port: cfg.PORT, host: cfg.HOST });
  app.log.info(`API em http://localhost:${cfg.PORT}  (assistente: ${cfg.features.assistant ? 'ligado' : 'desligado'}; Google: ${cfg.features.google ? 'sim' : 'não'}; Discord: ${cfg.features.discord ? 'sim' : 'não'})`);
} catch (e) {
  app.log.error(e);
  process.exit(1);
}
