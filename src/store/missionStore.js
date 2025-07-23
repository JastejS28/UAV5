import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useMissionStore = create(
  subscribeWithSelector((set, get) => ({
    // Mission configuration
    missionType: null, // 'surveillance' | 'surveillance-attack'
    missionDuration: 60, // Total mission time in seconds (1 minute default)
    baseLocation: [-45, 30, -45], // Home base location
    currentTarget: null, // Currently detected target for hovering
    isHovering: false, // Whether UAV is hovering above target
    hoverStartTime: null, // When hovering started
    
    // Payload configuration
    selectedPayload: {
      bombs: 0,
      missiles: 0
    },
    
    // Mission status
    missionStatus: 'planning', // 'planning' | 'active' | 'completed' | 'failed'
    missionStartTime: null,
    missionEndTime: null,
    missionTimeRemaining: 60, // Countdown timer
    
    // Time calculations
    timeToTarget: 0, // Time to reach current target
    timeToBase: 0, // Time to return to base
    hoverTime: 0, // Time spent hovering above targets
    
    // Mission objectives tracking
    objectives: {
      surveillanceComplete: false,
      hoverTime: 0, // Time spent hovering above targets
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
            requiredSurveillanceTime: 30, // 30 seconds for surveillance only
            requiredTargetsDestroyed: 0
          }
        });
      } else if (type === 'surveillance-attack') {
        set({
          objectives: {
            ...get().objectives,
            requiredSurveillanceTime: 20, // 20 seconds surveillance
            requiredTargetsDestroyed: 3 // Destroy 3 targets
          }
        });
      }
    },
    
    setMissionDuration: (duration) => {
      set({ 
        missionDuration: duration,
        missionTimeRemaining: duration,
        objectives: {
          ...get().objectives,
          requiredSurveillanceTime: Math.min(duration * 0.5, get().objectives.requiredSurveillanceTime)
        }
      });
    },
    
    setCurrentTarget: (target) => {
      set({ currentTarget: target });
      if (target) {
        get().calculateTimeToTarget();
      }
    },
    
    setPayload: (payload) => {
      set({ selectedPayload: payload });
    },
    
    calculateTimeToTarget: () => {
      const { currentTarget, baseLocation } = get();
      if (!currentTarget) return;
      
      // Get current UAV position
      const currentPosition = useUAVStore.getState().position;
      
      // Calculate distance to target
      const distance = Math.sqrt(
        Math.pow(currentTarget.position[0] - currentPosition[0], 2) +
        Math.pow(currentTarget.position[1] - currentPosition[1], 2) +
        Math.pow(currentTarget.position[2] - currentPosition[2], 2)
      );
      
      // Calculate distance from target to base
      const distanceToBase = Math.sqrt(
        Math.pow(baseLocation[0] - currentTarget.position[0], 2) +
        Math.pow(baseLocation[1] - currentTarget.position[1], 2) +
        Math.pow(baseLocation[2] - currentTarget.position[2], 2)
      );
      
      // Assume UAV speed of 30 units per second
      const uavSpeed = 30;
      const timeToTarget = distance / uavSpeed;
      const timeToBase = distanceToBase / uavSpeed;
      
      set({ 
        timeToTarget: timeToTarget,
        timeToBase: timeToBase
      });
    },
    
    startHovering: () => {
      set({ 
        isHovering: true,
        hoverStartTime: Date.now()
      });
    },
    
    stopHovering: () => {
      const { hoverStartTime, hoverTime } = get();
      if (hoverStartTime) {
        const additionalHoverTime = (Date.now() - hoverStartTime) / 1000;
        set({ 
          isHovering: false,
          hoverStartTime: null,
          hoverTime: hoverTime + additionalHoverTime,
          objectives: {
            ...get().objectives,
            hoverTime: hoverTime + additionalHoverTime
          }
        });
      }
    },
    
    startMission: () => {
      set({
        missionStatus: 'active',
        missionStartTime: Date.now(),
        missionTimeRemaining: get().missionDuration,
        objectives: {
          ...get().objectives,
          surveillanceComplete: false,
          hoverTime: 0,
          targetsDestroyed: 0,
          detectionEvents: 0
        },
        hoverTime: 0
      });
      
      // Start mission timer
      get().startMissionTimer();
    },
    
    startMissionTimer: () => {
      const timer = setInterval(() => {
        const { missionTimeRemaining, missionStatus } = get();
        
        if (missionStatus !== 'active') {
          clearInterval(timer);
          return;
        }
        
        const newTimeRemaining = Math.max(0, missionTimeRemaining - 1);
        set({ missionTimeRemaining: newTimeRemaining });
        
        // Auto-complete mission if time runs out
        if (newTimeRemaining <= 0) {
          clearInterval(timer);
          const success = get().checkMissionSuccess();
          get().completeMission(success);
        }
      }, 1000);
    },
    
    completeMission: (success = true) => {
      // Stop hovering if active
      if (get().isHovering) {
        get().stopHovering();
      }
      
      set({
        missionStatus: success ? 'completed' : 'failed',
        missionEndTime: Date.now()
      });
    },
    
    updateHoverTime: (deltaTime) => {
      const current = get().objectives;
      const newTime = current.hoverTime + deltaTime;
      
      set({
        objectives: {
          ...current,
          hoverTime: newTime,
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
    
    checkMissionSuccess: () => {
      const { objectives, missionType } = get();
      
      if (missionType === 'surveillance') {
        return objectives.surveillanceComplete && objectives.detectionEvents <= objectives.maxAllowedDetections;
      } else if (missionType === 'surveillance-attack') {
        return objectives.surveillanceComplete && 
               objectives.targetsDestroyed >= objectives.requiredTargetsDestroyed &&
               objectives.detectionEvents <= objectives.maxAllowedDetections;
      }
      
      return false;
    },
    
    resetMission: () => {
      set({
        missionType: null,
        missionDuration: 60,
        currentTarget: null,
        isHovering: false,
        hoverStartTime: null,
        selectedPayload: { bombs: 0, missiles: 0 },
        missionStatus: 'planning',
        missionStartTime: null,
        missionEndTime: null,
        missionTimeRemaining: 60,
        timeToTarget: 0,
        timeToBase: 0,
        hoverTime: 0,
        objectives: {
          surveillanceComplete: false,
          hoverTime: 0,
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
      const { missionType, missionDuration, selectedPayload } = get();
      
      if (!missionType) return false;
      if (missionDuration <= 0) return false;
      
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