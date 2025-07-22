import React, { useEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useUAVStore } from '../store/uavStore';
import { THERMAL_MATERIALS } from './ThermalVisionEffect';
import * as THREE from 'three';

const Terrain = () => {
  const { scene: loadedGltfScene } = useGLTF('/models/mountain/terrain.glb');
  const { isThermalVision } = useUAVStore();
  const sceneInstanceRef = useRef(null);
  const originalMaterialsRef = useRef(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const terrainScale = 100;

  useEffect(() => {
    if (loadedGltfScene && !isInitialized) {
      console.log('[Terrain] Initializing: GLTF scene loaded. Cloning scene...');
      const clonedScene = loadedGltfScene.clone(true);
      const materialsMap = new Map();
      clonedScene.traverse((node) => {
        if (node.isMesh && node.material) {
          materialsMap.set(node.uuid, node.material.clone());
        }
      });
      originalMaterialsRef.current = materialsMap;
      sceneInstanceRef.current = clonedScene;
      setIsInitialized(true);
      console.log(`[Terrain] Initialization complete. Stored ${materialsMap.size} original materials.`);

      if (THERMAL_MATERIALS.terrain.uniforms) {
        const tempBox = new THREE.Box3();
        const unscaledBox = new THREE.Box3().setFromObject(loadedGltfScene);
        
        console.log(`[Terrain.jsx] Unscaled terrain bbox: min.y=${unscaledBox.min.y.toFixed(4)}, max.y=${unscaledBox.max.y.toFixed(4)}`);

        let worldMinY = unscaledBox.min.y * terrainScale;
        let worldMaxY = unscaledBox.max.y * terrainScale;

        // Ensure maxHeight is always greater than minHeight for the shader
        if (worldMaxY <= worldMinY) {
          console.warn(`[Terrain.jsx] Calculated worldMaxY (${worldMaxY.toFixed(4)}) is not greater than worldMinY (${worldMinY.toFixed(4)}). Adjusting maxHeight slightly.`);
          worldMaxY = worldMinY + 0.1; // Add a small delta to prevent division by zero or negative range
        }

        THERMAL_MATERIALS.terrain.uniforms.minHeight.value = worldMinY;
        THERMAL_MATERIALS.terrain.uniforms.maxHeight.value = worldMaxY;
        console.log(`[Terrain.jsx] Set thermal shader uniforms: minH=${worldMinY.toFixed(4)}, maxH=${worldMaxY.toFixed(4)}`);
        console.log(`[Terrain.jsx] Effective height range for shader: ${(worldMaxY - worldMinY).toFixed(4)}`);
      }
    }
  }, [loadedGltfScene, isInitialized, terrainScale]);

  useEffect(() => {
    if (!isInitialized || !sceneInstanceRef.current) {
      return;
    }
    // console.log(`[Terrain] Applying materials. Thermal vision active: ${isThermalVision}`); // Keep this for state changes
    sceneInstanceRef.current.traverse((node) => {
      if (node.isMesh) {
        if (isThermalVision) {
          if (node.material !== THERMAL_MATERIALS.terrain) {
            node.material = THERMAL_MATERIALS.terrain;
          }
        } else {
          const originalMat = originalMaterialsRef.current.get(node.uuid);
          if (originalMat && node.material !== originalMat) {
            node.material = originalMat;
          }
        }
      }
    });
  }, [isThermalVision, isInitialized]);

  if (!isInitialized || !sceneInstanceRef.current) {
    return null; 
  }

  return (
    <primitive
      key={isThermalVision ? 'thermal-terrain' : 'original-terrain'}
      object={sceneInstanceRef.current} 
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={[terrainScale, terrainScale, terrainScale]}
      receiveShadow
      castShadow
    >
      <mesh
        name="terrain" 
      >
        {/* ...geometry and materials */}
      </mesh>
    </primitive>
  );
};
useGLTF.preload('/models/mountain/terrain.glb');
export default Terrain;
