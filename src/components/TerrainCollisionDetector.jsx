import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useUAVStore } from '../store/uavStore';
import * as THREE from 'three';

const TerrainCollisionDetector = () => {
  const { scene } = useThree();
  
  const raycaster = useRef(new THREE.Raycaster());
  const downVector = new THREE.Vector3(0, -1, 0);
  const terrainMeshes = useRef([]);
  const frameCount = useRef(0);
  const isInitialized = useRef(false);
  const lastUAVPosition = useRef(null);
  
  // Find terrain meshes on mount
  useEffect(() => {
    const findTerrainMeshes = () => {
      const meshes = [];
      
      scene.traverse((object) => {
        if (object.isMesh && object.geometry) {
          const isTerrainMesh = (
            object.name === 'terrain' ||
            object.name?.toLowerCase().includes('terrain') ||
            object.name?.toLowerCase().includes('mountain') ||
            object.name?.toLowerCase().includes('ground') ||
            object.name?.toLowerCase().includes('landscape') ||
            object.parent?.name?.toLowerCase().includes('terrain') ||
            object.parent?.name?.toLowerCase().includes('mountain') ||
            object.material?.name?.toLowerCase().includes('terrain') ||
            object.geometry?.attributes?.position?.count > 500
          );
          
          if (isTerrainMesh) {
            meshes.push(object);
          }
        }
      });
      
      terrainMeshes.current = meshes;
      console.log(`[TerrainCollisionDetector] Found ${meshes.length} terrain meshes`);
      return meshes.length > 0;
    };

    const timer1 = setTimeout(() => {
      findTerrainMeshes();
    }, 1000);
    
    const timer2 = setTimeout(() => {
      const found = findTerrainMeshes();
      
      setTimeout(() => {
        if (found || terrainMeshes.current.length > 0) {
          isInitialized.current = true;
          console.log('[TerrainCollisionDetector] Collision detection ACTIVATED');
        } else {
          console.warn('[TerrainCollisionDetector] No terrain found');
        }
      }, 2000);
    }, 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [scene]);

  useFrame(() => {
    if (!isInitialized.current) return;
    
    frameCount.current += 1;
    if (frameCount.current < 60) return;
    if (frameCount.current % 30 !== 0) return; // Check every 30 frames instead of 15
    if (terrainMeshes.current.length === 0) return;

    const { position: uavPosition, setCrashed, isCrashed } = useUAVStore.getState();
    
    if (isCrashed) return;
    
    // Initialize last position on first check
    if (!lastUAVPosition.current) {
      lastUAVPosition.current = [...uavPosition];
      return;
    }
    
    // Calculate if UAV is actually moving by comparing positions
    const currentPos = new THREE.Vector3(...uavPosition);
    const lastPos = new THREE.Vector3(...lastUAVPosition.current);
    const movementDistance = currentPos.distanceTo(lastPos);
    
    // Only check collision if UAV has moved more than 0.1 units
    if (movementDistance < 0.1) {
      lastUAVPosition.current = [...uavPosition];
      return;
    }
    
    // Update last position
    lastUAVPosition.current = [...uavPosition];
    
    const uavPos = new THREE.Vector3(...uavPosition);
    
    raycaster.current.set(uavPos, downVector);
    raycaster.current.far = 200;
    
    const intersections = raycaster.current.intersectObjects(terrainMeshes.current, true);
    
    if (intersections.length > 0) {
      const terrainHeight = intersections[0].point.y;
      const uavAltitude = uavPos.y;
      const clearance = uavAltitude - terrainHeight;
      
      // Only log critical situations - remove excessive logging
      if (clearance < 5) {
        console.error('💥 UAV CRASHED INTO TERRAIN!');
        setCrashed(true, 'UAV CRASHED - Terrain collision during flight!');
      }
    }
  });

  return null;
};

export default TerrainCollisionDetector;