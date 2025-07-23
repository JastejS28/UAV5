import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUAVStore } from '../store/uavStore';
import { useAttackDroneStore } from '../store/attackDroneStore';
import { useMissionStore } from '../store/missionStore';

const UAVController = () => {
  const droneType = useUAVStore(state => state.droneType);
  
  useFrame((state, delta) => {
    // Handle different drone types
    if (droneType === 'surveillance') {
      // Handle surveillance drone movement and hovering
      const { 
        position, 
        targetPosition, 
        speed, 
        isCrashed, 
        setPosition, 
        setTargetPosition, 
        setRotation,
        targets 
      } = useUAVStore.getState();
      
      const { 
        missionStatus, 
        isHovering, 
        currentTarget, 
        setCurrentTarget, 
        startHovering, 
        stopHovering,
        updateHoverTime,
        missionTimeRemaining,
        baseLocation
      } = useMissionStore.getState();
      
      if (!isCrashed && missionStatus === 'active') {
        // Check if UAV should return to base (low time remaining)
        if (missionTimeRemaining <= 15 && !isHovering) {
          // Calculate time to return to base
          const currentPos = new THREE.Vector3(...position);
          const basePos = new THREE.Vector3(...baseLocation);
          const distanceToBase = currentPos.distanceTo(basePos);
          const timeToBase = distanceToBase / 30; // 30 units per second
          
          if (missionTimeRemaining <= timeToBase + 5) { // 5 second buffer
            console.log("Mission time critical - returning to base");
            setTargetPosition([...baseLocation]);
          }
        }
        
        // Check for nearby targets to hover above
        if (!isHovering && targets && targets.length > 0) {
          const currentPos = new THREE.Vector3(...position);
          
          // Find closest target within hover range
          const nearbyTarget = targets.find(target => {
            const targetPos = new THREE.Vector3(...target.position);
            const distance = currentPos.distanceTo(targetPos);
            return distance < 15; // 15 unit hover range
          });
          
          if (nearbyTarget && (!currentTarget || nearbyTarget.id !== currentTarget.id)) {
            console.log("Starting hover above target:", nearbyTarget.type);
            setCurrentTarget(nearbyTarget);
            startHovering();
            
            // Set hover position above target
            const hoverPos = [
              nearbyTarget.position[0],
              nearbyTarget.position[1] + 20, // 20 units above target
              nearbyTarget.position[2]
            ];
            setTargetPosition(hoverPos);
          }
        }
        
        // Update hover time if hovering
        if (isHovering && currentTarget) {
          updateHoverTime(delta);
          
          // Implement circular hovering pattern
          const time = Date.now() / 1000;
          const radius = 8; // Hover radius
          const speed = 0.5; // Rotation speed
          
          const centerX = currentTarget.position[0];
          const centerZ = currentTarget.position[2];
          const hoverY = currentTarget.position[1] + 20;
          
          const newX = centerX + Math.cos(time * speed) * radius;
          const newZ = centerZ + Math.sin(time * speed) * radius;
          
          setPosition([newX, hoverY, newZ]);
          
          // Face the direction of movement for circular motion
          const angle = time * speed + Math.PI / 2; // Add 90 degrees to face forward
          setRotation([0, angle, 0]);
          
          // Check if hover time is sufficient, then move to next target or return
          if (useMissionStore.getState().objectives.hoverTime >= 10) { // 10 seconds per target
            console.log("Sufficient hover time achieved, looking for next target");
            stopHovering();
            setCurrentTarget(null);
            
            // Look for next target or return to base if time is low
            if (missionTimeRemaining > 30) {
              // Continue exploring
              setTargetPosition(null);
            } else {
              // Return to base
              setTargetPosition([...baseLocation]);
            }
          }
        }
        
        // Normal movement when not hovering
        if (!isHovering && targetPosition) {
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