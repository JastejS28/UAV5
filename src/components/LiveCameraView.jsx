

// import React, { useRef, useEffect } from 'react';
// import { useUAVStore } from '../store/uavStore';
// import { useEnvironmentStore } from '../store/environmentStore';
// import { useGLTF } from '@react-three/drei';
// import * as THREE from 'three';
// import { useCameraStore } from '../store/cameraStore';
// import { LIVE_THERMAL_MATERIALS } from './LiveThermalMaterials';

// const CRASH_BG_COLOR = '#330000';
// const DAY_SKY_COLOR = new THREE.Color(0xFFFFFF);
// const NIGHT_SKY_COLOR = new THREE.Color(0x000000);
// const RAIN_SKY_COLOR = new THREE.Color(0x404050);

// const LiveCameraView = ({ width = 400, height = 225 }) => {
//   const canvasRef = useRef();
//   const customSceneRef = useRef(new THREE.Scene());
//   const customCameraRef = useRef();
//   const rendererRef = useRef();
//   const animationFrameIdRef = useRef();
//   const crashStartTime = useRef(null);

//   // Load the terrain model for the live view
//   const { scene: loadedTerrainModel } = useGLTF('/models/mountain/terrain.glb');
//   const { scene: tankModel } = useGLTF('/models/tank/tank.glb');
//   const { scene: jeepModel } = useGLTF('/models/jeep/jeep.glb');
//   const { scene: warehouseModel } = useGLTF('/models/building/warehouse.glb');
//   const { scene: soldierModel } = useGLTF('/models/soldier/soldier.glb');
//   const { scene: armyBaseModel } = useGLTF('/models/army_base/army_base.glb');
//   const { scene: uavModel } = useGLTF('/models/drone/uav.glb');
  
//   const liveTerrainInstanceRef = useRef(null);
//   const liveTerrainOriginalMaterials = useRef(new Map());
//   const liveModelsRef = useRef({});

//   const terrainScale = 100;
  
//   // Effect for scene setup (runs once)
//   useEffect(() => {
//     if (!canvasRef.current || !loadedTerrainModel) return;

//     console.log('[LiveCameraView] Setting up scene...');

//     // Initialize the renderer
//     const renderer = new THREE.WebGLRenderer({
//       canvas: canvasRef.current,
//       antialias: true
//     });
//     renderer.setSize(width, height);
//     renderer.setPixelRatio(window.devicePixelRatio);
//     renderer.shadowMap.enabled = true;
//     rendererRef.current = renderer;

//     // Initialize custom camera
//     customCameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
//     // Lighting for the live camera scene
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
//     customSceneRef.current.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
//     directionalLight.position.set(10, 15, 10);
//     customSceneRef.current.add(directionalLight);

//     // Helper function to clone a model properly
//     const cloneModel = (model) => {
//       if (!model) return null;
//       const clone = model.clone(true);
//       // Store materials if needed for thermal vision
//       clone.traverse((node) => {
//         if (node.isMesh && node.material) {
//           liveTerrainOriginalMaterials.current.set(node.uuid, node.material.clone());
//         }
//       });
//       return clone;
//     };

//     // Clone the loaded terrain model for use in this scene
//     if (loadedTerrainModel && !liveTerrainInstanceRef.current) {
//       console.log('[LiveCameraView] Cloning terrain model...');
//       const terrainClone = loadedTerrainModel.clone(true);
//       terrainClone.scale.set(terrainScale, terrainScale, terrainScale);
//       terrainClone.position.set(0, 0, 0);
      
//       // Store original materials
//       terrainClone.traverse((node) => {
//         if (node.isMesh && node.material) {
//           liveTerrainOriginalMaterials.current.set(node.uuid, node.material.clone());
//         }
//       });
      
//       liveTerrainInstanceRef.current = terrainClone;
//       customSceneRef.current.add(liveTerrainInstanceRef.current);
//       console.log('[LiveCameraView] Terrain model added to custom scene.');
//     }
    
//     // Add all the 3D models to the live scene
//     if (tankModel && !liveModelsRef.current.tank) {
//       const tankClone = cloneModel(tankModel);
//       tankClone.position.set(40, 19, 16);
//       tankClone.scale.set(0.5, 0.5, 0.5);
//       liveModelsRef.current.tank = tankClone;
//       customSceneRef.current.add(tankClone);
//       console.log('[LiveCameraView] Tank model added to custom scene.');
//     }

