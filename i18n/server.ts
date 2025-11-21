import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next/initReactI18next";

export async function initServerI18n(lang: string) {
  const i18n = createInstance();

  await i18n.use(initReactI18next).init({
    lng: lang,
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    resources: {
      en: {
        common: (await import("../public/locales/en/common.json")).default,
      },
      pt: {
        common: (await import("../public/locales/pt/common.json")).default,
      },
    },
  });

  return i18n;
}
