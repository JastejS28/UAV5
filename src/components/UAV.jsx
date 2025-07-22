import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useUAVStore } from '../store/uavStore';

const UAV = () => {
  const { scene } = useGLTF('/models/drone/uav.glb');
  const uavRef = useRef();
  
  useFrame(() => {
    if (!uavRef.current) return;
    
    const state = useUAVStore.getState();
    const { position, rotation, targetPosition, isCrashed, setPosition, setRotation } = state;
    
    // If crashed, make UAV shake and don't move
    if (isCrashed) {
      if (uavRef.current) {
        uavRef.current.rotation.x = rotation[0] + Math.sin(Date.now() * 0.01) * 0.2;
        uavRef.current.rotation.z = rotation[2] + Math.cos(Date.now() * 0.01) * 0.2;
        uavRef.current.position.set(...position);
      }
      return;
    }
    
    // Normal movement when not crashed
    if (targetPosition && Array.isArray(targetPosition)) {
      const dx = targetPosition[0] - position[0];
      const dz = targetPosition[2] - position[2];
      const dy = targetPosition[1] - position[1];
      
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      if (distance > 0.5) {
        const speed = 0.3; // Reduced speed for better collision detection
        let newPos = [
          position[0] + (dx/distance) * speed,
          position[1] + (dy/distance) * speed,
          position[2] + (dz/distance) * speed
        ];
        
        // Strict altitude limits
        newPos[1] = Math.min(newPos[1], 50); // Maximum 50m
        newPos[1] = Math.max(newPos[1], 8);  // Minimum 8m (above ground)
        
        setPosition(newPos);
        
        if (dx !== 0 || dz !== 0) {
          const angle = Math.atan2(dx, dz);
          setRotation([0, angle, 0]);
        }
      } else {
        // Reached target - stop moving
        useUAVStore.setState({ targetPosition: null });
      }
    }
    
    // Apply position and rotation to model
    uavRef.current.position.set(...position);
    uavRef.current.rotation.set(rotation[0], rotation[1] + Math.PI, rotation[2]);
  });
  
  return (
    <primitive 
      ref={uavRef}
      object={scene.clone()}
      scale={[3, 3, 3]}
      castShadow
    />
  );
};

export default UAV;