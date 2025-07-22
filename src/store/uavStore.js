import { create } from 'zustand';

export const useUAVStore = create((set, get) => ({
  // UAV state - Start at safe altitude
  position: [-45, 35, -40],
  rotation: [0, 0, 0],
  speed: 0,
  altitude: 0, 
  lateralMovement: 0,
  
  // Target position for smooth movement
  targetPosition: null,
  
  // Simple crash status
  isCrashed: false,
  crashMessage: '',
  
  // Environment state
  isDayTime: true,
  isThermalVision: false,
  
  // Target data
  targets: [],
  
  // UAV functions
  setSpeed: (newSpeed) => set({ speed: newSpeed }),
  setAltitude: (newAltitude) => set({ altitude: newAltitude }),
  setLateralMovement: (newLateralMovement) => set({ lateralMovement: newLateralMovement }),
  setRotation: (newRotation) => {
    const current = get();
    if (JSON.stringify(current.rotation) !== JSON.stringify(newRotation)) {
      set({ rotation: newRotation });
    }
  },
  
  setPosition: (newPosition) => {
    const current = get();
    
    const positionChanged = 
      Math.abs(current.position[0] - newPosition[0]) > 0.01 ||
      Math.abs(current.position[1] - newPosition[1]) > 0.01 ||
      Math.abs(current.position[2] - newPosition[2]) > 0.01;
    
    if (!positionChanged) return;
    
    set({ position: newPosition });
  },
  
  setTargetPosition: (newTarget) => {
    const current = get();
    if (current.isCrashed) {
      return;
    }
    
    if (JSON.stringify(current.targetPosition) !== JSON.stringify(newTarget)) {
      set({ targetPosition: newTarget });
    }
  },
  
  // Crash functions - once crashed, no recovery
  setCrashed: (crashed, message = '') => {
    set({ 
      isCrashed: crashed, 
      crashMessage: message,
      targetPosition: null
    });
  },
  
  // Environment functions
  toggleDayTime: () => set((state) => ({ isDayTime: !state.isDayTime })),
  setThermalVision: (value) => set({ isThermalVision: value }),
  
  // Target functions
  addTarget: (newTarget) => {
    const current = get();
    const exists = current.targets.some(target => target.id === newTarget.id);
    if (!exists) {
      set(state => ({
        targets: [...state.targets, newTarget]
      }));
    }
  },
}));

