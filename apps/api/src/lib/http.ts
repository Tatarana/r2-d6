// http.ts - erros em application/problem+json e contexto da aplicacao.
export class HttpError extends Error {
  constructor(public status: number, public title: string, public detail?: string, public extra?: Record<string, unknown>) {
    super(detail || title);
  }
}
export const notFound = (what = 'Recurso') => new HttpError(404, 'Não encontrado', `${what} não encontrado.`);
export const forbidden = (detail = 'Você não tem permissão para isso.') => new HttpError(403, 'Proibido', detail);
export const badRequest = (detail: string, extra?: Record<string, unknown>) => new HttpError(400, 'Requisição inválida', detail, extra);
export const unprocessable = (detail: string, extra?: Record<string, unknown>) => new HttpError(422, 'Não processável', detail, extra);
export const conflict = (detail: string, extra?: Record<string, unknown>) => new HttpError(409, 'Conflito', detail, extra);
