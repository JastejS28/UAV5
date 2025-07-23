// If you don't have this file, create it or add to your existing animation loop

import { useFrame } from '@react-three/fiber';
import { useUAVStore } from '../store/uavStore';
import { useAttackDroneStore } from '../store/attackDroneStore';

const UAVController = () => {
  const droneType = useUAVStore(state => state.droneType);
  
  // Use a separate function to update position in the animation frame
  // This avoids setState inside useEffect and prevents render loops
  useFrame((state, delta) => {
    // Handle different drone types
    if (droneType === 'surveillance') {
      // Get the update function directly from the UAV store for surveillance drones
      const { updatePosition } = useUAVStore.getState();
      
      // Call it with delta time for smooth movement
      if (updatePosition) {
        updatePosition(delta);
      }
    } else if (droneType === 'attack') {
      // For attack drones, use the attack drone store's movement system
      const { updateMissionMovement, updateCrashAnimation, missionState } = useAttackDroneStore.getState();
      
      if (missionState === 'crashed') {
        updateCrashAnimation(delta);
      } else {
        updateMissionMovement(delta);
      }
    }
  });
  
  return null;
};

export default UAVController;