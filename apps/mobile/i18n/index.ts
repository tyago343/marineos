import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import es from "./es.json";
import en from "./en.json";

const deviceLocale = getLocales()[0]?.languageCode ?? "es";

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: deviceLocale === "en" ? "en" : "es",
  fallbackLng: "es",
  interpolation: { escapeValue: false },
  initImmediate: false,
});

export default i18n;
