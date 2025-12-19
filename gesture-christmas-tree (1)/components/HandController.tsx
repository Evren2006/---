import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as mpHands from '@mediapipe/hands';
import { detectGesture } from '../services/gestureService';
import { GestureType, HandData } from '../types';

interface HandControllerProps {
  onHandUpdate: (data: HandData) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const HandController: React.FC<HandControllerProps> = ({ onHandUpdate, videoRef }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (!videoRef.current) return;

    // Handle ESM import differences for MediaPipe
    // esm.sh often wraps CJS modules in a default export
    const Hands = (mpHands as any).Hands || (mpHands as any).default?.Hands;
    
    if (!Hands) {
      console.error("MediaPipe Hands not found in import", mpHands);
      return;
    }

    const hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Safety check: ensure landmarks array is valid and has enough points
        if (!landmarks || landmarks.length < 21) {
             onHandUpdate({
              gesture: GestureType.NONE,
              x: 0.5,
              y: 0.5,
              isOpen: false,
              isClosed: false,
              isPinching: false
            });
            return;
        }

        const gesture = detectGesture(landmarks);
        
        // Calculate center of palm roughly (Middle finger base)
        const palmX = landmarks[9].x; 
        const palmY = landmarks[9].y;

        onHandUpdate({
          gesture,
          x: palmX,
          y: palmY,
          isOpen: gesture === GestureType.OPEN_PALM,
          isClosed: gesture === GestureType.FIST,
          isPinching: gesture === GestureType.PINCH
        });
      } else {
        onHandUpdate({
          gesture: GestureType.NONE,
          x: 0.5,
          y: 0.5,
          isOpen: false,
          isClosed: false,
          isPinching: false
        });
      }
    });

    const videoElement = videoRef.current;
    
    // Manual Camera Setup to avoid import errors from @mediapipe/camera_utils
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            videoElement.play();
            setIsInitializing(false);
            processVideo();
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    const processVideo = async () => {
      if (videoElement && !videoElement.paused && !videoElement.ended) {
        await hands.send({ image: videoElement });
        requestRef.current = requestAnimationFrame(processVideo);
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      hands.close();
      if (videoElement && videoElement.srcObject) {
         const stream = videoElement.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef, onHandUpdate]);

  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-none">
       {isInitializing && <div className="text-yellow-400 text-sm animate-pulse">Initializing Vision...</div>}
    </div>
  );
};

export default HandController;