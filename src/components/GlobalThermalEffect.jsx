import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useUAVStore } from '../store/uavStore';
import { thermalMaterial, updateThermalMaterialTime } from '../materials/thermalMaterial';

const GlobalThermalEffect = () => {
  const { scene } = useThree();
  const { isThermalVision } = useUAVStore();
  const originalMaterials = useRef(new Map());

  useEffect(() => {
    // This effect runs whenever you toggle thermal vision
    scene.traverse((object) => {
      if (object.isMesh) {
        if (isThermalVision) {
          // If turning ON: store the original material and apply the thermal one
          if (!originalMaterials.current.has(object.uuid)) {
            originalMaterials.current.set(object.uuid, object.material);
          }
          object.material = thermalMaterial;
        } else {
          // If turning OFF: restore the original material
          if (originalMaterials.current.has(object.uuid)) {
            object.material = originalMaterials.current.get(object.uuid);
          }
        }
      }
    });
  }, [isThermalVision, scene]);

  // This updates the noise animation on the thermal material every frame
  useFrame((state, delta) => {
    if (isThermalVision) {
      updateThermalMaterialTime(delta);
    }
  });

  return null; // This component only manages logic, it doesn't render anything
};

export default GlobalThermalEffect;