// HyperspaceField - campo de estrelas em canvas 2D: paralaxe suave em repouso e "hyperspace jump" (estrelas viram riscos,
// aceleram, clarao branco-azulado). Codigo e arte originais. Nunca bloqueia: quem chama navega mesmo se a animacao falhar.
import { useEffect, useRef } from 'react';

export const JUMP_MS = 1500;

export function HyperspaceField({ jumping, onDone, className }: { jumping: boolean; onDone?: () => void; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const jumpStart = useRef<number | null>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => { if (jumping && jumpStart.current === null) jumpStart.current = performance.now(); }, [jumping]);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
    const phone = window.innerWidth < 700;
    const N = phone ? 220 : 650;
    const frameMs = phone ? 1000 / 30 : 0;
    let w = 0, h = 0, raf = 0, last = performance.now(), lastDraw = 0, finished = false;
    const dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
    const stars = Array.from({ length: N }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 0.98 + 0.02, hue: Math.random() < 0.2 ? 30 : 205 }));
    const mouse = { x: 0, y: 0 };
    const resize = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const onMove = (e: PointerEvent) => { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (frameMs && now - lastDraw < frameMs) return;
      lastDraw = now;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = jumpStart.current === null ? -1 : (now - jumpStart.current) / JUMP_MS; // 0..1 durante o salto
      if (reduced && t >= 0 && !finished) { finished = true; done.current?.(); }
      const speed = reduced ? 0 : t < 0 ? 0.045 : 0.025 + Math.pow(Math.min(t, 1), 3) * 7;
      ctx.fillStyle = t > 0.55 ? `rgba(4,8,18,${Math.max(0.08, 0.5 - t * 0.45)})` : 'rgba(5,7,12,1)';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2 - mouse.x * 14, cy = h / 2 - mouse.y * 10, sc = Math.max(w, h) * 0.55;
      for (const s of stars) {
        const pz = s.z;
        s.z -= speed * dt * (0.4 + (s.x * s.x + s.y * s.y) * 0.3);
        if (s.z <= 0.015) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; continue; }
        const x2 = cx + (s.x / s.z) * sc * 0.5, y2 = cy + (s.y / s.z) * sc * 0.5;
        const x1 = cx + (s.x / Math.min(1.2, pz + speed * dt * 0.9 + 0.001)) * sc * 0.5, y1 = cy + (s.y / Math.min(1.2, pz + speed * dt * 0.9 + 0.001)) * sc * 0.5;
        if (x2 < -50 || x2 > w + 50 || y2 < -50 || y2 > h + 50) { s.z = 1; s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; continue; }
        const a = Math.min(1, (t < 0 ? 0.55 : 0.25) + (1 - s.z) * 0.9);
        ctx.strokeStyle = `hsla(${s.hue},${t > 0.3 ? 90 : 60}%,${t > 0.3 ? 88 : 80}%,${a})`;
        ctx.lineWidth = t < 0 ? 1 + (1 - s.z) * 1.6 : 0.8 + (1 - s.z) * (1.5 + t * 2.5);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (t < 0) { ctx.fillStyle = ctx.strokeStyle; ctx.fillRect(x2, y2, 1.8, 1.8); }
      }
      if (t >= 0.62 && !reduced) { // clarao
        const k = Math.min(1, (t - 0.62) / 0.33);
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * (0.2 + k * 0.9));
        g.addColorStop(0, `rgba(235,246,255,${k})`); g.addColorStop(1, `rgba(120,190,255,${k * 0.85})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      if (t >= 1 && !finished) { finished = true; done.current?.(); }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', onMove); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden data-testid="hyperspace-canvas" style={{ width: '100%', height: '100%', display: 'block' }} />;
}
