import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set) => ({
      // User State
      isPremium: false,
      stars: {}, // { levelId: starCount }
      foundTriangles: {}, // { levelId: Set of found strings } -- persist doesn't handle Sets well, convert to Array if needed
      
      // Game Progress
      currentWorld: 1,
      unlockedWorlds: [1], // 1, 2 are free
      
      // Actions
      unlockPremium: () => set({ isPremium: true, unlockedWorlds: [1, 2, 3, 4, 5] }),
      saveProgress: (levelId, trianglesCount, starCount) => set((state) => ({
        stars: { ...state.stars, [levelId]: Math.max(state.stars[levelId] || 0, starCount) }
      })),
      resetProgress: () => set({ stars: {}, foundTriangles: {}, currentWorld: 1, unlockedWorlds: [1] }),
    }),
    {
      name: 'geoquest-storage',
    }
  )
);
