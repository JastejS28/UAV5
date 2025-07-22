import { create } from 'zustand';

export const useClickControlStore = create((set, get) => ({
  // Click modes
  isClickToMoveEnabled: false,
  isSpawnMode: false,
  
  // Visual indicators
  clickIndicator: null, // {position: [x, y, z], timestamp: Date.now()}
  spawnIndicator: null,
  
  // Terrain interaction
  lastClickedPosition: null,
  isProcessingClick: false,
  
  // Actions
  setClickToMoveEnabled: (enabled) => {
    console.log(`Click-to-Move ${enabled ? 'ENABLED' : 'DISABLED'}`);
    set({ isClickToMoveEnabled: enabled });
  },
  
  setSpawnMode: (enabled) => {
    console.log(`Spawn Mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    set({ 
      isSpawnMode: enabled,
      isClickToMoveEnabled: false // Disable movement when spawning
    });
  },
  
  setClickIndicator: (position) => {
    if (position) {
      console.log('Click indicator set at:', position);
      set({ 
        clickIndicator: { 
          position, 
          timestamp: Date.now() 
        }
      });
      
      // Auto-remove indicator after 3 seconds
      setTimeout(() => {
        const current = get().clickIndicator;
        if (current && current.position === position) {
          set({ clickIndicator: null });
        }
      }, 3000);
    } else {
      set({ clickIndicator: null });
    }
  },
  
  setSpawnIndicator: (position) => {
    set({ spawnIndicator: position ? { position, timestamp: Date.now() } : null });
  },
  
  setLastClickedPosition: (position) => {
    set({ lastClickedPosition: position });
  },
  
  setProcessingClick: (processing) => {
    set({ isProcessingClick: processing });
  },
  
  // Reset all states
  resetClickStates: () => {
    set({
      isClickToMoveEnabled: false,
      isSpawnMode: false,
      clickIndicator: null,
      spawnIndicator: null,
      lastClickedPosition: null,
      isProcessingClick: false
    });
  }
}));