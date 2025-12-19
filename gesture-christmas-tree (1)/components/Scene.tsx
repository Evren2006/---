import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import LuxuryFoliage from './LuxuryFoliage';
import LuxuryOrnaments from './LuxuryOrnaments';
import PhotoCloud from './PhotoCloud';
import { AppState } from '../types';
import { COLORS } from '../constants';

interface SceneProps {
  appState: AppState;
  handPos: { x: number, y: number };
  photos: string[];
  focusedPhotoIndex: number;
}

const Scene: React.FC<SceneProps> = ({ appState, handPos, photos, focusedPhotoIndex }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 2, 40], fov: 45 }}
      gl={{ 
        antialias: false, 
        toneMapping: THREE.ReinhardToneMapping, 
        toneMappingExposure: 1.5,
        alpha: false 
      }}
    >
      <color attach="background" args={[COLORS.BACKGROUND]} />
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.5} color={COLORS.MATTE_GREEN} />
      <spotLight position={[20, 50, 20]} angle={0.3} penumbra={1} intensity={1000} color="#fff8e0" castShadow />
      <pointLight position={[-10, 0, -10]} intensity={20} color={COLORS.CHRISTMAS_RED} />
      <pointLight position={[0, -10, 10]} intensity={30} color={COLORS.METALLIC_GOLD} />

      <Suspense fallback={null}>
        {/* Hand rotation affects group in Chaos mode */}
        <group 
           rotation={[
             0, 
             appState !== AppState.FORMED ? (handPos.x - 0.5) * Math.PI : 0, 
             0
           ]}
        >
             <LuxuryFoliage appState={appState} />
             <LuxuryOrnaments appState={appState} />
             <PhotoCloud photos={photos} appState={appState} focusedIndex={focusedPhotoIndex} />
        </group>
        
        <Environment preset="night" />
        
        <Sparkles 
            count={300} 
            scale={40} 
            size={4} 
            speed={0.4} 
            opacity={0.5} 
            color="#fff" 
        />
      </Suspense>

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.9} mipmapBlur intensity={1.5} radius={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.0} />
      </EffectComposer>

      <OrbitControls 
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 3}
        autoRotate={appState === AppState.FORMED}
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
};

export default Scene;