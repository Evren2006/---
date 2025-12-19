import * as THREE from 'three';
import { DualPositionData } from './types';

export const COLORS = {
  MATTE_GREEN: '#0f3b23',    // Deeper, richer green
  LIGHT_GREEN: '#4a7c59',    // Highlights
  METALLIC_GOLD: '#FFD700',  // Shiny Gold
  CHRISTMAS_RED: '#D42426',  // Vivid Red
  SNOW_WHITE: '#FFFFFF',
  BACKGROUND: '#020502',     // Almost black
};

// Tree Dimensions
export const TREE_HEIGHT = 18;
export const TREE_RADIUS = 7.5;
export const CHAOS_RADIUS = 35;

// Counts
export const FOLIAGE_COUNT = 9000; 
export const ORNAMENT_COUNT = 300; 

// --- Geometry Helpers ---

export const getChaosPos = (): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * CHAOS_RADIUS;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

// Spiral Tree Generation
export const getTreePos = (i: number, total: number, yOffset: number): THREE.Vector3 => {
  const ratio = i / total;
  const h = ratio; 
  
  const rMax = TREE_RADIUS * (1 - h);
  const angle = i * 2.39996; 
  const r = rMax * Math.sqrt(Math.random()); 
  
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  const y = (h * TREE_HEIGHT) - yOffset;
  
  return new THREE.Vector3(x, y, z);
};

// Get a random position ON THE SURFACE of the tree (for photos)
export const getRandomTreeSurfacePos = (): { pos: THREE.Vector3, rot: THREE.Euler } => {
  const yOffset = TREE_HEIGHT / 2;
  
  // Random height (0 to 1)
  // We bias slightly towards the bottom/middle where there is more volume
  const h = Math.random() * 0.9 + 0.05; 
  
  // Radius at this height (Cone shape)
  // INCREASED RANDOMNESS: 
  // Base radius + random offset (-1.0 to +1.5) to hide photos in leaves or float them
  const rBase = TREE_RADIUS * (1 - h);
  const rOffset = (Math.random() * 2.5) - 1.0; 
  const r = Math.max(0.5, rBase + rOffset); 
  
  // Random Angle around the tree
  const angle = Math.random() * Math.PI * 2;
  
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const y = (h * TREE_HEIGHT) - yOffset;
  
  // Calculate rotation to face outwards
  return {
    pos: new THREE.Vector3(x, y, z),
    rot: new THREE.Euler(0, -angle + Math.PI / 2, 0) // Face outwards
  };
};

export const generateOrnamentData = (count: number): DualPositionData[] => {
  const data: DualPositionData[] = [];
  const yOffset = TREE_HEIGHT / 2;

  // Generate ornaments in a spiral
  for (let i = 0; i < count; i++) {
    const ratio = i / count; // 0 to 1
    const h = ratio; 
    
    // Make ornaments sit slightly "inside" the foliage for depth, 
    // but pop out enough to be seen.
    const rMax = TREE_RADIUS * (1 - h) * 0.9; 
    
    // Spiral placement
    const angle = ratio * Math.PI * 16; // 8 full rotations
    
    const x = rMax * Math.cos(angle);
    const z = rMax * Math.sin(angle);
    const y = (h * TREE_HEIGHT) - yOffset;

    const typeRoll = Math.random();
    let type: 'sphere' | 'box' | 'candy' = 'sphere';
    let color = new THREE.Color(COLORS.METALLIC_GOLD);
    
    // Distribution: 60% Gold Spheres, 40% Red Boxes
    if (typeRoll > 0.6) {
        type = 'box';
        color = new THREE.Color(COLORS.CHRISTMAS_RED);
    }

    data.push({
      chaosPos: getChaosPos(),
      targetPos: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      scale: Math.random() * 0.4 + 0.3, // Slightly smaller range for elegance
      color: color,
      speed: Math.random() * 1.5 + 0.5,
      type: type
    });
  }
  return data;
};