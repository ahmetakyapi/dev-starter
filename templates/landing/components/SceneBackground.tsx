'use client'

import { Canvas } from '@react-three/fiber'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Three.js arka plan — yavaş dönen parçacık bulutu.
 * Sadece dark modda belirgin; light modda çok soluk.
 * dynamic import ile SSR'sız yüklenir (page.tsx'te).
 */
function Particles({ count = 800 }) {
  const mesh = useRef<THREE.Points>(null)

  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20
  }

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.03
      mesh.current.rotation.x += delta * 0.01
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#6366f1"
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  )
}

export default function SceneBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-60 dark:opacity-100">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Particles />
      </Canvas>
    </div>
  )
}
