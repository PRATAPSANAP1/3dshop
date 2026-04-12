import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const FloatingOrb = () => {
  return (
    <>
      <Float speed={4} rotationIntensity={1} floatIntensity={2}>
        <Sphere args={[1.5, 64, 64]} scale={1.2}>
          <MeshDistortMaterial color="#6366f1" speed={3} distort={0.4} radius={1} />
        </Sphere>
      </Float>
      <Float speed={2} rotationIntensity={2} floatIntensity={1}>
        <mesh position={[2, 1, -1]}>
          <octahedronGeometry args={[0.5]} />
          <meshStandardMaterial color="#f97316" wireframe />
        </mesh>
      </Float>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-2, -1.5, 1]}>
          <torusGeometry args={[0.3, 0.1, 16, 32]} />
          <meshStandardMaterial color="#8b5cf6" />
        </mesh>
      </Float>
    </>
  );
};

const Hero3DScene = () => {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <FloatingOrb />
      </Canvas>
    </div>
  );
};

export default Hero3DScene;
