import React, { useState, useEffect, useRef } from 'react';
import { Hand, BoxSelect, Move, Image as ImageIcon, Sparkles, Upload } from 'lucide-react';
import Scene from './components/Scene';
import HandController from './components/HandController';
import { AppState, GestureType, HandData } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.FORMED);
  const [handData, setHandData] = useState<HandData>({ 
    gesture: GestureType.NONE, x: 0.5, y: 0.5, isOpen: false, isClosed: false, isPinching: false 
  });
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Hand Gestures
  useEffect(() => {
    switch (handData.gesture) {
      case GestureType.FIST:
        if (appState !== AppState.FORMED) setAppState(AppState.FORMED);
        break;

      case GestureType.OPEN_PALM:
        if (appState !== AppState.CHAOS) setAppState(AppState.CHAOS);
        break;

      case GestureType.PINCH:
        if (photos.length > 0) setAppState(AppState.PHOTO_VIEW);
        break;
        
      default:
        if (appState === AppState.PHOTO_VIEW && handData.gesture === GestureType.NONE) {
            setAppState(AppState.CHAOS);
        }
        break;
    }
  }, [handData.gesture, photos.length]);

  const prevGesture = useRef(GestureType.NONE);
  useEffect(() => {
    if (handData.gesture === GestureType.PINCH && prevGesture.current !== GestureType.PINCH) {
        if (photos.length > 0) {
            setFocusedIndex(prev => (prev + 1) % photos.length);
        }
    }
    prevGesture.current = handData.gesture;
  }, [handData.gesture, photos.length]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newPhotos = Array.from(event.target.files).map(file => URL.createObjectURL(file as Blob));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const getStateLabel = (state: AppState) => {
    switch(state) {
        case AppState.FORMED: return "TREE ASSEMBLED";
        case AppState.CHAOS: return "MAGIC SCATTERED";
        case AppState.PHOTO_VIEW: return "MEMORY VIEW";
        default: return state;
    }
  };

  return (
    <div className="relative w-full h-full text-white overflow-hidden bg-[#050a05]">
      {/* 3D Scene */}
      <Scene 
        appState={appState} 
        handPos={{ x: handData.x, y: handData.y }} 
        photos={photos}
        focusedPhotoIndex={focusedIndex}
      />

      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      <HandController videoRef={videoRef} onHandUpdate={setHandData} />

      {/* --- UI LAYER --- */}

      {/* 1. Header (Top Left) */}
      <div className="absolute top-0 left-0 p-8 z-10 pointer-events-none select-none flex flex-col items-start gap-2">
        <div className="relative">
             <h2 className="font-vibes text-4xl md:text-5xl text-[#C41E3A] text-red-glow -rotate-6 transform translate-y-2 ml-[-10px]">
                Merry
            </h2>
            <h1 className="font-cinzel font-bold text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] to-[#B8860B] drop-shadow-2xl text-gold-glow tracking-widest">
                CHRISTMAS
            </h1>
        </div>
        <div className="h-[1px] w-32 bg-gradient-to-r from-[#FFD700] to-transparent mt-2"></div>
        <p className="font-mont text-[#a0cfa0] text-[10px] uppercase tracking-[0.4em] ml-1">
            Interactive 3D Experience
        </p>
      </div>

      {/* 2. Top Right Actions */}
      <div className="absolute top-8 right-8 z-20 flex gap-4">
        {/* Upload Button */}
        <div className="pointer-events-auto">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handlePhotoUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex items-center gap-3 px-6 py-3 glass-panel rounded-full hover:bg-white/5 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-full border border-[#FFD700]/30 group-hover:border-[#FFD700]/80 transition-colors"></div>
            <Upload size={16} className="text-[#FFD700] group-hover:scale-110 transition-transform" />
            <span className="font-cinzel font-semibold text-xs tracking-widest text-[#FFD700]">Add Photos</span>
          </button>
        </div>
      </div>

      {/* 3. State Indicator (Top Center / Floating HUD) */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="glass-panel px-8 py-2 rounded-full flex items-center gap-3 border-[#FFD700]/20">
            <div className={`w-2 h-2 rounded-full ${appState === AppState.FORMED ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-[#FFD700] animate-pulse'}`}></div>
            <span className="font-cinzel text-xs font-bold tracking-[0.2em] text-white/90 min-w-[120px] text-center">
                {getStateLabel(appState)}
            </span>
            <div className="w-2 h-2 rounded-full bg-[#FFD700] opacity-0"></div> {/* Spacer for center alignment visually */}
        </div>
      </div>

      {/* 4. Gesture Guide (Bottom Right) */}
      <div className="absolute bottom-8 right-8 z-10 pointer-events-none flex flex-col items-end gap-3">
        <div className="font-cinzel text-[#FFD700] text-xs tracking-widest mb-1 border-b border-[#FFD700]/30 pb-1">GESTURE CONTROLS</div>
        
        <InstructionItem 
          active={appState === AppState.FORMED}
          icon={<Hand size={18} />} 
          title="ASSEMBLE" 
          desc="Close Fist" 
        />
        <InstructionItem 
          active={appState === AppState.CHAOS}
          icon={<BoxSelect size={18} />} 
          title="SCATTER" 
          desc="Open Hand" 
        />
        <InstructionItem 
          active={appState === AppState.CHAOS}
          icon={<Move size={18} />} 
          title="ROTATE" 
          desc="Move Hand" 
        />
        <InstructionItem 
          active={appState === AppState.PHOTO_VIEW}
          icon={<ImageIcon size={18} />} 
          title="VIEW PHOTO" 
          desc="Pinch Fingers" 
        />
      </div>

       {/* 5. Decorative Corners */}
       <div className="absolute bottom-8 left-8 z-0 pointer-events-none opacity-40">
           <Sparkles className="text-[#FFD700] animate-pulse" size={32} strokeWidth={1} />
       </div>
    </div>
  );
};

const InstructionItem = ({ icon, title, desc, active }: { icon: React.ReactNode, title: string, desc: string, active?: boolean }) => (
  <div className={`
    relative flex items-center gap-4 p-3 pr-4 rounded-lg transition-all duration-500
    ${active ? 'glass-panel border-l-2 border-l-[#FFD700] translate-x-[-10px]' : 'bg-transparent opacity-60'}
  `}>
    <div className="text-right">
      <div className={`font-cinzel font-bold text-[10px] tracking-widest ${active ? 'text-white' : 'text-white/60'}`}>{title}</div>
      <div className="font-mont text-[9px] text-[#FFD700]/80 uppercase tracking-wider">{desc}</div>
    </div>
    <div className={`${active ? 'text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]' : 'text-white/40'}`}>
      {icon}
    </div>
  </div>
);

export default App;