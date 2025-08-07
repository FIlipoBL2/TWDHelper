<<<<<<< HEAD
# TWD Helper - The Walking Dead Universe Digital Companion

A comprehensive digital companion app for The Walking Dead Universe Roleplaying Game, built with modern React architecture and TypeScript. Features advanced character management, dice mechanics, combat systems, and AI-powered storytelling tools.

## 🎮 Core Features

### **Character Management**
- **Full Character Creation System**: Step-by-step guided character creation with archetype selection, attribute allocation, skill distribution, and talent selection
- **Dynamic Character Sheets**: Interactive character sheets with real-time stat tracking, inventory management, and condition monitoring
- **Pre-made Characters**: Library of canon characters and randomly generated NPCs for quick setup
- **Character Progression**: XP tracking, talent acquisition, and character advancement mechanics
- **Critical Injury System**: Automatic tracking and management of injuries with healing progression

### **Advanced Dice System**
- **Skill Roll Mechanics**: Complete implementation of base dice + stress dice system with success counting
- **Push Roll System**: Risk/reward mechanic allowing players to add stress dice for second chances
- **Specialized Rolls**: Support for D6, D66, D666, and other specialized dice mechanics
- **Visual Dice Display**: Animated dice with color coding (base dice vs stress dice vs success indicators)
- **Automatic Calculations**: Smart dice pool calculation based on attributes, skills, equipment, and conditions
- **Mess Up Detection**: Automatic walker/complication generation on stress die failures

### **Combat Systems**
- **Dual Combat Modes**: 
  - **Duel System**: Turn-based 1v1 combat with range management and opposed rolls
  - **Brawl System**: Phase-based group combat with tactical positioning and action declaration
  - **Swarm Combat**: Specialized mechanics for fighting walker hordes
- **Range Categories**: Short/Long/Extreme range system with tactical implications
- **Armor Integration**: Full armor system with damage reduction and mobility penalties
- **Interactive Battlemap**: Grid-based and gridless combat with cover, objects, and positioning
- **Real-time Combat Log**: All actions, rolls, and results tracked in session history

### **AI-Powered Storytelling**
- **Gemini AI Integration**: Context-aware story generation and scenario creation
- **Solo Oracle System**: AI-powered yes/no oracle with likelihood modifiers for solo play
- **Dynamic Battlemap Generation**: AI-generated tactical maps based on scene descriptions
- **Intelligent NPCs**: AI-assisted NPC dialogue and behavior generation

### **Game Tables & Oracles**
- **50+ Game Tables**: Complete implementation of all official game tables including:
  - Walker generation and description tables
  - Scavenging and loot tables  
  - Critical injury and fear tables
  - Random event generators
  - NPC personality and motivation tables
- **Theme Oracle**: Advanced 3-dice oracle system for narrative inspiration
- **Luck Oracle**: Binary yes/no decision making with likelihood modifiers
- **Table Automation**: One-click rolling with automatic result interpretation

### **Haven Management**
- **Community Building**: Track haven capacity, defense, and resource management
- **Project System**: Long-term community improvement projects with progress tracking
- **Issue Management**: Dynamic problem generation and resolution tracking
- **Population Dynamics**: NPC community member management and relationships

### **Session Management**
- **Real-time Chat Log**: Persistent session history with character-specific messaging
- **Automatic Logging**: All dice rolls, combat actions, and story events automatically recorded
- **Save/Load System**: Complete session state persistence with auto-save functionality
- **Multi-Character Support**: Handle multiple player characters and NPCs simultaneously

### **Game Modes**
- **Campaign Mode**: Full group play with GM controls and multiple players
- **Solo Mode**: Single-player experience with AI assistance and automated mechanics
- **Edit Mode**: Real-time session editing and adjustment capabilities

## 🛠️ Technologies Used

### **Frontend Framework**
- **React 19.1.0**: Latest React with modern hooks and concurrent features
- **TypeScript**: Full type safety with comprehensive interfaces and type definitions
- **Vite 6.2.0**: Lightning-fast build tool with hot module replacement

### **UI/UX Technologies**
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Custom Components**: Modular component architecture with reusable UI elements
- **Responsive Design**: Mobile-first design that works on desktop, tablet, and mobile
- **Dark Theme**: Professional dark theme optimized for extended gaming sessions

