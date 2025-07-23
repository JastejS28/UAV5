import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useUAVStore } from '../store/uavStore';
import { useEnvironmentStore } from '../store/environmentStore';
import { useCameraStore } from '../store/cameraStore';
import { useAttackDroneStore } from '../store/attackDroneStore';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Define sky colors for the live view
const DAY_SKY_COLOR = new THREE.Color(0x87CEEB);
const NIGHT_SKY_COLOR = new THREE.Color(0x000000);
const RAIN_SKY_COLOR = new THREE.Color(0x404050);
const THERMAL_SKY_COLOR = new THREE.Color(0x000033);

// Create materials for different objects in thermal view
const THERMAL_MATERIALS = {
  terrain: new THREE.MeshBasicMaterial({ color: 0x004400 }), // Dark green for terrain
  uav: new THREE.MeshBasicMaterial({ color: 0xFF0000 }), // Red hot for UAV
  tank: new THREE.MeshBasicMaterial({ color: 0xFF4400 }), // Orange-red for tank
  jeep: new THREE.MeshBasicMaterial({ color: 0xFF6600 }), // Orange for jeep
  soldier: new THREE.MeshBasicMaterial({ color: 0xFF8800 }), // Yellow-orange for soldier
  warehouse: new THREE.MeshBasicMaterial({ color: 0x0066FF }), // Blue for warehouse
  armyBase: new THREE.MeshBasicMaterial({ color: 0x0088FF }), // Light blue for army base
};

// Normal materials
const NORMAL_MATERIALS = {
  uav: new THREE.MeshStandardMaterial({ color: 0x333333 }),
  tank: new THREE.MeshStandardMaterial({ color: 0x2c2c2c }),
  jeep: new THREE.MeshStandardMaterial({ color: 0x3c3c3c }),
  soldier: new THREE.MeshStandardMaterial({ color: 0x5a4a3a }),
  warehouse: new THREE.MeshStandardMaterial({ color: 0x4a4a4a }),
  armyBase: new THREE.MeshStandardMaterial({ color: 0x555555 }),
};

