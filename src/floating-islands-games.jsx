import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';

// ============================================================================
// UI CONSTANTS
// ============================================================================
const UI_CONSTANTS = {
  HEADER_HEIGHT: 110,
  FOOTER_HEIGHT: 180,
  YOFFSET_MIN: 5,
  YOFFSET_RANGE: 80,
  VIEWPORT_CLAMP: 700,
  POP_SCALE: 2.5,
  POP_DURATION: 1200,
  WINDOW_RESIZE_THROTTLE: 100
};

// ============================================================================
// FIREBASE BACKEND INTEGRATION
// ============================================================================
// This uses Firebase Firestore for synchronized island positions
// All users see the same islands at the same positions in real-time

// Mock Firebase client (replace with actual Firebase SDK in production)
class MockFirebaseClient {
  constructor() {
    this.data = null;
    this.listeners = [];
    this.connected = true;
    
    // CLOUD PORTAL UPDATE - Clear to regenerate with new spawn positions (10-40%)
    localStorage.removeItem('islandData');
    
    // Simulate initial data load
    setTimeout(() => {
      this.data = this.loadFromLocalStorage() || this.generateInitialData();
      this.saveToLocalStorage();
      this.notifyListeners();
    }, 500);
  }
  
  loadFromLocalStorage() {
    const stored = localStorage.getItem('islandData');
    return stored ? JSON.parse(stored) : null;
  }
  
  saveToLocalStorage() {
    localStorage.setItem('islandData', JSON.stringify(this.data));
  }
  
  generateInitialData() {
    const now = Date.now();
    return SAMPLE_GAMES.map((game, index) => {
      // Store BASE transit time in days (multiplier applied in getIslandPosition)
      const transitTime = game.transitDays;
      
      // For initial positioning, calculate based on showcase mode (1 day = 1 hour)
      const showcaseMultiplier = 3600 * 1000; // 1 hour in milliseconds
      const actualTransitTime = transitTime * showcaseMultiplier;
      
      // Spread games evenly from 5% to 95% progress so they're distributed
      // across the full screen width — only a handful visible at any moment
      const progressPercent = 0.05 + (index / (SAMPLE_GAMES.length - 1)) * 0.9;
      const elapsedTime = progressPercent * actualTransitTime;
      const spawnTime = now - elapsedTime;

      // Golden ratio Y distribution — prevents clustering, natural even spread
      const goldenRatio = 0.6180339887;
      const yOffset = 12 + ((index * goldenRatio * 68) % 68);

      return {
        ...game,
        id: now + index,
        spawnTime,
        transitTime,
        yOffset,
      };
    });
  }
  
  onSnapshot(callback) {
    this.listeners.push(callback);
    if (this.data) {
      callback(this.data);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.data));
  }
  
  async addIsland(gameData) {
    if (!this.data) return;
    
    // Store BASE transit time (multiplier applied in getIslandPosition)
    const transitTime = gameData.transitDays;
    const newIsland = {
      ...gameData,
      id: Date.now(), // Generate unique ID
      spawnTime: Date.now(),
      transitTime, // Store base days
      yOffset: Math.random() * UI_CONSTANTS.YOFFSET_RANGE + UI_CONSTANTS.YOFFSET_MIN // Spread from 5% to 85% (closer to header)
    };
    
    this.data.push(newIsland);
    this.saveToLocalStorage();
    this.notifyListeners();
    
    return newIsland;
  }
  
  async removeIsland(islandId) {
    if (!this.data) return;
    
    this.data = this.data.filter(island => island.id !== islandId);
    this.saveToLocalStorage();
    this.notifyListeners();
  }
}

// Initialize mock Firebase client
const firebaseClient = new MockFirebaseClient();

