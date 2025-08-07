import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      // Development server configuration
      server: {
        port: 5173,
        host: true,
        // Disable problematic source map warnings in development
        fs: {
          strict: false
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Source map configuration to fix DevTools errors
        sourcemap: isDev ? 'inline' : false,
        minify: isDev ? false : 'esbuild',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              // React vendor chunk
              'react-vendor': ['react', 'react-dom'],
              // AI services chunk
              'ai-services': ['@google/genai'],
              // Game data chunk (tables and constants)
              'game-data': ['./data/tables', './data/premades', './constants'],
              // UI components chunk
              'ui-components': [
                './components/common/Card',
                './components/common/Icons',
                './components/common/DiceRollCard',
                './components/common/ProgressBar',
                './components/common/Clock',
                './components/common/EditableField',
                './components/common/InlineConfirmation',
                './components/common/CharacterSelector',
                './components/common/Die',
                './components/common/Scorecard'
              ],
              // Character management chunk
              'character-management': [
                './components/CharacterCreator',
                './components/CharacterSheet',
                './components/DiceRoller',
                './components/Inventory',
                './components/TakeDamage',
                './components/HandleFear',
                './components/XpAward'
              ],
              // Combat system chunk
              'combat-system': [
                './components/CombatDashboard',
                './components/DuelCard',
                './components/DuelChatCard',
                './components/CombatantCard',
                './components/CombatantActionCard'
              ],
              // Game management chunk
              'game-management': [
                './components/GMControlPanel',
                './components/SoloDashboard',
                './components/HavenDashboard',
                './components/ThreatDashboard',
                './components/FactionDashboard',
                './components/DataManagementDashboard'
              ]
            }
          }
        }
      }
    };
});