// Enhanced thermal vision shader
const ThermalShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'time': { value: 0 },
    'noiseIntensity': { value: 0.12 },
    'contrast': { value: 3.5 },
    'brightness': { value: 0.2 },
    'saturation': { value: 2.0 },
    'scanlineIntensity': { value: 0.08 },
    'vignetteStrength': { value: 0.4 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float noiseIntensity;
    uniform float contrast;
    uniform float brightness;
    uniform float saturation;
    uniform float scanlineIntensity;
    uniform float vignetteStrength;
    varying vec2 vUv;
    
    // Improved noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Realistic thermal color mapping with 9 temperature zones
    vec3 getThermalColor(float temp) {
      temp = clamp(temp, 0.0, 1.0);
      
      // Very cold (deep blue/purple)
      if (temp < 0.1) return mix(vec3(0.0, 0.0, 0.3), vec3(0.0, 0.0, 0.6), temp * 10.0);
      
      // Cold (blue to cyan)
      else if (temp < 0.25) return mix(vec3(0.0, 0.0, 0.6), vec3(0.0, 0.4, 0.8), (temp - 0.1) * 6.67);
      
      // Cool (cyan to green)
      else if (temp < 0.4) return mix(vec3(0.0, 0.4, 0.8), vec3(0.0, 0.8, 0.4), (temp - 0.25) * 6.67);
      
      // Medium cool (green)
      else if (temp < 0.5) return mix(vec3(0.0, 0.8, 0.4), vec3(0.2, 1.0, 0.0), (temp - 0.4) * 10.0);
      
      // Medium (green to yellow)
      else if (temp < 0.65) return mix(vec3(0.2, 1.0, 0.0), vec3(0.8, 1.0, 0.0), (temp - 0.5) * 6.67);
      
      // Warm (yellow to orange)
      else if (temp < 0.8) return mix(vec3(0.8, 1.0, 0.0), vec3(1.0, 0.6, 0.0), (temp - 0.65) * 6.67);
      
      // Hot (orange to red)
      else if (temp < 0.9) return mix(vec3(1.0, 0.6, 0.0), vec3(1.0, 0.2, 0.0), (temp - 0.8) * 10.0);
      
      // Very hot (red to bright red)
      else if (temp < 0.95) return mix(vec3(1.0, 0.2, 0.0), vec3(1.0, 0.0, 0.0), (temp - 0.9) * 20.0);
      
      // Extremely hot (red to white)
      else return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), (temp - 0.95) * 20.0);
    }
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Calculate perceived brightness with better weighting
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      
      // Enhance brightness based on color intensity
      brightness += brightness * brightness;
      
      // Apply contrast enhancement
      brightness = (brightness - 0.5) * contrast + 0.5 + brightness;
      brightness = clamp(brightness, 0.0, 1.0);
      
      // Add multiple layers of noise for realism
      float baseNoise = noise(vUv * 200.0 + time * 0.1) * noiseIntensity;
      float fineNoise = random(vUv * 800.0 + time * 0.3) * noiseIntensity * 0.5;
      float timeNoise = sin(time * 4.0 + vUv.x * 30.0) * 0.03;
      
      brightness += baseNoise + fineNoise + timeNoise;
      brightness = clamp(brightness, 0.0, 1.0);
      
      // Get thermal color
      vec3 thermalColor = getThermalColor(brightness);
      
      // Add realistic scan lines with multiple frequencies
      float scanline1 = sin(vUv.y * 400.0 + time * 2.0) * scanlineIntensity;
      float scanline2 = sin(vUv.y * 800.0 + time * 3.0) * scanlineIntensity * 0.5;
      float scanline3 = sin(vUv.y * 1200.0 - time * 1.5) * scanlineIntensity * 0.3;
      
      thermalColor += scanline1 + scanline2 + scanline3;
      
      // Apply saturation enhancement
      float gray = dot(thermalColor, vec3(0.299, 0.587, 0.114));
      thermalColor = mix(vec3(gray), thermalColor, saturation);
      
      // Add vignette effect for authentic thermal camera look
      vec2 center = vUv - 0.5;
      float vignette = 1.0 - dot(center, center) * vignetteStrength;
      thermalColor *= vignette;
      
      // Add subtle chromatic aberration
      float aberration = length(center) * 0.02;
      thermalColor.r += aberration;
      thermalColor.b -= aberration;
      
      // Final brightness adjustment
      thermalColor = clamp(thermalColor, 0.0, 1.0);
      
      gl_FragColor = vec4(thermalColor, 1.0);
    }
  `
};

const LiveCameraView = ({ portalRef }) => {
  const canvasRef = useRef();
  const rendererRef = useRef();
  const composerRef = useRef();
  const customSceneRef = useRef(new THREE.Scene());
  const customCameraRef = useRef();
  const animationFrameIdRef = useRef();
  const thermalPassRef = useRef();
  const lastTimeRef = useRef(0);

  // Model references
  const modelInstancesRef = useRef({});

  // Load all models
  const { scene: terrainModel } = useGLTF('/models/mountain/terrain.glb');
  const { scene: uavModel } = useGLTF('/models/drone/uav.glb');
  const { scene: tankModel } = useGLTF('/models/tank/tank.glb');
  const { scene: jeepModel } = useGLTF('/models/jeep/jeep.glb');
  const { scene: soldierModel } = useGLTF('/models/soldier/soldier.glb');
  const { scene: warehouseModel } = useGLTF('/models/building/warehouse.glb');
  const { scene: armyBaseModel } = useGLTF('/models/army_base/army_base.glb');

  useEffect(() => {
    if (!portalRef.current) return;

    console.log('[LiveCameraView] Initializing live camera view with all models');

    // --- Setup Canvas & Renderer ---
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, { width: '100%', height: '100%', borderRadius: '8px' });
    portalRef.current.innerHTML = '';
    portalRef.current.appendChild(canvas);
    canvasRef.current = canvas;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    rendererRef.current = renderer;
    const rect = portalRef.current.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- Setup Scene, Camera, and Lighting ---
    const scene = customSceneRef.current;
    const camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 10000);
    customCameraRef.current = camera;
    
    // Enhanced lighting for better model visibility
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // --- Add all models to the scene ---
    const instances = {};

    // Add terrain
    if (terrainModel) {
      const terrainClone = terrainModel.clone(true);
      terrainClone.scale.set(100, 100, 100);
      // Store original materials and only set shadow properties
      terrainClone.traverse(node => {
        if (node.isMesh) {
          // Keep the original material with textures
          node.receiveShadow = true;
          node.castShadow = true;
        }
      });
      instances.terrain = terrainClone;
      scene.add(terrainClone);
    }

    // Add UAV
    if (uavModel) {
      const uavClone = uavModel.clone(true);
      uavClone.scale.set(3, 3, 3);
      uavClone.traverse(node => {
        if (node.isMesh) {
          node.material = NORMAL_MATERIALS.uav;
          node.castShadow = true;
        }
      });
      instances.uav = uavClone;
      scene.add(uavClone);
    }

    // Add Tank
    if (tankModel) {
      const tankClone = tankModel.clone(true);
      tankClone.position.set(40, 19, 16);
      tankClone.scale.set(0.5, 0.5, 0.5);
      tankClone.traverse(node => {
        if (node.isMesh) {
          node.material = NORMAL_MATERIALS.tank;
          node.castShadow = true;
        }
      });
      instances.tank = tankClone;
      scene.add(tankClone);
    }

    // Add Jeep
    if (jeepModel) {
      const jeepClone = jeepModel.clone(true);
      jeepClone.position.set(40, 19, 20);
      jeepClone.scale.set(0.03, 0.03, 0.03);
      jeepClone.traverse(node => {
        if (node.isMesh) {
          node.material = NORMAL_MATERIALS.jeep;
          node.castShadow = true;
        }
      });
      instances.jeep = jeepClone;
      scene.add(jeepClone);
    }

    // Add Soldier
    if (soldierModel) {
      const soldierClone = soldierModel.clone(true);
      soldierClone.position.set(40, 21, 32);
      soldierClone.scale.set(0.2, 0.2, 0.2);
      soldierClone.traverse(node => {
        if (node.isMesh) {
          node.material = NORMAL_MATERIALS.soldier;
          node.castShadow = true;
        }
      });
      instances.soldier = soldierClone;
      scene.add(soldierClone);
    }

    // Add Warehouse
    if (warehouseModel) {
      const warehouseClone = warehouseModel.clone(true);
      warehouseClone.position.set(40, 21, 32);
      warehouseClone.scale.set(0.7, 0.7, 0.7);
      warehouseClone.traverse(node => {
        if (node.isMesh) {
          node.material = NORMAL_MATERIALS.warehouse;
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      instances.warehouse = warehouseClone;
      scene.add(warehouseClone);
    }

    // Add Army Base
    if (armyBaseModel) {
      const armyBaseClone = armyBaseModel.clone(true);
      armyBaseClone.position.set(-45, 25, -40);
      armyBaseClone.scale.set(0.5, 0.5, 0.5);
      armyBaseClone.traverse(node => {
        if (node.isMesh) {
          node.material = NORMAL_MATERIALS.armyBase;
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      instances.armyBase = armyBaseClone;
      scene.add(armyBaseClone);
    }

    modelInstancesRef.current = instances;

    // --- Setup Post-Processing Effects ---
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    const thermalPass = new ShaderPass(ThermalShader);
    thermalPass.enabled = false;
    composer.addPass(thermalPass);
    thermalPassRef.current = thermalPass;

    // --- Animation Loop ---
    const animate = (time) => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      
      const { position, rotation, isThermalVision, isCrashed, droneType } = useUAVStore.getState();
      const { destroyedTargets } = useAttackDroneStore.getState();
      const { environmentMode } = useEnvironmentStore.getState();
      const { getCurrentSettings } = useCameraStore.getState();
      const settings = getCurrentSettings();

      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Update camera
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation));
      const offsetVector = new THREE.Vector3(...settings.offset).applyMatrix4(rotationMatrix);
      const lookAtOffset = new THREE.Vector3(...settings.lookAtOffset).applyMatrix4(rotationMatrix);
      camera.position.fromArray(position).add(offsetVector);
      camera.lookAt(new THREE.Vector3().fromArray(position).add(lookAtOffset));
      camera.fov = settings.fov;
      camera.updateProjectionMatrix();

      // Update UAV position and visibility
      if (instances.uav) {
        instances.uav.position.fromArray(position);
        instances.uav.rotation.fromArray(rotation);
        
        // Show UAV only if spawned (not at default position)
        const isSpawned = position[0] !== 0 || position[1] !== 50 || position[2] !== 0;
        instances.uav.visible = isSpawned && (droneType === 'surveillance' || droneType === 'attack');
      }

      // Hide destroyed targets
      destroyedTargets.forEach(targetId => {
        if (targetId.includes('tank') && instances.tank) instances.tank.visible = false;
        if (targetId.includes('jeep') && instances.jeep) instances.jeep.visible = false;
        if (targetId.includes('warehouse') && instances.warehouse) instances.warehouse.visible = false;
        if (targetId.includes('soldier') && instances.soldier) instances.soldier.visible = false;
      });

      // Update thermal vision
      if (isThermalVision) {
        thermalPassRef.current.enabled = true;
        thermalPassRef.current.uniforms.time.value += deltaTime;
        
        // Dynamic thermal parameters for realism
        thermalPassRef.current.uniforms.noiseIntensity.value = 0.12 + Math.sin(time * 0.001) * 0.03;
        thermalPassRef.current.uniforms.contrast.value = 3.5 + Math.sin(time * 0.0008) * 0.5;
        thermalPassRef.current.uniforms.scanlineIntensity.value = 0.08 + Math.sin(time * 0.002) * 0.02;
        
        // Apply thermal materials to all objects
        Object.entries(instances).forEach(([key, instance]) => {
          if (instance && THERMAL_MATERIALS[key]) {
            instance.traverse(node => {
              if (node.isMesh) {
                node.material = THERMAL_MATERIALS[key];
              }
            });
          }
        });
      } else {
        thermalPassRef.current.enabled = false;
        
        // Restore normal materials (skip terrain to keep original textures)
        Object.entries(instances).forEach(([key, instance]) => {
          if (instance && NORMAL_MATERIALS[key] && key !== 'terrain') {
            instance.traverse(node => {
              if (node.isMesh) {
                node.material = NORMAL_MATERIALS[key];
              }
            });
          }
        });
      }

      // Set background color
      let skyColor = isThermalVision ? THERMAL_SKY_COLOR : 
                     (environmentMode === 'night' ? NIGHT_SKY_COLOR : 
                     (environmentMode === 'rain' ? RAIN_SKY_COLOR : DAY_SKY_COLOR));
      renderer.setClearColor(skyColor);

      // Handle crash overlay
      const overlay = portalRef.current.querySelector('.crash-overlay');
      if (isCrashed && !overlay) {
        const crashOverlay = document.createElement('div');
        Object.assign(crashOverlay.style, { 
          position: 'absolute', 
          top: '0', 
          left: '0', 
          width: '100%', 
          height: '100%', 
          background: 'rgba(255,0,0,0.3)', 
          zIndex: '10', 
          pointerEvents: 'none' 
        });
        crashOverlay.className = 'crash-overlay';
        portalRef.current.appendChild(crashOverlay);
      } else if (!isCrashed && overlay) {
        overlay.remove();
      }

      composerRef.current.render();
    };
    
    animate(0);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      renderer.dispose();
      composer.dispose();
      scene.clear();
    };
  }, [terrainModel, uavModel, tankModel, jeepModel, soldierModel, warehouseModel, armyBaseModel]);

  return null;
};

export default LiveCameraView;