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
    count: '9 Quadrilaterals',
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
  show: { transition: { staggerChildren: 0.12 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 18, stiffness: 150 } }
};

const WorldMap = ({ onSelectWorld }) => {
  const { i18n, t } = useTranslation();
  const { isPremium, unlockedWorlds } = useGameStore();
  const isKo = i18n.language === 'ko';

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: 64, marginBottom: 12 }}
          >
            🧩
          </motion.div>
          <h2 style={{
            fontSize: 42, fontStyle: 'normal', fontWeight: 900, marginBottom: 12, letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #FFFFFF, #AFA9EC)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {isKo ? '세상의 모든 도형 탐험' : 'Explore the World of Shapes'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18, fontWeight: 500, margin: 0 }}>
            {isKo ? '보물을 찾아 떠나는 기하학 모험!' : 'A geometry adventure to find hidden treasures!'}
          </p>
        </motion.div>
      </div>

      {/* World Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}
      >
        {worlds.map((world) => {
          const isUnlocked = unlockedWorlds.includes(world.id) || isPremium;
          return (
            <motion.div
              key={world.id}
              variants={cardVariants}
              whileHover={isUnlocked ? { y: -8, scale: 1.03, boxShadow: `0 20px 50px ${world.glow}` } : {}}
              whileTap={isUnlocked ? { scale: 0.97 } : {}}
              onClick={() => isUnlocked && onSelectWorld(world.id)}
              className={`world-card ${!isUnlocked ? 'locked' : ''}`}
              style={{
                background: world.gradient,
                padding: 32,
                minHeight: 220,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: isUnlocked ? `0 10px 30px ${world.glow}` : 'none',
              }}
            >
              {/* Card Number Watermark */}
              <div style={{
                position: 'absolute', top: 20, right: 24,
                fontSize: 84, fontWeight: 900, opacity: 0.15, color: '#fff', lineHeight: 1,
                fontFamily: 'Outfit'
              }}>
                {world.id}
              </div>

              {/* Lock overlay */}
              {!isUnlocked && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'inherit', backdropFilter: 'blur(3px)',
                  zIndex: 10
                }}>
                  <motion.span 
                    whileHover={{ scale: 1.1 }}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff', padding: '12px 24px',
                      borderRadius: 100, fontSize: 14, fontWeight: 800,
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', gap: 10,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
                    }}
                  >
                    🔒 {t('level_locked')}
                  </motion.span>
                </div>
              )}

              {/* Content */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: 48 }}>{world.emoji}</span>
              </div>
              <div style={{ position: 'relative', zIndex: 2, color: '#fff' }}>
                <h3 style={{ fontSize: 26, fontWeight: 900, margin: '12px 0 6px', letterSpacing: '-0.5px' }}>
                  {isKo ? world.name : world.enName}
                </h3>
                <p style={{ fontSize: 15, opacity: 0.9, fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
                  {isKo ? world.desc : world.enDesc}
                </p>
                <div style={{
                  display: 'inline-block', marginTop: 16,
                  fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: 1.5, opacity: 0.8,
                  background: 'rgba(255,255,255,0.2)', padding: '6px 14px',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {world.count}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default WorldMap;
