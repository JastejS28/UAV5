import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useUAVStore } from '../store/uavStore';
import { useClickControlStore } from '../store/clickControlStore';
import * as THREE from 'three';

const TerrainClickHandler = () => {
  const { scene, camera, raycaster, gl } = useThree();
  const [isInitialized, setIsInitialized] = useState(false);
  const clickProcessed = useRef(false);
  const firstClickProcessed = useRef(false); // Track if we've handled the first click
  
  // Get state and actions from stores
  const { position } = useUAVStore();
  const setPosition = useUAVStore(state => state.setPosition);
  const setTargetPosition = useUAVStore(state => state.setTargetPosition);
  const setRotation = useUAVStore(state => state.setRotation);
  const setCrashed = useUAVStore(state => state.setCrashed);
  
  const { clickMode, setSpawnMode, setSpawnIndicator, setClickIndicator } = useClickControlStore();

  // Add initialization effect to ensure everything is ready
  useEffect(() => {
    // Short delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setIsInitialized(true);
      console.log('🔧 [TerrainClickHandler] Initialized and ready for clicks');
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // This effect handles the very first click regardless of initialization state
  useEffect(() => {
    // Only add this special handler if the UAV is at the default position
    const isAtDefaultPosition = 
      Math.abs(position[0]) < 0.1 && 
      Math.abs(position[1] - 50) < 0.1 && 
      Math.abs(position[2]) < 0.1;
    
    if (!isAtDefaultPosition || firstClickProcessed.current) return;
    
    console.log('🔍 [TerrainClickHandler] Adding special first-click handler');
    
    const handleFirstClick = (event) => {
      // Prevent processing if already handled
      if (firstClickProcessed.current) return;
      firstClickProcessed.current = true;
      
      console.log('⭐ [TerrainClickHandler] Processing FIRST CLICK with special handler');
      
      // Get mouse coordinates for raycasting
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
      
      // Update the raycaster
      raycaster.setFromCamera(mouse, camera);
      
      // Perform the raycast
      const intersects = raycaster.intersectObjects(scene.children, true);
      console.log(`🎯 [FirstClickHandler] Found ${intersects.length} intersections`);
      
      // Find terrain intersection
      const terrainIntersect = intersects.find(i =>
        i.object.userData.isClickableTerrain === true ||
        i.object.name?.toLowerCase().includes('terrain') ||
        i.object.parent?.name?.toLowerCase().includes('terrain')
      );
      
      if (!terrainIntersect) {
        console.warn('⚠️ [FirstClickHandler] No terrain found, retrying normal click handler');
        firstClickProcessed.current = false; // Reset so we can try again
        return;
      }
      
      const point = terrainIntersect.point;
      
      // Force spawn UAV
      const spawnPos = [point.x, point.y + 60, point.z];
      console.log('🚀 [FIRST CLICK] Spawning UAV at:', spawnPos);
      
      // Execute all spawn actions
      setCrashed(false, '');
      setPosition(spawnPos);
      setRotation([0, 0, 0]);
      setSpawnIndicator(spawnPos);
      setSpawnMode(false);
      
      // Remove this special handler
      document.removeEventListener('click', handleFirstClick);
      
      // Set a delayed flag reset for good measure
      setTimeout(() => {
        console.log('🔄 [TerrainClickHandler] First click handler cleanup completed');
      }, 1000);
    };
    
    // Add the special first-click handler directly to document
    document.addEventListener('click', handleFirstClick);
    
    return () => {
      document.removeEventListener('click', handleFirstClick);
    };
  }, [position, camera, raycaster, scene, gl, setCrashed, setPosition, setRotation, setSpawnIndicator, setSpawnMode]);

  // Main click handler for normal operation
  const handleClick = useCallback((event) => {
    // Skip if first click already processed this event
    if (firstClickProcessed.current && !isInitialized) return;
    
    // Normal debounce logic
    if (clickProcessed.current) return;
    clickProcessed.current = true;
    setTimeout(() => {
      clickProcessed.current = false;
    }, 300);
    
    const storeState = useUAVStore.getState();
    
    // Debug info
    console.log('🔍 [ClickHandler] Debug Info:', {
      clickMode,
      currentUAVPosition: storeState.position,
      isAtDefault: JSON.stringify(storeState.position) === JSON.stringify([0, 50, 0]),
      isCrashed: storeState.isCrashed,
      targetPosition: storeState.targetPosition,
      firstClickProcessed: firstClickProcessed.current
    });

    // Create normalized mouse coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Force clickMode to 'spawn' on first click when at default position
    const forceSpawnMode = JSON.stringify(storeState.position) === JSON.stringify([0, 50, 0]);
    const effectiveClickMode = forceSpawnMode ? 'spawn' : clickMode;
    
    // Perform the raycast
    const intersects = raycaster.intersectObjects(scene.children, true);
    console.log(`🎯 [TerrainClickHandler] Found ${intersects.length} intersections`);

    // Find terrain intersection
    const terrainIntersect = intersects.find(i =>
      i.object.userData.isClickableTerrain === true ||
      i.object.name?.toLowerCase().includes('terrain') ||
      i.object.parent?.name?.toLowerCase().includes('terrain')
    );

    if (!terrainIntersect) {
      console.warn('⚠️ [TerrainClickHandler] No terrain found in intersections');
      return;
    }

    const point = terrainIntersect.point;
    console.log('📍 [TerrainClickHandler] Terrain intersection point:', point);

    // === SPAWN MODE LOGIC ===
    if (effectiveClickMode === 'spawn') {
      // Increased safe altitude to 60 units above terrain
      const spawnPos = [point.x, point.y + 60, point.z];
      console.log('🚁 [SPAWN MODE] Spawning UAV at:', spawnPos);

      console.log('🔄 Resetting crash state...');
      setCrashed(false, '');

      console.log('📦 Setting UAV position...');
      setPosition(spawnPos);

      console.log('🧭 Setting default rotation...');
      setRotation([0, 0, 0]);

      console.log('🎯 Setting spawn indicator...');
      setSpawnIndicator(spawnPos);

      console.log('🔁 Switching to move mode...');
      setSpawnMode(false);

      console.log('✅ UAV spawned successfully!');
      return;
    }

    // === MOVE MODE LOGIC ===
    if (effectiveClickMode === 'move') {
      const targetPos = [point.x, point.y + 30, point.z];
      console.log('🚩 [MOVE MODE] Move target set:', targetPos);

      console.log('📡 Updating target position...');
      setTargetPosition(targetPos);

      console.log('📍 Setting click indicator...');
      setClickIndicator(targetPos);
    }
  }, [
    scene, camera, raycaster, gl, clickMode, isInitialized,
    setPosition, setTargetPosition, setRotation,
    setCrashed, setSpawnMode, setSpawnIndicator, setClickIndicator
  ]);

  // Normal event binding for subsequent clicks
  useEffect(() => {
    if (!isInitialized) return;
    
    const domElement = gl.domElement;
    console.log('🧲 [TerrainClickHandler] Adding click listener');
    domElement.addEventListener('click', handleClick);

    return () => {
      console.log('❌ [TerrainClickHandler] Removing click listener');
      domElement.removeEventListener('click', handleClick);
    };
  }, [gl, handleClick, isInitialized]);

  return null;
};

export default TerrainClickHandler;
