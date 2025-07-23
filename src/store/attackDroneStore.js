import { create } from 'zustand';
import * as THREE from 'three';
import { useUAVStore } from './uavStore';
import { useMissionStore } from './missionStore';

export const useAttackDroneStore = create((set, get) => ({
  // Basic targeting data
  targets: [],
  selectedWeapon: 'missile',
  ammoCount: {
    missile: 6,
    bomb: 3,
  },
  targeting: {
    lockedTarget: null,
    lockStatus: 'inactive', // 'inactive', 'seeking', 'locked'
    lockTimer: 0,
    maxLockTime: 2.0, // seconds to achieve full lock
    maxTargetingRange: 200, // maximum range in world units
  },
  activeMissiles: [],
  
  // Attack mission properties
  missionState: 'idle', // 'idle', 'moving', 'attacking', 'returning'
  homeBase: [-50, 30, -40], // Starting position
  attackPosition: null, // Will be calculated based on target
  attackAltitude: 40, // Height to maintain during attack
  attackDistance: 30, // Distance to maintain from target
  attackSpeed: 0.5, // Movement speed units per frame
  moveProgress: 0, // Progress along movement path (0-1)
  
  // Track which targets have been destroyed
  destroyedTargets: [],
  explosions: [], // Track recent explosions
  
  // Initialize and fetch targets from environment
  initTargets: () => {
    // Pull targets from the uavStore
    const targets = useUAVStore.getState().targets || [];
    console.log("Initializing attack drone targets:", targets);
    set({ targets });
    
    // Reset position to home base
    useUAVStore.setState({ position: [...get().homeBase] });
  },
  
  // Weapon selection
  selectWeapon: (weapon) => {
    console.log("Weapon selected:", weapon);
    set({ selectedWeapon: weapon });
  },
  
  // Begin attack mission after target lock
  beginMission: (targetId) => {
    const { targets } = get();
    const target = targets.find(t => t.id === targetId);
    
    if (!target) {
      console.error("Target not found for attack mission");
      return;
    }
    
    // Calculate optimal attack position
    const targetPos = new THREE.Vector3(...target.position);
    const currentPos = new THREE.Vector3(...useUAVStore.getState().position);
    
    // Direction vector from target to current position (normalized)
    const direction = new THREE.Vector3().subVectors(currentPos, targetPos).normalize();
    
    // Calculate attack position at specified distance from target
    const attackPos = new THREE.Vector3().copy(targetPos).add(
      direction.multiplyScalar(get().attackDistance)
    );
    
    // Set altitude for the attack position
    attackPos.y = get().attackAltitude;
    
    console.log("Beginning attack mission to:", attackPos);
    
    // Start mission
    set({ 
      missionState: 'moving',
      attackPosition: [attackPos.x, attackPos.y, attackPos.z],
      moveProgress: 0
    });
  },
  
  // Add the moveToPosition function and fix the targeting workflow
  moveToPosition: (targetPosition) => {
    // Set mission state to moving and save the target position
    set({ 
      missionState: 'moving',
      attackPosition: targetPosition
    });
    
    // This would trigger the UAV movement in your simulation
    // Once position is reached, the animation or physics system 
    // should call the positionReached function
  },
  
  // Called when UAV reaches its destination
  positionReached: () => {
    // Update state to attacking
    set({ missionState: 'attacking' });
    console.log("Attack position reached. Ready to engage targets.");
  },
  
  // Begin target lock - only works when in attacking state
  beginTargetLock: (targetId) => {
    const state = get();
    if (state.missionState !== 'attacking') return;
    
    const target = state.targets.find(t => t.id === targetId);
    if (!target) return;
    
    set({ 
      targeting: {
        ...state.targeting,
        lockedTarget: targetId,
        lockStatus: 'acquiring',
        lockTimer: 0,
        maxLockTime: 3000 // 3 seconds to lock
      }
    });
    
    // Start lock-on process
    const lockInterval = setInterval(() => {
      set(state => {
        if (state.targeting.lockTimer >= state.targeting.maxLockTime) {
          // Target lock complete
          clearInterval(lockInterval);
          set({ 
            targeting: {
              ...state.targeting,
              lockStatus: 'locked'
            }
          });
          return state;
        }
        
        // Update lock timer
        return {
          targeting: {
            ...state.targeting,
            lockTimer: state.targeting.lockTimer + 100
          }
        };
      });
    }, 100);
  },
  
  // Update target lock with time
  updateTargetLock: (delta) => {
    const { targeting, missionState } = get();
    
    // Skip if not in seeking mode
    if (targeting.lockStatus !== 'seeking') return;
    
    // Increment lock timer
    let newTimer = targeting.lockTimer + delta;
    let newStatus = targeting.lockStatus;
    
    // Check if lock is complete
    if (newTimer >= targeting.maxLockTime) {
      newTimer = targeting.maxLockTime;
      newStatus = 'locked';
      
      // Only begin mission if not already in attack position
      if (missionState !== 'attacking') {
        get().beginMission(targeting.lockedTarget);
      }
    }
    
    // Update state
    set({
      targeting: {
        ...targeting,
        lockTimer: newTimer,
        lockStatus: newStatus,
      }
    });
  },
  
  // Update UAV position during mission
  updateMissionMovement: (delta) => {
    const { missionState, attackPosition, homeBase, attackSpeed, moveProgress, manualTargetPosition, manualMovementSpeed } = get();
    
    // Handle different movement states
    if (missionState === 'crashed') return; // No movement if crashed
    
    // Get current position
    const uavPosition = useUAVStore.getState().position;
    if (!uavPosition) return;
    
    // Handle manual movement when in manual mode or idle with a target
    if (manualTargetPosition && (missionState === 'manual' || missionState === 'idle')) {
      const start = new THREE.Vector3(...uavPosition);
      const end = new THREE.Vector3(...manualTargetPosition);
      
      // Enforce minimum Y value for target (ensure we don't set below minimum height)
      if (end.y < 10) end.y = 10;
      
      // Calculate distance to target
      const distanceToTarget = start.distanceTo(end);
      
      // If we've reached the target (within 1 unit)
      if (distanceToTarget < 1) {
        // We've reached the manual position
        console.log("Reached manual position");
        set({ manualTargetPosition: null, missionState: 'idle' });
        return;
      }
      
      // Calculate direction vector
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      
      // Calculate new position with smooth movement
      const moveDistance = Math.min(manualMovementSpeed * delta * 60, distanceToTarget);
      const newPos = new THREE.Vector3()
        .copy(start)
        .add(direction.multiplyScalar(moveDistance));
      
      // Ensure we never go below minimum height (Y=10)
      if (newPos.y < 10) newPos.y = 10;
      
      // Update UAV position
      useUAVStore.setState({ 
        position: [newPos.x, newPos.y, newPos.z]
      });
      
      // Calculate rotation to face direction of movement
      const rotation = [
        0, // X rotation (pitch)
        Math.atan2(direction.x, direction.z), // Y rotation (yaw)
        0  // Z rotation (roll)
      ];
      
      // Update UAV rotation
      useUAVStore.setState({ rotation });
      
      return; // Exit the function after handling manual movement
    }
    
    if (missionState !== 'moving' && missionState !== 'returning') return;
    
    // Get current position
    const currentPos = useUAVStore.getState().position;
    
    // Determine target position based on mission state
    const targetPos = missionState === 'moving' ? attackPosition : homeBase;
    
    // Create THREE.js vectors for easier calculation
    const start = new THREE.Vector3(...currentPos);
    const end = new THREE.Vector3(...targetPos);
    
    // Calculate distance to target
    const distanceToTarget = start.distanceTo(end);
    
    // If we've reached the target (within 2 units)
    if (distanceToTarget < 2) {
      if (missionState === 'moving') {
        // We've reached the attack position, switch to attacking
        console.log("Reached attack position, ready to fire");
        set({ missionState: 'attacking', moveProgress: 0 });
      } else if (missionState === 'returning') {
        // We've returned to base
        console.log("Returned to base position");
        set({ missionState: 'idle', moveProgress: 0 });
      }
      return;
    }
    
    // Calculate new position along path
    const newProgress = Math.min(1.0, moveProgress + (attackSpeed * delta));
    
    // Interpolate between current and target position
    const newPos = new THREE.Vector3().lerpVectors(start, end, (newProgress - moveProgress) * 5);
    
    // Update UAV position
    useUAVStore.setState({ 
      position: [newPos.x, newPos.y, newPos.z]
    });
    
    // Calculate direction for UAV to face (look at target when attacking, look forward when returning)
    const lookTarget = missionState === 'moving' ? 
      // When moving to attack, look ahead at attack position
      new THREE.Vector3(...targetPos) :
      // When returning to base, look at direction of movement
      new THREE.Vector3().subVectors(end, start).normalize().add(newPos);
      
    // Create a direction vector
    const direction = new THREE.Vector3().subVectors(lookTarget, newPos).normalize();
    
    // Calculate rotation from direction vector
    const rotation = [
      0, // X rotation (pitch) - keep level
      Math.atan2(direction.x, direction.z), // Y rotation (yaw) - face direction
      0  // Z rotation (roll) - keep level
    ];
    
    // Update UAV rotation
    useUAVStore.setState({ rotation });
    
    // Update movement progress
    set({ moveProgress: newProgress });
  },
  
  // Fire missile
  fireMissile: () => {
    const { selectedWeapon, ammoCount, targeting, activeMissiles, missionState } = get();
    
    // Check if we can fire - must be in attacking state
    if (missionState !== 'attacking') {
      console.warn("Cannot fire: drone is not in attack position");
      return;
    }
    
    // Check if we have lock and ammo
    if (targeting.lockStatus !== 'locked' || ammoCount[selectedWeapon] <= 0) {
      console.warn("Cannot fire: either no target locked or no ammo");
      return;
    }
    
    // Get target and UAV positions
    const targets = get().targets;
    const target = targets.find(t => t.id === targeting.lockedTarget);
    if (!target) {
      console.error("Target not found");
      return;
    }
    
    const uavPosition = useUAVStore.getState().position;
    
    // Create unique ID for missile
    const uniqueId = `missile-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create new missile
    const newMissile = {
      id: uniqueId,
      weaponType: selectedWeapon,
      targetId: targeting.lockedTarget,
      position: [...uavPosition],
      targetPosition: [...target.position],
      flightProgress: 0,
      speed: selectedWeapon === 'missile' ? 0.5 : 0.3, // progress per second
    };
    
    // Update state
    set({
      ammoCount: {
        ...ammoCount,
        [selectedWeapon]: ammoCount[selectedWeapon] - 1
      },
      activeMissiles: [...activeMissiles, newMissile]
    });
    
    // After firing all ammo, return to base
    if (ammoCount[selectedWeapon] - 1 <= 0) {
      setTimeout(() => {
        set({ 
          missionState: 'returning',
          targeting: {
            ...get().targeting,
            lockStatus: 'inactive',
            lockTimer: 0,
          }
        });
        console.log("All ammo expended, returning to base");
      }, 3000); // Wait 3 seconds before returning
    }
    
    console.log("Missile fired:", newMissile);
  },
  
  // Add this to your store's state
  destroyTarget: (targetId) => {
    const { targets, destroyedTargets } = get();
    
    if (destroyedTargets.includes(targetId)) return;
    
    const targetToDestroy = targets.find(t => t.id === targetId);
    if (!targetToDestroy) return;
    
    const updatedDestroyedTargets = [...destroyedTargets, targetId];
    set({ destroyedTargets: updatedDestroyedTargets });
    
    // Update mission store with target destruction
    const missionStore = useMissionStore.getState();
    if (missionStore.missionStatus === 'active') {
      missionStore.incrementTargetsDestroyed();
    }
    
    console.log(`Target destroyed: ${targetId} (${targetToDestroy.type})`);
  },
  
  // Update missiles in flight
  updateMissiles: (delta) => {
    const { activeMissiles, destroyTarget } = get();
    if (activeMissiles.length === 0) return;
    
    const updatedMissiles = activeMissiles.map(missile => {
      // Update flight progress
      const newProgress = missile.flightProgress + delta * missile.speed;
      
      // If missile just reached target, destroy it
      if (missile.flightProgress < 1.0 && newProgress >= 1.0) {
        console.log("Missile hit target:", missile.targetId);
        destroyTarget(missile.targetId);
      }
      
      return {
        ...missile,
        flightProgress: newProgress
      };
    });
    
    // Keep missiles that haven't reached target yet (or just reached it)
    // This will remove missiles that have already been "exploded" after a short delay
    const currentMissiles = updatedMissiles.filter(missile => 
      missile.flightProgress <= 1.0 || 
      (missile.flightProgress > 1.0 && missile.flightProgress < 1.0 + missile.speed * 0.2)
    );
    
    // Only update state if missiles have changed
    if (currentMissiles.length !== activeMissiles.length || 
        currentMissiles.some((m, i) => m.flightProgress !== activeMissiles[i].flightProgress)) {
      set({ activeMissiles: currentMissiles });
    }
  },
  
  // Return to base command
  returnToBase: () => {
    set({ 
      missionState: 'returning',
      moveProgress: 0,
      targeting: {
        ...get().targeting,
        lockStatus: 'inactive',
        lockTimer: 0,
      }
    });
    console.log("Returning to base");
  },
  
  // Add these properties and methods for drone damage
  droneHealth: 100,
  damageEffects: {
    smoke: false,
    communications: false,
    targeting: false
  },
  communicationsJammed: false,
  targetingJammed: false,
  
  setDroneDamage: ({ type, damage, duration }) => {
    const currentState = get();
    
    switch (type) {
      case 'hit':
        // Direct hit from anti-aircraft fire
        if (damage > 0) {
          const newHealth = Math.max(0, currentState.droneHealth - damage);
          
          set({
            droneHealth: newHealth,
            damageEffects: {
              ...currentState.damageEffects,
              smoke: newHealth < 70 // Show smoke when health below 70%
            }
          });
          
          // If drone destroyed
          if (newHealth <= 0) {
            console.log("Drone destroyed by anti-aircraft fire!");
            
            // Get current position for crash start
            const currentPosition = [...useUAVStore.getState().position];
            
            // Set to falling state with random rotation speeds
            set({ 
              missionState: 'crashed',
              damageEffects: {
                ...currentState.damageEffects,
                smoke: true,
                fire: true
              },
              crashData: {
                isFalling: true,
                crashStartPosition: [...currentPosition],
                groundLevel: 10, // Set to 10 to match our new minimum height
                fallSpeed: 0.5 + Math.random() * 1.5,
                rotationSpeed: [
                  (Math.random() - 0.5) * 0.1,
                  (Math.random() - 0.5) * 0.05,
                  (Math.random() - 0.5) * 0.15
                ]
              }
            });
          }
        }
        break;
        
      case 'communications':
        // Jam drone communications
        set({
          communicationsJammed: true,
          damageEffects: {
            ...currentState.damageEffects,
            communications: true
          }
        });
        
        // Restore after duration
        setTimeout(() => {
          set({
            communicationsJammed: false,
            damageEffects: {
              ...get().damageEffects,
              communications: false
            }
          });
        }, duration * 1000);
        break;
        
      case 'targeting':
        // Jam targeting systems
        set({
          targetingJammed: true,
          damageEffects: {
            ...currentState.damageEffects,
            targeting: true
          },
          // Reset targeting lock
          targeting: {
            ...currentState.targeting,
            lockStatus: 'inactive',
            lockTimer: 0
          }
        });
        
        // Restore after duration
        setTimeout(() => {
          set({
            targetingJammed: false,
            damageEffects: {
              ...get().damageEffects,
              targeting: false
            }
          });
        }, duration * 1000);
        break;
    }
  },
  
  // Add these properties to your store's initial state:

  manualTargetPosition: null,   // Target for manual movement
  manualMovementSpeed: 0.5,     // Speed for manual movement

  crashData: {
    isFalling: false,
    crashStartPosition: null,
    groundLevel: 0,
    fallSpeed: 0,
    rotationSpeed: [0, 0, 0]
  },

  // Add this method to your store:
  setManualTargetPosition: (targetPos) => {
    set({ 
      manualTargetPosition: targetPos,
      missionState: get().missionState === 'idle' ? 'manual' : get().missionState
    });
  },

  // Add a method to update the falling animation:
  updateCrashAnimation: (delta) => {
    const { crashData, missionState } = get();
    
    if (missionState !== 'crashed' || !crashData.isFalling) return;
    
    // Get current position
    const currentPos = useUAVStore.getState().position;
    const currentRot = useUAVStore.getState().rotation || [0, 0, 0];
    
    // If we've reached the ground
    if (currentPos[1] <= crashData.groundLevel) {
      set({
        crashData: {
          ...crashData,
          isFalling: false
        }
      });
      
      // Set final position at ground level
      useUAVStore.setState({ 
        position: [currentPos[0], crashData.groundLevel, currentPos[2]]
      });
      return;
    }
    
    // Calculate new position with gravity
    const newY = Math.max(crashData.groundLevel, currentPos[1] - (crashData.fallSpeed * delta));
    
    // Add some horizontal drift as it falls
    const driftX = (Math.sin(Date.now() / 500) * 0.05) * crashData.fallSpeed;
    const driftZ = (Math.cos(Date.now() / 700) * 0.05) * crashData.fallSpeed;
    
    // Update UAV position
    useUAVStore.setState({ 
      position: [
        currentPos[0] + driftX * delta,
        newY,
        currentPos[2] + driftZ * delta
      ],
      // Add tumbling rotation
      rotation: [
        currentRot[0] + crashData.rotationSpeed[0],
        currentRot[1] + crashData.rotationSpeed[1],
        currentRot[2] + crashData.rotationSpeed[2]
      ]
    });
  },

  // Add to your attackDroneStore.js if it's not already there
  setTargeting: (targeting) => {
    set({ targeting });
  },
}));