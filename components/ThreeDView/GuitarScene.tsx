'use client';

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, Center, ContactShadows, Html } from '@react-three/drei';
import GuitarModel from './GuitarModel';
import { Loader2 } from 'lucide-react';

function Loader() {
  return (
    <Html center>
      <div className="p-3 bg-white rounded-lg shadow-sm text-xs font-medium text-text flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
        <span>Loading 3D Guitar...</span>
      </div>
    </Html>
  );
}

export default function GuitarScene() {
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* Viewport Info */}
      <div className="w-full flex items-center justify-between gap-3 mb-2 px-1 text-xs text-text-muted">
        <span>Swipe left or right to rotate • Click a spot to bid</span>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="text-xs text-text hover:underline"
        >
          {autoRotate ? 'Stop auto-rotate' : 'Auto-rotate'}
        </button>
      </div>

      {/* 3D Canvas without hard borders, with soft ambient shadow */}
      <div className="relative w-full h-[540px] sm:h-[620px] bg-card-bg rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <Canvas
          shadows
          camera={{ position: [0, 0, 1.4], fov: 36 }}
          style={{ background: '#F5F5F5' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Soft Studio Lighting */}
          <ambientLight intensity={0.95} color="#FFFFFF" />
          <directionalLight
            position={[2, 4, 3]}
            intensity={1.3}
            color="#FFFFFF"
            castShadow
          />
          <directionalLight
            position={[-2, 1, 2]}
            intensity={0.6}
            color="#F5F5F5"
          />

          <Suspense fallback={<Loader />}>
            <Bounds fit clip observe margin={1.2}>
              <Center top={false}>
                <GuitarModel />
              </Center>
            </Bounds>

            <ContactShadows
              position={[0, -0.45, 0]}
              opacity={0.25}
              scale={2.2}
              blur={2.5}
              far={1.2}
              color="#1A1A1A"
            />
          </Suspense>

          {/* Locked to smooth horizontal turntable rotation */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={0.8}
            maxDistance={2.6}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
            target={[0, 0, 0]}
            autoRotate={autoRotate}
            autoRotateSpeed={1.0}
            makeDefault
          />
        </Canvas>
      </div>
    </div>
  );
}
