import * as THREE from 'three';

export enum AppState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED',
  PHOTO_VIEW = 'PHOTO_VIEW'
}

export enum GestureType {
  NONE = 'NONE',
  FIST = 'FIST',       // Form Tree
  OPEN_PALM = 'OPEN',  // Scatter / Chaos
  PINCH = 'PINCH',     // Grab Photo
  POINT = 'POINT'      // Rotate/Interact
}

export interface DualPositionData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  color: THREE.Color;
  speed: number;
  type?: 'sphere' | 'box' | 'candy'; // For mixed ornaments
}

export interface HandData {
  gesture: GestureType;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  isOpen: boolean;
  isClosed: boolean;
  isPinching: boolean;
}