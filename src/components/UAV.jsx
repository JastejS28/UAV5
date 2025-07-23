import React, { useRef, useEffect } from 'react';
import { useUAVStore } from '../store/uavStore';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const UAV = (props) => {
  // Get position and rotation from the UAV store
  const position = useUAVStore((state) => state.position);
  const rotation = useUAVStore((state) => state.rotation);
  const isCrashed = useUAVStore((state) => state.isCrashed);
  const targetPosition = useUAVStore((state) => state.targetPosition);
  const speed = useUAVStore((state) => state.speed);
  
  // Reference to the UAV model
  const modelRef = useRef();
  
  // Mark UAV to avoid collision detection with itself
  useEffect(() => {
    if (modelRef.current) {
      // Mark the UAV and all its children
      modelRef.current.userData.isUAV = true;
      modelRef.current.name = "UAV_Main";
      
      modelRef.current.traverse(child => {
        child.userData.isUAV = true;
        if (child.isMesh && !child.name.includes('UAV')) {
          child.name = `UAV_${child.name || 'Part'}`;
        }
      });
      
      console.log('[UAV] Marked UAV mesh and its children for collision exclusion');
    }
  }, []);

  useFrame(() => {
    // Handle UAV movement first
    if (!isCrashed && targetPosition) {
      const currentPos = new THREE.Vector3(...position);
      const targetPos = new THREE.Vector3(...targetPosition);
      const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
      const distance = currentPos.distanceTo(targetPos);
      
      // Only move if not very close to target
      if (distance > 0.5) {
        // Calculate new position
        const stepSize = Math.min(speed, distance);
        const newPos = new THREE.Vector3().copy(currentPos);
        newPos.addScaledVector(direction, stepSize);
        
        // Update position in store
        useUAVStore.getState().setPosition([newPos.x, newPos.y, newPos.z]);
        
        // Update rotation to face movement direction
        if (Math.abs(direction.x) > 0.01 || Math.abs(direction.z) > 0.01) {
          const angle = Math.atan2(direction.x, direction.z);
          useUAVStore.getState().setRotation([0, angle, 0]);
        }
      } else {
        // Snap to target and clear it
        useUAVStore.getState().setPosition([...targetPosition]);
        useUAVStore.getState().setTargetPosition(null);
      }
    }
    
    if (!modelRef.current) return;
    
    // If crashed, make UAV shake and don't move
    if (isCrashed) {
      if (modelRef.current) {
        modelRef.current.rotation.x = rotation[0] + Math.sin(Date.now() * 0.01) * 0.2;
        modelRef.current.rotation.z = rotation[2] + Math.cos(Date.now() * 0.01) * 0.2;
        modelRef.current.position.set(...position);
      }
      return;
    }
    
    // Update the model position/rotation from the store
    modelRef.current.position.set(...position);
    modelRef.current.rotation.set(rotation[0], rotation[1] + Math.PI, rotation[2]);
  });
  
  return (
    <group 
      ref={modelRef}
      userData={{ isUAV: true }}
      {...props} // Pass through any other props
    >
      <primitive 
        object={useGLTF('/models/drone/uav.glb').scene.clone()}
        scale={[3, 3, 3]}
        castShadow
      />
    </group>
  );
};

export default UAV;