import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, FOLIAGE_COUNT, TREE_HEIGHT, getChaosPos, getTreePos } from '../constants';
import { AppState } from '../types';

const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColorBottom: { value: new THREE.Color(COLORS.MATTE_GREEN) },
    uColorTop: { value: new THREE.Color(COLORS.LIGHT_GREEN) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aRandom; // 0 to 1
    
    varying float vRandom;
    varying float vHeightRatio;
    varying float vDepth;

    void main() {
      vRandom = aRandom;
      
      // Interpolate position
      float t = smoothstep(0.0, 1.0, uProgress);
      
      // Add a slight "explosion" curve to the movement
      // Points move out then in
      vec3 pos = mix(aChaosPos, aTargetPos, t);
      
      // Spiral wind effect when forming
      if (t > 0.01 && t < 0.99) {
          float spin = sin(t * 3.14) * 2.0;
          float c = cos(spin * pos.y * 0.1);
          float s = sin(spin * pos.y * 0.1);
          mat2 m = mat2(c, -s, s, c);
          pos.xz = m * pos.xz;
      }

      // Gentle idle sway
      float wind = sin(uTime * 1.5 + pos.y * 0.5) * 0.15 * t;
      pos.x += wind;
      pos.z += cos(uTime * 1.2 + pos.x * 0.5) * 0.15 * t;
      
      // Calculate normalized height for color gradient
      vHeightRatio = (aTargetPos.y + 8.0) / 16.0; // Approx range

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      // Randomize size for texture
      float sizeBase = mix(4.0, 12.0, aRandom);
      gl_PointSize = sizeBase * (25.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBottom;
    uniform vec3 uColorTop;
    uniform float uTime;
    
    varying float vRandom;
    varying float vHeightRatio;

    void main() {
      // Soft circular particle
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Gradient from bottom (dark) to top (light)
      vec3 color = mix(uColorBottom, uColorTop, vHeightRatio * 0.8 + 0.1);
      
      // Random variation per leaf
      color = mix(color, color * 1.5, vRandom * 0.3);

      // Magical Twinkle effect
      // Only twinkle some particles based on vRandom threshold
      float twinkleSpeed = 3.0;
      float twinkle = sin(uTime * twinkleSpeed + vRandom * 20.0);
      
      if (vRandom > 0.7) {
        color += vec3(0.4, 0.4, 0.2) * smoothstep(0.8, 1.0, twinkle); // Golden sparkles
      }

      // Soft edge
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

      gl_FragColor = vec4(color, alpha);
    }
  `
};

interface Props {
  appState: AppState;
}

const LuxuryFoliage: React.FC<Props> = ({ appState }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  const { positions, chaosPositions, randoms } = useMemo(() => {
    const pos = new Float32Array(FOLIAGE_COUNT * 3);
    const chaos = new Float32Array(FOLIAGE_COUNT * 3);
    const rnd = new Float32Array(FOLIAGE_COUNT);
    const yOffset = TREE_HEIGHT / 2;

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      // Use new spiral generation logic
      const target = getTreePos(i, FOLIAGE_COUNT, yOffset);
      
      pos[i * 3] = target.x;
      pos[i * 3 + 1] = target.y;
      pos[i * 3 + 2] = target.z;

      const c = getChaosPos();
      chaos[i * 3] = c.x;
      chaos[i * 3 + 1] = c.y;
      chaos[i * 3 + 2] = c.z;

      rnd[i] = Math.random();
    }
    return { positions: pos, chaosPositions: chaos, randoms: rnd };
  }, []);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      const targetProgress = appState === AppState.FORMED ? 1.0 : 0.0;
      // Slower, smoother transition for elegance
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uProgress.value,
        targetProgress,
        0.03 
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={FOLIAGE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTargetPos" count={FOLIAGE_COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaosPos" count={FOLIAGE_COUNT} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={FOLIAGE_COUNT} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending} 
      />
    </points>
  );
};

export default LuxuryFoliage;