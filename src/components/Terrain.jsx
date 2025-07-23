import React, { useEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const Terrain = () => {
  const { scene: loadedGltfScene } = useGLTF('/models/mountain/terrain.glb');
  
  const visualTerrainRef = useRef();
  const originalMaterialsRef = useRef(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const [interactionLayer, setInteractionLayer] = useState(null);

  useEffect(() => {
    if (loadedGltfScene && !isInitialized) {
      console.log('[Terrain] Initializing terrain components...');
      
      // --- 1. Create the VISIBLE terrain ---
      const visualClone = loadedGltfScene.clone(true);
      visualClone.name = "visual-terrain";
      visualClone.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      visualTerrainRef.current = visualClone;

      // --- 2. Create the INVISIBLE interaction layer ---
      const interactionClone = loadedGltfScene.clone(true);
      interactionClone.name = "interaction-terrain-layer";
      
      // IMPORTANT: Use a transparent material instead of visible:false
      // This keeps the mesh raycast-able but visually invisible
      const interactionMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0.0,     // Completely transparent
        side: THREE.DoubleSide,
        depthWrite: false // This is crucial - don't write to depth buffer
      });
      
      interactionClone.traverse(node => {
        if (node.isMesh) {
          node.userData.isClickableTerrain = true;
          node.material = interactionMaterial;
          // For debugging, log how many meshes we're marking as clickable
          console.log(`[Terrain] Marked mesh "${node.name}" as clickable terrain`);
        }
      });
      setInteractionLayer(interactionClone);

      setIsInitialized(true);
      console.log('[Terrain] Terrain initialized with interaction layer');
    }
  }, [loadedGltfScene, isInitialized]);


  if (!isInitialized) return null;

  return (
    <group scale={[100, 100, 100]} position={[0, 0, 0]}>
      {/* Render interaction layer first so it's "in front" for raycasting */}
      <primitive object={interactionLayer} />
      {/* Then render the visual terrain */}
      <primitive object={visualTerrainRef.current} />
    </group>
  );
};

// Preload terrain model
useGLTF.preload('/models/mountain/terrain.glb');

export default Terrain;