//     if (jeepModel && !liveModelsRef.current.jeep) {
//       const jeepClone = cloneModel(jeepModel);
//       jeepClone.position.set(40, 19, 20);
//       jeepClone.scale.set(0.03, 0.03, 0.03);
//       liveModelsRef.current.jeep = jeepClone;
//       customSceneRef.current.add(jeepClone);
//       console.log('[LiveCameraView] Jeep model added to custom scene.');
//     }

//     if (warehouseModel && !liveModelsRef.current.warehouse) {
//       const warehouseClone = cloneModel(warehouseModel);
//       warehouseClone.position.set(40, 21, 32);
//       warehouseClone.scale.set(0.7, 0.7, 0.7);
//       liveModelsRef.current.warehouse = warehouseClone;
//       customSceneRef.current.add(warehouseClone);
//       console.log('[LiveCameraView] Warehouse model added to custom scene.');
//     }

//     if (soldierModel && !liveModelsRef.current.soldier) {
//       const soldierClone = cloneModel(soldierModel);
//       soldierClone.position.set(40, 21, 32);
//       soldierClone.scale.set(0.2, 0.2, 0.2);
//       liveModelsRef.current.soldier = soldierClone;
//       customSceneRef.current.add(soldierClone);
//       console.log('[LiveCameraView] Soldier model added to custom scene.');
//     }

//     if (armyBaseModel && !liveModelsRef.current.armyBase) {
//       const armyBaseClone = cloneModel(armyBaseModel);
//       armyBaseClone.position.set(-45, 25, -40);
//       armyBaseClone.scale.set(0.5, 0.5, 0.5);
//       liveModelsRef.current.armyBase = armyBaseClone;
//       customSceneRef.current.add(armyBaseClone);
//       console.log('[LiveCameraView] Army Base model added to custom scene.');
//     }

//     if (uavModel && !liveModelsRef.current.uav) {
//       const uavClone = cloneModel(uavModel);
//       uavClone.scale.set(3, 3, 3);
//       liveModelsRef.current.uav = uavClone;
//       customSceneRef.current.add(uavClone);
//       console.log('[LiveCameraView] UAV model added to custom scene.');
//     }
    
//     // Create the animation loop
//     const animate = () => {
//       animationFrameIdRef.current = requestAnimationFrame(animate);
//       if (!rendererRef.current || !customCameraRef.current || !customSceneRef.current) return;

//       const { position, rotation, isThermalVision, isCrashed } = useUAVStore.getState();
//       const { environmentMode } = useEnvironmentStore.getState();
//       const { cameraMode, getCurrentSettings } = useCameraStore.getState();

//       // Get the current camera settings based on mode
//       const settings = getCurrentSettings();

//       // Create a rotation matrix from UAV rotation
//       const rotationMatrix = new THREE.Matrix4();
//       rotationMatrix.makeRotationFromEuler(new THREE.Euler(
//         rotation[0], 
//         rotation[1], 
//         rotation[2]
//       ));
      
//       // Update UAV model position and rotation if it exists
//       if (liveModelsRef.current.uav) {
//         liveModelsRef.current.uav.position.set(position[0], position[1], position[2]);
//         liveModelsRef.current.uav.rotation.set(rotation[0], rotation[1] + Math.PI, rotation[2]);
//       }
      
//       // Calculate camera position based on mode settings
//       const uavWorldPosition = new THREE.Vector3().fromArray(position);
//       const offsetVector = new THREE.Vector3(...settings.offset);
//       offsetVector.applyMatrix4(rotationMatrix);
      
//       // Set camera position
//       customCameraRef.current.position.copy(uavWorldPosition);
//       customCameraRef.current.position.add(offsetVector);
      
//       // Calculate look-at position
//       const lookAtOffset = new THREE.Vector3(...settings.lookAtOffset);
//       lookAtOffset.applyMatrix4(rotationMatrix);
//       const lookAtTarget = uavWorldPosition.clone().add(lookAtOffset);
      
//       // Make camera look at target
//       customCameraRef.current.lookAt(lookAtTarget);
      
//       // Update camera FOV based on settings
//       customCameraRef.current.fov = settings.fov;
//       customCameraRef.current.updateProjectionMatrix();
      
//       // Handle crash state
//       if (isCrashed && crashStartTime.current === null) {
//         crashStartTime.current = Date.now();
//       } else if (!isCrashed) {
//         crashStartTime.current = null;
//       }
      
