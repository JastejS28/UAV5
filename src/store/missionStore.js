import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useMissionStore = create(
  subscribeWithSelector((set, get) => ({
    // Mission configuration
    missionType: null, // 'surveillance' | 'surveillance-attack'
    missionDuration: 300, // Total mission time in seconds (5 minutes default)
    targetArea: null, // Target coordinates [x, y, z]
    
    // Payload configuration
    selectedPayload: {
      bombs: 0,
      missiles: 0
    },
    
    // Mission status
    missionStatus: 'planning', // 'planning' | 'active' | 'completed' | 'failed'
    missionStartTime: null,
    missionEndTime: null,
    
    // Time calculations
    travelTime: 0, // Calculated travel time to target and back
    operationalTime: 0, // Time available for operations at target
    
    // Mission objectives tracking
    objectives: {
      surveillanceComplete: false,
      surveillanceTime: 0, // Time spent in surveillance
      requiredSurveillanceTime: 60, // Required surveillance time in seconds
      targetsDestroyed: 0,
      requiredTargetsDestroyed: 0,
      detectionEvents: 0,
      maxAllowedDetections: 2
    },
    
    // Actions
    setMissionType: (type) => {
      set({ missionType: type });
      
      // Set default objectives based on mission type
      if (type === 'surveillance') {
        set({
          objectives: {
            ...get().objectives,
            requiredSurveillanceTime: 120, // 2 minutes for surveillance only
            requiredTargetsDestroyed: 0
          }
        });
      } else if (type === 'surveillance-attack') {
        set({
          objectives: {
            ...get().objectives,
            requiredSurveillanceTime: 60, // 1 minute surveillance
            requiredTargetsDestroyed: 3 // Destroy 3 targets
          }
        });
      }
    },
    
    setMissionDuration: (duration) => {
      set({ missionDuration: duration });
      get().calculateOperationalTime();
    },
    
    setTargetArea: (coordinates) => {
      set({ targetArea: coordinates });
      get().calculateTravelTime();
    },
    
    setPayload: (payload) => {
      set({ selectedPayload: payload });
    },
    
    calculateTravelTime: () => {
      const { targetArea } = get();
      if (!targetArea) return;
      
      // Assume UAV starts at [0, 50, 0] (spawn position)
      const startPosition = [0, 50, 0];
      const distance = Math.sqrt(
        Math.pow(targetArea[0] - startPosition[0], 2) +
        Math.pow(targetArea[1] - startPosition[1], 2) +
        Math.pow(targetArea[2] - startPosition[2], 2)
      );
      
      // Assume UAV speed of 20 units per second
      const uavSpeed = 20;
      const oneWayTime = distance / uavSpeed;
      const totalTravelTime = oneWayTime * 2; // Round trip
      
      set({ travelTime: totalTravelTime });
      get().calculateOperationalTime();
    },
    
    calculateOperationalTime: () => {
      const { missionDuration, travelTime } = get();
      const operational = Math.max(0, missionDuration - travelTime);
      set({ operationalTime: operational });
    },
    
    startMission: () => {
      set({
        missionStatus: 'active',
        missionStartTime: Date.now(),
        objectives: {
          ...get().objectives,
          surveillanceComplete: false,
          surveillanceTime: 0,
          targetsDestroyed: 0,
          detectionEvents: 0
        }
      });
    },
    
    completeMission: (success = true) => {
      set({
        missionStatus: success ? 'completed' : 'failed',
        missionEndTime: Date.now()
      });
    },
    
    updateSurveillanceTime: (deltaTime) => {
      const current = get().objectives;
      const newTime = current.surveillanceTime + deltaTime;
      
      set({
        objectives: {
          ...current,
          surveillanceTime: newTime,
          surveillanceComplete: newTime >= current.requiredSurveillanceTime
        }
      });
    },
    
    incrementTargetsDestroyed: () => {
      const current = get().objectives;
      set({
        objectives: {
          ...current,
          targetsDestroyed: current.targetsDestroyed + 1
        }
      });
    },
    
    incrementDetectionEvents: () => {
      const current = get().objectives;
      const newCount = current.detectionEvents + 1;
      
      set({
        objectives: {
          ...current,
          detectionEvents: newCount
        }
      });
      
      // Auto-fail mission if too many detections
      if (newCount > current.maxAllowedDetections) {
        get().completeMission(false);
      }
    },
    
    resetMission: () => {
      set({
        missionType: null,
        missionDuration: 300,
        targetArea: null,
        selectedPayload: { bombs: 0, missiles: 0 },
        missionStatus: 'planning',
        missionStartTime: null,
        missionEndTime: null,
        travelTime: 0,
        operationalTime: 0,
        objectives: {
          surveillanceComplete: false,
          surveillanceTime: 0,
          requiredSurveillanceTime: 60,
          targetsDestroyed: 0,
          requiredTargetsDestroyed: 0,
          detectionEvents: 0,
          maxAllowedDetections: 2
        }
      });
    },
    
    // Validation
    isMissionValid: () => {
      const { missionType, targetArea, operationalTime, selectedPayload } = get();
      
      if (!missionType || !targetArea) return false;
      if (operationalTime <= 0) return false;
      
      // For attack missions, ensure payload is selected
      if (missionType === 'surveillance-attack') {
        if (selectedPayload.bombs === 0 && selectedPayload.missiles === 0) {
          return false;
        }
      }
      
      return true;
    }
  }))
);