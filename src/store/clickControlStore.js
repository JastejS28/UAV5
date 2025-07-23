import { create } from 'zustand';

// Define the click control store
export const useClickControlStore = create((set) => ({
  clickMode: 'spawn', // Start in spawn mode instead of 'move'
  isSpawnMode: true,  // Add this flag for clarity
  spawnIndicator: null, // To store the visual indicator for spawn position
  clickIndicator: null, // To store the movement click indicator
  
  // Method to change the click mode
  setClickMode: (mode) => set({ clickMode: mode }),
  
  // Set spawn mode explicitly
  setSpawnMode: (enabled) => set({ 
    clickMode: enabled ? 'spawn' : 'move',
    isSpawnMode: enabled 
  }),
  
  // Toggle method for UI buttons
  toggleMoveMode: () => {
    set((state) => ({
      clickMode: state.clickMode === 'move' ? 'none' : 'move',
      isSpawnMode: false
    }));
  },
  
  // Add these methods for handling indicators
  setSpawnIndicator: (position) => set({ 
    spawnIndicator: { position, type: 'spawn' } 
  }),
  
  setClickIndicator: (position) => set({ 
    clickIndicator: { position, type: 'click' } 
  }),
  
  resetClickStates: () => set({
    clickIndicator: null
  })
}));