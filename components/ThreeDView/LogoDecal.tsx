'use client';

import React, { useState } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { EnhancedZoneDefinition } from '@/lib/zones';
import { useAuction } from '@/lib/AuctionContext';

interface LogoDecalProps {
  definition: EnhancedZoneDefinition;
}

function PrintedSticker({
  url,
  position,
  rotation,
  scale,
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}) {
  const texture = useTexture(url);

  React.useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <group position={position} rotation={rotation} renderOrder={1}>
      {/* Matte Vinyl Sticker Body */}
      <mesh position={[0, 0, 0.0001]}>
        <planeGeometry args={[scale[0], scale[1]]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.35}
          metalness={0.05}
          depthWrite={false}
          depthTest={true}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  );
}

export default function LogoDecal({ definition }: LogoDecalProps) {
  const { getZoneState, setSelectedZoneId } = useAuction();
  const zoneState = getZoneState(definition.id);
  const [hovered, setHovered] = useState(false);

  const hasBid = Boolean(zoneState?.current_bid_cents && zoneState.current_bid_cents > 0);
  const hasLogo = Boolean(hasBid && zoneState?.logo_url);

  const { position, rotation, scale } = definition.threeDView;

  return (
    <group>
      {/* 1. Has Top Bid Logo - Render Matte Vinyl Sticker */}
      {hasLogo && zoneState?.logo_url ? (
        <React.Suspense fallback={null}>
          <PrintedSticker
            url={zoneState.logo_url}
            position={position}
            rotation={rotation}
            scale={scale}
          />
        </React.Suspense>
      ) : (
        /* 2. Open Spot Sticker Outline on Surface */
        <group position={position} rotation={rotation}>
          {/* Subtle Sticker Base */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[scale[0], scale[1]]} />
            <meshBasicMaterial
              color={hovered ? '#034F46' : '#1A1A1A'}
              transparent
              opacity={hovered ? 0.25 : 0.06}
              depthWrite={false}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-8}
            />
          </mesh>

          {/* Clean Sticker Outline */}
          <mesh position={[0, 0, 0.0002]}>
            <planeGeometry args={[scale[0] * 1.01, scale[1] * 1.01]} />
            <meshBasicMaterial
              color={hovered ? '#034F46' : '#5A5A52'}
              wireframe
              transparent
              opacity={hovered ? 0.95 : 0.4}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* 3. Interactive Click / Hover Hitbox */}
      <mesh
        position={position}
        rotation={rotation}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedZoneId(definition.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[scale[0] * 1.2, scale[1] * 1.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
