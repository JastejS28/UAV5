// components/anti-drone/AntiDroneSystem.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useUAVStore } from '../../store/uavStore';
import { useAttackDroneStore } from '../../store/attackDroneStore';
import { useMissionStore } from '../../store/missionStore';
import DefenseRadar from './DefenseRadar';
import AntiAircraftGun from './AntiAircraftGun';
import DefenseProjectile from './DefenseProjectile';
import DefenseBomb from './DefenseBomb';
import * as THREE from 'three';

const RADAR_RADIUS = 50; // Detection range
const MIN_SAFE_ALTITUDE = 20; // Below this height, UAV is undetectable

const AntiDroneSystem = ({ position, baseId }) => {
  const { position: uavPosition, droneType } = useUAVStore();
  const { missionState, setDroneDamage } = useAttackDroneStore();
  const { incrementDetectionEvents, missionStatus } = useMissionStore();
  
  const [isUavDetected, setIsUavDetected] = useState(false);
  const [isDefenseActive, setIsDefenseActive] = useState(false);
  const [targetPosition, setTargetPosition] = useState(null);
  const [projectiles, setProjectiles] = useState([]);
  const [bombs, setBombs] = useState([]);
  const lastFireTime = useRef(Date.now()); // Initialize to prevent immediate fire on mount
  const lastBombTime = useRef(Date.now()); // Initialize to prevent immediate fire on mount
  const defenseSystemActive = useRef(true);
  const lastDetectionState = useRef(false);
  
  // Check for UAV detection
  useEffect(() => {
    if (!uavPosition || droneType !== 'attack') {
      if (isDefenseActive) { // If UAV is lost or changes type, deactivate
        console.log("[AntiDroneSystem] UAV lost or no longer attack type. Deactivating defense.");
        setIsDefenseActive(false);
        setTargetPosition(null);
        setIsUavDetected(false);
      }
      return;
    }
    
    const basePos = new THREE.Vector3(...position);
    const uavPos = new THREE.Vector3(...uavPosition);
    const distance = basePos.distanceTo(uavPos);
    const uavAltitude = uavPos.y;
    
    const isDetected = distance < RADAR_RADIUS && uavAltitude > MIN_SAFE_ALTITUDE;
    
    if (isDetected && !isUavDetected) { // UAV just got detected
        console.log("[AntiDroneSystem] UAV DETECTED at", uavPosition, "Distance:", distance.toFixed(2));
        
        // Increment detection events in mission store
        if (missionStatus === 'active') {
          incrementDetectionEvents();
        }
    } else if (!isDetected && isUavDetected) { // UAV just got lost
        console.log("[AntiDroneSystem] UAV LOST. Was at", targetPosition);
    }
    setIsUavDetected(isDetected);
    
    // Track detection state changes for mission
    if (isDetected !== lastDetectionState.current) {
      lastDetectionState.current = isDetected;
    }
    
    if (isDetected && defenseSystemActive.current) {
      if (!isDefenseActive) {
        console.log("[AntiDroneSystem] Activating defense. Target:", uavPosition);
      }
      setIsDefenseActive(true);
      setTargetPosition([...uavPosition]);
    } else if (!isDetected && isDefenseActive) {
      console.log("[AntiDroneSystem] Deactivating defense due to loss of detection.");
      setIsDefenseActive(false);
      setTargetPosition(null);
    }
  }, [uavPosition, position, droneType, isDefenseActive, isUavDetected, targetPosition]);

  // Generate bombs and projectiles when defense is active
  useEffect(() => {
    if (!isDefenseActive || !targetPosition) {
      // console.log("[AntiDroneSystem] Bomb/Projectile useEffect: SKIPPING - Defense not active or no target.");
      return;
    }
    console.log("[AntiDroneSystem] Bomb/Projectile useEffect: ACTIVE. Target:", targetPosition);

    const intervalId = setInterval(() => {
      const now = Date.now();
      
      // Fire projectile every 3 seconds
      if (now - lastFireTime.current > 3000) {
        lastFireTime.current = now;
        const newProjectile = {
          id: `projectile-${now}`,
          startPosition: [...position], 
          targetPosition: [...targetPosition] // Use the current targetPosition
        };
        setProjectiles(prev => [...prev, newProjectile]);
        console.log("[AntiDroneSystem] Firing projectile:", newProjectile.id, "Target:", newProjectile.targetPosition);
      }
      
      // Drop bomb every 1.5 seconds for testing
      if (now - lastBombTime.current > 1500) { // REDUCED INTERVAL
        lastBombTime.current = now;
        
        const currentTarget = get().targetPosition; // Get latest targetPosition if it updated
        if (!currentTarget) {
            console.log("[AntiDroneSystem] Bomb drop skipped: targetPosition is null.");
            return;
        }

        const bombDropPosition = [
          currentTarget[0], 
          currentTarget[1] + 80, 
          currentTarget[2]
        ];
        const newBomb = {
          id: `bomb-${now}`,
          startPosition: bombDropPosition,
          targetPosition: [...currentTarget]
        };
        
        console.log("🔴 [AntiDroneSystem] DROPPING BOMB:", {
          id: newBomb.id,
          from: bombDropPosition,
          to: newBomb.targetPosition,
          bombsInStateBefore: bombs.length // Log current bombs length before update
        });
        
        setBombs(prevBombs => {
          const updatedBombs = [...prevBombs, newBomb];
          console.log("   💣 [AntiDroneSystem] Bombs state updated. New count:", updatedBombs.length);
          return updatedBombs;
        });
      }
    }, 500); // Check conditions every 500ms

    return () => {
      console.log("[AntiDroneSystem] Bomb/Projectile useEffect: Cleanup interval.");
      clearInterval(intervalId);
    };
  // Ensure dependencies are correct for re-running this effect if targetPosition changes
  // or defense status changes. `position` is the defense system's own position.
  }, [isDefenseActive, targetPosition, position, bombs]); // Added bombs to dependency to see if it helps with logging

  // Clean up old projectiles and bombs
  useEffect(() => {
    const cleanupIntervalId = setInterval(() => {
      // console.log("[AntiDroneSystem] Cleanup Effect: Current bombs:", bombs.length, "Current projectiles:", projectiles.length);
      
      setProjectiles(prev => prev.filter(p => {
        const projectileTime = parseInt(p.id.split('-').pop());
        return Date.now() - projectileTime < 5000;
      }));
      
      setBombs(prev => prev.filter(b => {
        const bombTime = parseInt(b.id.split('-').pop());
        return Date.now() - bombTime < 10000; // Keep bombs for 10 seconds
      }));
    }, 5000);
    
    return () => {
      console.log("[AntiDroneSystem] Cleanup Effect: Clearing interval.");
      clearInterval(cleanupIntervalId);
    };
  }, []); // This effect should run once on mount and clean up on unmount.
           // Dependencies `bombs` and `projectiles` would cause it to re-run too often.

  // Handle projectile completion
  const handleProjectileComplete = (id) => {
    console.log("[AntiDroneSystem] Projectile completed:", id);
    setProjectiles(prev => prev.filter(p => p.id !== id));
  };
  
  // Handle bomb completion
  const handleBombComplete = (id) => {
    console.log("[AntiDroneSystem] Bomb explosion completed:", id);
    setBombs(prev => prev.filter(b => b.id !== id));
  };
  
  return (
    <group position={position}>
      {/* Base defense radar visualization */}
      <DefenseRadar 
        radius={RADAR_RADIUS} 
        isActive={defenseSystemActive.current}
        isTargetDetected={isUavDetected}
      />
      
      {/* Anti-aircraft gun - only show when UAV detected */}
      {isDefenseActive && targetPosition && (
        <AntiAircraftGun 
          targetPosition={targetPosition} 
          onFire={() => {}}
        />
      )}
      
      {/* Projectiles in flight - give world coordinates */}
      {projectiles.map(projectile => (
        <DefenseProjectile
          key={projectile.id}
          startPosition={[
            position[0], 
            position[1] + 2,  
            position[2]
          ]}
          targetPosition={projectile.targetPosition}
          onComplete={() => handleProjectileComplete(projectile.id)}
        />
      ))}
      
      {/* Bombs dropping - ensure they're rendered */}
      {bombs.map(bomb => {
        // This console.log will confirm if the map function is being called
        // console.log("[AntiDroneSystem] Rendering DefenseBomb component for bomb ID:", bomb.id); 
        return (
          <DefenseBomb
            key={bomb.id}
            startPosition={bomb.startPosition}
            targetPosition={bomb.targetPosition}
            onComplete={() => handleBombComplete(bomb.id)}
          />
        );
      })}
    </group>
  );
};

export default AntiDroneSystem;