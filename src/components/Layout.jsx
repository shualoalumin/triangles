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
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1c1c20] text-[#1a1a1a] dark:text-[#e8e6e0] transition-colors duration-300">
      <header className="max-w-4xl mx-auto p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#534AB7] dark:text-[#AFA9EC]">GeoQuest</h1>
        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleLanguage}
            className="text-xs font-bold px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {i18n.language === 'ko' ? 'EN' : 'KO'}
          </button>
          {!isPremium && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1.5 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              {t('unlock_premium')}
            </button>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto pb-20">
        {children}
      </main>
      <PremiumModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Layout;
