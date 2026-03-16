import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

const worlds = [
  {
    id: 1, emoji: '🌲', name: '삼각숲', enName: 'Triangle Forest',
    enDesc: 'Find hidden triangles!',
    desc: '숨어있는 삼각형을 모두 찾아보세요!',
    gradient: 'linear-gradient(135deg, #0F6E56 0%, #1A9E7A 40%, #5DCAA5 100%)',
    glow: 'rgba(15,110,86,0.4)',
    count: '47 Triangles',
  },
  {
    id: 2, emoji: '🏙️', name: '사각도시', enName: 'Square City',
    enDesc: 'Discover rectangles & squares!',
    desc: '사각형과 직사각형을 찾아보세요!',
    gradient: 'linear-gradient(135deg, #185FA5 0%, #2B7BD4 40%, #85B7EB 100%)',
    glow: 'rgba(24,95,165,0.4)',
    count: 'Coming Soon',
  },
  {
    id: 3, emoji: '⭐', name: '다각별', enName: 'Polygon Star',
    enDesc: 'Pentagon & hexagon puzzles!',
    desc: '오각형과 육각형의 세계!',
    gradient: 'linear-gradient(135deg, #534AB7 0%, #7C6BDB 40%, #AFA9EC 100%)',
    glow: 'rgba(83,74,183,0.4)',
    count: 'Coming Soon',
  },
  {
    id: 4, emoji: '🌊', name: '원과 해저', enName: 'Ocean Circles',
    enDesc: 'Arcs, sectors & pi!',
    desc: '호와 부채꼴의 바다!',
    gradient: 'linear-gradient(135deg, #993C1D 0%, #D4612D 40%, #F0997B 100%)',
    glow: 'rgba(153,60,29,0.4)',
    count: 'Coming Soon',
  },
  {
    id: 5, emoji: '🏛️', name: '입체미궁', enName: '3D Labyrinth',
    enDesc: 'Spatial perception!',
    desc: '3D 공간 지각력 도전!',
    gradient: 'linear-gradient(135deg, #D4537E 0%, #E8789A 40%, #F5B0C7 100%)',
    glow: 'rgba(212,83,126,0.4)',
    count: 'Coming Soon',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 200 } }
};

const WorldMap = ({ onSelectWorld }) => {
  const { t, i18n } = useTranslation();
  const { isPremium, unlockedWorlds } = useGameStore();
  const isKo = i18n.language === 'ko';

  return (
    <div style={{ paddingTop: 8 }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ fontSize: 52, marginBottom: 8 }} className="animate-float">🔺</div>
          <h2 style={{
            fontSize: 32, fontWeight: 900, marginBottom: 8,
            background: 'linear-gradient(135deg, #F0EEF6, #8B8FA8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {isKo ? '도형 속 보물을 찾아라!' : 'Discover Hidden Treasures!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0 }}>
            {isKo ? '월드를 선택하고 모험을 시작하세요' : 'Choose a world and start your adventure'}
          </p>
        </motion.div>
      </div>

      {/* World Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}
      >
        {worlds.map((world) => {
          const isUnlocked = unlockedWorlds.includes(world.id) || isPremium;
          return (
            <motion.div
              key={world.id}
              variants={cardVariants}
              whileHover={isUnlocked ? { y: -6, scale: 1.02 } : {}}
              whileTap={isUnlocked ? { scale: 0.97 } : {}}
              onClick={() => isUnlocked && onSelectWorld(world.id)}
              className={`world-card ${!isUnlocked ? 'locked' : ''}`}
              style={{
                background: world.gradient,
                padding: 28,
                minHeight: 180,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: isUnlocked ? `0 12px 40px ${world.glow}` : 'none',
              }}
            >
              {/* Card Number Watermark */}
              <div style={{
                position: 'absolute', top: 16, right: 20,
                fontSize: 72, fontWeight: 900, opacity: 0.12, color: '#fff', lineHeight: 1,
              }}>
                {world.id}
              </div>

              {/* Lock overlay */}
              {!isUnlocked && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'inherit', backdropFilter: 'blur(2px)',
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff', padding: '10px 22px',
                    borderRadius: 100, fontSize: 14, fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    🔒 {t('level_locked')}
                  </span>
                </div>
              )}

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: 36 }}>{world.emoji}</span>
              </div>
              <div style={{ position: 'relative', zIndex: 2, color: '#fff' }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0 4px' }}>
                  {isKo ? world.name : world.enName}
                </h3>
                <p style={{ fontSize: 14, opacity: 0.85, margin: 0 }}>
                  {isKo ? world.desc : world.enDesc}
                </p>
                <span style={{
                  display: 'inline-block', marginTop: 10,
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: 1.2, opacity: 0.7,
                  background: 'rgba(255,255,255,0.15)', padding: '4px 12px',
                  borderRadius: 8,
                }}>
                  {world.count}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default WorldMap;
