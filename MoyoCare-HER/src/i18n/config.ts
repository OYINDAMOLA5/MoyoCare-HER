import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import yorubaTranslations from './locales/yo.json';
import igboTranslations from './locales/ig.json';
import hausaTranslations from './locales/ha.json';

i18next.use(initReactI18next).init({
    resources: {
        en: { translation: enTranslations },
        yo: { translation: yorubaTranslations },
        ig: { translation: igboTranslations },
        ha: { translation: hausaTranslations },
    },
    lng: typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
    ns: ['translation'],
    defaultNS: 'translation',
});

export default i18next;
