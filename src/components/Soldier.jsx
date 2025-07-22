import React, { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useUAVStore } from '../store/uavStore';
import { useAttackDroneStore } from '../store/attackDroneStore';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import DetectionEffect from './DetectionEffect';
import DestroyedTarget from './attack-drone/DestroyedTarget';
import FireEffect from './attack-drone/FireEffect';
import useThermalMaterial from './useThermalMaterial';


const SCAN_RADIUS = 20;

const Soldier = ({ position, id = 'soldier-1' }) => {
  const { scene } = useGLTF('/models/soldier/soldier.glb');
  const soldierRef = useRef();
  
  const { addTarget, position: uavPosition, targets } = useUAVStore();
  const { destroyedTargets } = useAttackDroneStore();
  const alreadyDetected = useRef(false);
  const [showEffect, setShowEffect] = useState(false);
  
  const currentPosition = useRef([...position]);
  const basePosition = useRef([...position]);
  
  const soldierId = useRef(`soldier-${position[0]}-${position[1]}-${position[2]}`);
  useThermalMaterial(scene, 'soldier');

  useEffect(() => {
    if (targets && targets.some(target => target.id === soldierId.current)) {
      alreadyDetected.current = true;
    }
  }, [targets]);

  useFrame(() => {
    if (!soldierRef.current) return;

    const isDestroyed = destroyedTargets.includes(id) || destroyedTargets.includes(soldierId.current);
    if (isDestroyed) return;

    // Animate soldier movement
    const time = Date.now() * 0.001;
    const speed = 0.3;
    const t = (Math.sin(time * speed) + 1) / 2;
    
    const startPos = [basePosition.current[0], basePosition.current[1], basePosition.current[2]];
    const endPos = [basePosition.current[0], basePosition.current[1], basePosition.current[2] - 2];
    
    currentPosition.current = [
      startPos[0] + (endPos[0] - startPos[0]) * t,
      startPos[1] + (endPos[1] - startPos[1]) * t,
      startPos[2] + (endPos[2] - startPos[2]) * t
    ];
    
    soldierRef.current.position.set(...currentPosition.current);
    soldierRef.current.rotation.y = t > 0.5 ? Math.PI : 0;

    // Detection logic
    if (!alreadyDetected.current) {
      const soldierWorldPosition = new THREE.Vector3(...currentPosition.current);
      const currentUAVPosition = new THREE.Vector3(...uavPosition);
      const distance = soldierWorldPosition.distanceTo(currentUAVPosition);

      if (distance < SCAN_RADIUS) {
        const isAlreadyMarked = targets.some(target => target.id === soldierId.current);

        if (!isAlreadyMarked) {
          const newTarget = {
            id: soldierId.current,
            position: currentPosition.current,
            type: 'soldier',
          };
          addTarget(newTarget);
          alreadyDetected.current = true;
          setShowEffect(true);
          setTimeout(() => setShowEffect(false), 3000);
        }
      }
    }
  });

  const isDestroyed = destroyedTargets.includes(id) || destroyedTargets.includes(soldierId.current);
  
  if (isDestroyed) {
    return (
      <>
        <DestroyedTarget position={currentPosition.current} targetType="soldier" />
        <FireEffect position={[currentPosition.current[0], currentPosition.current[1] + 0.5, currentPosition.current[2]]} intensity={0.6} />
      </>
    );
  }

  return (
    <>
      <primitive 
        ref={soldierRef}
        object={scene} 
        position={currentPosition.current}
        scale={[0.2, 0.2, 0.2]}
      />
      {showEffect && <DetectionEffect position={currentPosition.current} />}
    </>
  );
};

useGLTF.preload('/models/soldier/soldier.glb');
export default Soldier;