//       // Set background color based on state
//       if (isCrashed) {
//         renderer.setClearColor(CRASH_BG_COLOR);
//       } else if (isThermalVision) {
//         renderer.setClearColor(0x000000); // Black for thermal vision
//       } else {
//         // Set background based on environment
//         switch(environmentMode) {
//           case 'night': 
//             renderer.setClearColor(NIGHT_SKY_COLOR); 
//             break;
//           case 'rain': 
//             renderer.setClearColor(RAIN_SKY_COLOR); 
//             break;
//           case 'day':
//           default:
//             renderer.setClearColor(DAY_SKY_COLOR);
//             break;
//         }
//       }

//       // Apply thermal vision material if needed
//       if (isThermalVision) {
//         if (liveTerrainInstanceRef.current) {
//           applyThermalVision(liveTerrainInstanceRef.current, true);
//         }
        
//         Object.values(liveModelsRef.current).forEach(model => {
//           if (model) applyModelThermal(model, true);
//         });
//       } else {
//         // Restore original materials
//         if (liveTerrainInstanceRef.current) {
//           applyThermalVision(liveTerrainInstanceRef.current, false);
//         }
        
//         Object.values(liveModelsRef.current).forEach(model => {
//           if (model) applyModelThermal(model, false);
//         });
//       }
      
//       // Render the scene
//       renderer.render(customSceneRef.current, customCameraRef.current);
//     };
    
//     // Apply thermal materials to models - FIXED VERSION
//     const applyModelThermal = (model, isThermal) => {
//       model.traverse(node => {
//         if (node.isMesh) {
//           if (isThermal) {
//             let thermalMat;
            
//             if (model === liveModelsRef.current.tank || model === liveModelsRef.current.jeep) {
//               thermalMat = LIVE_THERMAL_MATERIALS.hot;
//             } else if (model === liveModelsRef.current.soldier) {
//               thermalMat = LIVE_THERMAL_MATERIALS.medium;
//             } else if (model === liveModelsRef.current.warehouse || model === liveModelsRef.current.armyBase) {
//               thermalMat = LIVE_THERMAL_MATERIALS.cool;
//             }
            
//             if (thermalMat && node.material !== thermalMat) {
//               node.material = thermalMat;
//             }
//           } else {
//             // Restore original material
//             const originalMat = liveTerrainOriginalMaterials.current.get(node.uuid);
//             if (originalMat && node.material !== originalMat) {
//               node.material = originalMat;
//             }
//           }
//         }
//       });
//     };
    
//     // Updated helper function to apply thermal vision to terrain
//     const applyThermalVision = (object, isThermal) => {
//       object.traverse((node) => {
//         if (node.isMesh) {
//           if (isThermal) {
//             // Use the simplified thermal material
//             if (node.material !== LIVE_THERMAL_MATERIALS.terrain) {
//               node.material = LIVE_THERMAL_MATERIALS.terrain;
//             }
//           } else {
//             // Restore original material
//             const originalMat = liveTerrainOriginalMaterials.current.get(node.uuid);
//             if (originalMat && node.material !== originalMat) {
//               node.material = originalMat;
//             }
//           }
//         }
//       });
//     };
    
//     animate();

//     return () => {
//       if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
//     };
//   }, [width, height, loadedTerrainModel, terrainScale, tankModel, jeepModel, warehouseModel, soldierModel, armyBaseModel, uavModel]);

//   // CSS animation for pulse effect
//   const pulseKeyframes = `
//     @keyframes pulse {
//       0% { opacity: 1; }
//       50% { opacity: 0.5; }
//       100% { opacity: 1; }
//     }
//   `;

//   return (
//     <div style={{ position: 'relative' }}>
//       <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />
      
//       <canvas
//         ref={canvasRef}
//         style={{
//           width: `${width}px`,
//           height: `${height}px`,
//           borderRadius: '8px',
//           border: '1px solid #555',
//           position: 'relative',
//           zIndex: 5
//         }}
//       />
      
