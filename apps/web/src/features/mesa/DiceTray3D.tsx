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

function faceTexture(v: number, kind: 'normal' | 'wild' | 'cp') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const bg = kind === 'wild' ? '#b87a10' : kind === 'cp' ? '#3a2a66' : '#1b2230';
  const fg = kind === 'wild' ? '#1a1000' : kind === 'cp' ? '#d9c6ff' : '#4fd1ff';
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = kind === 'wild' ? '#ffe08a' : 'rgba(255,255,255,.18)'; g.lineWidth = 6; g.strokeRect(3, 3, 122, 122);
  g.fillStyle = fg;
  if (kind === 'wild') { g.shadowColor = '#ffe08a'; g.shadowBlur = 8; }
  for (const [x, y] of PIPS[v]) { g.beginPath(); g.arc(64 + x * 30, 64 + y * 30, 11, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Die({ value, kind, x, delay, size }: { value: number; kind: 'normal' | 'wild' | 'cp'; x: number; delay: number; size: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mats = useMemo(() => FACE_VALUES.map((v) => new THREE.MeshStandardMaterial({ map: faceTexture(v, kind), roughness: kind === 'wild' ? 0.25 : 0.55, metalness: 0.1, emissive: kind === 'wild' ? new THREE.Color('#ffb020') : new THREE.Color('#000'), emissiveIntensity: kind === 'wild' ? 0.25 : 0 })), [kind]);
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
  return <mesh ref={ref} material={mats} scale={size}><boxGeometry args={[1, 1, 1]} /></mesh>;
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
