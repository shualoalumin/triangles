import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "title": "GeoQuest",
      "subtitle": "Discover hidden patterns in shapes!",
      "play": "Play Now",
      "level_locked": "Level Locked",
      "unlock_premium": "Unlock All Levels ($4.99)",
      "found": "Found",
      "total": "Total",
      "back_to_map": "World Map",
      "reset": "Reset",
      "hints": "Hints",
      "hint_left": "hints left",
      "msg_idle": "Drag or click 3 points to find a triangle!",
      "msg_collinear": "Warning: Points are collinear!",
      "msg_invalid": "Warning: Invalid triangle!",
      "msg_done": "🎉 World Completed! 47/47!",
    }
  },
  ko: {
    translation: {
      "title": "지오퀘스트 (GeoQuest)",
      "subtitle": "도형 속에 숨은 패턴을 찾아보세요!",
      "play": "시작하기",
      "level_locked": "잠긴 레벨",
      "unlock_premium": "모든 레벨 잠금 해제 ($4.99)",
      "found": "발견",
      "total": "전체",
      "back_to_map": "월드맵",
      "reset": "초기화",
      "hints": "힌트",
      "hint_left": "개 남음",
      "msg_idle": "세 점을 드래그하거나 클릭하세요!",
      "msg_collinear": "⚠ 일직선입니다!",
      "msg_invalid": "⚠ 유효하지 않은 삼각형입니다!",
      "msg_done": "🎉 월드 완성! 47/47!",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