### **AI Integration**
- **Google Gemini AI**: Advanced language model integration for story generation
- **Context-Aware Prompting**: Intelligent context management for relevant AI responses
- **Real-time Generation**: On-demand content creation without interrupting gameplay

### **Game Mechanics**
- **Custom Dice Service**: Sophisticated dice rolling engine with probability calculations
- **State Management**: React Context API for global game state management
- **Performance Optimization**: Lazy loading, memoization, and code splitting for optimal performance

### **Data Management**
- **Local Storage**: Persistent data storage for session continuity
- **JSON-based Architecture**: Flexible data structures for easy modification and extension
- **Export/Import**: Session data portability for backup and sharing

## 🎨 Visual Design & Experience

### **Interface Design**
- **Walking Dead Aesthetic**: Dark, post-apocalyptic theme with red accent colors
- **Intuitive Navigation**: Tab-based interface with clear section organization
- **Professional Layout**: Clean, organized design that doesn't distract from gameplay

### **Interactive Elements**
- **VS Logo Integration**: Custom skull logo for duel combat with blue/red theming
- **Animated Feedback**: Smooth transitions and visual feedback for all interactions
- **Color-Coded Systems**: Consistent color language (green=success, red=danger, yellow=warning)
- **Icon Integration**: Intuitive icons for quick recognition (⚔️ combat, 🎲 dice, 🏠 haven)

### **User Experience**
- **Workflow Optimization**: Streamlined character creation and combat resolution
- **Context-Sensitive UI**: Interface adapts based on game mode and current activity
- **Minimal Clicking**: Most common actions accessible with single clicks
- **Smart Defaults**: Intelligent default values reduce setup time

### **Accessibility Features**
- **High Contrast**: Strong color contrast for readability in various lighting
- **Large Click Targets**: Button sizing optimized for both mouse and touch input
- **Clear Typography**: Readable fonts with appropriate sizing hierarchy
- **Loading States**: Clear feedback during AI generation and processing

## 📱 Cross-Platform Experience

### **Desktop Experience**
- **Multi-Panel Layout**: Simultaneous access to character sheets, chat, and game tools
- **Keyboard Shortcuts**: Efficient navigation for power users
- **Large Screen Optimization**: Full utilization of desktop screen real estate

### **Mobile Experience**
- **Touch-Optimized**: All controls designed for finger input
- **Swipe Navigation**: Intuitive gesture-based interface switching
- **Compact Layouts**: Information density optimized for smaller screens

### **Performance**
- **Fast Loading**: Optimized bundle size with code splitting
- **Smooth Animations**: 60fps interface animations and transitions
- **Offline Capability**: Core functionality works without internet connection
- **Memory Efficient**: Optimized for extended gaming sessions

## 🚀 Getting Started