//       {/* Crash overlay */}
//       {useUAVStore.getState().isCrashed && (
//         <div style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           width: '100%',
//           height: '100%',
//           background: 'rgba(255, 0, 0, 0.2)',
//           borderRadius: '8px',
//           pointerEvents: 'none',
//           zIndex: 6,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center'
//         }}>
//           <div style={{
//             color: 'red',
//             fontSize: '16px',
//             fontWeight: 'bold',
//             textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
//             animation: 'pulse 1s infinite'
//           }}>
//             💥 SIGNAL LOST 💥
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// useGLTF.preload('/models/mountain/terrain.glb');
// useGLTF.preload('/models/tank/tank.glb');
// useGLTF.preload('/models/jeep/jeep.glb');
// useGLTF.preload('/models/building/warehouse.glb');
// useGLTF.preload('/models/soldier/soldier.glb');
// useGLTF.preload('/models/army_base/army_base.glb');
// useGLTF.preload('/models/drone/uav.glb');

// export default LiveCameraView;

import React, { useRef, useEffect } from 'react';
import { useUAVStore } from '../store/uavStore';
import { useEnvironmentStore } from '../store/environmentStore';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCameraStore } from '../store/cameraStore';

const CRASH_BG_COLOR = '#330000';
const DAY_SKY_COLOR = new THREE.Color(0xFFFFFF);
const NIGHT_SKY_COLOR = new THREE.Color(0x000000);
const RAIN_SKY_COLOR = new THREE.Color(0x404050);

