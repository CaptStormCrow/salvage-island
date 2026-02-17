import React, { useState, useEffect } from 'react';
import { X, Database, Wifi, WifiOff, Check } from 'lucide-react';

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
    
    // FORCE REGENERATE - Clear old slow data
    // Commented out for testing - uncomment only when changing data structure
    // localStorage.removeItem('islandData');
    
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
      // TESTING MODE: Use seconds instead of days (1 day = 15 seconds, 7 days = 105 seconds)
      const transitTime = game.transitDays * 15 * 1000;
      // Stagger initial spawn times so islands are spread out
      const spawnTime = now - (index * transitTime / SAMPLE_GAMES.length);
      
      return {
        ...game,
        spawnTime, // Server timestamp when island entered the stream
        transitTime,
        yOffset: Math.random() * 80 + 10 // Spread across full height (10-90%)
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
    
    // TESTING MODE: Use seconds instead of days
    const transitTime = gameData.transitDays * 15 * 1000;
    const newIsland = {
      ...gameData,
      id: Date.now(), // Generate unique ID
      spawnTime: Date.now(),
      transitTime,
      yOffset: Math.random() * 80 + 10 // Spread across full height (10-90%)
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
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Quantum Garden",
    creator: "Studio Beta",
    thumbnail: "https://source.unsplash.com/random/200x150/?garden,nature",
    description: "Grow impossible plants in a quantum greenhouse",
    tags: ["Puzzle", "Relaxing"],
    transitDays: 5,
    gameUrl: "https://itch.io"
  },
  {
    title: "Neon Runners",
    creator: "Indie Collective",
    thumbnail: "https://source.unsplash.com/random/200x150/?neon,city",
    description: "Parkour through a cyberpunk cityscape",
    tags: ["Platformer", "Cyberpunk"],
    transitDays: 1,
    gameUrl: "https://itch.io"
  },
  {
    title: "Cosmic Café",
    creator: "Starlight Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?coffee,space",
    description: "Serve coffee to aliens in deep space",
    tags: ["Simulation", "Casual"],
    transitDays: 3,
    gameUrl: "https://itch.io"
  },
  {
    title: "Echo Chamber",
    creator: "Sound Wave Studios",
    thumbnail: "https://source.unsplash.com/random/200x150/?music,sound",
    description: "Solve puzzles using sound wave mechanics",
    tags: ["Puzzle", "Music"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Shadow Tactics",
    creator: "Stealth Masters",
    thumbnail: "https://source.unsplash.com/random/200x150/?shadow,ninja",
    description: "Outsmart enemies in a world of shadows",
    tags: ["Stealth", "Strategy"],
    transitDays: 6,
    gameUrl: "https://itch.io"
  },
  {
    title: "Glow Forge",
    creator: "Ember Interactive",
    thumbnail: "https://source.unsplash.com/random/200x150/?fire,forge",
    description: "Craft magical weapons in a mystical forge",
    tags: ["Crafting", "Fantasy"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Time Loop Diner",
    creator: "Temporal Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?diner,retro",
    description: "Run a diner stuck in a time loop",
    tags: ["Time Travel", "Management"],
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
    creator: "Cloud Nine Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?sky,clouds",
    description: "Trade goods between floating islands",
    tags: ["Trading", "Adventure"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Spell Weaver",
    creator: "Arcane Arts",
    thumbnail: "https://source.unsplash.com/random/200x150/?magic,fantasy",
    description: "Combine magical elements to cast spells",
    tags: ["Magic", "Puzzle"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Mech Arena",
    creator: "Steel Giants",
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
    creator: "Beat Box Studios",
    thumbnail: "https://source.unsplash.com/random/200x150/?racing,music",
    description: "Race to the beat in this musical speedrun",
    tags: ["Racing", "Music"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Haunted Halls",
    creator: "Spooky Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?haunted,mansion",
    description: "Explore a mansion full of ghosts",
    tags: ["Horror", "Adventure"],
    transitDays: 6,
    gameUrl: "https://itch.io"
  },
  {
    title: "Card Commander",
    creator: "Deck Masters",
    thumbnail: "https://source.unsplash.com/random/200x150/?cards,game",
    description: "Strategic deck-building card battles",
    tags: ["Card Game", "Strategy"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Ninja Dash",
    creator: "Swift Strike",
    thumbnail: "https://source.unsplash.com/random/200x150/?ninja,action",
    description: "Lightning-fast ninja action platformer",
    tags: ["Platformer", "Action"],
    transitDays: 1,
    gameUrl: "https://itch.io"
  },
  {
    title: "Farm Frenzy",
    creator: "Harvest Moon Dev",
    thumbnail: "https://source.unsplash.com/random/200x150/?farm,agriculture",
    description: "Manage your farm from dawn to dusk",
    tags: ["Farming", "Simulation"],
    transitDays: 7,
    gameUrl: "https://itch.io"
  },
  {
    title: "Galaxy Explorer",
    creator: "Cosmic Studios",
    thumbnail: "https://source.unsplash.com/random/200x150/?galaxy,space",
    description: "Discover new worlds across the universe",
    tags: ["Space", "Exploration"],
    transitDays: 5,
    gameUrl: "https://itch.io"
  },
  {
    title: "Puzzle Portal",
    creator: "Brain Games Inc",
    thumbnail: "https://source.unsplash.com/random/200x150/?portal,abstract",
    description: "Mind-bending portal mechanics",
    tags: ["Puzzle", "Physics"],
    transitDays: 3,
    gameUrl: "https://itch.io"
  },
  {
    title: "Dragon Rider",
    creator: "Fantasy Flight",
    thumbnail: "https://source.unsplash.com/random/200x150/?dragon,fantasy",
    description: "Soar through the skies on dragonback",
    tags: ["Flying", "Adventure"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Zombie Survival",
    creator: "Undead Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?zombie,apocalypse",
    description: "Survive the zombie apocalypse",
    tags: ["Survival", "Horror"],
    transitDays: 4,
    gameUrl: "https://itch.io"
  },
  {
    title: "Treasure Hunt",
    creator: "Adventure Squad",
    thumbnail: "https://source.unsplash.com/random/200x150/?treasure,adventure",
    description: "Search for hidden treasures worldwide",
    tags: ["Adventure", "Exploration"],
    transitDays: 6,
    gameUrl: "https://itch.io"
  },
  {
    title: "Chef Master",
    creator: "Culinary Creations",
    thumbnail: "https://source.unsplash.com/random/200x150/?cooking,chef",
    description: "Cook your way to culinary fame",
    tags: ["Cooking", "Simulation"],
    transitDays: 3,
    gameUrl: "https://itch.io"
  },
  {
    title: "Cyber Hacker",
    creator: "Digital Dreams",
    thumbnail: "https://source.unsplash.com/random/200x150/?cyberpunk,hacker",
    description: "Hack the mainframe in this cyberpunk thriller",
    tags: ["Hacking", "Cyberpunk"],
    transitDays: 2,
    gameUrl: "https://itch.io"
  },
  {
    title: "Pet Paradise",
    creator: "Cute Games",
    thumbnail: "https://source.unsplash.com/random/200x150/?pets,cute",
    description: "Raise and care for adorable pets",
    tags: ["Pets", "Casual"],
    transitDays: 5,
    gameUrl: "https://itch.io"
  },
  {
    title: "Battle Royale Arena",
    creator: "Combat Zone",
    thumbnail: "https://source.unsplash.com/random/200x150/?battle,arena",
    description: "Last player standing wins",
    tags: ["Battle Royale", "Multiplayer"],
    transitDays: 1,
    gameUrl: "https://itch.io"
  },
  {
    title: "Mystery Manor",
    creator: "Detective Games",
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

const FloatingIslandsGames = () => {
  const [islands, setIslands] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isConnected, setIsConnected] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
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
  const [speedMode, setSpeedMode] = useState('testing'); // 'testing' (seconds) or 'production' (days)
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
  
  // Archive Page & Submission Form
  const [showArchive, setShowArchive] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  
  // Back to Top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Subscribe to Firebase real-time updates
  useEffect(() => {
    const unsubscribe = firebaseClient.onSnapshot((data) => {
      setIslands(data || []);
      setIsConnected(true);
    });
    
    return unsubscribe;
  }, []);

  // Update current time every second for smooth animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate island size based on transit days (shorter = larger, longer = smaller)
  const getIslandSize = (transitDays) => {
    // 1 day = largest (scale 1.4), 7 days = smallest (scale 0.8)
    const minScale = 0.8;
    const maxScale = 1.4;
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
    const startY = 15; // Start from top
    
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

  // Calculate island position using SERVER timestamp (synchronized across all users)
  // TESTING MODE: Re-enable looping so islands respawn
  const getIslandPosition = (island) => {
    const elapsed = currentTime - island.spawnTime;
    // Apply speed multiplier based on mode
    const speedMultiplier = speedMode === 'testing' ? 1 : (24 * 60 * 60); // Testing=seconds, Production=days
    const adjustedTransitTime = island.transitTime * speedMultiplier;
    const progress = (elapsed / adjustedTransitTime) % 1; // LOOP ENABLED
    return progress * 120 - 10; // -10% to 110% (enter/exit screen)
  };

  // Check if island is departing soon (last 10% of journey)
  const isDepartingSoon = (island) => {
    const elapsed = currentTime - island.spawnTime;
    const speedMultiplier = speedMode === 'testing' ? 1 : (24 * 60 * 60);
    const adjustedTransitTime = island.transitTime * speedMultiplier;
    const progress = (elapsed / adjustedTransitTime) % 1;
    return progress > 0.9;
  };

  // Check if island is arriving soon (first 10% of journey)
  const isArrivingSoon = (island) => {
    const elapsed = currentTime - island.spawnTime;
    const speedMultiplier = speedMode === 'testing' ? 1 : (24 * 60 * 60);
    const adjustedTransitTime = island.transitTime * speedMultiplier;
    const progress = (elapsed / adjustedTransitTime) % 1;
    return progress < 0.1;
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
      const speedMultiplier = speedMode === 'testing' ? 1 : (24 * 60 * 60);
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
      const speedMultiplier = speedMode === 'testing' ? 1 : (24 * 60 * 60);
      const adjustedTransitTime = island.transitTime * speedMultiplier;
      const progress = (elapsed / adjustedTransitTime) % 1;
      return { ...island, progress, adjustedTransitTime };
    })
    .filter(island => island.progress > 0.8)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  // Zoom to island - centers it in MIDDLE of viewport (not bottom)
  const zoomToIsland = (island) => {
    // Calculate offset to center island vertically in middle of screen
    const screenHeight = window.innerHeight;
    const middleOfScreen = screenHeight / 2;
    const islandYPosition = (island.yOffset / 100) * screenHeight;
    const targetOffset = middleOfScreen - islandYPosition;
    
    setViewportOffset(Math.max(-300, Math.min(300, targetOffset)));
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
        @keyframes float {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0px);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
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
      {/* Clouds background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-20 bg-white rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-60 h-24 bg-white rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-1/3 w-48 h-20 bg-white rounded-full blur-xl"></div>
      </div>

      {/* Top Bar */}
      <div className="relative z-20 bg-gradient-to-b from-sky-900/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Island Salvage</h1>
              {isConnected ? (
                <Wifi className="text-green-400" size={20} />
              ) : (
                <WifiOff className="text-red-400" size={20} />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Archive Button */}
              <button
                onClick={() => setShowArchive(true)}
                className="text-white/90 hover:text-white px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold text-sm btn-press"
              >
                Archive
              </button>
              
              {/* Submit Game Button */}
              <button
                onClick={() => setShowSubmissionForm(true)}
                className="text-white/90 hover:text-white px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-sm btn-press"
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

          <p className="text-white/70 text-xs mt-2 text-center">
            {isGridMode ? (
              <>Grid View: {sortedIslands.length} islands • Click "Reset Stream" to return</>
            ) : (
              <>Swipe or scroll vertically to explore more islands • {sortedIslands.length} islands floating</>
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
              className="absolute right-0 w-4 h-6 transition-all duration-150"
              style={{
                top: `${((300 - viewportOffset) / 600) * (window.innerHeight - 120 - 96)}px`,
                background: 'radial-gradient(ellipse at right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)'
              }}
            />
          </div>
        )}
        {/* Floating Islands */}
        <div 
          className="absolute inset-0 transition-transform duration-150"
          style={{ transform: isGridMode ? 'translateY(0px)' : `translateY(${viewportOffset}px)` }}
        >
          {sortedIslands.map((island, index) => {
            const xPos = getIslandPosition(island);
            const isDeparting = isDepartingSoon(island);
            const isArriving = isArrivingSoon(island);
            const islandSize = getIslandSize(island.transitDays);
            
            // Calculate position based on mode
            let finalXPos, finalYPos, finalScale;
            
            if (isGridMode) {
              // Grid mode - arrange in 6x grid
              const gridPos = getGridPosition(index, sortedIslands.length);
              finalXPos = gridPos.xPos;
              finalYPos = gridPos.yPos;
              finalScale = islandSize;
            } else {
              // Stream mode - normal floating position
              finalXPos = xPos;
              finalYPos = island.yOffset;
              finalScale = islandSize;
            }
            
            return (
              <div
                key={island.id}
                className={`absolute cursor-pointer hover:scale-110 ${
                  animationsEnabled && !isGridMode ? 'animate-float' : ''
                }`}
                style={{
                  left: `${finalXPos}%`,
                  top: `${finalYPos}%`,
                  transform: `translate(-50%, -50%) scale(${finalScale})`,
                  willChange: 'left, top, transform',
                  transition: isGridMode 
                    ? 'left 1.2s ease-in-out, top 1.2s ease-in-out, transform 1.2s ease-in-out' 
                    : 'left 1s linear, top 0.3s ease-out, transform 0.5s ease-out',
                  animationDelay: animationsEnabled && !isGridMode ? `${island.id % 3}s` : '0s',
                  zIndex: isGridMode ? 10 : Math.floor(island.yOffset)
                }}
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
                  <div className="w-48 h-36 bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-t-full transform -skew-x-3 shadow-2xl hover:shadow-3xl transition-shadow">
                    {/* Game thumbnail on island */}
                    <div className="absolute inset-4 bg-white rounded-lg overflow-hidden shadow-lg border-4 border-yellow-600">
                      <img 
                        src={island.thumbnail} 
                        alt={island.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Island details */}
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white/95 rounded-lg px-4 py-2 shadow-lg w-44 text-center border-2 border-yellow-600">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{island.title}</h3>
                      <p className="text-xs text-gray-600">{island.creator}</p>
                      <p className="text-xs text-sky-600 font-semibold mt-1">
                        {island.transitDays} day journey
                      </p>
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
              <div className="text-6xl mb-4">🏝️</div>
              <p className="text-sky-700 text-2xl font-bold mb-2">
                {searchQuery ? 'No islands match your search' : 
                 isGridMode && filterGenre !== 'all' ? `No ${filterGenre} games found` :
                 'No islands floating by'}
              </p>
              <p className="text-sky-600 mb-4">
                {searchQuery ? `We couldn't find any games matching "${searchQuery}"` :
                 isGridMode && filterGenre !== 'all' ? `Try selecting a different genre or view all games` :
                 'Islands will appear as they drift into view'}
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
                      View All Islands
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Right Side with Tabs - CLOSER TO TOP BAR */}
      {showSidebar && (
        <div 
          className="fixed top-[140px] right-6 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-sky-200 z-50 max-h-[calc(100vh-240px)] overflow-hidden flex flex-col"
        >
          {/* Tabs */}
          <div className="flex border-b border-sky-200">
            <button
              onClick={() => setSidebarView('upcoming')}
              className={`flex-1 py-3 px-4 font-semibold text-sm transition-colors ${
                sidebarView === 'upcoming'
                  ? 'bg-gradient-to-r from-sky-50 to-purple-50 text-sky-700 border-b-2 border-sky-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setSidebarView('archive')}
              className={`flex-1 py-3 px-4 font-semibold text-sm transition-colors ${
                sidebarView === 'archive'
                  ? 'bg-gradient-to-r from-sky-50 to-purple-50 text-sky-700 border-b-2 border-sky-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Archive
            </button>
          </div>
          
          {/* Upcoming Tab Content */}
          {sidebarView === 'upcoming' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-2 font-semibold">Arriving Soon</p>
                {upcomingArrivals.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No islands arriving soon</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingArrivals.map((island) => {
                      const timeUntilVisible = island.transitTime * (0.1 - island.progress);
                      const hoursRemaining = Math.floor(timeUntilVisible / (1000 * 60 * 60));
                      
                      return (
                        <div
                          key={island.id}
                          className="bg-white rounded-lg p-2 shadow-sm border border-sky-100 hover:border-sky-300 transition-colors cursor-pointer"
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
                                ~{hoursRemaining}h away
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
                      const timeUntilGone = island.transitTime * (1 - island.progress);
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

          {/* Archive Tab Content */}
          {sidebarView === 'archive' && (
            <div className="flex-1 overflow-y-auto p-4">
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
                <button className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                  View Full Archive Page →
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
                      className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm"
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
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-lg transition-colors text-center"
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

      {/* Admin Panel with Controls - Much Higher Above Bottom Bar */}
      {showAdminPanel ? (
        <div className="fixed bottom-56 left-6 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border-2 border-purple-300 z-40 w-72">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="text-purple-600" size={18} />
              <h3 className="font-bold text-gray-800 text-sm">Admin & Controls</h3>
            </div>
            <button
              onClick={() => setShowAdminPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Speed Mode Toggle */}
            <div>
              <label className="text-xs text-gray-600 font-semibold mb-2 block">Speed Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSpeedMode('testing')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all btn-press ${
                    speedMode === 'testing'
                      ? 'bg-sky-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Testing (15s)
                </button>
                <button
                  onClick={() => setSpeedMode('production')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all btn-press ${
                    speedMode === 'production'
                      ? 'bg-sky-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Production (Days)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {speedMode === 'testing' ? '1 day = 15 seconds' : '1 day = 24 hours'}
              </p>
            </div>

            {/* Animation Toggle */}
            <div>
              <label className="text-xs text-gray-600 font-semibold mb-2 block">Island Animations</label>
              <button
                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all btn-press ${
                  animationsEnabled
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {animationsEnabled ? '✓ Floating Enabled' : 'Floating Disabled'}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 pt-3">
              <label className="text-xs text-gray-600 font-semibold mb-2 block">Admin Actions</label>
              <button
                onClick={handleAddIsland}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-xs btn-press"
              >
                + Add Random Island
              </button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
              <p className="font-semibold mb-1">Status:</p>
              <p>Active: {islands.length} islands</p>
              <p>Visible: {visibleIslands.length} islands</p>
              <p>Speed: {speedMode === 'testing' ? 'Fast' : 'Real-time'}</p>
              <p>Animations: {animationsEnabled ? 'On' : 'Off'}</p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdminPanel(true)}
          className="fixed bottom-56 left-6 bg-purple-600/90 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-semibold z-40 backdrop-blur-sm btn-press"
        >
          Admin
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
                      const timeUntilGone = island.transitTime * (1 - island.progress);
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
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-sky-900/95 to-sky-800/95 backdrop-blur-md border-t-2 border-sky-700 z-30 shadow-2xl">
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

      {/* SIMPLE TEST - This should show when sidebar is open */}
      {showSidebar && false && (
        <div className="fixed top-20 left-20 w-96 h-96 bg-red-500 border-8 border-yellow-400 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <h1 className="text-white text-4xl font-bold">TEST SIDEBAR</h1>
        </div>
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

// Game Submission Form Component (Embedded)
const GameSubmissionFormComponent = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '', creator: '', thumbnail: '', description: '', tags: [], transitDays: 3, gameUrl: '', email: ''
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
