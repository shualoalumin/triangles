import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import PremiumModal from './PremiumModal';

const Layout = ({ children }) => {
  const { i18n, t } = useTranslation();
  const { isPremium } = useGameStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko');
  };

  return (
    <div style={{ minHeight: '100svh', position: 'relative' }}>
      {/* Animated star background */}
      <div className="bg-stars" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{
          maxWidth: 900, margin: '0 auto', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }} className="animate-float-slow">🔺</span>
            <h1 style={{
              fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', margin: 0,
              background: 'linear-gradient(135deg, #7C5CFC, #FF6BB5, #4FE0D9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%', animation: 'gradient-shift 4s ease infinite'
            }}>
              GeoQuest
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn-ghost" onClick={toggleLanguage}>
              {i18n.language === 'ko' ? '🌐 EN' : '🌐 KO'}
            </button>
            {!isPremium && (
              <button
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #FFD166, #FF8F50, #FF6BB5)',
                  color: '#fff', fontWeight: 800, fontSize: 13,
                  border: 'none', borderRadius: 14, padding: '10px 20px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(255,143,80,0.3)'
                }}
                onMouseEnter={e => e.target.style.transform = 'translateY(-2px) scale(1.03)'}
                onMouseLeave={e => e.target.style.transform = 'none'}
              >
                👑 {t('unlock_premium')}
              </button>
            )}
            {isPremium && (
              <span style={{
                background: 'linear-gradient(135deg, #FFD166, #FF8F50)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                fontWeight: 800, fontSize: 13
              }}>
                👑 Premium
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
          {children}
        </main>
      </div>

      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Layout;
