import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const Terrain = () => {
  const gltf = useLoader(GLTFLoader, '/models/mountain/terrain.glb');
  
  return (
    <primitive 
      object={gltf.scene} 
      position={[0, 0, 0]} 
      scale={[1, 1, 1]} 
    />
  );
};

export default Terrain;