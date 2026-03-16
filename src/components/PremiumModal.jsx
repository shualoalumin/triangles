import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

const PremiumModal = ({ isOpen, onClose }) => {
  const { unlockPremium } = useGameStore();

  if (!isOpen) return null;

  const handlePurchase = () => {
    // TODO: Replace with real Stripe checkout
    alert("Payment successful! (Simulated)");
    unlockPremium();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-[#232328] rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500" />

          <h2 className="text-2xl font-black text-center mb-4">👑 GeoQuest Premium</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            모든 월드를 즉시 잠금 해제하고 광고 없는 교육 환경을 경험하세요!
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-yellow-500 text-xl">✨</span>
              <span className="text-sm font-medium">전체 500개 이상의 레벨 이용</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-orange-500 text-xl">🌟</span>
              <span className="text-sm font-medium">글로벌 리더보드 도전권</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-500 text-xl">🎓</span>
              <span className="text-sm font-medium">오프라인 모드 지원</span>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-4 rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all mb-4"
          >
            $4.99 - 결제하기
          </button>

          <button
            onClick={onClose}
            className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
          >
            나중에 하기
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PremiumModal;
