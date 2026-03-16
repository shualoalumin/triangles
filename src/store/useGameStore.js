import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set, get) => ({
      // User State
      isPremium: false,
      stars: {}, // { levelId: starCount }
      foundShapes: {}, // { levelId: [shape1, shape2, ...] }
      
      // Game Progress
      unlockedWorlds: [1, 2], // 1, 2 are free
      
      // Actions
      unlockPremium: () => set({ isPremium: true, unlockedWorlds: [1, 2, 3, 4, 5] }),
      
      addFoundShape: (worldId, shape) => set((state) => {
        const currentFound = state.foundShapes[worldId] || [];
        if (currentFound.includes(shape)) return state;
        return {
          foundShapes: {
            ...state.foundShapes,
            [worldId]: [...currentFound, shape]
          }
        };
      }),
      
      getFoundShapes: (worldId) => get().foundShapes[worldId] || [],
      
      resetProgress: () => set({ stars: {}, foundShapes: {}, unlockedWorlds: [1, 2], isPremium: false }),
    }),
    {
      name: 'geoquest-storage-v2',
    }
  )
);
