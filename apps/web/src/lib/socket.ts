// socket.ts - Socket.IO do cliente. Mesma origem (o Vite faz proxy de /socket.io); o cookie de sessao autentica o handshake.
// So distribui eventos; toda escrita continua sendo REST (ADR-0006).
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';

type Sub = { campaignId?: string; characterId?: string };
let socket: Socket | null = null;
const subs = new Map<string, Sub>();
const connectCallbacks = new Set<() => void>();

export const useSocketState = create<{ connected: boolean }>(() => ({ connected: false }));

export function connectSocket(): Socket {
  if (socket) return socket;
  socket = io({ path: '/socket.io', withCredentials: true, reconnectionDelayMax: 8000 });
  socket.on('connect', () => {
    useSocketState.setState({ connected: true });
    for (const s of subs.values()) socket!.emit('subscribe', s);
    connectCallbacks.forEach((cb) => cb());
  });
  socket.on('disconnect', () => useSocketState.setState({ connected: false }));
  return socket;
}
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  subs.clear();
  useSocketState.setState({ connected: false });
}
export const onSocketConnect = (cb: () => void) => { connectCallbacks.add(cb); return () => { connectCallbacks.delete(cb); }; };

/** Inscreve-se numa sala (o servidor confere a autorizacao). Devolve a funcao que cancela. */
export function subscribeRoom(sub: Sub) {
  const key = JSON.stringify(sub);
  subs.set(key, sub);
  const s = connectSocket();
  if (s.connected) s.emit('subscribe', sub);
  return () => { subs.delete(key); s.emit('unsubscribe', sub); };
}

/** Hook: ouve um evento enquanto o componente esta montado. */
export function useSocketEvent<T = any>(event: string, handler: (payload: T) => void) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const s = connectSocket();
    const fn = (p: T) => ref.current(p);
    s.on(event, fn);
    return () => { s.off(event, fn); };
  }, [event]);
}

/** Hook: inscreve numa sala de campanha/personagem. */
export function useRoom(sub: Sub | null) {
  const key = sub ? JSON.stringify(sub) : '';
  useEffect(() => {
    if (!sub) return;
    return subscribeRoom(sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
