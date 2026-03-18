import { en } from './en';
import { ru } from './ru';
import { pt } from './pt';
import { es } from './es';
import { tr } from './tr';
import { de } from './de';
import { fr } from './fr';
import { id } from './id';
import { nl } from './nl';
import { ja } from './ja';
import { ko } from './ko';
import { it } from './it';
import { pl } from './pl';

const locales: Record<string, Record<string, string>> = { en, ru, pt, es, tr, de, fr, id, nl, ja, ko, it, pl };

let currentLang = 'en';

export function setLanguage(lang: string): void {
    if (locales[lang]) currentLang = lang;
}

export function getLanguage(): string {
    return currentLang;
}

export function t(key: string, params?: Record<string, string | number>): string {
    const str = locales[currentLang]?.[key] ?? locales['en']?.[key] ?? key;
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}
