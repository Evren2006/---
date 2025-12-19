import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { AppState } from '../types';
import { getChaosPos, getRandomTreeSurfacePos } from '../constants';

interface PhotoCloudProps {
  photos: string[];
  appState: AppState;
  focusedIndex: number; // Which photo is currently "Grabbed"
}

const PhotoCloud: React.FC<PhotoCloudProps> = ({ photos, appState, focusedIndex }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Reusable temporary objects to avoid GC
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);
  const tempEuler = useMemo(() => new THREE.Euler(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  
  // Calculate fixed positions for each photo ONCE when photos change
  const layout = useMemo(() => {
    return photos.map((_, i) => {
      // Use RANDOM surface position
      const { pos: treePos, rot: treeRot } = getRandomTreeSurfacePos();

      return {
        id: i,
        chaosPos: getChaosPos(),
        targetPos: treePos,
        // Convert Euler to Quaternion for smoother interpolation later
        rotation: treeRot, 
        baseQuat: new THREE.Quaternion().setFromEuler(treeRot),
        // Add slight random sway speed for each photo
        swaySpeed: Math.random() * 0.5 + 0.5
      };
    });
  }, [photos]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const camera = state.camera;

    // Pre-calculate parent inverse world quaternion to handle coordinate space conversion
    // This allows us to "lock" a child to the camera rotation even if the parent group is rotating
    const parentWorldQuat = new THREE.Quaternion();
    groupRef.current.getWorldQuaternion(parentWorldQuat);
    const parentWorldQuatInv = parentWorldQuat.clone().invert();

    // Iterate through children (Images)
    groupRef.current.children.forEach((child, i) => {
      const data = layout[i];
      if (!data) return;

      let targetPosition = new THREE.Vector3();
      let targetQuaternion = new THREE.Quaternion();
      let targetScale = 1.0;

      const isFocused = i === focusedIndex;

      if (appState === AppState.PHOTO_VIEW) {
        if (isFocused) {
          // --- CENTER STAGE MODE (LOCKED TO SCREEN) ---
          
          // 1. Calculate Target Position in WORLD space (In front of camera)
          // 15 units in front of the camera ensures it clears the tree geometry
          tempVec.set(0, 0, -15).applyQuaternion(camera.quaternion).add(camera.position);
          
          // 2. Convert WORLD position to LOCAL position within the group
          // This accounts for the group's rotation (Chaos mode) or position
          groupRef.current!.worldToLocal(tempVec); 
          targetPosition.copy(tempVec);

          // 3. Calculate Target Rotation
          // We want the photo to be parallel to the camera plane.
          // Target World Rotation = Camera World Rotation.
          // Target Local Rotation = ParentInverse * CameraWorld
          targetQuaternion.copy(camera.quaternion).premultiply(parentWorldQuatInv);
          
          // Make it BIG
          targetScale = 6.0; 
          
          // Subtle hover effect relative to camera up?
          // We can add local y offset, but worldToLocal logic handles it best if we just strictly follow camera.
          
        } else {
          // --- BACKGROUND MODE ---
          // Other photos fade back
          targetPosition.copy(data.chaosPos);
          targetPosition.z -= 10; // Push back
          
          // Spin slowly
          tempEuler.set(data.rotation.x + time * 0.1, data.rotation.y, 0);
          targetQuaternion.setFromEuler(tempEuler);
          
          targetScale = 0.5; // Shrink others
        }
      } else if (appState === AppState.FORMED) {
        // --- TREE MODE ---
        targetPosition.copy(data.targetPos);
        
        // Base rotation from tree layout
        targetQuaternion.copy(data.baseQuat);
        
        // Add gentle swaying
        const swayY = Math.sin(time * data.swaySpeed + i) * 0.05;
        const swayRotZ = Math.cos(time * 0.5 + i) * 0.05;
        
        targetPosition.y += swayY;
        
        // Compose sway rotation onto base rotation
        tempQuat.setFromEuler(new THREE.Euler(0, 0, swayRotZ));
        targetQuaternion.multiply(tempQuat);

        targetScale = 1.2; 

      } else {
        // --- CHAOS MODE ---
        targetPosition.copy(data.chaosPos);
        targetPosition.y += Math.sin(time + i) * 0.02;
        
        // Simple spin
        tempEuler.set(0, time * 0.2 + i, 0);
        targetQuaternion.setFromEuler(tempEuler);
        
        targetScale = 1.5;
      }

      // LERP for smooth transition
      const lerpSpeed = appState === AppState.PHOTO_VIEW ? 0.1 : 0.04;
      
      // Position Lerp
      child.position.lerp(targetPosition, lerpSpeed);
      
      // Rotation Slerp (Spherical Linear Interpolation) for smooth 3D rotation
      child.quaternion.slerp(targetQuaternion, lerpSpeed);

      // Scale Lerp
      tempScale.setScalar(targetScale);
      child.scale.lerp(tempScale, lerpSpeed);
    });
  });

  if (photos.length === 0) return null;

  return (
    <group ref={groupRef}>
      {photos.map((url, i) => (
        <Image 
          key={i} 
          url={url} 
          transparent 
          side={THREE.DoubleSide}
          position={[0,0,0]} // Controlled by useFrame
        />
      ))}
    </group>
  );
};

export default PhotoCloud;