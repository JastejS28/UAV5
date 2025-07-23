import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useUAVStore } from '../store/uavStore';
import { useEnvironmentStore } from '../store/environmentStore';
import { useCameraStore } from '../store/cameraStore';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Define sky colors for the live view
const DAY_SKY_COLOR = new THREE.Color(0x87CEEB);
const NIGHT_SKY_COLOR = new THREE.Color(0x000000);
const RAIN_SKY_COLOR = new THREE.Color(0x404050);
const THERMAL_SKY_COLOR = new THREE.Color(0x000000);

// Create simple materials for the live view
const SIMPLE_MATERIALS = {
  // Normal view: A simple material that looks like terrain
  terrain: new THREE.MeshStandardMaterial({ 
    color: 0x7C745C,  // Beige/tan color for terrain
    roughness: 0.8,
    metalness: 0.1
  }),
  
  // Base material for thermal view (will be enhanced with post-processing)
  thermalTerrain: new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,  // White base - the shader will colorize it
    wireframe: false
  })
};

// Custom thermal vision shader
const ThermalShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'time': { value: 0 },
    'noiseIntensity': { value: 0.08 },
    'contrast': { value: 2.2 },
    'brightness': { value: 0.1 },
    'saturation': { value: 1.4 }
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
    varying vec2 vUv;
    
    // Simple noise function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Enhanced thermal color mapping with more realistic heat signatures
    vec3 getThermalColor(float temp) {
      // Very cold (deep blue/purple)
      if (temp < 0.15) return vec3(0.0, 0.0, 0.4) + vec3(temp * 0.8, 0, temp * 2.5);
      
      // Cold (blue to cyan)
      else if (temp < 0.3) return vec3(0.0, (temp - 0.15) * 4.0, 0.8 - (temp - 0.15) * 2.0);
      
      // Cool to medium (cyan to green)
      else if (temp < 0.45) return vec3((temp - 0.3) * 2.0, 0.9, (temp - 0.3) * 1.5);
      
      // Medium (green to yellow)
      else if (temp < 0.65) return vec3((temp - 0.45) * 4.0, 1.0, 0.0);
      
      // Warm (yellow to orange)
      else if (temp < 0.8) return vec3(1.0, 0.9 - (temp - 0.65) * 2.0, 0.0);
      
      // Hot (orange to red)
      else if (temp < 0.92) return vec3(1.0, 0.4 - (temp - 0.8) * 2.5, 0.0);
      
      // Very hot (red to white)
      else return vec3(1.0, (temp - 0.92) * 8.0, (temp - 0.92) * 10.0);
    }
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Calculate perceived brightness
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      
      // Add brightness adjustment
      brightness += brightness;
      
      // Apply contrast
      brightness = (brightness - 0.5) * contrast + 0.5;
      brightness = clamp(brightness, 0.0, 1.0);
      
      // Add enhanced noise with time variation
      float noise = random(vUv * 150.0 + time * 0.15) * noiseIntensity;
      float timeNoise = sin(time * 3.0 + vUv.x * 20.0) * 0.02;
      noise += timeNoise;
      brightness += noise;
      brightness = clamp(brightness, 0.0, 1.0);
      
      // Get thermal color based on brightness
      vec3 thermalColor = getThermalColor(brightness);
      
      // Enhanced scan lines with multiple frequencies
      float scanline = sin(vUv.y * 250.0 + time * 3.0) * 0.04;
      scanline += sin(vUv.y * 500.0 + time * 5.0) * 0.02;
      thermalColor += scanline;
      
      // Apply saturation enhancement
      float gray = dot(thermalColor, vec3(0.299, 0.587, 0.114));
      thermalColor = mix(vec3(gray), thermalColor, saturation);
      
      // Add subtle vignette effect for realism
      vec2 center = vUv - 0.5;
      float vignette = 1.0 - dot(center, center) * 0.3;
      thermalColor *= vignette;
      
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

  const { scene: terrainModel } = useGLTF('/models/mountain/terrain.glb');
  const terrainInstanceRef = useRef(null);

  useEffect(() => {
    if (!portalRef.current || !terrainModel) return;

    console.log('[LiveCameraView] Initializing live camera view');

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

    // --- Setup Scene, Camera, and Lighting ---
    const scene = customSceneRef.current;
    const camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 10000);
    customCameraRef.current = camera;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 20, 5);
    scene.add(dirLight);

    // --- Clone Terrain for the Live View ---
    const terrainClone = terrainModel.clone(true);
    terrainClone.scale.set(100, 100, 100);
    
    // IMPORTANT: Immediately replace ALL materials with our safe materials
    terrainClone.traverse(node => {
      if (node.isMesh) {
        // Start with our simple terrain material (never store shader materials)
        node.material = SIMPLE_MATERIALS.terrain;
      }
    });
    
    terrainInstanceRef.current = terrainClone;
    scene.add(terrainInstanceRef.current);

    // --- Setup Post-Processing Effects ---
    // Create an effect composer for post-processing
    const composer = new EffectComposer(renderer);
    composerRef.current = composer;
    
    // Add a render pass that renders the scene with the camera
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Add the thermal vision pass with our custom shader
    const thermalPass = new ShaderPass(ThermalShader);
    thermalPass.enabled = false; // Start with normal vision
    composer.addPass(thermalPass);
    thermalPassRef.current = thermalPass;

    // --- Animation Loop ---
    const animate = (time) => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      
      const { position, rotation, isThermalVision, isCrashed } = useUAVStore.getState();
      const { environmentMode } = useEnvironmentStore.getState();
      const { getCurrentSettings } = useCameraStore.getState();
      const settings = getCurrentSettings();

      // Calculate delta time for animations
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

      // Update thermal vision effect
      if (isThermalVision) {
        // Enable thermal shader and update its uniforms
        thermalPassRef.current.enabled = true;
        thermalPassRef.current.uniforms.time.value += deltaTime;
        
        // Add dynamic thermal effects
        thermalPassRef.current.uniforms.noiseIntensity.value = 0.08 + Math.sin(time * 0.5) * 0.02;
        thermalPassRef.current.uniforms.contrast.value = 2.2 + Math.sin(time * 0.3) * 0.3;
        
        // Use a base material that works well with the thermal shader
        terrainInstanceRef.current.traverse(node => {
          if (node.isMesh && node.material !== SIMPLE_MATERIALS.thermalTerrain) {
            node.material = SIMPLE_MATERIALS.thermalTerrain;
          }
        });
      } else {
        // Disable thermal shader
        thermalPassRef.current.enabled = false;
        
        // Restore normal materials
        terrainInstanceRef.current.traverse(node => {
          if (node.isMesh && node.material !== SIMPLE_MATERIALS.terrain) {
            node.material = SIMPLE_MATERIALS.terrain;
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

      // Render using the composer instead of the renderer directly
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
  }, [terrainModel]);

  return null;
};

export default LiveCameraView;