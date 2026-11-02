// DiceTray3D - bandeja 3D (React Three Fiber, carregada sob demanda). So ANIMA: os valores vem prontos das regras/servidor.
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { DiceResult } from './DiceViews';

// BoxGeometry: +x, -x, +y, -y, +z, -z  ->  faces opostas somam 7
const FACE_VALUES = [3, 4, 1, 6, 2, 5];
const FACE_NORMALS = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

// materiais dos dados (texture.die.normal e texture.die.wild do manifesto), gerados por codigo: sem imagem para baixar.
// normal = resina fosca grafite com pips gravados em luz ciano; Wild Die = resina ambar translucida com veios dourados
// e pips em branco quente; CP = violeta. Cada face tem um mapa de cor e um de emissao (so os pips brilham).
type Kind = 'normal' | 'wild' | 'cp';
const LOOK: Record<Kind, { base: [string, string]; pip: string; glow: string; rim: string }> = {
  normal: { base: ['#262d3a', '#141922'], pip: '#0b1017', glow: '#4fd1ff', rim: 'rgba(79,209,255,.22)' },
  wild: { base: ['#ffbe45', '#b56a06'], pip: '#fff6dc', glow: '#fff1c2', rim: 'rgba(255,236,170,.75)' },
  cp: { base: ['#4a3584', '#2a1d52'], pip: '#efe6ff', glow: '#d9c6ff', rim: 'rgba(217,198,255,.4)' },
};

function rand(seed: number) { let x = seed; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; }

function faceMaps(v: number, kind: Kind) {
  const S = 256, L = LOOK[kind], r = rand(v * 97 + (kind === 'wild' ? 7 : kind === 'cp' ? 3 : 1));
  const color = document.createElement('canvas'), glow = document.createElement('canvas');
  color.width = color.height = glow.width = glow.height = S;
  const g = color.getContext('2d')!, e = glow.getContext('2d')!;
  // base: gradiente diagonal + granulado fino (resina)
  const grad = g.createLinearGradient(0, 0, S, S); grad.addColorStop(0, L.base[0]); grad.addColorStop(1, L.base[1]);
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * (kind === 'normal' ? 0.05 : 0.03)})`; g.fillRect(r() * S, r() * S, 1.5, 1.5); }
  if (kind === 'wild') {
    // veios dourados internos
    for (let i = 0; i < 5; i++) {
      g.strokeStyle = `rgba(255,${200 + r() * 40},${90 + r() * 60},${0.25 + r() * 0.3})`; g.lineWidth = 1 + r() * 2.5;
      g.beginPath(); g.moveTo(r() * S, 0); g.bezierCurveTo(r() * S, S * 0.35, r() * S, S * 0.65, r() * S, S); g.stroke();
    }
  }
  g.strokeStyle = L.rim; g.lineWidth = 8; g.strokeRect(4, 4, S - 8, S - 8);
  e.fillStyle = '#000'; e.fillRect(0, 0, S, S);
  for (const [x, y] of PIPS[v]) {
    const cx = S / 2 + x * 60, cy = S / 2 + y * 60;
    // pip gravado: anel escuro (sombra do rebaixo) e centro colorido
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(cx + 2, cy + 2, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = L.pip; g.beginPath(); g.arc(cx, cy, 19, 0, Math.PI * 2); g.fill();
    const h = e.createRadialGradient(cx, cy, 0, cx, cy, 24); h.addColorStop(0, L.glow); h.addColorStop(0.7, L.glow); h.addColorStop(1, 'rgba(0,0,0,0)');
    e.fillStyle = h; e.beginPath(); e.arc(cx, cy, 24, 0, Math.PI * 2); e.fill();
  }
  const tex = (c: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  return { map: tex(color), emissiveMap: tex(glow) };
}

function dieMaterial(v: number, kind: Kind) {
  const { map, emissiveMap } = faceMaps(v, kind);
  if (kind === 'wild') {
    return new THREE.MeshPhysicalMaterial({ map, emissiveMap, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.3, roughness: 0.18, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.93, sheen: 0.4, sheenColor: new THREE.Color('#ffd27a') });
  }
  return new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: new THREE.Color('#ffffff'), emissiveIntensity: kind === 'normal' ? 1.1 : 0.8,
    roughness: kind === 'normal' ? 0.72 : 0.45, metalness: 0.05 });
}

// BoxGeometry tem um grupo por face (um material por face); o RoundedBoxGeometry perde os grupos e o dado some
const GEOMETRY = new THREE.BoxGeometry(1, 1, 1);

function Die({ value, kind, x, delay, size }: { value: number; kind: Kind; x: number; delay: number; size: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mats = useMemo(() => FACE_VALUES.map((v) => dieMaterial(v, kind)), [kind]);
  const target = useMemo(() => {
    const idx = FACE_VALUES.indexOf(value);
    const q = new THREE.Quaternion().setFromUnitVectors(FACE_NORMALS[idx], new THREE.Vector3(0, 0, 1));
    // leve inclinacao para dar sensacao de objeto sem esconder a face
    return q.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, -0.28, 0)));
  }, [value]);
  const spin = useMemo(() => new THREE.Vector3((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 12), []);
  const start = useRef<number | null>(null);
  useFrame((state) => {
    const m = ref.current; if (!m) return;
    if (start.current === null) start.current = state.clock.elapsedTime + delay;
    const t = state.clock.elapsedTime - start.current;
    const dur = 1.0;
    if (t < 0) { m.position.set(x, -3, 0); return; }
    const k = Math.min(1, t / dur);
    const ease = 1 - Math.pow(1 - k, 3);
    // sobe de baixo (lancado), quica e para
    m.position.set(x, -2.6 + 2.6 * ease + Math.abs(Math.sin(k * Math.PI * 2.2)) * 0.5 * (1 - k), 0);
    const rest = new THREE.Quaternion().setFromEuler(new THREE.Euler(spin.x * (1 - ease), spin.y * (1 - ease), spin.z * (1 - ease)));
    m.quaternion.copy(target).premultiply(rest);
  });
  return <mesh ref={ref} material={mats} scale={size} geometry={GEOMETRY} />;
}

export default function DiceTray3D({ r, rollKey }: { r: DiceResult; rollKey: string }) {
  const dice = useMemo(() => {
    const list: { v: number; kind: 'normal' | 'wild' | 'cp' }[] = [
      ...r.normals.map((v) => ({ v, kind: 'normal' as const })), ...r.wild.map((v) => ({ v, kind: 'wild' as const })), ...r.cp.flat().map((v) => ({ v, kind: 'cp' as const })),
    ];
    return list;
  }, [r]);
  const gap = 1.35;
  const width = Math.max(4, dice.length * gap);
  return (
    <div className="glass chamfer relative h-44 overflow-hidden md:h-52" aria-hidden data-testid="dice-tray-3d">
      <Canvas key={rollKey} camera={{ position: [0, 0, 6], fov: 40 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={2} color="#cfeaff" />
        <pointLight position={[-4, -2, 3]} intensity={12} color="#4fd1ff" />
        <group scale={Math.min(1, 7.2 / width)}>
          {dice.map((d, i) => <Die key={i} value={d.v} kind={d.kind} x={(i - (dice.length - 1) / 2) * gap} delay={i * 0.12} size={d.kind === 'wild' ? 1.1 : 1} />)}
        </group>
      </Canvas>
    </div>
  );
}
