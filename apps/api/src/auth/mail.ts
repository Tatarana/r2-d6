// mail.ts - envio de e-mail (Nodemailer; Mailpit no dev). Em teste guarda as mensagens em memoria.
import nodemailer from 'nodemailer';
import type { Config } from '../config';

export interface Mail { to: string; subject: string; text: string }
export interface Mailer { send(mail: Mail): Promise<void>; outbox: Mail[] }

export function createMailer(cfg: Config): Mailer {
  const outbox: Mail[] = [];
  if (cfg.isTest) return { outbox, send: async (m) => { outbox.push(m); } };
  const transport = nodemailer.createTransport(cfg.SMTP_URL);
  return {
    outbox,
    async send(m) {
      outbox.push(m);
      if (outbox.length > 50) outbox.shift();
      try {
        await transport.sendMail({ from: cfg.MAIL_FROM, ...m });
      } catch (e: any) {
        // sem Mailpit/SMTP o reset fica indisponivel, mas o app segue de pe
        console.error('[mail] falha ao enviar:', e.message);
      }
    },
  };
}