### **Prerequisites**
- Node.js (Latest LTS version recommended)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### **Installation**
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd TWDHelper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment** (optional for AI features):
   ```bash
   # Create .env.local file
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

### **Production Build**
```bash
npm run build
npm run preview
```

## 📖 Usage Guide

### **Quick Start**
1. **Choose Game Mode**: Select Campaign (group) or Solo (single player) mode
2. **Create Characters**: Use the guided character creation or select pre-made characters
3. **Start Playing**: Begin with the Player tab for character actions and move to other tabs as needed
4. **Use AI Features**: Leverage the AI oracle and generation tools for enhanced storytelling

### **Tab Navigation**
- **🏠 Player**: Character management, dice rolling, and primary gameplay
- **🎮 GM**: Game master controls, NPC management, and scenario tools  
- **⚔️ Combat**: Tactical combat with battlemap and turn management
- **🏘️ Haven**: Community building and resource management
- **🎲 Solo**: Single-player tools with AI assistance and oracles
- **💾 Data**: Session management, save/load, and configuration

### **Advanced Features**
- **Combat Range**: Use radio buttons in duel mode to set tactical distance
- **AI Assistance**: Ask the oracle questions or generate battlemap descriptions
- **Table Rolling**: One-click access to all official game tables
- **Session Continuity**: All progress automatically saved and restored

## 🏗️ Architecture & Design Principles

### **SOLID Principles Implementation**
- **Single Responsibility**: Each component has a focused, well-defined purpose
- **Open/Closed**: Extensible design patterns for adding new game features
- **Liskov Substitution**: Consistent interfaces across similar components
- **Interface Segregation**: Focused interfaces preventing unnecessary dependencies
- **Dependency Inversion**: Services abstracted for easier testing and maintenance

### **Performance Optimizations**
- **React.memo**: Component memoization to prevent unnecessary re-renders
- **useMemo & useCallback**: Expensive calculations and function reference stability
- **Lazy Loading**: Code splitting for heavy components (AI, Combat, Character sheets)
- **Service Caching**: Dice calculation and skill lookup caching
- **Cleanup Patterns**: Proper memory management and event listener cleanup

### **Race Condition Prevention**
- **AbortController**: Cancellable async operations (AI calls, file operations)
- **Timeout Management**: Safe timeout handling with cleanup on unmount
- **State Guards**: Prevent state updates after component unmount
- **Loading States**: Prevent multiple concurrent operations

### **Code Organization**
```
├── components/           # UI Components
│   ├── common/          # Reusable UI components
│   ├── brawl/           # Combat-specific components
│   ├── npc/             # NPC management components
│   └── animal/          # Animal system components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── services/            # Business logic & external APIs
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── data/                # Game data & tables
```

## 🧪 Testing & Quality Assurance

### **Error Handling**
- **Graceful Degradation**: AI features fail gracefully when offline
- **User Feedback**: Clear error messages and loading states
- **Input Validation**: Client-side validation for all user inputs
- **State Recovery**: Automatic recovery from invalid game states

### **Performance Monitoring**
- **Bundle Analysis**: Optimized bundle size with Vite analyzer
- **Memory Management**: Proper cleanup prevents memory leaks
- **Render Optimization**: Minimal re-renders through proper dependency management

## 🤝 Contributing

This is a specialized tool for The Walking Dead Universe RPG. Contributions welcome for:
- Bug fixes and performance improvements
- Additional game table implementations
- Enhanced AI integration features
- UI/UX improvements and accessibility enhancements

### **Development Guidelines**
- Follow TypeScript strict mode for type safety
- Use React hooks and functional components exclusively
- Implement proper cleanup in useEffect hooks
- Add JSDoc comments for complex functions
- Test thoroughly across different browsers and screen sizes

### **Code Style**
- Use meaningful variable and function names
- Prefer composition over inheritance
- Keep components small and focused
- Use TypeScript interfaces for all data structures
- Follow established file naming conventions

## 📄 License

This project is created for educational and personal use with The Walking Dead Universe RPG. Please respect intellectual property rights of the game system and associated materials.

## 🙏 Acknowledgments

- **Free League Publishing** for The Walking Dead Universe RPG system
- **React Team** for the excellent framework and documentation  
- **Google** for the Gemini AI API enabling intelligent storytelling features
- **Tailwind CSS** for the utility-first CSS framework
- **The TWD RPG Community** for feedback and feature suggestions

## 📊 Project Stats

- **Total Files**: ~190 TypeScript/React files
- **Components**: 50+ reusable UI components
- **Game Tables**: 15+ official RPG tables implemented
- **Type Definitions**: Comprehensive TypeScript coverage
- **Features**: Character creation, combat, AI integration, session management
- **Supported Platforms**: Web (desktop & mobile), PWA-ready

## 🔧 Maintenance & Updates

### **Recent Improvements (v2024)**
- ✅ Fixed race conditions in async operations
- ✅ Implemented proper timeout cleanup patterns
- ✅ Enhanced memory management and cleanup
- ✅ Improved TypeScript type coverage
- ✅ Optimized component re-rendering
- ✅ Added comprehensive error boundaries

### **Planned Features**
- 🔄 Enhanced AI storytelling capabilities
- 🔄 Additional combat mechanics (vehicle combat)
- 🔄 Export functionality for character sheets
- 🔄 Multi-language support
- 🔄 Enhanced mobile experience
- 🔄 Community features and session sharing
- UI/UX enhancements
- Mobile optimization
- New AI integration features

## 📄 License

This project is a fan-created tool for The Walking Dead Universe Roleplaying Game. All rights to The Walking Dead Universe belong to their respective owners.

---

**TWD Beyond** - Survive the apocalypse with intelligence. 🧟‍♂️⚔️🎲
=======
# TWDHelper
The Walking Dead RPG Helper, i do not make any profits and this is just a fan project if you want me to take it down please chat @filipoo.b on instagram
>>>>>>> 8d766c0194f4c31818aea8b43893ed090b5b4f86
