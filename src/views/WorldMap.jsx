import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

const worlds = [
  { id: 1, name: '삼각숲', enName: 'Triangle Forest', color: '#0F6E56', description: '기본 삼각형 찾기' },
  { id: 2, name: '사각도시', enName: 'Square City', color: '#185FA5', description: '사각형의 기초' },
  { id: 3, name: '다각별', enName: 'Polygon Star', color: '#534AB7', description: '고급 다각형', locked: true },
  { id: 4, name: '원과 해저', enName: 'Ocean Circles', color: '#993C1D', description: '호와 부채꼴', locked: true },
  { id: 5, name: '입체미궁', enName: '3D Labyrinth', color: '#D4537E', description: '공간 지각', locked: true },
];

const WorldMap = ({ onSelectWorld }) => {
  const { t, i18n } = useTranslation();
  const { isPremium, unlockedWorlds } = useGameStore();

  return (
    <div className="px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {worlds.map((world) => {
          const isUnlocked = unlockedWorlds.includes(world.id) || isPremium;
          return (
            <motion.div
              key={world.id}
              whileHover={isUnlocked ? { scale: 1.02 } : {}}
              whileTap={isUnlocked ? { scale: 0.98 } : {}}
              onClick={() => isUnlocked && onSelectWorld(world.id)}
              className={`relative overflow-hidden rounded-2xl p-6 h-40 flex flex-col justify-end cursor-pointer shadow-md transition-shadow
                ${isUnlocked ? 'hover:shadow-xl' : 'opacity-80 grayscale cursor-not-allowed'}
              `}
              style={{ background: world.color }}
            >
              <div className="absolute top-4 right-4 text-white opacity-20 text-6xl font-black">
                {world.id}
              </div>
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold border border-white/30">
                    🔒 {t('level_locked')}
                  </span>
                </div>
              )}
              <div className="relative z-10 text-white">
                <h3 className="text-xl font-bold">
                  {i18n.language === 'ko' ? world.name : world.enName}
                </h3>
                <p className="text-sm opacity-80">{world.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WorldMap;