// Sample game data - in production, this would be your game submission form
const SAMPLE_GAMES = [
  {
    title: "Pixel Pirates",
    creator: "DevTeam Alpha",
    thumbnail: "https://source.unsplash.com/random/200x150/?game,pirate",
    description: "Navigate treacherous pixel seas in this retro adventure",
    tags: ["Action", "Retro"],
    techStack: ["Unity", "C#", "GIMP"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Quantum Garden",
    creator: "Studio Beta",
    thumbnail: "https://source.unsplash.com/random/200x150/?garden,nature",
    description: "Grow impossible plants in a quantum greenhouse",
    tags: ["Puzzle", "Relaxing"],
    techStack: ["Godot 4", "GDScript", "Blender"],
    transitDays: 5,
    gameUrl: "https://itch.io"
  },
  {
    title: "Neon Runners",
    creator: "DevTeam Alpha",
    thumbnail: "https://source.unsplash.com/random/200x150/?neon,city",
    description: "Parkour through a cyberpunk cityscape",
    tags: ["Platformer", "Cyberpunk"],
    techStack: ["Unreal 5", "C++", "Blueprints"],
    transitDays: 1,
    gameUrl: "https://itch.io"
  },
  {
    title: "Cosmic Café",
    creator: "Starlight Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?coffee,space",
    description: "Serve coffee to aliens in deep space",
    tags: ["Simulation", "Casual"],
    techStack: ["Unity", "C#", "Photoshop"],
    transitDays: 3,
    gameUrl: "https://itch.io"
  },
  {
    title: "Echo Chamber",
    creator: "Studio Beta",
    thumbnail: "https://source.unsplash.com/random/200x150/?music,sound",
    description: "Solve puzzles using sound wave mechanics",
    tags: ["Puzzle", "Music"],
    techStack: ["Unity", "C#", "FMOD"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Shadow Tactics",
    creator: "Athletic Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?shadow,ninja",
    description: "Outsmart enemies in a world of shadows",
    tags: ["Stealth", "Strategy"],
    techStack: ["Unity", "C#", "Substance Painter"],
    transitDays: 6,
    gameUrl: "https://itch.io"
  },
  {
    title: "Glow Forge",
    creator: "Ember Interactive",
    thumbnail: "https://source.unsplash.com/random/200x150/?fire,forge",
    description: "Craft magical weapons in a mystical forge",
    tags: ["Crafting", "Fantasy"],
    techStack: ["Godot 4", "GDScript", "Aseprite"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Time Loop Diner",
    creator: "Temporal Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?diner,retro",
    description: "Run a diner stuck in a time loop",
    tags: ["Time Travel", "Management"],
    techStack: ["GameMaker Studio 2", "GML", "Aseprite"],
    transitDays: 7,
    gameUrl: "https://itch.io"
  },
  // Additional games for archive
  {
    title: "Dungeon Delver",
    creator: "Roguelike Studios",
    thumbnail: "https://source.unsplash.com/random/200x150/?dungeon,castle",
    description: "Procedurally generated dungeons await",
    tags: ["Roguelike", "Action"],
    transitDays: 3,
    gameUrl: "https://itch.io"
  },
  {
    title: "Sky Merchant",
    creator: "Starlight Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?sky,clouds",
    description: "Trade goods between floating islands",
    tags: ["Trading", "Adventure"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Spell Weaver",
    creator: "Ember Interactive",
    thumbnail: "https://source.unsplash.com/random/200x150/?magic,fantasy",
    description: "Combine magical elements to cast spells",
    tags: ["Magic", "Puzzle"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Mech Arena",
    creator: "Combat Zone",
    thumbnail: "https://source.unsplash.com/random/200x150/?robot,tech",
    description: "Battle giant robots in futuristic arenas",
    tags: ["Action", "Multiplayer"],
    transitDays: 1,
    gameUrl: "https://itch.io"
  },
  {
    title: "Cozy Cottage",
    creator: "Peaceful Play",
    thumbnail: "https://source.unsplash.com/random/200x150/?cottage,cozy",
    description: "Decorate your dream cottage and garden",
    tags: ["Casual", "Relaxing"],
    transitDays: 5,
    gameUrl: "https://itch.io"
  },
  {
    title: "Rhythm Racer",
    creator: "Creative Tools",
    thumbnail: "https://source.unsplash.com/random/200x150/?racing,music",
    description: "Race to the beat in this musical speedrun",
    tags: ["Racing", "Music"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Haunted Halls",
    creator: "Temporal Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?haunted,mansion",
    description: "Explore a mansion full of ghosts",
    tags: ["Horror", "Adventure"],
    transitDays: 6,
    gameUrl: "https://itch.io"
  },
  {
    title: "Card Commander",
    creator: "Roguelike Studios",
    thumbnail: "https://source.unsplash.com/random/200x150/?cards,game",
    description: "Strategic deck-building card battles",
    tags: ["Card Game", "Strategy"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Ninja Dash",
    creator: "Athletic Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?ninja,action",
    description: "Lightning-fast ninja action platformer",
    tags: ["Platformer", "Action"],
    transitDays: 1,
    gameUrl: "https://itch.io"
  },
  {
    title: "Farm Frenzy",
    creator: "Peaceful Play",
    thumbnail: "https://source.unsplash.com/random/200x150/?farm,agriculture",
    description: "Manage your farm from dawn to dusk",
    tags: ["Farming", "Simulation"],
    transitDays: 7,
    gameUrl: "https://itch.io"
  },
  {
    title: "Galaxy Explorer",
    creator: "Starlight Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?galaxy,space",
    description: "Discover new worlds across the universe",
    tags: ["Space", "Exploration"],
    transitDays: 5,
    gameUrl: "https://itch.io"
  },
  {
    title: "Puzzle Portal",
    creator: "Studio Beta",
    thumbnail: "https://source.unsplash.com/random/200x150/?portal,abstract",
    description: "Mind-bending portal mechanics",
    tags: ["Puzzle", "Physics"],
    transitDays: 3,
    gameUrl: "https://itch.io"
  },
  {
    title: "Dragon Rider",
    creator: "Ember Interactive",
    thumbnail: "https://source.unsplash.com/random/200x150/?dragon,fantasy",
    description: "Soar through the skies on dragonback",
    tags: ["Flying", "Adventure"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Zombie Survival",
    creator: "Combat Zone",
    thumbnail: "https://source.unsplash.com/random/200x150/?zombie,apocalypse",
    description: "Survive the zombie apocalypse",
    tags: ["Survival", "Horror"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Treasure Hunt",
    creator: "Roguelike Studios",
    thumbnail: "https://source.unsplash.com/random/200x150/?treasure,adventure",
    description: "Search for hidden treasures worldwide",
    tags: ["Adventure", "Exploration"],
    transitDays: 6,
    gameUrl: "https://itch.io"
  },
  {
    title: "Chef Master",
    creator: "Creative Tools",
    thumbnail: "https://source.unsplash.com/random/200x150/?cooking,chef",
    description: "Cook your way to culinary fame",
    tags: ["Cooking", "Simulation"],
    transitDays: 3,
    gameUrl: "https://itch.io"
  },
  {
    title: "Cyber Hacker",
    creator: "Combat Zone",
    thumbnail: "https://source.unsplash.com/random/200x150/?cyberpunk,hacker",
    description: "Hack the mainframe in this cyberpunk thriller",
    tags: ["Hacking", "Cyberpunk"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Pet Paradise",
    creator: "Peaceful Play",
    thumbnail: "https://source.unsplash.com/random/200x150/?pets,cute",
    description: "Raise and care for adorable pets",
    tags: ["Pets", "Casual"],
    transitDays: 5,
    gameUrl: "https://itch.io"
  },
  {
    title: "Battle Royale Arena",
    creator: "DevTeam Alpha",
    thumbnail: "https://source.unsplash.com/random/200x150/?battle,arena",
    description: "Last player standing wins",
    tags: ["Battle Royale", "Multiplayer"],
    transitDays: 1,
    gameUrl: "https://itch.io"
  },
  {
    title: "Mystery Manor",
    creator: "Temporal Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?mystery,detective",
    description: "Solve the murder mystery",
    tags: ["Mystery", "Adventure"],
    transitDays: 7,
    gameUrl: "https://itch.io"
  },
  {
    title: "Sports Stadium",
    creator: "Athletic Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?sports,stadium",
    description: "Compete in various sports events",
    tags: ["Sports", "Multiplayer"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Pixel Art Studio",
    creator: "Creative Tools",
    thumbnail: "https://source.unsplash.com/random/200x150/?art,creative",
    description: "Create beautiful pixel art",
    tags: ["Creative", "Art"],
    transitDays: 6,
    gameUrl: "https://itch.io"
  }
];

// ============================================================================
// ISLAND VISUAL THEMES (mapped to game genre)
// ============================================================================
const ISLAND_THEMES = {
  forest:   { gradFrom: '#15803d', gradTo: '#14532d', border: '#ca8a04', glow: 'rgba(34,197,94,0.35)',   shape: '50% 50% 0% 0% / 55% 55% 0% 0%',          skew: 'skewX(-3deg)'             },
  dark:     { gradFrom: '#334155', gradTo: '#0f172a', border: '#ef4444', glow: 'rgba(239,68,68,0.35)',   shape: '8% 8% 0% 0%',                             skew: 'skewX(2deg)'              },
  mystic:   { gradFrom: '#7c3aed', gradTo: '#4c1d95', border: '#a78bfa', glow: 'rgba(167,139,250,0.35)', shape: '55% 45% 0% 0% / 65% 50% 0% 0%',          skew: ''                         },
  cosmic:   { gradFrom: '#1d4ed8', gradTo: '#1e3a8a', border: '#38bdf8', glow: 'rgba(56,189,248,0.35)',  shape: '0%',                                      skew: 'skewX(-6deg) skewY(-1deg)'},
  desert:   { gradFrom: '#b45309', gradTo: '#78350f', border: '#fb923c', glow: 'rgba(251,146,60,0.35)',  shape: '4% 4% 0% 0%',                             skew: ''                         },
  musical:  { gradFrom: '#be185d', gradTo: '#831843', border: '#f9a8d4', glow: 'rgba(249,168,212,0.35)', shape: '45% 55% 0% 0% / 60% 60% 0% 0%',          skew: 'skewX(3deg)'              },
  crystal:  { gradFrom: '#0f766e', gradTo: '#134e4a', border: '#5eead4', glow: 'rgba(94,234,212,0.35)',  shape: '30% 70% 0% 0% / 45% 65% 0% 0%',          skew: 'skewX(-5deg)'             },
  meadow:   { gradFrom: '#4d7c0f', gradTo: '#365314', border: '#a3e635', glow: 'rgba(163,230,53,0.35)',  shape: '65% 35% 0% 0% / 75% 45% 0% 0%',          skew: 'skewX(4deg)'              },
  volcanic: { gradFrom: '#b91c1c', gradTo: '#7f1d1d', border: '#f97316', glow: 'rgba(249,115,22,0.35)',  shape: '25% 25% 0% 0% / 35% 35% 0% 0%',          skew: ''                         },
};

const getIslandTheme = (tags = []) => {
  const t = tags.join(' ').toLowerCase();
  if (/horror|survival|zombie|stealth|shadow|haunted/.test(t))        return 'dark';
  if (/fantasy|magic|rpg|wizard|spell|dragon|dungeon/.test(t))        return 'mystic';
  if (/space|galaxy|cosmic|cyber|neon|sci|hacker|mech|robot/.test(t)) return 'cosmic';
  if (/racing|sports|stadium|athletic/.test(t))                        return 'desert';
  if (/music|rhythm|sound/.test(t))                                    return 'musical';
  if (/puzzle|strategy|card|brain|portal/.test(t))                     return 'crystal';
  if (/farm|cozy|cottage|cooking|pets|simulation|casual|management|time travel/.test(t)) return 'meadow';
  if (/action|shooter|battle|fight|ninja|pirate|multiplayer/.test(t)) return 'volcanic';
  return 'forest';
};

const getThemeIcon = (themeName) => {
  switch (themeName) {
    case 'forest':   return <><circle cx="10" cy="14" r="2" fill="#a3e635"/><polygon points="10,2 4,10 7,10 7,14 13,14 13,10 16,10" fill="#4ade80"/></>;
    case 'dark':     return <><rect x="4" y="10" width="12" height="8" fill="#475569" rx="1"/><polygon points="4,10 10,2 16,10" fill="#64748b"/><circle cx="7" cy="13" r="1" fill="#ef4444"/><circle cx="13" cy="13" r="1" fill="#ef4444"/></>;
    case 'mystic':   return <><polygon points="10,1 12,7 18,7 13,11 15,17 10,13 5,17 7,11 2,7 8,7" fill="#a78bfa"/></>;
    case 'cosmic':   return <><circle cx="10" cy="10" r="4" fill="#38bdf8"/><ellipse cx="10" cy="10" rx="9" ry="3" fill="none" stroke="#7dd3fc" strokeWidth="1.5"/></>;
    case 'desert':   return <><circle cx="10" cy="7" r="5" fill="#fbbf24"/><line x1="10" y1="1" x2="10" y2="0" stroke="#fbbf24" strokeWidth="1.5"/><line x1="16" y1="4" x2="17" y2="3" stroke="#fbbf24" strokeWidth="1.5"/><line x1="19" y1="10" x2="20" y2="10" stroke="#fbbf24" strokeWidth="1.5"/><line x1="4" y1="4" x2="3" y2="3" stroke="#fbbf24" strokeWidth="1.5"/><line x1="1" y1="10" x2="0" y2="10" stroke="#fbbf24" strokeWidth="1.5"/></>;
    case 'musical':  return <><circle cx="7" cy="15" r="3" fill="#f9a8d4"/><circle cx="14" cy="13" r="3" fill="#f9a8d4"/><path d="M10,12 L10,4 L17,2 L17,10" stroke="#ec4899" strokeWidth="1.5" fill="none"/></>;
    case 'crystal':  return <><polygon points="10,1 14,7 18,9 14,11 10,19 6,11 2,9 6,7" fill="#5eead4"/><polygon points="10,5 12,8 10,15 8,8" fill="#99f6e4" opacity="0.6"/></>;
    case 'meadow':   return <><circle cx="10" cy="10" r="4" fill="#86efac"/><circle cx="6" cy="12" r="3" fill="#4ade80"/><circle cx="14" cy="12" r="3" fill="#4ade80"/><circle cx="10" cy="14" r="3" fill="#22c55e"/><circle cx="10" cy="8" r="2" fill="#fde047"/></>;
    case 'volcanic': return <><polygon points="10,1 14,9 18,18 2,18 6,9" fill="#ef4444"/><polygon points="10,5 12,11 8,11" fill="#fbbf24"/><path d="M6,18 Q8,13 10,11 Q12,13 14,18" fill="#f97316"/></>;
    default:         return <><circle cx="10" cy="14" r="2" fill="#a3e635"/><polygon points="10,2 4,10 7,10 7,14 13,14 13,10 16,10" fill="#4ade80"/></>;
  }
};

const FloatingIslandsGames = () => {
  const [islands, setIslands] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // New UI state
  const [viewportOffset, setViewportOffset] = useState(0); // Vertical pan offset (start at 0)
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false); // Changed from showUpcoming
  const [sidebarView, setSidebarView] = useState('upcoming'); // 'upcoming' or 'archive'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false); // For scroll indicator visibility
  const bottomBarRef = React.useRef(null); // For bottom bar horizontal scroll
  
  // Speed & Animation Controls
  const [speedMode, setSpeedMode] = useState('showcase'); // 'testing' (seconds), 'showcase' (hours), or 'production' (days)
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  // Search & Filters
  const [showSearch, setShowSearch] = useState(false);
  const [filterSort, setFilterSort] = useState('newest'); // 'newest', 'oldest', 'popular'
  const [filterGenre, setFilterGenre] = useState('all'); // 'all' or specific genre
  
  // Grid Layout State
  const [isGridMode, setIsGridMode] = useState(() => {
    // Restore grid mode from localStorage
    const saved = localStorage.getItem('isGridMode');
    return saved === 'true';
  });
  
  // Pop animation state
  const [poppedIslandId, setPoppedIslandId] = useState(null);
  
  // Archive Page & Submission Form
  const [showArchive, setShowArchive] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showRecruiterView, setShowRecruiterView] = useState(false);
  
  // Back to Top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Subscribe to Firebase real-time updates
  useEffect(() => {
    const unsubscribe = firebaseClient.onSnapshot((data) => {
      setIslands(data || []);
    });
    
    return unsubscribe;
  }, []);

  // Update current time for sidebar/badge refreshes (CSS animations handle visual smoothness)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Calculate island size based on transit days (shorter = larger, longer = smaller)
  const getIslandSize = (transitDays) => {
    // 1 day = largest (scale 1.1), 7 days = smallest (scale 0.72)
    const minScale = 0.72;
    const maxScale = 1.1;
    const scale = maxScale - ((transitDays - 1) / 6) * (maxScale - minScale);
    return scale;
  };

  // Calculate grid position for an island
  const getGridPosition = (index, totalIslands) => {
    // Responsive columns: 2 on mobile, 4 on tablet, 6 on desktop
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const cols = screenWidth < 640 ? 2 : screenWidth < 1024 ? 4 : 6;
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Calculate positions (centered grid)
    const gridWidth = 80; // Percentage of screen width
    const gridHeight = 70; // Percentage of screen height
    const startX = (100 - gridWidth) / 2;
    const startY = 10; // Start from top
    
    const colWidth = gridWidth / cols;
    const rowHeight = 15; // Spacing between rows
    
    const xPos = startX + (col * colWidth) + (colWidth / 2);
    const yPos = startY + (row * rowHeight);
    
    return { xPos, yPos };
  };

  // Handle filter activation (enter grid mode)
  const activateGridMode = (newSort, newGenre) => {
    setFilterSort(newSort);
    setFilterGenre(newGenre);
    setIsGridMode(true);
    localStorage.setItem('isGridMode', 'true');
  };

  // Reset to streaming mode
  const resetToStreaming = () => {
    setIsGridMode(false);
    setFilterSort('newest');
    setFilterGenre('all');
    setViewportOffset(0); // Reset viewport
    localStorage.setItem('isGridMode', 'false');
  };

  // Helper: Get speed multiplier based on current mode
  const getSpeedMultiplier = () => {
    switch(speedMode) {
      case 'testing': return 1000; // 1 day = 1 second
      case 'showcase': return 3600 * 1000; // 1 day = 1 hour
      case 'production': return 24 * 60 * 60 * 1000; // 1 day = 1 real day
      default: return 3600 * 1000; // Default to showcase
    }
  };

  // Pre-compute CSS animation properties once per island set (CSS engine handles the rest)
  const islandAnimProps = useMemo(() => {
    const multiplierMap = { testing: 1000, showcase: 3600 * 1000, production: 24 * 3600 * 1000 };
    const multiplier = multiplierMap[speedMode] || multiplierMap.showcase;
    const result = {};
    islands.forEach(island => {
      const duration = island.transitTime * multiplier;
      const elapsed = Date.now() - island.spawnTime;
      const cycleMs = ((elapsed % duration) + duration) % duration;
      result[island.id] = { duration, cycleMs };
    });
    return result;
  }, [islands, speedMode]);

  // Calculate island position using SERVER timestamp (synchronized across all users)
  // SHOWCASE MODE: Games move at visible speed (1 day = 1 hour)
  const getIslandPosition = (island) => {
    const elapsed = currentTime - island.spawnTime;
    const speedMultiplier = getSpeedMultiplier();
    const adjustedTransitTime = island.transitTime * speedMultiplier;
    const progress = (elapsed / adjustedTransitTime) % 1; // LOOP ENABLED
    return progress * 120 - 10; // -10% to 110% (enter/exit screen)
  };

  // Check if island is departing soon (last 10% of journey)
  const isDepartingSoon = (island) => {
    const elapsed = currentTime - island.spawnTime;
    const speedMultiplier = getSpeedMultiplier();
    const adjustedTransitTime = island.transitTime * speedMultiplier;
    const progress = (elapsed / adjustedTransitTime) % 1;
    return progress > 0.9;
  };

  // Check if island is arriving soon (first 20% of journey)
  const isArrivingSoon = (island) => {
    const elapsed = currentTime - island.spawnTime;
    const speedMultiplier = getSpeedMultiplier();
    const adjustedTransitTime = island.transitTime * speedMultiplier;
    const progress = (elapsed / adjustedTransitTime) % 1;
    return progress < 0.2; // Show "Just Arrived!" for first 20% of journey
  };

  // Admin: Add new island
  const handleAddIsland = async () => {
    const randomGame = SAMPLE_GAMES[Math.floor(Math.random() * SAMPLE_GAMES.length)];
    await firebaseClient.addIsland(randomGame);
  };

  // Admin: Remove island
  const handleRemoveIsland = async (islandId) => {
    await firebaseClient.removeIsland(islandId);
  };

  // Filter islands by search query
  const filteredIslands = islands.filter(island => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      island.title.toLowerCase().includes(query) ||
      island.creator.toLowerCase().includes(query) ||
      island.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Apply genre filter
  const genreFilteredIslands = filteredIslands.filter(island => {
    if (filterGenre === 'all') return true;
    return island.tags.some(tag => tag.toLowerCase().includes(filterGenre.toLowerCase()));
  });

  // Apply sorting
  const sortedIslands = [...genreFilteredIslands].sort((a, b) => {
    switch (filterSort) {
      case 'newest':
        return b.spawnTime - a.spawnTime; // Newest first
      case 'oldest':
        return a.spawnTime - b.spawnTime; // Oldest first
      case 'popular':
        // Sort by transit days (shorter = more popular/featured)
        return a.transitDays - b.transitDays;
      default:
        return 0;
    }
  });

  // Get visible islands (currently in viewport range -10% to 110%)
  const visibleIslands = sortedIslands.filter(island => {
    const xPos = getIslandPosition(island);
    return xPos >= -10 && xPos <= 110;
  });

  // Get archived islands (completed their journey, for demo purposes we'll show all islands)
  const archivedIslands = [...sortedIslands].reverse().slice(0, 20); // Last 20 islands

  // Get upcoming arrivals (islands in first 20% of journey)
  const upcomingArrivals = sortedIslands
    .map(island => {
      const elapsed = currentTime - island.spawnTime;
      const speedMultiplier = getSpeedMultiplier();
      const adjustedTransitTime = island.transitTime * speedMultiplier;
      const progress = (elapsed / adjustedTransitTime) % 1;
      return { ...island, progress, adjustedTransitTime };
    })
    .filter(island => island.progress < 0.2)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 5);

  // Get departing soon (islands in last 20% of journey)
  const departingSoon = islands
    .map(island => {
      const elapsed = currentTime - island.spawnTime;
      const speedMultiplier = getSpeedMultiplier();
      const adjustedTransitTime = island.transitTime * speedMultiplier;
      const progress = (elapsed / adjustedTransitTime) % 1;
      return { ...island, progress, adjustedTransitTime };
    })
    .filter(island => island.progress > 0.8)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  // Zoom to island - centers it in VISIBLE area (between header and footer) and pops it
  const zoomToIsland = (island) => {
    const screenHeight = window.innerHeight;
    const headerHeight = UI_CONSTANTS.HEADER_HEIGHT;
    const footerHeight = UI_CONSTANTS.FOOTER_HEIGHT;
    
    // Games spawn between 5-85% of screen height
    // We want to center them in the VISIBLE area (between header and footer)
    const visibleAreaHeight = screenHeight - headerHeight - footerHeight;
    const visibleCenterY = headerHeight + (visibleAreaHeight / 2);
    
    // Island's actual Y position on screen
    const islandY = (island.yOffset / 100) * screenHeight;
    
    // How much to shift to center it
    const shiftNeeded = visibleCenterY - islandY;
    
    // Apply shift with higher bounds
    setViewportOffset(Math.max(-UI_CONSTANTS.VIEWPORT_CLAMP, Math.min(UI_CONSTANTS.VIEWPORT_CLAMP, shiftNeeded)));
    
    // Trigger pop
    setPoppedIslandId(island.id);
    setTimeout(() => {
      setPoppedIslandId(null);
    }, UI_CONSTANTS.POP_DURATION);
  };

  // Viewport dragging handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientY - viewportOffset);
    setIsScrolling(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newOffset = e.clientY - dragStart;
    setViewportOffset(Math.max(-300, Math.min(300, newOffset))); // Limit pan range
    setIsScrolling(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const newOffset = viewportOffset - e.deltaY * 0.5;
    setViewportOffset(Math.max(-300, Math.min(300, newOffset)));
    setIsScrolling(true);
    
    // Show back to top if scrolled down significantly
    setShowBackToTop(newOffset < -50);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientY - viewportOffset);
    setIsScrolling(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const newOffset = e.touches[0].clientY - dragStart;
    setViewportOffset(Math.max(-300, Math.min(300, newOffset)));
    setIsScrolling(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Auto-hide scroll indicator after 1 second of no scrolling
  useEffect(() => {
    if (isScrolling) {
      const timer = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isScrolling, viewportOffset]);

  // Handle window resize for responsive grid
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation - Escape to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showSubmissionForm) {
          setShowSubmissionForm(false);
        } else if (showArchive) {
          if (selectedGame) {
            setSelectedGame(null); // Close detail modal first
          } else {
            setShowArchive(false); // Then close archive
          }
        } else if (selectedGame) {
          setSelectedGame(null);
        } else if (showSidebar) {
          setShowSidebar(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSubmissionForm, showArchive, selectedGame, showSidebar]);

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        /* Font Imports - Replace with your downloaded fonts */
        @import url('https://fonts.googleapis.com/css2?family=Righteous&family=Nunito:wght@400;600;700;800&display=swap');
        
        /* Font Families */
        :root {
          /* ShowPop substitute: Righteous (similar bold display font) */
          --font-display: 'Righteous', 'ShowPop', sans-serif;
          /* Roundex substitute: Nunito (similar rounded font) */
          --font-body: 'Nunito', 'Roundex', sans-serif;
        }
        
        /* Title/Display Font */
        .font-display {
          font-family: var(--font-display);
        }
        
        /* UI/Body Font */
        .font-body {
          font-family: var(--font-body);
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @keyframes popIsland {
          0% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .animate-pop {
          animation: popIsland 0.8s ease-in-out;
        }
        
        .animate-pulse-pop {
          animation: pulse 0.4s ease-in-out 3;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Background cloud drift - slow ambient movement for depth */
        @keyframes driftBgCloud {
          from { left: -22%; }
          to { left: 122%; }
        }

        /* CSS drift animation for island movement - buttery smooth, no JS updates needed */
        @keyframes driftAcross {
          from { left: -10%; }
          to { left: 110%; }
        }

        /* Island anchor - centering only, no transform conflicts */
        .island-anchor {
          transform: translate(-50%, -50%);
        }

        /* Island hover - brightness only so it doesn't conflict with scale/float transforms */
        .island-float {
          transition: filter 0.2s ease;
        }
        .island-float:hover {
          filter: brightness(1.08);
        }

        /* Hamburger Menu Morphing Animation */
        .hamburger-line {
          transition: all 0.3s ease-in-out;
          transform-origin: center;
        }
        
        .hamburger-top {
          transform: translateY(0) rotate(0);
        }
        
        .hamburger-middle {
          opacity: 1;
        }
        
        .hamburger-bottom {
          transform: translateY(0) rotate(0);
        }
        
        .hamburger-open .hamburger-top {
          transform: translateY(8px) rotate(45deg);
        }
        
        .hamburger-open .hamburger-middle {
          opacity: 0;
        }
        
        .hamburger-open .hamburger-bottom {
          transform: translateY(-8px) rotate(-45deg);
        }
        
        /* Button Press Animation */
        .btn-press:active {
          transform: scale(0.95);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      
    <div className="relative w-full h-screen bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 overflow-hidden">
      {/* Background clouds - slowly drifting for ambient depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { top: '7%',  w: 200, h: 88,  dur: 150, delay:  22, op: 0.28 },
          { top: '20%', w: 260, h: 100, dur: 200, delay:  68, op: 0.22 },
          { top: '34%', w: 170, h: 72,  dur: 130, delay:   9, op: 0.25 },
          { top: '48%', w: 230, h: 92,  dur: 180, delay:  95, op: 0.20 },
          { top: '62%', w: 190, h: 80,  dur: 160, delay:  40, op: 0.24 },
          { top: '76%', w: 215, h: 86,  dur: 140, delay:  55, op: 0.21 },
          { top: '13%', w: 150, h: 64,  dur: 110, delay:  80, op: 0.18 },
          { top: '88%', w: 240, h: 96,  dur: 190, delay:  30, op: 0.20 },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-2xl bg-white"
            style={{
              top: c.top,
              width: c.w,
              height: c.h,
              opacity: c.op,
              animationName: 'driftBgCloud',
              animationDuration: `${c.dur}s`,
              animationDelay: `-${c.delay}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      {/* Top Bar */}
      <div className="relative z-20 bg-gradient-to-b from-sky-900/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white font-display tracking-wide">Cloud Bound Gaming</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Archive Button */}
              <button
                onClick={() => setShowArchive(true)}
                className="text-white/90 hover:text-white px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold text-sm btn-press font-body"
              >
                Archive
              </button>

              {/* Recruiter View Button */}
              <button
                onClick={() => setShowRecruiterView(true)}
                className="text-white px-3 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 transition-all font-semibold text-sm btn-press shadow-lg font-body"
              >
                For Recruiters
              </button>

              {/* Submit Game Button - Golden CTA */}
              <button
                onClick={() => setShowSubmissionForm(true)}
                className="text-white px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 transition-all font-semibold text-sm btn-press shadow-lg font-body"
              >
                Submit Game
              </button>
              
              {/* Search Icon */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="text-white/90 hover:text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors btn-press"
                aria-label="Search"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
              
              {/* Hamburger Menu with Morphing Animation */}
              <button
                onClick={() => {
                  setShowSidebar(!showSidebar);
                }}
                className="text-white/90 hover:text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors w-10 h-10 flex items-center justify-center btn-press"
                aria-label="Menu"
              >
                <div className={`w-6 h-5 flex flex-col justify-between ${showSidebar ? 'hamburger-open' : ''}`}>
                  <span className="hamburger-line hamburger-top w-full h-0.5 bg-current rounded-full"></span>
                  <span className="hamburger-line hamburger-middle w-full h-0.5 bg-current rounded-full"></span>
                  <span className="hamburger-line hamburger-bottom w-full h-0.5 bg-current rounded-full"></span>
                </div>
              </button>
            </div>
          </div>

          {/* Search Bar - Collapsible */}
          {showSearch && (
            <div className="relative mb-3 animate-slideDown">
              <input
                type="text"
                placeholder="Search games, creators, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                // TODO: Add debouncing when game count > 100 for better performance
                className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-md text-white placeholder-white/60 border-2 border-white/30 focus:border-white/60 focus:outline-none transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Reset Button - Only show in grid mode */}
            {isGridMode && (
              <button
                onClick={resetToStreaming}
                className="px-4 py-1 rounded-full text-xs font-semibold transition-all bg-red-500 text-white hover:bg-red-600 btn-press whitespace-nowrap"
              >
                ← Reset Stream
              </button>
            )}
            
            <span className="text-white/70 text-xs font-semibold whitespace-nowrap">Sort:</span>
            <button
              onClick={() => activateGridMode('newest', filterGenre)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press ${
                filterSort === 'newest' && isGridMode
                  ? 'bg-white text-sky-900'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => activateGridMode('oldest', filterGenre)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press ${
                filterSort === 'oldest' && isGridMode
                  ? 'bg-white text-sky-900'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              Oldest
            </button>
            <button
              onClick={() => activateGridMode('popular', filterGenre)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press ${
                filterSort === 'popular' && isGridMode
                  ? 'bg-white text-sky-900'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              Popular
            </button>
            
            <span className="text-white/70 text-xs font-semibold whitespace-nowrap ml-2">Genre:</span>
            <button
              onClick={() => activateGridMode(filterSort, 'all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press ${
                filterGenre === 'all' && isGridMode
                  ? 'bg-white text-sky-900'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              All
            </button>
            <button
              onClick={() => activateGridMode(filterSort, 'action')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press ${
                filterGenre === 'action' && isGridMode
                  ? 'bg-white text-sky-900'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              Action
            </button>
            <button
              onClick={() => activateGridMode(filterSort, 'puzzle')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press ${
                filterGenre === 'puzzle' && isGridMode
                  ? 'bg-white text-sky-900'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              Puzzle
            </button>
            <button
              onClick={() => activateGridMode(filterSort, 'platformer')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press ${
                filterGenre === 'platformer' && isGridMode
                  ? 'bg-white text-sky-900'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              Platformer
            </button>
          </div>

          <p className="text-white/70 text-xs mt-2 text-center font-body">
            {isGridMode ? (
              <>Grid View: {sortedIslands.length} games • Click "Reset Stream" to return</>
            ) : (
              <>Discover games as they drift through the clouds • {sortedIslands.length} games floating</>
            )}
          </p>
        </div>
      </div>

      {/* Main Viewport - Draggable */}
      <div 
        className={`relative w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Scroll Position Indicator - Bell Curve Shape */}
        {isScrolling && (
          <div className="fixed right-0 top-0 bottom-24 w-4 pointer-events-none z-35 transition-opacity duration-300">
            <div 
              className="absolute right-0 w-3 h-8 transition-all duration-150"
              style={{
                top: `${((300 - viewportOffset) / 600) * (window.innerHeight - 120 - 96)}px`,
                background: 'radial-gradient(ellipse at right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, transparent 60%)'
              }}
            />
          </div>
        )}
        
        {/* Cloud Portals - Entry (Left) and Exit (Right) */}
        {!isGridMode && (
          <>
            {/* Left Cloud Column (Entry Portal) - wall of clouds */}
            <div className="absolute left-0 top-0 bottom-0 w-48 pointer-events-none z-30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-100/70 via-sky-50/30 to-transparent" />
              {[
                { top: '-6%',  left: -22, w: 200, h: 100, op: 0.93 },
                { top:  '3%',  left:  12, w: 170, h:  85, op: 0.86 },
                { top: '10%',  left: -18, w: 210, h: 105, op: 0.94 },
                { top: '18%',  left:   4, w: 180, h:  90, op: 0.88 },
                { top: '26%',  left: -26, w: 205, h: 102, op: 0.91 },
                { top: '34%',  left:   8, w: 175, h:  88, op: 0.85 },
                { top: '42%',  left: -14, w: 215, h: 108, op: 0.93 },
                { top: '50%',  left:  -4, w: 185, h:  93, op: 0.89 },
                { top: '58%',  left: -20, w: 200, h: 100, op: 0.91 },
                { top: '66%',  left:  10, w: 170, h:  85, op: 0.86 },
                { top: '74%',  left: -16, w: 210, h: 105, op: 0.92 },
                { top: '82%',  left:   2, w: 180, h:  90, op: 0.87 },
                { top: '90%',  left: -24, w: 205, h: 102, op: 0.90 },
                { top: '98%',  left:   6, w: 175, h:  88, op: 0.85 },
              ].map((c, i) => (
                <div key={i} style={{ position: 'absolute', top: c.top, left: c.left, width: c.w, height: c.h }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: `rgba(255,255,255,${c.op})`, borderRadius: 12, filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '25%', left: '5%',  width: '36%', height: '70%', background: `rgba(255,255,255,${c.op})`,        borderRadius: '50%', filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '30%', left: '28%', width: '46%', height: '84%', background: `rgba(255,255,255,${c.op})`,        borderRadius: '50%', filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '18%', right: '4%', width: '35%', height: '62%', background: `rgba(255,255,255,${c.op * 0.9})`, borderRadius: '50%', filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '35%', left: '55%', width: '28%', height: '52%', background: `rgba(255,255,255,${c.op * 0.85})`, borderRadius: '50%', filter: 'blur(5px)' }} />
                </div>
              ))}
            </div>
            
            {/* Right Cloud Column (Exit Portal) - wall of clouds */}
            <div className="absolute right-0 top-0 bottom-0 w-48 pointer-events-none z-30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-l from-sky-100/70 via-sky-50/30 to-transparent" />
              {[
                { top: '-4%',  right: -20, w: 195, h:  98, op: 0.91 },
                { top:  '5%',  right:   8, w: 168, h:  84, op: 0.86 },
                { top: '12%',  right: -16, w: 208, h: 104, op: 0.93 },
                { top: '20%',  right:   2, w: 178, h:  89, op: 0.88 },
                { top: '28%',  right: -24, w: 202, h: 101, op: 0.91 },
                { top: '36%',  right:  10, w: 172, h:  86, op: 0.84 },
                { top: '44%',  right: -12, w: 212, h: 106, op: 0.93 },
                { top: '52%',  right:  -2, w: 183, h:  92, op: 0.89 },
                { top: '60%',  right: -18, w: 198, h:  99, op: 0.91 },
                { top: '68%',  right:   7, w: 168, h:  84, op: 0.85 },
                { top: '76%',  right: -14, w: 208, h: 104, op: 0.92 },
                { top: '84%',  right:   4, w: 178, h:  89, op: 0.87 },
                { top: '92%',  right: -22, w: 202, h: 101, op: 0.90 },
                { top: '100%', right:   5, w: 172, h:  86, op: 0.84 },
              ].map((c, i) => (
                <div key={i} style={{ position: 'absolute', top: c.top, right: c.right, width: c.w, height: c.h }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: `rgba(255,255,255,${c.op})`, borderRadius: 12, filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '25%', left: '5%',  width: '36%', height: '70%', background: `rgba(255,255,255,${c.op})`,        borderRadius: '50%', filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '30%', left: '28%', width: '46%', height: '84%', background: `rgba(255,255,255,${c.op})`,        borderRadius: '50%', filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '18%', right: '4%', width: '35%', height: '62%', background: `rgba(255,255,255,${c.op * 0.9})`, borderRadius: '50%', filter: 'blur(4px)' }} />
                  <div style={{ position: 'absolute', bottom: '35%', left: '55%', width: '28%', height: '52%', background: `rgba(255,255,255,${c.op * 0.85})`, borderRadius: '50%', filter: 'blur(5px)' }} />
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Floating Islands */}
        <div
          className="absolute inset-0 transition-transform duration-150"
          style={{
            transform: isGridMode ? 'translateY(0px)' : `translateY(${viewportOffset}px)`,
            maskImage: !isGridMode
              ? 'linear-gradient(to bottom, transparent 0%, white 70px, white calc(100% - 70px), transparent 100%), linear-gradient(to right, transparent 0px, white 192px, white calc(100% - 192px), transparent 100%)'
              : 'none',
            WebkitMaskImage: !isGridMode
              ? 'linear-gradient(to bottom, transparent 0%, white 70px, white calc(100% - 70px), transparent 100%), linear-gradient(to right, transparent 0px, white 192px, white calc(100% - 192px), transparent 100%)'
              : 'none',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'destination-in',
          }}
        >
          {sortedIslands.map((island, index) => {
            const isDeparting = isDepartingSoon(island);
            const isArriving = isArrivingSoon(island);
            const islandSize = getIslandSize(island.transitDays);
            const isPopped = poppedIslandId === island.id;
            const animProps = islandAnimProps[island.id];

            // Outer div: handles position only (CSS anim for stream, inline for grid)
            let outerStyle;
            if (isGridMode) {
              const gridPos = getGridPosition(index, sortedIslands.length);
              outerStyle = {
                left: `${gridPos.xPos}%`,
                top: `${gridPos.yPos}%`,
                animation: 'none',
                transition: 'left 1.2s ease-in-out, top 1.2s ease-in-out',
              };
            } else if (animProps) {
              outerStyle = {
                top: `${island.yOffset}%`,
                animationName: 'driftAcross',
                animationDuration: `${animProps.duration}ms`,
                animationDelay: `-${animProps.cycleMs}ms`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationPlayState: animationsEnabled ? 'running' : 'paused',
              };
            } else {
              outerStyle = { top: `${island.yOffset}%`, left: '50%' };
            }

            return (
              <div
                key={island.id}
                className="absolute island-anchor"
                style={{
                  ...outerStyle,
                  zIndex: isPopped ? 9999 : (isGridMode ? 10 : Math.floor(island.yOffset)),
                }}
              >
                {/* Scale + effects wrapper — separate element so it doesn't conflict with drift or float */}
                <div
                  className={isPopped ? 'animate-pulse-pop' : ''}
                  style={{
                    transform: `scale(${islandSize * (isPopped ? UI_CONSTANTS.POP_SCALE : 1)})`,
                    transition: 'transform 0.5s ease-out, filter 0.3s ease, box-shadow 0.3s ease',
                    filter: isPopped
                      ? 'drop-shadow(0 0 40px rgba(255, 215, 0, 1)) drop-shadow(0 0 80px rgba(255, 140, 0, 0.6)) brightness(1.3) contrast(1.2)'
                      : 'none',
                    boxShadow: isPopped
                      ? '0 0 0 4px rgba(255, 215, 0, 0.8), 0 0 0 8px rgba(255, 215, 0, 0.4), 0 20px 60px rgba(0, 0, 0, 0.4)'
                      : 'none',
                    willChange: isPopped ? 'transform, filter, box-shadow' : 'auto',
                  }}
                >
                  {/* Float + click wrapper — float animation only does translateY now, no conflicts */}
                  <div
                    className={`island-float cursor-pointer ${animationsEnabled && !isGridMode ? 'animate-float' : ''}`}
                    style={{ animationDelay: `${(index % 5) * 1.2}s` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGame(island);
                    }}
                  >
                    {/* Island shadow */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/20 rounded-full blur-md"></div>

                    {/* Status indicator */}
                    {isDeparting && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap animate-pulse">
                        Departing Soon!
                      </div>
                    )}
                    {isArriving && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        Just Arrived!
                      </div>
                    )}

                    {/* Island base */}
                    <div className="relative">
                      {(() => {
                        const themeName = getIslandTheme(island.tags);
                        const theme = ISLAND_THEMES[themeName];
                        return (
                          <div
                            className="w-48 h-36 shadow-2xl transition-shadow"
                            style={{
                              background: `linear-gradient(to bottom, ${theme.gradFrom}, ${theme.gradTo})`,
                              borderRadius: theme.shape,
                              transform: theme.skew,
                            }}
                          >
                            {/* Genre icon at peak */}
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 drop-shadow-lg">
                              <svg viewBox="0 0 20 20" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                {getThemeIcon(themeName)}
                              </svg>
                            </div>
                            {/* Game thumbnail on island */}
                            <div
                              className="absolute inset-4 bg-white rounded-lg overflow-hidden shadow-lg border-4"
                              style={{ borderColor: theme.border }}
                            >
                              <img
                                src={island.thumbnail}
                                alt={island.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Island details */}
                            <div
                              className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white/95 rounded-lg px-4 py-2 shadow-lg w-44 text-center border-2"
                              style={{ borderColor: theme.border }}
                            >
                              <h3 className="font-bold text-gray-800 text-sm truncate font-body">{island.title}</h3>
                              <p className="text-xs text-gray-600 font-body">{island.creator}</p>
                              <p className="text-xs font-semibold mt-1 font-body" style={{ color: theme.gradFrom }}>
                                {island.transitDays} day journey
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {sortedIslands.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="text-6xl mb-4">☁️</div>
              <p className="text-sky-700 text-2xl font-bold mb-2">
                {searchQuery ? 'No games match your search' : 
                 isGridMode && filterGenre !== 'all' ? `No ${filterGenre} games found` :
                 'No games drifting by'}
              </p>
              <p className="text-sky-600 mb-4">
                {searchQuery ? `We couldn't find any games matching "${searchQuery}"` :
                 isGridMode && filterGenre !== 'all' ? `Try selecting a different genre or view all games` :
                 'Games will appear as they drift through the clouds'}
              </p>
              {(searchQuery || isGridMode) && (
                <div className="flex gap-3 justify-center">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  {isGridMode && (
                    <button
                      onClick={resetToStreaming}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      View All Games
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Detail Modal */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedGame(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-bold text-gray-800">{selectedGame.title}</h2>
              <button 
                onClick={() => setSelectedGame(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <img 
              src={selectedGame.thumbnail} 
              alt={selectedGame.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 font-semibold">Created by</p>
                <p className="text-gray-800">{selectedGame.creator}</p>
              </div>
              
              <div>
                <p className="text-gray-600 font-semibold">Description</p>
                <p className="text-gray-800">{selectedGame.description}</p>
              </div>
              
              <div>
                <p className="text-gray-600 font-semibold mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedGame.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-gray-600 font-semibold">Journey Duration</p>
                <p className="text-gray-800">{selectedGame.transitDays} days to cross the sky</p>
              </div>
              
              <div className="flex gap-3">
                <a 
                  href={selectedGame.gameUrl || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all text-center"
                >
                  Play Game →
                </a>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href + '?game=' + selectedGame.id);
                    alert('Game link copied to clipboard!');
                  }}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                  title="Share game"
                >
                  🔗 Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && !isGridMode && (
        <button
          onClick={() => {
            setViewportOffset(0);
            setShowBackToTop(false);
          }}
          className="fixed bottom-56 right-24 bg-sky-600/90 hover:bg-sky-700 text-white p-3 rounded-full shadow-lg z-40 backdrop-blur-sm transition-all hover:scale-110"
          title="Back to top"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
      )}


      {/* SIDEBAR - Click outside to close */}
      {showSidebar && (
        <>
          {/* Backdrop - click to close */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="fixed top-20 right-8 w-80 bg-white rounded-xl shadow-2xl border-2 border-sky-300 flex flex-col z-50" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            {/* Tabs */}
            <div className="flex border-b border-sky-200 bg-sky-50 flex-shrink-0">
              <button
                onClick={() => setSidebarView('upcoming')}
                className={`flex-1 py-3 px-4 font-semibold text-sm transition-colors ${
                  sidebarView === 'upcoming'
                    ? 'bg-sky-600 text-white border-b-2 border-sky-700'
                    : 'text-gray-600 hover:bg-sky-100'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setSidebarView('archive')}
                className={`flex-1 py-3 px-4 font-semibold text-sm transition-colors ${
                  sidebarView === 'archive'
                    ? 'bg-sky-600 text-white border-b-2 border-sky-700'
                    : 'text-gray-600 hover:bg-sky-100'
                }`}
              >
                Archive
              </button>
            </div>
          
          {/* Upcoming Tab Content */}
          {sidebarView === 'upcoming' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white min-h-0">
              <div>
                <p className="text-xs text-gray-600 mb-2 font-semibold">Arriving Soon</p>
                {upcomingArrivals.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No islands arriving soon</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingArrivals.map((island) => {
                      const timeUntilVisible = island.adjustedTransitTime * (0.1 - island.progress);
                      const hoursRemaining = Math.floor(timeUntilVisible / (1000 * 60 * 60));
                      const minutesRemaining = Math.floor(timeUntilVisible / (1000 * 60));
                      const displayTime = speedMode === 'testing' 
                        ? `${minutesRemaining}min`
                        : `${hoursRemaining}h`;
                      
                      return (
                        <div
                          key={island.id}
                          className="bg-sky-50 rounded-lg p-2 shadow-sm border border-sky-200 hover:border-sky-400 transition-colors cursor-pointer"
                          onClick={() => {
                            zoomToIsland(island);
                            setSelectedGame(island);
                          }}
                        >
                          <div className="flex gap-2 items-center">
                            <img
                              src={island.thumbnail}
                              alt={island.title}
                              className="w-12 h-12 object-cover rounded border-2 border-yellow-500"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 text-xs truncate">{island.title}</h4>
                              <p className="text-xs text-green-600 font-semibold">
                                ~{displayTime} away
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {departingSoon.length > 0 && (
                <div className="pt-3 mt-3 border-t border-sky-200">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">⚠️ Departing Soon</p>
                  <div className="space-y-2">
                    {departingSoon.map((island) => {
                      const timeUntilGone = island.adjustedTransitTime * (1 - island.progress);
                      const hoursRemaining = Math.floor(timeUntilGone / (1000 * 60 * 60));

                      return (
                        <div
                          key={island.id}
                          className="bg-red-50 rounded-lg p-2 shadow-sm border border-red-200 hover:border-red-400 transition-colors cursor-pointer"
                          onClick={() => {
                            zoomToIsland(island);
                            setSelectedGame(island);
                          }}
                        >
                          <div className="flex gap-2 items-center">
                            <img
                              src={island.thumbnail}
                              alt={island.title}
                              className="w-12 h-12 object-cover rounded border-2 border-red-500"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 text-xs truncate">{island.title}</h4>
                              <p className="text-xs text-red-600 font-semibold">
                                Gone in ~{hoursRemaining}h
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Archive Tab Content - WITH PROPER SCROLLING */}
          {sidebarView === 'archive' && (
            <div className="flex-1 overflow-y-auto p-4 bg-white min-h-0">
              <p className="text-xs text-gray-600 mb-3">Previously featured games</p>
              <div className="space-y-2">
                {archivedIslands.slice(0, 10).map((island) => (
                  <div
                    key={island.id}
                    className="bg-gray-50 rounded-lg p-2 shadow-sm border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => setSelectedGame(island)}
                  >
                    <div className="flex gap-2 items-center">
                      <img
                        src={island.thumbnail}
                        alt={island.title}
                        className="w-12 h-12 object-cover rounded border-2 border-gray-400"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-xs truncate">{island.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{island.creator}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {archivedIslands.length > 10 && (
                <button 
                  onClick={() => {
                    setShowArchive(true);
                    setShowSidebar(false);
                  }}
                  className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 btn-press"
                >
                  View Full Archive Page →
                </button>
              )}
            </div>
          )}
        </div>
        </>
      )}

      {/* Bottom Game List - Full Width Bar with Horizontal Scrolling */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-sky-900/95 via-indigo-800/95 to-sky-800/90 backdrop-blur-md border-t-2 border-sky-700 z-30 shadow-2xl">
        <div className="max-w-full px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-white text-xs">Currently Visible</h3>
              <p className="text-white/70 text-xs">{visibleIslands.length} islands • Click to center</p>
            </div>
          </div>
          
          <div 
            ref={bottomBarRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent hover:scrollbar-thumb-white/50"
            onWheel={(e) => {
              // Enable horizontal scrolling with mouse wheel
              if (bottomBarRef.current) {
                e.preventDefault();
                bottomBarRef.current.scrollLeft += e.deltaY;
              }
            }}
          >
            {visibleIslands.length === 0 ? (
              <div className="w-full text-center py-3">
                <p className="text-white/70 text-xs">No islands in view - scroll up/down to explore</p>
              </div>
            ) : (
              visibleIslands.map((island) => (
                <div
                  key={island.id}
                  className="flex-shrink-0 w-28 bg-white/10 backdrop-blur-sm rounded-lg p-2 shadow-lg border-2 border-white/20 hover:border-yellow-500 transition-all cursor-pointer hover:scale-105 hover:bg-white/20 btn-press"
                  onClick={() => {
                    zoomToIsland(island);
                    // DON'T open modal - just zoom to it
                  }}
                >
                  <img
                    src={island.thumbnail}
                    alt={island.title}
                    className="w-full h-16 object-cover rounded border-2 border-yellow-500 mb-1 shadow-md"
                  />
                  <h4 className="font-semibold text-white text-xs truncate">{island.title}</h4>
                  <p className="text-white/70 text-xs truncate">{island.creator}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recruiter View - Full Screen */}
      {showRecruiterView && (
        <RecruiterViewComponent
          games={islands}
          onClose={() => setShowRecruiterView(false)}
          onSelectGame={(game) => {
            setSelectedGame(game);
          }}
          selectedGame={selectedGame}
          onCloseModal={() => setSelectedGame(null)}
        />
      )}

      {/* Archive Page - Full Screen */}
      {showArchive && (
        <ArchivePageComponent 
          games={islands}
          onClose={() => setShowArchive(false)}
          onSelectGame={(game) => {
            setSelectedGame(game);
            // DON'T close archive - stay on the page
          }}
          selectedGame={selectedGame}
          onCloseModal={() => setSelectedGame(null)}
        />
      )}

      {/* Game Submission Form */}
      {showSubmissionForm && (
        <GameSubmissionFormComponent
          onClose={() => setShowSubmissionForm(false)}
          onSubmit={async (gameData) => {
            // console.log('New game submitted:', gameData); // Uncomment for debugging
            // Add the game directly to the stream
            await firebaseClient.addIsland(gameData);
            alert('Game submitted successfully! It will appear in the stream shortly.');
          }}
        />
      )}
    </div>
    </>
  );
};

// Archive Page Component (Embedded)
const ArchivePageComponent = ({ games, onClose, onSelectGame, selectedGame, onCloseModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 24;

  const allGenres = ['all', ...new Set(games.flatMap(game => game.tags.map(tag => tag.toLowerCase())))];

  const filteredGames = games.filter(game => {
    const matchesSearch = !searchQuery || 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = filterGenre === 'all' || 
      game.tags.some(tag => tag.toLowerCase() === filterGenre);
    return matchesSearch && matchesGenre;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'newest': return b.spawnTime - a.spawnTime;
      case 'oldest': return a.spawnTime - b.spawnTime;
      case 'title': return a.title.localeCompare(b.title);
      case 'creator': return a.creator.localeCompare(b.creator);
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sortedGames.length / gamesPerPage);
  const startIndex = (currentPage - 1) * gamesPerPage;
  const displayedGames = sortedGames.slice(startIndex, startIndex + gamesPerPage);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 z-50 overflow-hidden flex flex-col">
      <div className="bg-gradient-to-b from-sky-900/90 to-sky-800/80 backdrop-blur-sm border-b-2 border-sky-700 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-white/90 hover:text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-white">Game Archive</h1>
            </div>
            <button onClick={onClose} className="text-white/90 hover:text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search games, creators, or tags..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-3 rounded-lg bg-white/20 backdrop-blur-md text-white placeholder-white/60 border-2 border-white/30 focus:border-white/60 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                <X size={20} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/70 text-xs font-semibold">Genre:</span>
              {allGenres.slice(0, 6).map(genre => (
                <button
                  key={genre}
                  onClick={() => { setFilterGenre(genre); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    filterGenre === genre ? 'bg-white text-sky-900' : 'bg-white/20 text-white/80 hover:bg-white/30'
                  }`}
                >
                  {genre.charAt(0).toUpperCase() + genre.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-xs font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 text-white border-2 border-white/30 focus:border-white/60 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="creator">Creator A-Z</option>
              </select>
            </div>
          </div>
          <p className="text-white/70 text-xs mt-3">
            Showing {displayedGames.length} of {sortedGames.length} games
            {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {displayedGames.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sky-700 text-xl font-semibold mb-2">No games found</p>
              <button onClick={() => { setSearchQuery(''); setFilterGenre('all'); setCurrentPage(1); }} className="mt-4 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg font-semibold">
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {displayedGames.map((game) => (
                <div key={game.id} className="bg-white rounded-xl shadow-lg border-2 border-sky-200 overflow-hidden hover:border-yellow-500 hover:scale-105 transition-all cursor-pointer group" onClick={() => onSelectGame(game)}>
                  <div className="relative">
                    <img src={game.thumbnail} alt={game.title} className="w-full h-32 object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{game.title}</h3>
                    <p className="text-xs text-gray-600 truncate">{game.creator}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {game.tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pb-8">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className={`px-4 py-2 rounded-lg font-semibold text-sm ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-sky-700 hover:bg-sky-50 border-2 border-sky-300'}`}>
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-lg font-semibold text-sm ${currentPage === pageNum ? 'bg-sky-600 text-white' : 'bg-white text-sky-700 hover:bg-sky-50 border-2 border-sky-300'}`}>
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className={`px-4 py-2 rounded-lg font-semibold text-sm ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-white text-sky-700 hover:bg-sky-50 border-2 border-sky-300'}`}>
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Game Detail Modal - Shows on top of Archive */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <button
                onClick={onCloseModal}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10"
              >
                <X size={24} />
              </button>
              
              <img 
                src={selectedGame.thumbnail} 
                alt={selectedGame.title}
                className="w-full h-64 object-cover rounded-t-xl"
              />
              
              <div className="p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedGame.title}</h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 font-semibold">Created by</p>
                    <p className="text-gray-800">{selectedGame.creator}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 font-semibold">Description</p>
                    <p className="text-gray-800">{selectedGame.description}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 font-semibold mb-2">Tags</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedGame.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-600 font-semibold">Journey Length</p>
                    <p className="text-gray-800">{selectedGame.transitDays} {selectedGame.transitDays === 1 ? 'day' : 'days'}</p>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    <a 
                      href={selectedGame.gameUrl || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all text-center"
                    >
                      Play Game →
                    </a>
                    
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href + '?game=' + selectedGame.id);
                        alert('Game link copied to clipboard!');
                      }}
                      className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                      title="Share game"
                    >
                      🔗 Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Recruiter View Component
const RecruiterViewComponent = ({ games, onClose, onSelectGame, selectedGame, onCloseModal }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const developers = useMemo(() => {
    const devMap = {};
    games.forEach(game => {
      const key = game.creator;
      if (!devMap[key]) {
        devMap[key] = { name: key, games: [], techStack: new Set(), tags: new Set() };
      }
      devMap[key].games.push(game);
      if (Array.isArray(game.techStack)) {
        game.techStack.forEach(t => devMap[key].techStack.add(t));
      }
      game.tags.forEach(t => devMap[key].tags.add(t));
    });
    return Object.values(devMap)
      .filter(dev => !searchQuery || dev.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.games.length - a.games.length);
  }, [games, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #0c1445 0%, #1a1050 50%, #0d2137 100%)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Developer Showcase</h1>
            <p className="text-white/40 text-sm">{developers.length} developers · {games.length} games</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search developers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 focus:border-white/50 focus:outline-none text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Developer cards */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {developers.length === 0 ? (
          <div className="text-center py-20 text-white/40">No developers found</div>
        ) : developers.map(dev => {
          const techList = [...dev.techStack];
          const genreList = [...dev.tags];
          const theme = ISLAND_THEMES[getIslandTheme([...dev.tags])];

          return (
            <div key={dev.name} className="rounded-2xl border border-white/10 overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {/* LEFT: Developer profile */}
              <div className="flex-shrink-0 w-56 p-5 border-r border-white/10">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3 text-white text-xl font-bold shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${theme.gradFrom}, ${theme.gradTo})`, boxShadow: `0 0 24px ${theme.glow}` }}
                >
                  {dev.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-white text-base leading-snug">{dev.name}</h3>
                <p className="text-white/40 text-xs mt-0.5">{dev.games.length} game{dev.games.length !== 1 ? 's' : ''}</p>

                {/* Tech stack */}
                {techList.length > 0 && (
                  <div className="mt-3">
                    <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-1.5">Tech Stack</p>
                    <div className="flex flex-wrap gap-1">
                      {techList.map(tech => (
                        <span
                          key={tech}
                          className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ background: theme.glow, color: theme.border, border: `1px solid ${theme.border}50` }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Genres */}
                <div className="mt-3">
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-1.5">Genres</p>
                  <div className="flex flex-wrap gap-1">
                    {genreList.slice(0, 8).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Floating mini islands */}
              <div className="flex-1 p-5 min-w-0">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-4">Games</p>
                <div className="flex gap-5 overflow-x-auto pb-3">
                  {dev.games.map((game, gi) => {
                    const gTheme = ISLAND_THEMES[getIslandTheme(game.tags)];
                    return (
                      <div
                        key={game.id}
                        className="flex-shrink-0 w-36 cursor-pointer group"
                        onClick={() => onSelectGame(game)}
                      >
                        {/* Mini floating island */}
                        <div className="relative animate-float" style={{ animationDelay: `${gi * 0.9}s` }}>
                          <div
                            className="w-36 h-28 rounded-t-full transform -skew-x-2 shadow-2xl group-hover:scale-105 transition-transform duration-200"
                            style={{ background: `linear-gradient(to bottom, ${gTheme.gradFrom}, ${gTheme.gradTo})` }}
                          >
                            <div className="absolute inset-2 rounded overflow-hidden" style={{ border: `3px solid ${gTheme.border}` }}>
                              <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover" />
                            </div>
                          </div>
                          {/* Shadow */}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-3 rounded-full blur-sm" style={{ background: 'rgba(0,0,0,0.4)' }} />
                        </div>
                        <div className="mt-4 px-1">
                          <p className="text-white text-xs font-semibold truncate">{game.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {game.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: gTheme.glow, color: gTheme.border }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Game detail modal on top */}
      {selectedGame && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <button onClick={onCloseModal} className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg z-10">
                <X size={20} />
              </button>
              <img src={selectedGame.thumbnail} alt={selectedGame.title} className="w-full h-52 object-cover rounded-t-xl" />
              <div className="p-5">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedGame.title}</h2>
                <p className="text-gray-500 text-sm mb-3">by {selectedGame.creator}</p>
                <p className="text-gray-700 text-sm mb-3">{selectedGame.description}</p>
                {selectedGame.techStack && selectedGame.techStack.length > 0 && (
                  <div className="mb-3">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1.5">Tech Stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedGame.techStack.map(t => (
                        <span key={t} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedGame.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700">{tag}</span>
                  ))}
                </div>
                <a
                  href={selectedGame.gameUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all text-center"
                >
                  Play Game →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Game Submission Form Component (Embedded)
const GameSubmissionFormComponent = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '', creator: '', thumbnail: '', description: '', tags: [], techStack: '', transitDays: 3, gameUrl: '', email: ''
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const commonTags = ['Action', 'Adventure', 'Puzzle', 'Platformer', 'Strategy', 'RPG', 'Shooter', 'Simulation', 'Sports', 'Racing', 'Horror', 'Casual', 'Arcade', 'Fighting', 'Stealth', 'Rhythm', 'Music', 'Educational', 'Multiplayer', 'Retro'];

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.creator.trim()) newErrors.creator = 'Creator name is required';
    if (!formData.thumbnail.trim()) newErrors.thumbnail = 'Thumbnail URL is required';
    else if (!isValidUrl(formData.thumbnail)) newErrors.thumbnail = 'Please enter a valid URL';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length > 200) newErrors.description = 'Description must be under 200 characters';
    if (formData.tags.length === 0) newErrors.tags = 'At least one tag is required';
    if (formData.tags.length > 5) newErrors.tags = 'Maximum 5 tags allowed';
    if (!formData.gameUrl.trim()) newErrors.gameUrl = 'Game URL is required';
    else if (!isValidUrl(formData.gameUrl)) newErrors.gameUrl = 'Please enter a valid URL';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a valid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => { try { new URL(string); return true; } catch (_) { return false; } };
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddTag = (tag) => {
    if (formData.tags.length < 5 && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setErrors({ ...errors, tags: undefined });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => onClose(), 2000);
    }, 1000);
  };

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
          <p className="text-gray-600">Your game has been submitted and will appear on the island stream soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="bg-gradient-to-r from-sky-600 to-purple-600 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Submit Your Game</h2>
              <p className="text-white/80 text-sm">Share your creation with the community</p>
            </div>
            <button onClick={onClose} className="text-white/90 hover:text-white p-2 rounded-lg bg-white/10 hover:bg-white/20">
              <X size={24} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Game Title <span className="text-red-500">*</span></label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={`w-full px-4 py-2 rounded-lg border-2 ${errors.title ? 'border-red-500' : 'border-gray-300'} focus:border-sky-500 focus:outline-none`} placeholder="My Awesome Game" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Creator / Studio Name <span className="text-red-500">*</span></label>
            <input type="text" value={formData.creator} onChange={(e) => setFormData({ ...formData, creator: e.target.value })} className={`w-full px-4 py-2 rounded-lg border-2 ${errors.creator ? 'border-red-500' : 'border-gray-300'} focus:border-sky-500 focus:outline-none`} placeholder="Your Name or Studio" />
            {errors.creator && <p className="text-red-500 text-xs mt-1">{errors.creator}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Thumbnail Image URL <span className="text-red-500">*</span></label>
            <input type="url" value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} className={`w-full px-4 py-2 rounded-lg border-2 ${errors.thumbnail ? 'border-red-500' : 'border-gray-300'} focus:border-sky-500 focus:outline-none`} placeholder="https://i.imgur.com/yourimage.jpg" />
            {errors.thumbnail && <p className="text-red-500 text-xs mt-1">{errors.thumbnail}</p>}
            {formData.thumbnail && isValidUrl(formData.thumbnail) && (
              <img src={formData.thumbnail} alt="Preview" className="mt-2 w-32 h-24 object-cover rounded border-2 border-gray-300" />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`w-full px-4 py-2 rounded-lg border-2 ${errors.description ? 'border-red-500' : 'border-gray-300'} focus:border-sky-500 focus:outline-none resize-none`} placeholder="Brief description..." rows="3" maxLength="200" />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
              <p className="text-xs text-gray-500 ml-auto">{formData.description.length}/200</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tags <span className="text-red-500">*</span> <span className="text-gray-500 font-normal">(Select up to 5)</span></label>
            {formData.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3 p-3 bg-gray-50 rounded-lg">
                {formData.tags.map(tag => (
                  <span key={tag} className="bg-sky-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:bg-sky-700 rounded-full p-0.5">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {commonTags.map(tag => (
                <button key={tag} type="button" onClick={() => handleAddTag(tag)} disabled={formData.tags.includes(tag) || formData.tags.length >= 5} className={`px-3 py-1 rounded-full text-xs font-semibold ${formData.tags.includes(tag) || formData.tags.length >= 5 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-sky-100 hover:text-sky-700'}`}>
                  {tag}
                </button>
              ))}
            </div>
            {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tech Stack <span className="text-gray-400 font-normal">(optional — comma separated)</span></label>
            <input type="text" value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-sky-500 focus:outline-none" placeholder="e.g. Unity, C#, Blender" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Game URL <span className="text-red-500">*</span></label>
            <input type="url" value={formData.gameUrl} onChange={(e) => setFormData({ ...formData, gameUrl: e.target.value })} className={`w-full px-4 py-2 rounded-lg border-2 ${errors.gameUrl ? 'border-red-500' : 'border-gray-300'} focus:border-sky-500 focus:outline-none`} placeholder="https://itch.io/your-game" />
            {errors.gameUrl && <p className="text-red-500 text-xs mt-1">{errors.gameUrl}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full px-4 py-2 rounded-lg border-2 ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:border-sky-500 focus:outline-none`} placeholder="your@email.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-purple-600 text-white rounded-lg font-semibold hover:from-sky-700 hover:to-purple-700 disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FloatingIslandsGames;