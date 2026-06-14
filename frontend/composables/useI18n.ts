/**
 * 輕量 i18n —— 以 opencc-js 雙向正規化中文字體。
 * 原始碼一律用繁體當「單一真相來源」；切到簡體時即時轉換。
 * 連 LLM 回傳與後端動態文字（擇日理由等）一併正規化到所選字體，畫面字體一致。
 */
import * as OpenCC from 'opencc-js';

export type Locale = 'zh-Hant' | 'zh-Hans';

let toS: ((s: string) => string) | null = null;
let toT: ((s: string) => string) | null = null;

function converters() {
  if (!toS) toS = OpenCC.Converter({ from: 'tw', to: 'cn' });
  if (!toT) toT = OpenCC.Converter({ from: 'cn', to: 'tw' });
  return { toS, toT };
}

export function useLocale() {
  // useCookie 讓 SSR 與前端一致、且自動持久化
  const locale = useCookie<Locale>('locale', { default: () => 'zh-Hant', sameSite: 'lax' });

  function t(s: string | undefined | null): string {
    if (!s) return '';
    try {
      const { toS, toT } = converters();
      return locale.value === 'zh-Hans' ? toS(s) : toT(s);
    } catch {
      return s;
    }
  }

  function setLocale(l: Locale) { locale.value = l; }
  function toggle() { locale.value = locale.value === 'zh-Hant' ? 'zh-Hans' : 'zh-Hant'; }

  return { locale, t, setLocale, toggle };
}
