import { en } from './en';
import { ru } from './ru';

const locales: Record<string, Record<string, string>> = { en, ru };

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
