import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Line, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';

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
  depth = 0.4,
  shelves,
  rackName,
  color = '#EA580C',
  dimmed = false,
  isHighlighted = false,
}) => {
  const shelfHeight = height / shelves;
  const headerColor = isHighlighted ? '#22c55e' : dimmed ? '#94a3b8' : color;
  const postColor = dimmed ? '#cbd5e1' : '#64748b';

  return (
    <group>
      {/* Clean retail rack back panel */}
      <Box args={[width, height, 0.04]} position={[0, 0, -depth / 2]}>
        <meshStandardMaterial
          color={dimmed ? '#e2e8f0' : '#f8fafc'}
          roughness={0.5}
          metalness={0.1}
          transparent
          opacity={dimmed ? 0.2 : 0.88}
        />
      </Box>

      {/* Four brushed-steel vertical corner uprights */}
      {[
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2],
        [width / 2, depth / 2],
      ].map(([px, pz], idx) => (
        <Box key={`post-${idx}`} args={[0.07, height, 0.07]} position={[px, 0, pz]} castShadow>
          <meshStandardMaterial
            color={postColor}
            metalness={0.65}
            roughness={0.3}
            transparent={dimmed}
            opacity={dimmed ? 0.25 : 1}
          />
        </Box>
      ))}

      {/* Top cap */}
      <Box args={[width + 0.06, 0.07, depth + 0.08]} position={[0, height / 2, 0]} castShadow>
        <meshStandardMaterial color={postColor} metalness={0.6} roughness={0.35} transparent={dimmed} opacity={dimmed ? 0.25 : 1} />
      </Box>

      {/* Solid laminated retail shelves with front price-rail accent strip */}
      {Array.from({ length: shelves }).map((_, shelfIndex) => {
        const shelfBaseY = -height / 2 + shelfHeight * shelfIndex;
        return (
          <group key={`shelf-board-${shelfIndex}`} position={[0, shelfBaseY, 0]}>
            <Box args={[width, 0.045, depth]} receiveShadow castShadow>
              <meshStandardMaterial
                color={dimmed ? '#e2e8f0' : '#f1f5f9'}
                roughness={0.4}
                metalness={0.1}
                transparent={dimmed}
                opacity={dimmed ? 0.2 : 0.98}
              />
            </Box>
            {/* Front price-rail accent strip */}
            <Box args={[width, 0.03, 0.02]} position={[0, 0, depth / 2 + 0.01]}>
              <meshStandardMaterial color={headerColor} emissive={headerColor} emissiveIntensity={dimmed ? 0 : 0.2} />
            </Box>
          </group>
        );
      })}

      {/* Modern overhead aisle signage */}
      <group position={[0, height / 2 + 0.34, 0.05]}>
        <Box args={[Math.max(width * 0.92, 1.4), 0.42, 0.08]} castShadow>
          <meshStandardMaterial
            color={headerColor}
            emissive={headerColor}
            emissiveIntensity={dimmed ? 0 : isHighlighted ? 0.7 : 0.2}
            roughness={0.3}
            metalness={0.15}
          />
        </Box>
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.2}
          color="#ffffff"
          outlineWidth={0.015}
          outlineColor="#0f172a"
          fontWeight="900"
          anchorX="center"
          anchorY="middle"
          maxWidth={Math.max(width * 0.85, 1.2)}
        >
          {rackName.toUpperCase()}
        </Text>
      </group>
    </group>
  );
};

/**
 * Modern store ceiling LED light bars & subtle checkout counter props
 * to make the 3D scene look like an authentic retail supermarket.
 */
export const StoreInteriorDecor3D: React.FC<{
  width: number;
  depth: number;
  exitPosition?: [number, number];
}> = ({ width, depth, exitPosition }) => {
  const lightPositions = useMemo(() => {
    const cols = width >= 24 ? [-width / 4, width / 4] : [0];
    const rows = depth >= 18 ? [-depth / 4, depth / 4] : [0];
    const list: [number, number][] = [];
    cols.forEach((x) => rows.forEach((z) => list.push([x, z])));
    return list;
  }, [width, depth]);

  const checkoutX = exitPosition ? exitPosition[0] + (exitPosition[0] > 0 ? -2.2 : 2.2) : -width / 4;
  const checkoutZ = exitPosition ? exitPosition[1] : -depth / 2 + 1.8;

  return (
    <group>
      {/* Overhead suspended LED light fixtures */}
      {lightPositions.map(([lx, lz], i) => (
        <group key={`ceiling-light-${i}`} position={[lx, 4.3, lz]}>
          <Box args={[3.2, 0.08, 0.35]}>
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.3} />
          </Box>
          <Box args={[3.0, 0.03, 0.25]} position={[0, -0.04, 0]}>
            <meshBasicMaterial color="#ffffff" />
          </Box>
        </group>
      ))}

      {/* Sleek Retail Checkout / Billing Counter near Exit */}
      <group position={[checkoutX, 0, checkoutZ]}>
        {/* Counter body */}
        <Box args={[2.2, 0.95, 0.85]} position={[0, 0.475, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.1} />
        </Box>
        {/* Counter orange/slate top surface */}
        <Box args={[2.3, 0.08, 0.95]} position={[0, 0.98, 0]} castShadow>
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
        </Box>
        {/* Accent front strip */}
        <Box args={[2.22, 0.14, 0.03]} position={[0, 0.72, 0.43]}>
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.2} />
        </Box>
        {/* POS Monitor */}
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