const LiveCameraView = ({ width = 400, height = 225 }) => {
  const canvasRef = useRef();
  const customSceneRef = useRef(new THREE.Scene());
  const customCameraRef = useRef();
  const rendererRef = useRef();
  const animationFrameIdRef = useRef();
  const crashStartTime = useRef(null);
  const thermalMaterialsRef = useRef();

  // Load the terrain model for the live view
  const { scene: loadedTerrainModel } = useGLTF('/models/mountain/terrain.glb');
  const { scene: tankModel } = useGLTF('/models/tank/tank.glb');
  const { scene: jeepModel } = useGLTF('/models/jeep/jeep.glb');
  const { scene: warehouseModel } = useGLTF('/models/building/warehouse.glb');
  const { scene: soldierModel } = useGLTF('/models/soldier/soldier.glb');
  const { scene: armyBaseModel } = useGLTF('/models/army_base/army_base.glb');
  const { scene: uavModel } = useGLTF('/models/drone/uav.glb');

  const liveTerrainInstanceRef = useRef(null);
  const liveTerrainOriginalMaterials = useRef(new Map());
  const liveModelsRef = useRef({});

  const terrainScale = 100;

  // Effect for scene setup (runs once)
  useEffect(() => {
    if (!canvasRef.current || !loadedTerrainModel) return;

    console.log('[LiveCameraView] Setting up scene...');

    // Initialize thermal materials
    thermalMaterialsRef.current = {
      terrain: new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.0, 0.8, 0.2),
        side: THREE.DoubleSide,
        flatShading: true
      }),
      hot: new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.95, 0.1, 0.05),
        side: THREE.DoubleSide,
        flatShading: true
      }),
      medium: new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.9, 0.9, 0.1),
        side: THREE.DoubleSide,
        flatShading: true
      }),
      cool: new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.0, 0.1, 0.7),
        side: THREE.DoubleSide,
        flatShading: true
      }),
      uav: new THREE.MeshBasicMaterial({
        color: new THREE.Color(1.0, 1.0, 1.0),
        side: THREE.DoubleSide,
        flatShading: true
      })
    };

    // Initialize the renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Initialize custom camera
    customCameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
   
    // Lighting for the live camera scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    customSceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(10, 15, 10);
    customSceneRef.current.add(directionalLight);

    // Helper function to clone a model properly
    const cloneModel = (model) => {
      if (!model) return null;
      const clone = model.clone(true);
      // Store materials if needed for thermal vision
      clone.traverse((node) => {
        if (node.isMesh && node.material) {
          liveTerrainOriginalMaterials.current.set(node.uuid, node.material.clone());
        }
      });
      return clone;
    };

    // Clone the loaded terrain model for use in this scene
    if (loadedTerrainModel && !liveTerrainInstanceRef.current) {
      console.log('[LiveCameraView] Cloning terrain model...');
      const terrainClone = loadedTerrainModel.clone(true);
      terrainClone.scale.set(terrainScale, terrainScale, terrainScale);
      terrainClone.position.set(0, 0, 0);
     
      // Store original materials
      terrainClone.traverse((node) => {
        if (node.isMesh && node.material) {
          liveTerrainOriginalMaterials.current.set(node.uuid, node.material.clone());
        }
      });
     
      liveTerrainInstanceRef.current = terrainClone;
      customSceneRef.current.add(liveTerrainInstanceRef.current);
      console.log('[LiveCameraView] Terrain model added to custom scene.');
    }
   
    // Add all the 3D models to the live scene
    if (tankModel && !liveModelsRef.current.tank) {
      const tankClone = cloneModel(tankModel);
      tankClone.position.set(40, 19, 16);
      tankClone.scale.set(0.5, 0.5, 0.5);
      liveModelsRef.current.tank = tankClone;
      customSceneRef.current.add(tankClone);
      console.log('[LiveCameraView] Tank model added to custom scene.');
    }

    if (jeepModel && !liveModelsRef.current.jeep) {
      const jeepClone = cloneModel(jeepModel);
      jeepClone.position.set(40, 19, 20);
      jeepClone.scale.set(0.03, 0.03, 0.03);
      liveModelsRef.current.jeep = jeepClone;
      customSceneRef.current.add(jeepClone);
      console.log('[LiveCameraView] Jeep model added to custom scene.');
    }

    if (warehouseModel && !liveModelsRef.current.warehouse) {
      const warehouseClone = cloneModel(warehouseModel);
      warehouseClone.position.set(40, 21, 32);
      warehouseClone.scale.set(0.7, 0.7, 0.7);
      liveModelsRef.current.warehouse = warehouseClone;
      customSceneRef.current.add(warehouseClone);
      console.log('[LiveCameraView] Warehouse model added to custom scene.');
    }

    if (soldierModel && !liveModelsRef.current.soldier) {
      const soldierClone = cloneModel(soldierModel);
      soldierClone.position.set(40, 21, 32);
      soldierClone.scale.set(0.2, 0.2, 0.2);
      liveModelsRef.current.soldier = soldierClone;
      customSceneRef.current.add(soldierClone);
      console.log('[LiveCameraView] Soldier model added to custom scene.');
    }

    if (armyBaseModel && !liveModelsRef.current.armyBase) {
      const armyBaseClone = cloneModel(armyBaseModel);
      armyBaseClone.position.set(-45, 25, -40);
      armyBaseClone.scale.set(0.5, 0.5, 0.5);
      liveModelsRef.current.armyBase = armyBaseClone;
      customSceneRef.current.add(armyBaseClone);
      console.log('[LiveCameraView] Army Base model added to custom scene.');
    }

    if (uavModel && !liveModelsRef.current.uav) {
      const uavClone = cloneModel(uavModel);
      uavClone.scale.set(3, 3, 3);
      liveModelsRef.current.uav = uavClone;
      customSceneRef.current.add(uavClone);
      console.log('[LiveCameraView] UAV model added to custom scene.');
    }
   
    // Create the animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if (!rendererRef.current || !customCameraRef.current || !customSceneRef.current) return;

      const { position, rotation, isThermalVision, isCrashed } = useUAVStore.getState();
      const { environmentMode } = useEnvironmentStore.getState();
      const { cameraMode, getCurrentSettings } = useCameraStore.getState();

      // Get the current camera settings based on mode
      const settings = getCurrentSettings();

      // Create a rotation matrix from UAV rotation
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationFromEuler(new THREE.Euler(
        rotation[0],
        rotation[1],
        rotation[2]
      ));
     
      // Update UAV model position and rotation if it exists
      if (liveModelsRef.current.uav) {
        liveModelsRef.current.uav.position.set(position[0], position[1], position[2]);
        liveModelsRef.current.uav.rotation.set(rotation[0], rotation[1] + Math.PI, rotation[2]);
      }
     
      // Calculate camera position based on mode settings
      const uavWorldPosition = new THREE.Vector3().fromArray(position);
      const offsetVector = new THREE.Vector3(...settings.offset);
      offsetVector.applyMatrix4(rotationMatrix);
     
      // Set camera position
      customCameraRef.current.position.copy(uavWorldPosition);
      customCameraRef.current.position.add(offsetVector);
     
      // Calculate look-at position
      const lookAtOffset = new THREE.Vector3(...settings.lookAtOffset);
      lookAtOffset.applyMatrix4(rotationMatrix);
      const lookAtTarget = uavWorldPosition.clone().add(lookAtOffset);
     
      // Make camera look at target
      customCameraRef.current.lookAt(lookAtTarget);
     
      // Update camera FOV based on settings
      customCameraRef.current.fov = settings.fov;
      customCameraRef.current.updateProjectionMatrix();
     
      // Handle crash state
      if (isCrashed && crashStartTime.current === null) {
        crashStartTime.current = Date.now();
      } else if (!isCrashed) {
        crashStartTime.current = null;
      }
     
      // Set background color based on state
      if (isCrashed) {
        renderer.setClearColor(CRASH_BG_COLOR);
      } else if (isThermalVision) {
        renderer.setClearColor(0x000000); // Black for thermal vision
      } else {
        // Set background based on environment
        switch(environmentMode) {
          case 'night':
            renderer.setClearColor(NIGHT_SKY_COLOR);
            break;
          case 'rain':
            renderer.setClearColor(RAIN_SKY_COLOR);
            break;
          case 'day':
          default:
            renderer.setClearColor(DAY_SKY_COLOR);
            break;
        }
      }

      // Apply thermal vision material if needed
      if (isThermalVision) {
        if (liveTerrainInstanceRef.current) {
          applyThermalVision(liveTerrainInstanceRef.current, true);
        }
       
        Object.values(liveModelsRef.current).forEach(model => {
          if (model) applyModelThermal(model, true);
        });
      } else {
        // Restore original materials
        if (liveTerrainInstanceRef.current) {
          applyThermalVision(liveTerrainInstanceRef.current, false);
        }
       
        Object.values(liveModelsRef.current).forEach(model => {
          if (model) applyModelThermal(model, false);
        });
      }
     
      // Render the scene
      renderer.render(customSceneRef.current, customCameraRef.current);
    };
   
    // Apply thermal materials to models
    const applyModelThermal = (model, isThermal) => {
      model.traverse(node => {
        if (node.isMesh) {
          if (isThermal) {
            let thermalMat;
           
            if (model === liveModelsRef.current.tank || model === liveModelsRef.current.jeep) {
              thermalMat = thermalMaterialsRef.current.hot;
            } else if (model === liveModelsRef.current.soldier) {
              thermalMat = thermalMaterialsRef.current.medium;
            } else if (model === liveModelsRef.current.warehouse || model === liveModelsRef.current.armyBase) {
              thermalMat = thermalMaterialsRef.current.cool;
            }
           
            if (thermalMat && node.material !== thermalMat) {
              node.material = thermalMat;
            }
          } else {
            // Restore original material
            const originalMat = liveTerrainOriginalMaterials.current.get(node.uuid);
            if (originalMat && node.material !== originalMat) {
              node.material = originalMat;
            }
          }
        }
      });
    };
   
    // Helper function to apply thermal vision to terrain
    const applyThermalVision = (object, isThermal) => {
      object.traverse((node) => {
        if (node.isMesh) {
          if (isThermal) {
            // Use the simplified thermal material
            if (node.material !== thermalMaterialsRef.current.terrain) {
              node.material = thermalMaterialsRef.current.terrain;
            }
          } else {
            // Restore original material
            const originalMat = liveTerrainOriginalMaterials.current.get(node.uuid);
            if (originalMat && node.material !== originalMat) {
              node.material = originalMat;
            }
          }
        }
      });
    };
   
    animate();

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [width, height, loadedTerrainModel, terrainScale, tankModel, jeepModel, warehouseModel, soldierModel, armyBaseModel, uavModel]);

  // CSS animation for pulse effect
  const pulseKeyframes = `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;

  return (
    <div style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />
      
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: '8px',
          border: '1px solid #555',
          position: 'relative',
          zIndex: 5
        }}
      />
      
      {/* Crash overlay */}
      {useUAVStore.getState().isCrashed && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255, 0, 0, 0.2)',
          borderRadius: '8px',
          pointerEvents: 'none',
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            color: 'red',
            fontSize: '16px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            animation: 'pulse 1s infinite'
          }}>
            💥 SIGNAL LOST 💥
          </div>
        </div>
      )}
    </div>
  );
};

useGLTF.preload('/models/mountain/terrain.glb');
useGLTF.preload('/models/tank/tank.glb');
useGLTF.preload('/models/jeep/jeep.glb');
useGLTF.preload('/models/building/warehouse.glb');
useGLTF.preload('/models/soldier/soldier.glb');
useGLTF.preload('/models/army_base/army_base.glb');
useGLTF.preload('/models/drone/uav.glb');

export default LiveCameraView;