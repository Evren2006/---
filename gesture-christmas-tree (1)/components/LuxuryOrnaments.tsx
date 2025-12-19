import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateOrnamentData, TREE_HEIGHT } from '../constants';
import { AppState, DualPositionData } from '../types';

interface Props {
  appState: AppState;
}

// --- The Star Component ---
const StarTopper: React.FC<{ appState: AppState }> = ({ appState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create a 5-pointed star shape
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.5;

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = (i / (points * 2)) * Math.PI * 2 - (Math.PI / 2); // Start at top
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 2,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // Target Position logic
    const treeTopY = (TREE_HEIGHT / 2) + 0.5;
    const chaosPos = new THREE.Vector3(0, 20, 0); // Float high in chaos
    const formedPos = new THREE.Vector3(0, treeTopY, 0);
    const photoPos = new THREE.Vector3(0, 25, 0); // Get out of the way

    let target = chaosPos;
    if (appState === AppState.FORMED) target = formedPos;
    if (appState === AppState.PHOTO_VIEW) target = photoPos;

    // Smooth movement
    meshRef.current.position.lerp(target, 0.05);

    // Animation
    // Spin
    meshRef.current.rotation.y = time * 0.5;
    
    // Bob / Float
    if (appState === AppState.FORMED) {
        meshRef.current.position.y += Math.sin(time * 2) * 0.02;
    }

    // Pulse Scale
    const baseScale = 1.0;
    const pulse = Math.sin(time * 3) * 0.1 + 1;
    meshRef.current.scale.setScalar(baseScale * pulse);
  });

  return (
    <mesh ref={meshRef} geometry={starGeometry}>
      {/* Center the geometry so rotation works nicely */}
      <meshStandardMaterial 
        color="#FFFACD"
        emissive="#FFD700"
        emissiveIntensity={2.0} // High glow for the star
        metalness={0.9}
        roughness={0.1}
        toneMapped={false} // Let it blow out the bloom
      />
    </mesh>
  );
};


// --- The Ornaments System ---
const LuxuryOrnaments: React.FC<Props> = ({ appState }) => {
  const spheresRef = useRef<THREE.InstancedMesh>(null);
  const boxesRef = useRef<THREE.InstancedMesh>(null);

  // Component-scoped temp objects
  const tempObj = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  const { spheres, boxes } = useMemo(() => {
    const raw = generateOrnamentData(350);
    return {
      spheres: raw.filter(d => d.type === 'sphere'),
      boxes: raw.filter(d => d.type === 'box')
    };
  }, []);

  const updateMesh = (mesh: THREE.InstancedMesh, data: DualPositionData[], delta: number, time: number) => {
    data.forEach((d, i) => {
      let target = d.chaosPos;
      
      if (appState === AppState.FORMED) {
        target = d.targetPos;
      } else if (appState === AppState.PHOTO_VIEW) {
        target = d.chaosPos; 
      }

      const isFormed = appState === AppState.FORMED;
      const speed = isFormed ? 0.04 : 0.02;

      mesh.getMatrixAt(i, tempObj.matrix);
      tempObj.matrix.decompose(tempObj.position, tempObj.quaternion, tempObj.scale);

      // Position interpolation
      tempObj.position.lerp(target, speed * d.speed);
      
      // Rotate
      tempObj.rotation.x += delta * 0.3;
      tempObj.rotation.y += delta * 0.3;
      
      // Scale logic
      const targetScale = isFormed ? d.scale : d.scale * 1.5;
      
      tempVec.setScalar(targetScale);
      tempObj.scale.lerp(tempVec, 0.1);

      tempObj.updateMatrix();
      mesh.setMatrixAt(i, tempObj.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => {
    if (spheresRef.current) {
      spheres.forEach((d, i) => spheresRef.current!.setColorAt(i, d.color));
      spheresRef.current.instanceColor!.needsUpdate = true;
    }
    if (boxesRef.current) {
      boxes.forEach((d, i) => boxesRef.current!.setColorAt(i, d.color));
      boxesRef.current.instanceColor!.needsUpdate = true;
    }
  }, [spheres, boxes]);

  useFrame((state, delta) => {
    if (spheresRef.current) updateMesh(spheresRef.current, spheres, delta, state.clock.elapsedTime);
    if (boxesRef.current) updateMesh(boxesRef.current, boxes, delta, state.clock.elapsedTime);
  });

  return (
    <group>
      <StarTopper appState={appState} />

      <instancedMesh ref={spheresRef} args={[undefined, undefined, spheres.length]}>
        {/* Icosahedron catches light better than Sphere */}
        <icosahedronGeometry args={[0.8, 2]} /> 
        <meshStandardMaterial 
            metalness={1.0} 
            roughness={0.1} 
            emissive="#FFD700"
            emissiveIntensity={0.6} // Glowing Gold
            envMapIntensity={2.5} 
        />
      </instancedMesh>
      
      <instancedMesh ref={boxesRef} args={[undefined, undefined, boxes.length]}>
        {/* ChamferBox would be nice, but simple box with rounded texture logic or just Box is fine */}
        <boxGeometry args={[1.0, 1.0, 1.0]} />
        <meshStandardMaterial 
            metalness={0.7} 
            roughness={0.2} 
            emissive="#800000" // Deep red glow
            emissiveIntensity={0.8}
            envMapIntensity={2.0} 
        />
      </instancedMesh>
    </group>
  );
};

export default LuxuryOrnaments;