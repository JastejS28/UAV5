// If you don't have this file, create it or add to your existing animation loop

import { useFrame } from '@react-three/fiber';
import { useUAVStore } from '../store/uavStore';

const UAVController = () => {
  // Use a separate function to update position in the animation frame
  // This avoids setState inside useEffect and prevents render loops
  useFrame((state, delta) => {
    // Get the update function directly from the store
    const { updatePosition } = useUAVStore.getState();
    
    // Call it with delta time for smooth movement
    if (updatePosition) {
      updatePosition(delta);
    }
  });
  
  return null;
};

export default UAVController;