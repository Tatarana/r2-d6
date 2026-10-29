// storage.ts - midia: sharp decodifica (rejeita o que nao e imagem de verdade), remove EXIF e gera WebP 256/768 (ADR-0010).
// Driver "local" (pasta MEDIA_DIR); o driver s3 fica no backlog (mesma interface).
import { eq } from 'drizzle-orm';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { Config } from '../config';
import type { Db } from '../db/client';
import { schema } from '../db/client';
import { HttpError } from '../lib/http';

export interface Storage {
  saveImage(ownerId: string, kind: string, input: Buffer): Promise<{ id: string }>;
  read(m: { id: string; storageKey: string }, variant: string): Promise<Buffer>;
  remove(id: string): Promise<void>;
}

const ALLOWED = new Set(['jpeg', 'png', 'webp', 'avif']);

export function createStorage(cfg: Config, db: Db): Storage {
  return {
    async saveImage(ownerId, kind, input) {
      let meta: Awaited<ReturnType<ReturnType<typeof sharp>['metadata']>>;
      try {
        meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
      } catch {
        throw new HttpError(415, 'Imagem inválida', 'O arquivo não é uma imagem JPEG, PNG, WebP ou AVIF válida.');
      }
      if (!meta.format || !ALLOWED.has(meta.format)) throw new HttpError(415, 'Imagem inválida', 'Use JPEG, PNG, WebP ou AVIF.');
      const id = crypto.randomUUID();
      const dir = join(cfg.mediaDir, id);
      await mkdir(dir, { recursive: true });
      // rotate() aplica a orientacao do EXIF; sharp nao copia metadados (EXIF/GPS) para a saida por padrao
      const make = (size: number) => sharp(input, { limitInputPixels: 40_000_000 }).rotate().resize(size, size, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toBuffer();
      const [s256, s768] = await Promise.all([make(256), make(768)]);
      await writeFile(join(dir, '256.webp'), s256);
      await writeFile(join(dir, '768.webp'), s768);
      await db.insert(schema.media).values({ id, ownerId, kind, driver: 'local', storageKey: id, mime: 'image/webp', bytes: s768.length, width: 768, height: 768, variants: { '256': `${id}/256.webp`, '768': `${id}/768.webp` } });
      return { id };
    },
    async read(m, variant) {
      return readFile(join(cfg.mediaDir, m.storageKey, `${variant}.webp`));
    },
    async remove(id) {
      await db.update(schema.media).set({ deletedAt: new Date() }).where(eq(schema.media.id, id));
      await rm(join(cfg.mediaDir, id), { recursive: true, force: true });
    },
  };
}
