'use client';

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Bounds, Center, ContactShadows, Html } from '@react-three/drei';
import GuitarModel from './GuitarModel';
import { Loader2 } from 'lucide-react';

function Loader() {
  return (
    <Html center>
      <div className="p-3 bg-cream border border-hairline rounded-lg shadow-sm text-xs font-medium text-ink flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>Loading 3D Guitar...</span>
      </div>
    </Html>
  );
}

export default function GuitarScene() {
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center px-4 sm:px-8">
      {/* Viewport Info */}
      <div className="w-full flex items-center justify-between gap-3 mb-2 px-1 text-xs text-muted">
        <span className="text-[11px] sm:text-xs">Swipe to rotate • Click a spot to bid</span>
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="text-xs text-ink hover:text-primary transition-colors font-medium shrink-0"
        >
          {autoRotate ? 'Stop auto-rotate' : 'Auto-rotate'}
        </button>
      </div>

      {/* 3D Canvas matching --bg with subtle border */}
      <div className="relative w-full h-[420px] sm:h-[620px] bg-cream border border-hairline rounded-2xl overflow-hidden shadow-xs">
        <Canvas
          shadows
          camera={{ position: [0, 0, 1.4], fov: 36 }}
          style={{ background: '#FFFFEB' }}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        >
          {/* Soft Studio Lighting */}
          <ambientLight intensity={0.95} color="#FFFFEB" />
          <directionalLight
            position={[2, 4, 3]}
            intensity={1.3}
            color="#FFFFEB"
            castShadow
          />
          <directionalLight
            position={[-2, 1, 2]}
            intensity={0.6}
            color="#FBF9DE"
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
