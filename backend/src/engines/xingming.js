/**
 * xingming.js — 姓名學五格剖象（純 JS，移植自 xingming_local.py）
 * 五格(天/人/地/外/總) + 81 數理吉凶 + 三才配置 + 人格性格。需 data/kangxi_strokes.json。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT = path.resolve(__dirname, '../../data/kangxi_strokes.json');
let strokesDict = null;
function dict() {
  if (!strokesDict) {
    try { strokesDict = JSON.parse(fs.readFileSync(DICT, 'utf8')); } catch { strokesDict = {}; }
  }
  return strokesDict;
}

// 81 數理 [名稱, 吉(1)/凶(0)]
const SHU_LI = {
  1: ['太極', 1], 2: ['分離', 0], 3: ['進發', 1], 4: ['坎坷', 0], 5: ['福祿', 1], 6: ['安泰', 1], 7: ['獨立', 1], 8: ['努力', 1], 9: ['終結', 0], 10: ['空虛', 0],
  11: ['草木逢春', 1], 12: ['薄弱無力', 0], 13: ['才藝聰穎', 1], 14: ['挫折煩惱', 0], 15: ['人望福祿', 1], 16: ['貴人眾多', 1], 17: ['剛強突破', 1], 18: ['發展成功', 1], 19: ['辛苦成功', 0], 20: ['虛無飄渺', 0],
  21: ['先苦後甘', 1], 22: ['秋草逢霜', 0], 23: ['旭日升天', 1], 24: ['金錢豐盈', 1], 25: ['自立成功', 1], 26: ['英雄失路', 0], 27: ['中途受阻', 0], 28: ['苦盡甘來', 0], 29: ['成功富貴', 1], 30: ['吉凶參半', 0],
  31: ['頭領格', 1], 32: ['僥倖成功', 1], 33: ['旭日昇天', 1], 34: ['破家散業', 0], 35: ['處世嚴謹', 1], 36: ['英雄豪傑', 0], 37: ['智勇兼備', 1], 38: ['文藝有成', 1], 39: ['長袖善舞', 1], 40: ['無定向', 0],
  41: ['有德望重', 1], 42: ['多才多藝', 0], 43: ['散財破家', 0], 44: ['失意苦惱', 0], 45: ['大智大慧', 1], 46: ['波折重重', 0], 47: ['出人頭地', 1], 48: ['大智慧', 1], 49: ['吉凶各半', 0], 50: ['吉凶參半', 0],
  51: ['盛衰交替', 0], 52: ['先苦後得', 1], 53: ['內外不符', 0], 54: ['徒勞無功', 0], 55: ['外祥內苦', 0], 56: ['壯志難酬', 0], 57: ['先苦後甘', 1], 58: ['後福無窮', 1], 59: ['失意凄涼', 0], 60: ['動搖不安', 0],
  61: ['心想事成', 1], 62: ['空虛煩惱', 0], 63: ['前途光明', 1], 64: ['沉浮無常', 0], 65: ['正直長壽', 1], 66: ['衰退萎靡', 0], 67: ['獨立堅強', 1], 68: ['明智發展', 1], 69: ['溫飽難求', 0], 70: ['空虛苦惱', 0],
  71: ['消沉停滯', 0], 72: ['後苦先甘', 0], 73: ['平安喜樂', 1], 74: ['停頓受阻', 0], 75: ['先吉後凶', 0], 76: ['先吉後難', 0], 77: ['吉中帶凶', 0], 78: ['有得有失', 0], 79: ['命運多舛', 0], 80: ['消沉空虛', 0],
  81: ['還本歸元', 1],
};

const CORRECTIONS = { 誠: 14, 福: 14, 德: 15, 龍: 16, 鳳: 14, 靜: 16, 璇: 16, 璃: 15, 薇: 17, 蘭: 20, 瑋: 14, 霖: 16, 霞: 17, 駿: 17, 騰: 20 };
const DOUBLE = ['歐陽', '司馬', '上官', '諸葛', '東方', '獨孤', '南宮', '夏侯', '皇甫', '尉遲', '令狐', '宇文', '長孫', '慕容', '鮮于', '公孫', '鐘離'];

function wuxing(n) { const r = n % 10; if (r === 1 || r === 2) return '木'; if (r === 3 || r === 4) return '火'; if (r === 5 || r === 6) return '土'; if (r === 7 || r === 8) return '金'; return '水'; }
function shuli(n) { let m = ((n - 1) % 80) + 1; if (n === 81) m = 81; return SHU_LI[m] || [String(n), 1]; }

const PERSONALITY = {
  木: '仁慈向上，富有同理心，但有時會過於固執、缺乏彈性。',
  火: '熱情積極，行動力強，待人有禮，但性子急躁、缺乏耐心。',
  土: '踏實穩重，誠信敦厚，包容力強，但較為保守、不善變通。',
  金: '果斷剛強，重情重義，執行力極佳，但易生摩擦、過於銳利。',
  水: '聰慧靈動，適應力強，善於交際，但心思深沉、易猶豫不決。',
};

function strokesOf(ch) { if (ch in CORRECTIONS) return CORRECTIONS[ch]; return dict()[ch] || 1; }

function sancai(tian, ren, di) {
  const a = wuxing(tian); const b = wuxing(ren); const c = wuxing(di);
  const sheng = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const ke = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const rel = (x, y) => (x === y ? 1 : sheng[x] === y ? 1 : sheng[y] === x ? 2 : ke[x] === y ? -1 : ke[y] === x ? -2 : 0);
  const s = rel(a, b) + rel(b, c);
  const verdict = s >= 3 ? '大吉' : s >= 1 ? '吉' : s === 0 ? '平' : s >= -2 ? '半凶' : '大凶';
  return { key: a + b + c, verdict };
}

/**
 * @param {string} name
 * @returns {object|null} { wuge, sancai, personality, ren_wx }
 */
export function computeXingming(name) {
  if (!name || name.length < 2) return null;
  const xing = DOUBLE.some((d) => name.startsWith(d)) ? name.slice(0, 2) : name.slice(0, 1);
  const ming = name.slice(xing.length);
  const xs = [...xing].map(strokesOf);
  const ms = [...ming].map(strokesOf);

  const tian = xs.reduce((a, b) => a + b, 0) + (xing.length === 1 ? 1 : 0);
  const ren = xs[xs.length - 1] + (ms[0] || 1);
  const di = ms.reduce((a, b) => a + b, 0) + (ming.length === 1 ? 1 : 0);
  const zong = xs.reduce((a, b) => a + b, 0) + ms.reduce((a, b) => a + b, 0);
  let wai;
  if (xing.length === 1 && ming.length === 2) wai = 1 + ms[0];
  else if (xing.length === 1 && ming.length === 1) wai = 2;
  else if (xing.length === 2 && ming.length === 2) wai = xs[0] + ms[1];
  else if (xing.length === 2 && ming.length === 1) wai = xs[0] + 1;
  else wai = tian + di - ren;

  const sc = sancai(tian, ren, di);
  const renWx = wuxing(ren);
  const ge = (label, n) => ({ label, num: n, wuxing: wuxing(n), shuli: shuli(n)[0], ji: shuli(n)[1] ? '吉' : '凶' });

  return {
    name,
    wuge: { 天格: ge('天格', tian), 人格: ge('人格', ren), 地格: ge('地格', di), 外格: ge('外格', wai), 總格: ge('總格', zong) },
    sancai: sc,
    ren_wx: renWx,
    personality: PERSONALITY[renWx] || '',
  };
}
