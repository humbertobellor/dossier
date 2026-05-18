import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";

const loadLocale = async (lng: string): Promise<Record<string, unknown> | null> => {
  if (lng === "es") return (await import("./locales/es.json")).default as Record<string, unknown>;
  if (lng === "de") return (await import("./locales/de.json")).default as Record<string, unknown>;
  return null;
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    fallbackLng: "en",
    lng: "en",
    interpolation: { escapeValue: false },
  });

i18n.on("languageChanged", (lng) => {
  if (!i18n.hasResourceBundle(lng, "translation")) {
    void loadLocale(lng).then((bundle) => {
      if (bundle) {
        i18n.addResourceBundle(lng, "translation", bundle);
        void i18n.reloadResources(lng);
      }
    });
  }
});

export default i18n;
