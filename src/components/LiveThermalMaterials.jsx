import * as THREE from 'three';

// Ultra-simplified thermal materials - NO shaders, NO uniforms
export const LIVE_THERMAL_MATERIALS = {
  terrain: new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 0.8, 0.2), // Green for terrain
    side: THREE.DoubleSide,
    flatShading: true
  }),
  hot: new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.95, 0.1, 0.05), // Red for hot objects
    side: THREE.DoubleSide,
    flatShading: true
  }),
  medium: new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.9, 0.9, 0.1), // Yellow for medium temp
    side: THREE.DoubleSide,
    flatShading: true
  }),
  cool: new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.0, 0.1, 0.7), // Blue for cool objects
    side: THREE.DoubleSide,
    flatShading: true
  }),
  uav: new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.0, 1.0, 1.0), // White for UAV
    side: THREE.DoubleSide,
    flatShading: true
  })
};

export default () => null; // Empty component for consistency



// import * as THREE from 'three';

// // Simple thermal vision materials (non-shader based) for LiveCameraView
// export const LIVE_THERMAL_MATERIALS = {
//   terrain: new THREE.MeshBasicMaterial({
//     color: new THREE.Color(0.0, 0.8, 0.2), // Green for terrain
//     side: THREE.DoubleSide
//   }),
//   hot: new THREE.MeshBasicMaterial({
//     color: new THREE.Color(0.95, 0.1, 0.05), // Red for hot objects
//     side: THREE.DoubleSide
//   }),
//   medium: new THREE.MeshBasicMaterial({
//     color: new THREE.Color(0.9, 0.9, 0.1), // Yellow for medium temp
//     side: THREE.DoubleSide
//   }),
//   cool: new THREE.MeshBasicMaterial({
//     color: new THREE.Color(0.0, 0.1, 0.7), // Blue for cool objects
//     side: THREE.DoubleSide
//   })
// };

// export default () => null; // Empty component for consistency