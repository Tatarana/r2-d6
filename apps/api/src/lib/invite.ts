// invite.ts - codigo de convite: hash guardado no banco e cookie que leva o convite pelo login com Google.
import { createHash } from 'node:crypto';

export const hashCode = (code: string) => createHash('sha256').update(code.toUpperCase().replace(/[^A-Z0-9]/g, '')).digest('hex');

export const INVITE_COOKIE = 'r2d6_invite';

/** Set-Cookie do convite (1 hora); sem codigo, apaga o cookie. */
export const inviteCookie = (code: string | null, secure: boolean) =>
  `${INVITE_COOKIE}=${code ? encodeURIComponent(code) : ''}; Path=/; Max-Age=${code ? 3600 : 0}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;

export const inviteFromCookie = (cookie: string | null | undefined) => {
  const m = new RegExp(`(?:^|;\\s*)${INVITE_COOKIE}=([^;]+)`).exec(cookie ?? '');
  return m ? decodeURIComponent(m[1]) : undefined;
};
