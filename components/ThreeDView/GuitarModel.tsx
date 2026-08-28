'use client';

import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { ZONE_DEFINITIONS } from '@/lib/zones';
import LogoDecal from './LogoDecal';

export const GUITAR_MODEL_URL = '/models/taylor_guitar_gold_label.glb';

export default function GuitarModel({ modelPath = GUITAR_MODEL_URL }: { modelPath?: string }) {
  const groupRef = useRef<any>(null);
  const { scene } = useGLTF(modelPath) as any;

  // Clone scene and apply premium satin materials
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material.roughness = Math.min(child.material.roughness || 0.4, 0.35);
          child.material.metalness = Math.max(child.material.metalness || 0.1, 0.15);
          child.material.needsUpdate = true;
        }
      }
    });

    return clone;
  }, [scene]);

  return (
    // Fixed Euler Rotation to stand upright (headstock top, body bottom, face +Z camera)
    <group ref={groupRef} rotation={[0, Math.PI / 2, Math.PI / 2]} dispose={null}>
      {/* 3D Guitar Mesh from GLB */}
      <primitive object={clonedScene} />

      {/* Attach Zone Decals Directly to Guitar Group */}
      {ZONE_DEFINITIONS.map((def) => (
        <LogoDecal
          key={def.id}
          definition={def}
        />
      ))}
    </group>
  );
}

useGLTF.preload(GUITAR_MODEL_URL);
