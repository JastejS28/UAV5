import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';

// Create a flag outside the store to break potential circular updates
let isUpdating = false;

// Create UAV store with the subscribeWithSelector middleware
export const useUAVStore = create(
  subscribeWithSelector(
    (set, get) => ({
      // UAV state
      position: [0, 50, 0],
      rotation: [0, 0, 0],
      targetPosition: null,
      speed: 0.5,
      isCrashed: false,
      crashReason: '',
      isThermalVision: false,
      targets: [],
      
      // Actions
      setPosition: (newPosition) => {
        // Skip if currently processing an update to break circular dependencies
        if (isUpdating) return;
        
        // Check if position actually changed
        const currentPos = get().position;
        if (currentPos[0] === newPosition[0] && 
            currentPos[1] === newPosition[1] && 
            currentPos[2] === newPosition[2]) {
          return; // Skip if unchanged
        }
        
        // Set flag, update state, clear flag
        try {
          isUpdating = true;
          set({ position: newPosition });
        } finally {
          isUpdating = false;
        }
      },
      
      setRotation: (newRotation) => {
        // Skip if currently processing an update
        if (isUpdating) return;
        
        // Only update if changed
        const currentRot = get().rotation;
        if (currentRot[0] === newRotation[0] && 
            currentRot[1] === newRotation[1] && 
            currentRot[2] === newRotation[2]) {
          return; 
        }
        
        try {
          isUpdating = true;
          set({ rotation: newRotation });
        } finally {
          isUpdating = false;
        }
      },
      
      setTargetPosition: (newTarget) => {
        if (isUpdating) return;
        
        // Handle null case
        if (newTarget === null) {
          if (get().targetPosition === null) return;
          set({ targetPosition: null });
          return;
        }
        
        // Compare current and new target
        const current = get().targetPosition;
        if (current && 
            current[0] === newTarget[0] && 
            current[1] === newTarget[1] && 
            current[2] === newTarget[2]) {
          return;
        }
        
        set({ targetPosition: newTarget });
      },
      
      setSpeed: (newSpeed) => {
        if (get().speed === newSpeed) return;
        set({ speed: newSpeed });
      },
      
      setCrashed: (crashed, reason = '') => {
        if (get().isCrashed === crashed) return;
        
        try {
          isUpdating = true;
          set({ 
            isCrashed: crashed, 
            crashReason: reason,
            ...(crashed ? { targetPosition: null } : {})
          });
        } finally {
          isUpdating = false;
        }
      },
      
      setThermalVision: (enabled) => {
        if (get().isThermalVision === enabled) return;
        set({ isThermalVision: enabled });
      },
      
      addTarget: (target) => {
        const currentTargets = get().targets;
        const exists = currentTargets.some(t => t.id === target.id);
        if (!exists) {
          set({ targets: [...currentTargets, target] });
        }
      },
      
      removeTarget: (targetId) => {
        const currentTargets = get().targets;
        set({ targets: currentTargets.filter(t => t.id !== targetId) });
      },
      
      // This method handles movement logic in one place
      updatePosition: (delta = 0.016) => {
        // Don't update if we're in the middle of another update
        if (isUpdating) return;
        
        const { position, targetPosition, speed, isCrashed } = get();
        
        // Skip if crashed or no target
        if (isCrashed || !targetPosition) return;
        
        try {
          isUpdating = true;
          
          // Calculate movement
          const currentPos = new THREE.Vector3(...position);
          const targetPos = new THREE.Vector3(...targetPosition);
          const direction = new THREE.Vector3()
            .subVectors(targetPos, currentPos)
            .normalize();
          
          // Distance to target
          const distance = currentPos.distanceTo(targetPos);
          
          // Only move if not very close to target
          if (distance > 0.5) {
            // Step size with delta time for consistent movement speed
            const stepSize = Math.min(speed * delta * 60, distance);
            
            // New position
            const newPos = new THREE.Vector3().copy(currentPos);
            newPos.addScaledVector(direction, stepSize);
            
            // Update state directly to avoid recursive updates
            set({ position: [newPos.x, newPos.y, newPos.z] });
            
            // Update rotation if moving
            if (Math.abs(direction.x) > 0.01 || Math.abs(direction.z) > 0.01) {
              const angle = Math.atan2(direction.x, direction.z);
              if (Math.abs(get().rotation[1] - angle) > 0.01) {
                set({ rotation: [0, angle, 0] });
              }
            }
          } 
          else {
            // Snap to target and clear it
            set({ 
              position: [...targetPosition], 
              targetPosition: null,
              flightPath: [] // Clear flight path when target reached
            });
          }
        } finally {
          isUpdating = false;
        }
      }
    })
  )
);

// Clean function for external updates
export const updateUAVPosition = () => {
  useUAVStore.getState().updatePosition();
};

