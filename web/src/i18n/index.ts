import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { kaa } from './kaa';

// Only Karakalpak is wired up for now. Adding Uzbek later is just: write a
// uz.ts resource file matching kaa.ts's keys, add it to `resources` below, and
// surface a language switcher somewhere (e.g. SettingsScreen) that calls
// i18next.changeLanguage('uz').
void i18next.use(initReactI18next).init({
  resources: {
    kaa: { translation: kaa },
  },
  lng: 'kaa',
  fallbackLng: 'kaa',
  interpolation: { escapeValue: false },
});

export default i18next;
