import * as THREE from 'three';

// JS-side color constants (matching GLSL values)
const C_RED = new THREE.Color(0.95, 0.1, 0.05);
const C_YELLOW = new THREE.Color(0.9, 0.9, 0.1);
const C_BLUE = new THREE.Color(0.0, 0.1, 0.7);

// Vertex Shader
const thermalVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader
const thermalFragmentShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  uniform float minHeight;
  uniform float maxHeight;
  uniform float noiseFactor;

  #define DEBUG_MODE 0

  float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
  }

  const vec3 C_COLD_DARK_BLUE = vec3(0.0, 0.0, 0.25);
  const vec3 C_BLUE         = vec3(0.0, 0.1, 0.7);
  const vec3 C_CYAN_GREEN   = vec3(0.1, 0.6, 0.5);
  const vec3 C_GREEN_YELLOW = vec3(0.3, 0.8, 0.15);
  const vec3 C_YELLOW       = vec3(0.9, 0.9, 0.1);
  const vec3 C_ORANGE       = vec3(1.0, 0.5, 0.0);
  const vec3 C_RED          = vec3(0.95, 0.1, 0.05);
  const vec3 C_HOT_WHITE    = vec3(1.0, 1.0, 0.95);

  vec3 getThermalColor(float tempValue) {
      tempValue = clamp(tempValue, 0.0, 1.0);

      if (tempValue < 0.16) return mix(C_COLD_DARK_BLUE, C_BLUE, tempValue / 0.16);
      else if (tempValue < 0.32) return mix(C_BLUE, C_CYAN_GREEN, (tempValue - 0.16) / 0.16);
      else if (tempValue < 0.48) return mix(C_CYAN_GREEN, C_GREEN_YELLOW, (tempValue - 0.32) / 0.16);
      else if (tempValue < 0.64) return mix(C_GREEN_YELLOW, C_YELLOW, (tempValue - 0.48) / 0.16);
      else if (tempValue < 0.80) return mix(C_YELLOW, C_ORANGE, (tempValue - 0.64) / 0.16);
      else if (tempValue < 0.95) return mix(C_ORANGE, C_RED, (tempValue - 0.80) / 0.15);
      else return mix(C_RED, C_HOT_WHITE, (tempValue - 0.95) / 0.05);
  }

  void main() {
    float heightRange = max(0.001, maxHeight - minHeight);
    float heightRatio = (vWorldPosition.y - minHeight) / heightRange;

    #if DEBUG_MODE == 1
      gl_FragColor = vec4(vec3(clamp(heightRatio, 0.0, 1.0)), 1.0);
      return;
    #elif DEBUG_MODE == 2
      float scaledY = clamp((vWorldPosition.y + 0.0) / 50.0, 0.0, 1.0);
      gl_FragColor = vec4(vec3(scaledY), 1.0);
      return;
    #elif DEBUG_MODE == 3
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      return;
    #elif DEBUG_MODE == 4
      gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
      return;
    #endif

    float noise = (rand(vWorldPosition.xz * 0.1) - 0.5) * noiseFactor;
    float temperature = clamp(heightRatio + noise, 0.0, 1.0);

    vec3 finalColor = getThermalColor(temperature);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// Terrain Thermal Shader Material
const terrainThermalShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    minHeight: { value: 0.0 },
    maxHeight: { value: 1.0 },
    noiseFactor: { value: 0.15 },
  },
  vertexShader: thermalVertexShader,
  fragmentShader: thermalFragmentShader,
  side: THREE.DoubleSide,
  defines: {
    // DEBUG_MODE: 0
  },
});

// Export materials used in thermal vision
export const THERMAL_MATERIALS = {
  terrain: terrainThermalShaderMaterial,
  hot: new THREE.MeshBasicMaterial({ color: C_RED }),
  medium: new THREE.MeshBasicMaterial({ color: C_YELLOW }),
  cool: new THREE.MeshBasicMaterial({ color: C_BLUE }),
};

// Component that just defines materials
const ThermalVisionEffect = () => {
  return null;
};

export default ThermalVisionEffect;