import { Injectable, signal } from "@angular/core";
import { locale } from "@tauri-apps/plugin-os";
import {
  defaultLang,
  supportedLangs,
  translations,
  type Lang,
} from "./translations";

@Injectable({ providedIn: "root" })
export class LanguageService {
  private storageKey = "bookara-language";

  readonly currentLang = signal<Lang>(this.resolveInitialLang());

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      void this.detectSystemLocale();
    }
  }

  setLang(lang: Lang): void {
    this.currentLang.set(lang);
    localStorage.setItem(this.storageKey, lang);
  }

  translate(key: string): string {
    return (
      translations[this.currentLang()]?.[key] ??
      translations[defaultLang][key] ??
      key
    );
  }

  private resolveInitialLang(): Lang {
    const saved = localStorage.getItem(this.storageKey) as Lang | null;
    if (saved && supportedLangs.includes(saved)) {
      return saved;
    }
    const navLang = (navigator.language || "")
      .split("-")[0]
      .toLowerCase() as Lang;
    if (supportedLangs.includes(navLang)) {
      return navLang;
    }
    return defaultLang;
  }

  private async detectSystemLocale(): Promise<void> {
    try {
      const systemLocale = await locale();
      const primary = (systemLocale || "")
        .split("-")[0]
        .toLowerCase() as Lang;
      if (supportedLangs.includes(primary)) {
        this.setLang(primary);
      }
    } catch {
      // Plugin OS indisponible (ex: simple navigateur) : on garde la valeur navigator.language
    }
  }
}
