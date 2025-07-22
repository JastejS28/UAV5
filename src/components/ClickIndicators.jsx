import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useClickControlStore } from '../store/clickControlStore';
import * as THREE from 'three';

// Click indicator for movement targets
const MovementIndicator = ({ position }) => {
  const meshRef = useRef();
  const ringRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      meshRef.current.scale.setScalar(scale);
      
      // Rotation animation
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
    
    if (ringRef.current) {
      // Counter-rotation for ring
      ringRef.current.rotation.y = -state.clock.elapsedTime * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Main indicator sphere */}
      <mesh ref={meshRef} position={[0, 2, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color="#00ff00" 
          transparent 
          opacity={0.8}
          emissive="#004400"
        />
      </mesh>
      
      {/* Rotating ring */}
      <mesh ref={ringRef} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.2, 8, 32]} />
        <meshBasicMaterial 
          color="#00aa00" 
          transparent 
          opacity={0.6}
          emissive="#002200"
        />
      </mesh>
      
      {/* Ground marker */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.5, 32]} />
        <meshBasicMaterial 
          color="#00ff00" 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// Spawn indicator for UAV starting position
const SpawnIndicator = ({ position }) => {
  const meshRef = useRef();
  const particlesRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
    
    if (particlesRef.current) {
      // Particle effect rotation
      particlesRef.current.rotation.y = state.clock.elapsedTime * 1.5;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Main spawn beacon */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.5, 1, 4, 8]} />
        <meshBasicMaterial 
          color="#0088ff" 
          transparent 
          opacity={0.8}
          emissive="#002244"
        />
      </mesh>
      
      {/* Orbiting particles */}
      <group ref={particlesRef}>
        {[0, 1, 2, 3].map((i) => (
          <mesh 
            key={i}
            position={[
              Math.cos((i * Math.PI) / 2) * 4,
              position[1] + 3,
              Math.sin((i * Math.PI) / 2) * 4
            ]}
          >
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshBasicMaterial 
              color="#00ddff" 
              transparent 
              opacity={0.7}
              emissive="#001133"
            />
          </mesh>
        ))}
      </group>
      
      {/* Ground circle */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 4, 32]} />
        <meshBasicMaterial 
          color="#0088ff" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// Main component that manages all indicators
const ClickIndicators = () => {
  const { clickIndicator, spawnIndicator } = useClickControlStore();

  return (
    <>
      {/* Movement target indicator */}
      {clickIndicator && (
        <MovementIndicator position={clickIndicator.position} />
      )}
      
      {/* Spawn position indicator */}
      {spawnIndicator && (
        <SpawnIndicator position={spawnIndicator.position} />
      )}
    </>
  );
};

export default ClickIndicators;