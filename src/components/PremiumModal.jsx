import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

const PremiumModal = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const { unlockPremium } = useGameStore();
  const isKo = i18n.language === 'ko';

  const handlePurchase = () => {
    // TODO: Replace with real Stripe checkout
    unlockPremium();
    onClose();
  };

  const features = [
    { emoji: '🌲', text: isKo ? '삼각숲 — 47개 삼각형 퍼즐' : 'Triangle Forest — 47 puzzles', free: true },
    { emoji: '🏙️', text: isKo ? '사각도시 — 사각형의 세계' : 'Square City — Rectangles', free: false },
    { emoji: '⭐', text: isKo ? '다각별 — 오각형·육각형' : 'Polygon Star — Pentagons', free: false },
    { emoji: '🌊', text: isKo ? '원과 해저 — 호와 부채꼴' : 'Ocean Circles — Arcs & Pi', free: false },
    { emoji: '🏛️', text: isKo ? '입체미궁 — 3D 공간 지각' : '3D Labyrinth — Spatial', free: false },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 36,
              maxWidth: 440, width: '100%',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Top gradient bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'linear-gradient(90deg, #FFD166, #FF8F50, #FF6BB5, #7C5CFC)',
            }} />

            {/* Crown */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 48 }} className="animate-float-slow">👑</span>
              <h2 style={{
                fontSize: 26, fontWeight: 900, margin: '12px 0 6px',
                background: 'linear-gradient(135deg, #FFD166, #FF8F50)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                GeoQuest Premium
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
                {isKo ? '모든 월드를 즉시 잠금 해제!' : 'Unlock all worlds instantly!'}
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 14,
                  background: f.free ? 'rgba(91,219,129,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${f.free ? 'rgba(91,219,129,0.15)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <span style={{ fontSize: 22 }}>{f.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: f.free ? '#5BDB81' : 'var(--text-primary)' }}>
                    {f.text}
                  </span>
                  {f.free ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#5BDB81', opacity: 0.7 }}>FREE</span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD166' }}>PRO</span>
                  )}
                </div>
              ))}
            </div>

            {/* Purchase button */}
            <button
              onClick={handlePurchase}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FFD166, #FF8F50, #FF6BB5)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
                color: '#fff', fontWeight: 900, fontSize: 18,
                border: 'none', borderRadius: 18, padding: '16px 0',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 8px 30px rgba(255,143,80,0.3)',
                marginBottom: 12,
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'none'}
            >
              {isKo ? '$4.99 — 지금 잠금 해제' : '$4.99 — Unlock Now'}
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                background: 'none', border: 'none',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', padding: 8,
                letterSpacing: 1,
              }}
            >
              {isKo ? '나중에 하기' : 'Maybe Later'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PremiumModal;
