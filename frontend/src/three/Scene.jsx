import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { isMobile, prefersReducedMotion } from '../hooks/useScrollProgress';

// Camera path: one keyframe per page chapter (hero → mission → why → education → health → shelter → impact → donate → finale)
const PATH = [
  { p: [0, 1.4, 8.5], t: [0, 1.4, 0] },
  { p: [-3, 1.8, 6], t: [0, 2, -1] },
  { p: [3, 0.8, 5.5], t: [0, 1.2, 0] },
  { p: [-2.4, 2.4, 4.5], t: [-1, 2.2, -2] },
  { p: [2.4, 1.2, 4.5], t: [1, 1.4, -1] },
  { p: [0, 0.4, 5], t: [0, 1, 0] },
  { p: [0, 3.5, 7.5], t: [0, 1.5, -1] },
  { p: [0, 1.2, 3.6], t: [0, 1.4, 0] },
  { p: [0, 1.8, 9.5], t: [0, 2, -2] },
];

function sample(key, f) {
  const x = f * (PATH.length - 1);
  const i = Math.min(PATH.length - 2, Math.floor(x));
  const k = x - i;
  const s = k * k * (3 - 2 * k);
  return new THREE.Vector3(...PATH[i][key]).lerp(new THREE.Vector3(...PATH[i + 1][key]), s);
}

function CameraRig({ progress, reduced }) {
  const look = useRef(new THREE.Vector3(0, 1.4, 0));
  useFrame(({ camera, pointer }, dt) => {
    const f = progress.current;
    const target = sample('p', f);
    if (!reduced) { target.x += pointer.x * 0.35; target.y += pointer.y * 0.2; }
    camera.position.lerp(target, 1 - Math.exp(-dt * (reduced ? 20 : 3)));
    look.current.lerp(sample('t', f), 1 - Math.exp(-dt * 4));
    camera.lookAt(look.current);
  });
  return null;
}

function Spotlight() {
  return (
    <group position={[0, 0, 0]}>
      <spotLight position={[0, 9, 0]} angle={0.32} penumbra={1} intensity={220} color="#e4d8ff" target-position={[0, 0, 0]} />
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[2.8, 9, 32, 1, true]} />
        <meshBasicMaterial color="#b9a2ff" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#0b0716" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.3, 2.38, 64]} />
        <meshBasicMaterial color="#9d7bff" />
      </mesh>
    </group>
  );
}

function Panel() {
  const ref = useRef();
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.08; });
  return (
    <group ref={ref} position={[0, 3.1, -4]}>
      <mesh>
        <planeGeometry args={[9, 3.8]} />
        <meshStandardMaterial color="#120a2a" emissive="#3b1d8f" emissiveIntensity={0.55} transparent opacity={0.85} />
        <Edges color="#a78bfa" />
      </mesh>
      {/* simple "progress bar" motifs standing in for content on the panel */}
      {[-2.4, -0.6, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0.2 - i * 0.05, 0.02]}>
          <planeGeometry args={[1.4, 0.12 + i * 0.1]} />
          <meshBasicMaterial color={['#c4b5fd', '#f0abfc', '#818cf8'][i]} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Stylised volunteer built from primitives; the raised arm waves.
function Volunteer({ reduced }) {
  const group = useRef();
  const arm = useRef();
  const skin = '#e9c9b8';
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    group.current.position.y = Math.sin(t * 1.4) * 0.03;
    arm.current.rotation.z = -2.5 + Math.sin(t * 3.2) * 0.35;
  });
  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh position={[0, 1.15, 0]}><capsuleGeometry args={[0.38, 0.9, 6, 16]} /><meshStandardMaterial color="#6d4ae0" roughness={0.5} emissive="#2a1273" emissiveIntensity={0.4} /></mesh>
      <mesh position={[0, 2.15, 0]}><sphereGeometry args={[0.3, 24, 24]} /><meshStandardMaterial color={skin} roughness={0.6} /></mesh>
      <mesh position={[0, 2.32, -0.02]}><sphereGeometry args={[0.31, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.9]} /><meshStandardMaterial color="#1b1233" roughness={0.8} /></mesh>
      <mesh position={[-0.14, 0.2, 0]}><capsuleGeometry args={[0.13, 0.8, 4, 12]} /><meshStandardMaterial color="#1a1238" /></mesh>
      <mesh position={[0.14, 0.2, 0]}><capsuleGeometry args={[0.13, 0.8, 4, 12]} /><meshStandardMaterial color="#1a1238" /></mesh>
      <mesh position={[-0.52, 1.2, 0]} rotation-z={0.2}><capsuleGeometry args={[0.09, 0.7, 4, 12]} /><meshStandardMaterial color="#6d4ae0" /></mesh>
      <group ref={arm} position={[0.45, 1.65, 0]} rotation-z={-2.5}>
        <mesh position={[0, -0.38, 0]}><capsuleGeometry args={[0.09, 0.7, 4, 12]} /><meshStandardMaterial color="#6d4ae0" /></mesh>
        <mesh position={[0, -0.82, 0]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color={skin} /></mesh>
      </group>
      {/* heart badge */}
      <mesh position={[-0.17, 1.55, 0.37]}><sphereGeometry args={[0.07, 12, 12]} /><meshBasicMaterial color="#f472b6" /></mesh>
    </group>
  );
}

function Orbs({ count, reduced }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    pos: [Math.sin(i * 2.4) * (3 + (i % 4)), 0.8 + ((i * 37) % 50) / 12, Math.cos(i * 2.4) * 3 - 3],
    r: 0.12 + ((i * 13) % 10) / 40,
    c: ['#a78bfa', '#f0abfc', '#818cf8', '#c4b5fd'][i % 4],
  })), [count]);
  return items.map((o, i) => (
    <Float key={i} speed={reduced ? 0 : 1.2} floatIntensity={reduced ? 0 : 1.4} rotationIntensity={0}>
      <mesh position={o.pos}>
        <icosahedronGeometry args={[o.r, 2]} />
        <meshStandardMaterial color={o.c} emissive={o.c} emissiveIntensity={0.7} roughness={0.25} />
      </mesh>
    </Float>
  ));
}

export default function Scene({ progress }) {
  const mobile = isMobile();
  const reduced = prefersReducedMotion();
  return (
    <Canvas
      dpr={mobile ? 1 : [1, 1.75]}
      camera={{ position: [0, 1.4, 8.5], fov: mobile ? 62 : 45 }}
      gl={{ antialias: !mobile, powerPreference: 'high-performance' }}
      frameloop="always"
    >
      <color attach="background" args={['#05030b']} />
      <fog attach="fog" args={['#05030b', 10, 26]} />
      <ambientLight intensity={0.25} color="#8b7cff" />
      <pointLight position={[-3, 2.5, -2.5]} intensity={40} color="#8b5cf6" />
      <pointLight position={[3, 1.5, -2.5]} intensity={35} color="#d946ef" />
      <Stars radius={60} depth={50} count={mobile ? 1200 : 4000} factor={3.5} saturation={0.6} fade speed={reduced ? 0 : 0.6} />
      <Spotlight />
      <Panel />
      <Volunteer reduced={reduced} />
      <Orbs count={mobile ? 8 : 18} reduced={reduced} />
      <CameraRig progress={progress} reduced={reduced} />
    </Canvas>
  );
}
