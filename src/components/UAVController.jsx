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
      // Handle surveillance drone movement
      const { position, targetPosition, speed, isCrashed, setPosition, setTargetPosition, setRotation } = useUAVStore.getState();
      
      if (!isCrashed && targetPosition) {
        const currentPos = new THREE.Vector3(...position);
        const targetPos = new THREE.Vector3(...targetPosition);
        const direction = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
        const distance = currentPos.distanceTo(targetPos);
        
        // Only move if not very close to target
        if (distance > 0.5) {
          // Calculate new position with delta time
          const stepSize = Math.min(speed * delta * 60, distance);
          const newPos = new THREE.Vector3().copy(currentPos);
          newPos.addScaledVector(direction, stepSize);
          
          // Update position in store
          setPosition([newPos.x, newPos.y, newPos.z]);
          
          // Update rotation to face movement direction
          if (Math.abs(direction.x) > 0.01 || Math.abs(direction.z) > 0.01) {
            const angle = Math.atan2(direction.x, direction.z);
            setRotation([0, angle, 0]);
          }
        } else {
          // Snap to target and clear it
          setPosition([...targetPosition]);
          setTargetPosition(null);
        }
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