import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useClickControlStore } from '../store/clickControlStore';
import { useUAVStore } from '../store/uavStore';
import * as THREE from 'three';

const TerrainClickHandler = () => {
  const { camera, scene, gl } = useThree();
  
  const { 
    isClickToMoveEnabled, 
    isSpawnMode,
    setClickIndicator,
    setSpawnIndicator,
    setLastClickedPosition,
    isProcessingClick,
    setProcessingClick
  } = useClickControlStore();
  
  const { setTargetPosition, setPosition, isCrashed } = useUAVStore();
  
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const terrainMeshes = useRef([]);
  const isInitialized = useRef(false);

  // This useFrame hook will continuously try to find the terrain until it succeeds.
  useFrame(() => {
    // Stop trying once initialized.
    if (isInitialized.current) return;

    const meshes = [];
    scene.traverse((object) => {
      // Check if the object is the fully loaded terrain
      if (object.isMesh && object.geometry) {
        const objectName = object.name?.toLowerCase() || '';
        const parentName = object.parent?.name?.toLowerCase() || '';
        
        // More robust check: explicitly include 'terrain_model'
        const isTerrainMesh = (
          objectName === 'terrain_model' || // MOST IMPORTANT CHECK
          objectName.includes('terrain') ||
          objectName.includes('mountain') ||
          objectName.includes('ground') ||
          objectName.includes('landscape') ||
          parentName.includes('terrain') ||
          parentName.includes('mountain')
        );
        
        if (isTerrainMesh) {
          meshes.push(object);
        }
      }
    });
    
    terrainMeshes.current = meshes;
    console.log(`[TerrainClickHandler] Found ${meshes.length} terrain meshes for clicking`);
    
    if (meshes.length > 0) {
      isInitialized.current = true;
      console.log('[TerrainClickHandler] Click detection READY ✅');
    } else {
      console.warn('[TerrainClickHandler] No terrain found for clicking');
    }
  });

  // Handle mouse clicks
  useEffect(() => {
    const handleClick = (event) => {
      if (!isInitialized.current || isProcessingClick) return;
      if (!isClickToMoveEnabled && !isSpawnMode) return;
      if (terrainMeshes.current.length === 0) return;
      
      // Prevent processing if UAV is crashed and not in spawn mode
      if (isCrashed && !isSpawnMode) {
        console.warn('Cannot move crashed UAV. Use spawn mode to restart.');
        return;
      }
      
      setProcessingClick(true);
      
      // Get canvas bounds
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      
      // Calculate normalized mouse coordinates
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Perform raycast
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersections = raycaster.current.intersectObjects(terrainMeshes.current, true);
      
      if (intersections.length > 0) {
        const intersectionPoint = intersections[0].point;
        const terrainPosition = [intersectionPoint.x, intersectionPoint.y, intersectionPoint.z];
        
        // Adjust height for safe UAV operation (add minimum clearance)
        const safeHeight = Math.max(terrainPosition[1] + 15, 20); // Minimum 15m clearance, at least 20m altitude
        const safePosition = [terrainPosition[0], safeHeight, terrainPosition[2]];
        
        console.log(`Terrain clicked at:`, terrainPosition);
        console.log(`Safe UAV position:`, safePosition);
        
        if (isSpawnMode) {
          // Spawn mode: Set UAV starting position
          setPosition(safePosition);
          setSpawnIndicator(safePosition);
          console.log('🚁 UAV spawned at:', safePosition);
          
          // Auto-disable spawn mode after spawning
          setTimeout(() => {
            useClickControlStore.getState().setSpawnMode(false);
            useClickControlStore.getState().setSpawnIndicator(null);
            console.log('Spawn mode disabled - UAV ready for operation');
          }, 2000);
          
        } else if (isClickToMoveEnabled) {
          // Movement mode: Set target position
          setTargetPosition(safePosition);
          setClickIndicator(safePosition);
          console.log('🎯 UAV moving to:', safePosition);
        }
        
        setLastClickedPosition(terrainPosition);
      } else {
        console.log('No terrain intersection found');
      }
      
      // Reset processing flag
      setTimeout(() => {
        setProcessingClick(false);
      }, 100);
    };

    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [
    gl, 
    camera, 
    isClickToMoveEnabled, 
    isSpawnMode, 
    setTargetPosition, 
    setPosition, 
    setClickIndicator, 
    setSpawnIndicator, 
    setLastClickedPosition, 
    isProcessingClick, 
    setProcessingClick,
    isCrashed
  ]);

  return null; // This component doesn't render anything
};

export default TerrainClickHandler;