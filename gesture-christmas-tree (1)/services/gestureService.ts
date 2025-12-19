import { GestureType } from '../types';

// Simple types for MediaPipe Landmarks
type Landmark = { x: number; y: number; z: number };

export const detectGesture = (landmarks: Landmark[]): GestureType => {
  if (!landmarks || landmarks.length < 21) return GestureType.NONE;

  // Finger tips and bases
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexBase = landmarks[5];
  const middleBase = landmarks[9];
  const ringBase = landmarks[13];
  const pinkyBase = landmarks[17];
  
  const wrist = landmarks[0];

  // Helper: Is finger extended?
  // We compare tip distance to wrist vs base distance to wrist roughly
  const isExtended = (tip: Landmark, base: Landmark) => {
    // Simple check: Tip is higher (lower Y value in screen space) than base? 
    // Or distance from wrist is significantly larger.
    const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const distBase = Math.hypot(base.x - wrist.x, base.y - wrist.y);
    return distTip > distBase * 1.2; 
  };

  const fingersExtended = [
    isExtended(indexTip, indexBase),
    isExtended(middleTip, middleBase),
    isExtended(ringTip, ringBase),
    isExtended(pinkyTip, pinkyBase)
  ];

  const extendedCount = fingersExtended.filter(Boolean).length;

  // Check for Pinch (Thumb close to Index)
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  
  // LOGIC
  if (extendedCount === 4 && pinchDist > 0.1) {
    return GestureType.OPEN_PALM;
  }
  
  if (extendedCount === 0) {
    return GestureType.FIST;
  }

  // Pinch detection (needs to be fairly close)
  if (pinchDist < 0.05) {
    return GestureType.PINCH;
  }

  return GestureType.NONE;
};