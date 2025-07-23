import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const Terrain = () => {
  const gltf = useLoader(GLTFLoader, '/models/mountain/terrain.glb');
  
  // Mark terrain for click interaction
  React.useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.userData.isClickableTerrain = true;
        }
      });
    }
  }, [gltf.scene]);
  
  return (
    <primitive 
      object={gltf.scene} 
      position={[0, 0, 0]} 
      scale={[100, 100, 100]} 
    />
  );
};

export default Terrain;