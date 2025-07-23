import React, { useRef, useEffect } from 'react';
import { useUAVStore } from '../store/uavStore';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const UAV = (props) => {
  // Get position and rotation from the UAV store, but don't get functions that change state
  const position = useUAVStore((state) => state.position);
  const rotation = useUAVStore((state) => state.rotation);
  const isCrashed = useUAVStore((state) => state.isCrashed);
  
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
    
    // Simply update the model position/rotation from the store
    // without calling updatePosition() again
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