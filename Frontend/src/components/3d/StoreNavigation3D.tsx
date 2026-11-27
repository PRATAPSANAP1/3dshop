import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Line, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Generates a realistic warm cream/ivory ceramic tile floor texture
 * with subtle grout lines matching modern boutique showroom flooring.
 */
export const CreamTileFloor3D: React.FC<{ width: number; depth: number }> = ({ width, depth }) => {
  const tileTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Warm ivory ceramic tile base
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(0, 0, 256, 256);

      // Subtle tile surface variation
      ctx.fillStyle = '#f8f4ec';
      ctx.fillRect(4, 4, 248, 248);

      // Grout lines
      ctx.strokeStyle = '#cfc5b4';
      ctx.lineWidth = 5;
      ctx.strokeRect(0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(Math.max(4, Math.round(width / 1.2)), Math.max(4, Math.round(depth / 1.2)));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [width, depth]);

  useEffect(() => {
    return () => {
      tileTexture.dispose();
    };
  }, [tileTexture]);

  return (
    <group>
      <Plane args={[width, depth]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial map={tileTexture} roughness={0.35} metalness={0.08} />
      </Plane>
      {/* Clean architectural baseboard / slab edge */}
      <Box args={[width + 0.4, 0.14, depth + 0.4]} position={[0, -0.075, 0]}>
        <meshStandardMaterial color="#d6cfc2" roughness={0.6} metalness={0.1} />
      </Box>
    </group>
  );
};

/**
 * Renders Google Maps / architectural dimension lines around the 3D shop floor
 * showing store breadth (width) and depth in meters.
 */
export const StoreDimensionsOverlay3D: React.FC<{
  width: number;
  depth: number;
  floor?: number;
}> = ({ width, depth, floor = 1 }) => {
  const halfW = width / 2;
  const halfD = depth / 2;
  const offset = 1.1;

  return (
    <group position={[0, 0.03, 0]}>
      {/* Width (Breadth) dimension line along front edge (+Z) */}
      <Line
        points={[
          [-halfW, 0, halfD + offset],
          [halfW, 0, halfD + offset],
        ]}
        color="#38bdf8"
        lineWidth={2.5}
      />
      {/* End ticks for Width */}
      <Line
        points={[
          [-halfW, 0, halfD + offset - 0.35],
          [-halfW, 0, halfD + offset + 0.35],
        ]}
        color="#38bdf8"
        lineWidth={2.5}
      />
      <Line
        points={[
          [halfW, 0, halfD + offset - 0.35],
          [halfW, 0, halfD + offset + 0.35],
        ]}
        color="#38bdf8"
        lineWidth={2.5}
      />
      <group position={[0, 0.12, halfD + offset]}>
        <Box args={[2.6, 0.12, 0.7]}>
          <meshBasicMaterial color="#0f172a" />
        </Box>
        <Text
          position={[0, 0.08, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.38}
          color="#38bdf8"
          fontWeight="900"
          anchorX="center"
          anchorY="middle"
        >
          {`↔ ${width} m`}
        </Text>
      </group>

      {/* Depth dimension line along right edge (+X) */}
      <Line
        points={[
          [halfW + offset, 0, -halfD],
          [halfW + offset, 0, halfD],
        ]}
        color="#a78bfa"
        lineWidth={2.5}
      />
      {/* End ticks for Depth */}
      <Line
        points={[
          [halfW + offset - 0.35, 0, -halfD],
          [halfW + offset + 0.35, 0, -halfD],
        ]}
        color="#a78bfa"
        lineWidth={2.5}
      />
      <Line
        points={[
          [halfW + offset - 0.35, 0, halfD],
          [halfW + offset + 0.35, 0, halfD],
        ]}
        color="#a78bfa"
        lineWidth={2.5}
      />
      <group position={[halfW + offset, 0.12, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Box args={[2.6, 0.12, 0.7]}>
          <meshBasicMaterial color="#0f172a" />
        </Box>
        <Text
          position={[0, 0.08, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.38}
          color="#a78bfa"
          fontWeight="900"
          anchorX="center"
          anchorY="middle"
        >
          {`↕ ${depth} m`}
        </Text>
      </group>

      {/* Floor badge on front-left corner */}
      <group position={[-halfW + 2.4, 0.06, halfD + offset]}>
        <Box args={[4.4, 0.08, 0.65]}>
          <meshBasicMaterial color="#0f172a" />
        </Box>
        <Text
          position={[0, 0.06, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.28}
          color="#f8fafc"
          fontWeight="900"
          anchorX="center"
          anchorY="middle"
        >
          {`FLOOR ${floor} • ${width}m × ${depth}m`}
        </Text>
      </group>
    </group>
  );
};

interface RouteStopLabel {
  label?: string;
}

/**
 * Google Maps-style 3D route with glowing path ribbon, animated directional
 * chevron arrows along every segment, segment distance badges, and waypoint pins.
 */
export const GoogleMapsRoute3D: React.FC<{
  points: [number, number, number][];
  activeStepIndex: number;
  stopLabels?: RouteStopLabel[];
}> = ({ points, activeStepIndex, stopLabels }) => {
  const arrowsGroupRef = useRef<THREE.Group>(null);

  const segments = useMemo(() => {
    if (!points || points.length < 2) return [];
    const segs: {
      start: [number, number, number];
      end: [number, number, number];
      mid: [number, number, number];
      length: number;
      angle: number;
      arrows: { pos: [number, number, number]; idx: number }[];
    }[] = [];

    let arrowCounter = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const length = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const mid: [number, number, number] = [(a[0] + b[0]) / 2, 0.18, (a[2] + b[2]) / 2];

      const arrows: { pos: [number, number, number]; idx: number }[] = [];
      if (length >= 0.8) {
        const spacing = 1.6;
        const count = Math.max(1, Math.floor(length / spacing));
        for (let k = 1; k <= count; k++) {
          const t = k / (count + 1);
          arrows.push({
            pos: [a[0] + dx * t, 0.16, a[2] + dz * t],
            idx: arrowCounter++,
          });
        }
      }
      segs.push({ start: a, end: b, mid, length, angle, arrows });
    }
    return segs;
  }, [points]);

  useFrame(({ clock }) => {
    if (!arrowsGroupRef.current) return;
    const t = clock.getElapsedTime();
    arrowsGroupRef.current.children.forEach((child, idx) => {
      const pulse = 0.85 + Math.sin(t * 4 - idx * 0.6) * 0.2;
      child.scale.set(pulse, 1, pulse);
    });
  });

  if (!points || points.length < 2) return null;

  const floorPoints: [number, number, number][] = points.map(([x, , z]) => [x, 0.12, z]);

  return (
    <group>
      {/* Outer Google Maps blue glow ribbon */}
      <Line points={floorPoints} color="#1d4ed8" lineWidth={10} transparent opacity={0.35} />
      {/* Inner crisp Google Maps navigation line */}
      <Line points={floorPoints} color="#2563eb" lineWidth={4.5} />

      {/* Directional 3D arrows along every segment */}
      <group ref={arrowsGroupRef}>
        {segments.map((seg, sIdx) =>
          seg.arrows.map((arr, aIdx) => (
            <group key={`arrow-${sIdx}-${aIdx}`} position={arr.pos} rotation={[0, seg.angle, 0]}>
              {/* Arrowhead pointing forward along +Z in local space */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.24, 0.52, 4]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#2563eb"
                  emissiveIntensity={0.9}
                />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* Google Maps-style distance dimension pills at segment midpoints */}
      {segments.map((seg, sIdx) =>
        seg.length >= 0.7 ? (
          <group key={`seg-dist-${sIdx}`} position={[seg.mid[0], 0.52, seg.mid[2]]}>
            <Box args={[1.35, 0.42, 0.08]}>
              <meshBasicMaterial color="#0f172a" />
            </Box>
            <Box args={[1.41, 0.48, 0.04]} position={[0, 0, -0.01]}>
              <meshBasicMaterial color="#38bdf8" />
            </Box>
            <Text
              position={[0, 0, 0.05]}
              fontSize={0.22}
              color="#ffffff"
              fontWeight="900"
              anchorX="center"
              anchorY="middle"
            >
              {`${seg.length.toFixed(1)} m`}
            </Text>
          </group>
        ) : null
      )}

      {/* Waypoint Pins (Start, Stops, Exit) */}
      {points.map((pt, i) => {
        const isEntry = i === 0;
        const isExit = i === points.length - 1;
        const isActive = i === activeStepIndex + 1;
        const pinColor = isEntry ? '#10b981' : isExit ? '#f43f5e' : isActive ? '#22c55e' : '#3b82f6';
        const customLabel = stopLabels?.[i]?.label;
        const stepLabel = isEntry
          ? 'START'
          : isExit
          ? 'EXIT / PAY'
          : customLabel
          ? `${i}. ${customLabel}`
          : `STOP ${i}`;

        return (
          <group key={`route-pt-${i}`} position={[pt[0], 0.15, pt[2]]}>
            {/* Ground target ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.28, 0.45, 24]} />
              <meshBasicMaterial color={pinColor} transparent opacity={0.85} side={THREE.DoubleSide} />
            </mesh>
            {/* Pin stem */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.85, 8]} />
              <meshStandardMaterial color={pinColor} emissive={pinColor} emissiveIntensity={0.6} />
            </mesh>
            {/* Pin head */}
            <mesh position={[0, 0.95, 0]}>
              <sphereGeometry args={[isEntry || isExit ? 0.28 : 0.22, 16, 16]} />
              <meshStandardMaterial
                color={pinColor}
                emissive={pinColor}
                emissiveIntensity={isActive ? 1.5 : 0.7}
              />
            </mesh>
            {/* Pin floating label */}
            <Text
              position={[0, 1.35, 0]}
              fontSize={0.26}
              color="#ffffff"
              outlineWidth={0.03}
              outlineColor="#0f172a"
              fontWeight="900"
              anchorX="center"
              anchorY="bottom"
            >
              {stepLabel}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

/**
 * Sleek modern supermarket rack frame with metallic corner pillars,
 * solid laminated shelves, back panel, and glowing aisle header.
 */
export const AttractiveRackFrame3D: React.FC<{
  width: number;
  height: number;
  depth?: number;
  shelves: number;
  rackName: string;
  color?: string;
  dimmed?: boolean;
  isHighlighted?: boolean;
}> = ({
  width,
  height,
  depth = 0.48,
  shelves,
  rackName,
  color = '#27272a',
  dimmed = false,
  isHighlighted = false,
}) => {
  const shelfHeight = height / shelves;
  const headerColor = isHighlighted ? '#22c55e' : dimmed ? '#94a3b8' : '#27272a';
  const accentStripColor = isHighlighted ? '#22c55e' : dimmed ? '#94a3b8' : color;

  return (
    <group>
      {/* Clean matte-white architectural back wall */}
      <Box args={[width, height, 0.05]} position={[0, 0, -depth / 2]}>
        <meshStandardMaterial
          color={dimmed ? '#cbd5e1' : '#f8fafc'}
          roughness={0.45}
          metalness={0.05}
          transparent={dimmed}
          opacity={dimmed ? 0.2 : 1}
        />
      </Box>

      {/* Thick architectural white side columns */}
      <Box args={[0.1, height, depth]} position={[-width / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={dimmed ? '#cbd5e1' : '#f1f5f9'} roughness={0.4} transparent={dimmed} opacity={dimmed ? 0.2 : 1} />
      </Box>
      <Box args={[0.1, height, depth]} position={[width / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={dimmed ? '#cbd5e1' : '#f1f5f9'} roughness={0.4} transparent={dimmed} opacity={dimmed ? 0.2 : 1} />
      </Box>

      {/* Top architectural soffit beam */}
      <Box args={[width + 0.1, 0.14, depth + 0.06]} position={[0, height / 2 + 0.02, 0]} castShadow>
        <meshStandardMaterial color={dimmed ? '#cbd5e1' : '#ffffff'} roughness={0.35} transparent={dimmed} opacity={dimmed ? 0.25 : 1} />
      </Box>

      {/* Thick white boutique shelves + under-shelf warm LED light strip + alternating charcoal cubby frames */}
      {Array.from({ length: shelves }).map((_, shelfIndex) => {
        const shelfBaseY = -height / 2 + shelfHeight * shelfIndex;
        const hasCharcoalCubby = !dimmed && shelfIndex > 0 && shelfIndex % 2 === 1;
        const cubbyWidth = width * 0.44;
        const cubbyX = shelfIndex % 4 === 1 ? width * 0.22 : -width * 0.22;

        return (
          <group key={`shelf-board-${shelfIndex}`} position={[0, shelfBaseY, 0]}>
            {/* Thick white shelf slab */}
            <Box args={[width, 0.08, depth]} receiveShadow castShadow>
              <meshStandardMaterial
                color={dimmed ? '#cbd5e1' : '#ffffff'}
                roughness={0.35}
                metalness={0.05}
                transparent={dimmed}
                opacity={dimmed ? 0.2 : 1}
              />
            </Box>

            {/* Warm-white under-shelf LED light strip */}
            {!dimmed && (
              <Box args={[width - 0.16, 0.015, 0.03]} position={[0, -0.045, depth / 2 - 0.06]}>
                <meshBasicMaterial color="#fffbeb" />
              </Box>
            )}

            {/* Alternating dark charcoal accent cubby box (like boutique showroom) */}
            {hasCharcoalCubby && (
              <group position={[cubbyX, shelfHeight / 2, 0.03]}>
                {/* Top & bottom charcoal frame */}
                <Box args={[cubbyWidth, 0.05, depth + 0.06]} position={[0, shelfHeight / 2 - 0.05, 0]}>
                  <meshStandardMaterial color="#27272a" roughness={0.5} />
                </Box>
                <Box args={[cubbyWidth, 0.05, depth + 0.06]} position={[0, -shelfHeight / 2 + 0.05, 0]}>
                  <meshStandardMaterial color="#27272a" roughness={0.5} />
                </Box>
                {/* Left & right charcoal frame */}
                <Box args={[0.05, shelfHeight - 0.05, depth + 0.06]} position={[-cubbyWidth / 2 + 0.025, 0, 0]}>
                  <meshStandardMaterial color="#27272a" roughness={0.5} />
                </Box>
                <Box args={[0.05, shelfHeight - 0.05, depth + 0.06]} position={[cubbyWidth / 2 - 0.025, 0, 0]}>
                  <meshStandardMaterial color="#27272a" roughness={0.5} />
                </Box>
              </group>
            )}
          </group>
        );
      })}

      {/* Sleek charcoal boutique signage header */}
      <group position={[0, height / 2 + 0.34, 0.04]}>
        <Box args={[Math.max(width * 0.72, 1.3), 0.36, 0.07]} castShadow>
          <meshStandardMaterial
            color={headerColor}
            emissive={isHighlighted ? '#22c55e' : '#000000'}
            emissiveIntensity={isHighlighted ? 0.45 : 0}
            roughness={0.35}
          />
        </Box>
        {/* Thin color accent bar under sign */}
        <Box args={[Math.max(width * 0.72, 1.3), 0.035, 0.075]} position={[0, -0.19, 0]}>
          <meshStandardMaterial color={accentStripColor} emissive={accentStripColor} emissiveIntensity={dimmed ? 0 : 0.3} />
        </Box>
        <Text
          position={[0, 0, 0.045]}
          fontSize={0.18}
          color="#ffffff"
          fontWeight="900"
          anchorX="center"
          anchorY="middle"
          maxWidth={Math.max(width * 0.65, 1.1)}
        >
          {rackName.toUpperCase()}
        </Text>
      </group>
    </group>
  );
};

/**
 * Boutique showroom interior architecture:
 * - One-way inward-facing matte white walls (solid from inside, invisible from outside so camera never clips)
 * - Charcoal brand feature wall with illuminated white display niches & flanking promo posters
 * - Dual ceiling track-lighting rails with spotlight cans
 * - Center espresso benches / stepped display risers & billing counter
 */
export const StoreInteriorDecor3D: React.FC<{
  width: number;
  depth: number;
  shopName?: string;
  exitPosition?: [number, number];
}> = ({ width, depth, shopName = 'SHOWROOM', exitPosition }) => {
  const wallHeight = 4.6;
  const halfW = width / 2;
  const halfD = depth / 2;

  const trackPositions = useMemo(() => {
    const count = Math.max(4, Math.floor(depth / 2.2));
    const zs: number[] = [];
    for (let i = 0; i < count; i++) {
      zs.push(-halfD + 1.8 + (i * (depth - 3.6)) / Math.max(1, count - 1));
    }
    return zs;
  }, [depth, halfD]);

  const checkoutX = exitPosition ? exitPosition[0] + (exitPosition[0] > 0 ? -2.4 : 2.4) : -width / 4;
  const checkoutZ = exitPosition ? exitPosition[1] : -halfD + 2.2;

  return (
    <group>
      {/* Inward-facing architectural matte white walls (never block external camera angles) */}
      <Plane args={[width, wallHeight]} position={[0, wallHeight / 2, -halfD]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} side={THREE.FrontSide} />
      </Plane>
      <Plane args={[width, wallHeight]} position={[0, wallHeight / 2, halfD]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} side={THREE.FrontSide} />
      </Plane>
      <Plane args={[depth, wallHeight]} position={[-halfW, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.7} side={THREE.FrontSide} />
      </Plane>
      <Plane args={[depth, wallHeight]} position={[halfW, wallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.7} side={THREE.FrontSide} />
      </Plane>

      {/* Subtle translucent ceiling plane (visible from inside looking up) */}
      <Plane args={[width, depth]} position={[0, wallHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.8} side={THREE.FrontSide} />
      </Plane>

      {/* Charcoal Brand Feature Wall at Back Center (inspired by boutique reference) */}
      <group position={[0, 2.2, -halfD + 0.16]}>
        <Box args={[Math.min(5.2, width * 0.28), 4.2, 0.25]} castShadow>
          <meshStandardMaterial color="#27272a" roughness={0.55} />
        </Box>
        {/* Brand / Store Name Header */}
        <Text
          position={[0, 1.55, 0.15]}
          fontSize={0.48}
          color="#ffffff"
          fontWeight="900"
          anchorX="center"
          anchorY="middle"
          maxWidth={4.5}
        >
          {(shopName || 'STORE').toLowerCase()}
        </Text>
        {/* Illuminated White Display Niches */}
        {[-1.25, 0, 1.25].map((nx, idx) => (
          <group key={`niche-${idx}`} position={[nx, idx === 1 ? 0.35 : -0.15, 0.14]}>
            <Box args={[1.05, 1.15, 0.04]}>
              <meshBasicMaterial color="#ffffff" />
            </Box>
          </group>
        ))}
        {[-0.65, 0.65].map((nx, idx) => (
          <group key={`niche-low-${idx}`} position={[nx, -1.15, 0.14]}>
            <Box args={[1.15, 0.7, 0.04]}>
              <meshBasicMaterial color="#f8fafc" />
            </Box>
          </group>
        ))}
      </group>

      {/* Flanking Promo / Sale Poster Frames on Back Wall */}
      {width >= 14 && (
        <>
          <group position={[-4.3, 2.1, -halfD + 0.12]}>
            <Box args={[2.1, 3.4, 0.06]}>
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </Box>
            <Box args={[1.9, 3.2, 0.07]}>
              <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.25} />
            </Box>
            <Text position={[0, 0.5, 0.06]} fontSize={0.52} color="#ffffff" fontWeight="900" anchorX="center">
              SALE
            </Text>
            <Text position={[0, -0.15, 0.06]} fontSize={0.22} color="#fef3c7" fontWeight="bold" anchorX="center">
              NEW ARRIVALS
            </Text>
          </group>

          <group position={[4.3, 2.1, -halfD + 0.12]}>
            <Box args={[2.1, 3.4, 0.06]}>
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </Box>
            <Box args={[1.9, 3.2, 0.07]}>
              <meshStandardMaterial color="#0f172a" />
            </Box>
            <Text position={[0, 0.3, 0.06]} fontSize={0.34} color="#ffffff" fontWeight="900" anchorX="center">
              FEATURED
            </Text>
            <Text position={[0, -0.25, 0.06]} fontSize={0.2} color="#38bdf8" fontWeight="bold" anchorX="center">
              3D STORE GUIDE
            </Text>
          </group>
        </>
      )}

      {/* Dual Black Ceiling Track Lighting Rails + Spotlight Cans */}
      {[-width * 0.2, width * 0.2].map((tx, railIdx) => (
        <group key={`track-rail-${railIdx}`} position={[tx, wallHeight - 0.15, 0]}>
          <Box args={[0.14, 0.08, depth - 1.5]}>
            <meshStandardMaterial color="#18181b" metalness={0.6} roughness={0.35} />
          </Box>
          {trackPositions.map((tz, spotIdx) => (
            <group key={`spot-${railIdx}-${spotIdx}`} position={[0, -0.14, tz]}>
              <mesh rotation={[0.35, 0, railIdx === 0 ? -0.35 : 0.35]}>
                <cylinderGeometry args={[0.07, 0.09, 0.22, 8]} />
                <meshStandardMaterial color="#18181b" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.09, 0]}>
                <sphereGeometry args={[0.055, 8, 8]} />
                <meshBasicMaterial color="#fffbeb" />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Center Showroom Espresso Seating Bench & Stepped Display Riser */}
      <group position={[0, 0, -halfD + 5.5]}>
        <Box args={[1.6, 0.42, 0.75]} position={[0, 0.21, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4a2c1d" roughness={0.65} />
        </Box>
        <Box args={[1.4, 0.78, 0.85]} position={[0, 0.39, -1.35]} castShadow receiveShadow>
          <meshStandardMaterial color="#3b2114" roughness={0.55} />
        </Box>
        <Box args={[0.7, 0.42, 0.85]} position={[-1.0, 0.21, -1.35]} castShadow receiveShadow>
          <meshStandardMaterial color="#3b2114" roughness={0.55} />
        </Box>
      </group>

      {/* Sleek Retail Checkout / Billing Counter near Exit */}
      <group position={[checkoutX, 0, checkoutZ]}>
        <Box args={[2.2, 0.95, 0.85]} position={[0, 0.475, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.1} />
        </Box>
        <Box args={[2.3, 0.08, 0.95]} position={[0, 0.98, 0]} castShadow>
          <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.2} />
        </Box>
        <Box args={[2.22, 0.14, 0.03]} position={[0, 0.72, 0.43]}>
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.2} />
        </Box>
        <Box args={[0.45, 0.32, 0.04]} position={[-0.4, 1.24, 0]}>
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
        </Box>
        <Box args={[0.4, 0.26, 0.02]} position={[-0.4, 1.24, 0.02]}>
          <meshBasicMaterial color="#38bdf8" />
        </Box>
        <Text
          position={[0, 1.65, 0]}
          fontSize={0.22}
          color="#0f172a"
          fontWeight="900"
          anchorX="center"
          anchorY="bottom"
        >
          BILLING COUNTER
        </Text>
      </group>
    </group>
  );
};
