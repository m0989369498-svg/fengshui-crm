/**
 * bazi.js — 八字排盤（純 JS，lunar-javascript + 真太陽時校正）
 * 提供四柱、五行分佈、十神、身強弱啟發式與簡易用神，供玄學路由產生白話標籤。
 */
import Lunar from 'lunar-javascript';
import { toTrueSolar } from './trueSolarTime.js';
const { Solar } = Lunar;

const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const BEI_SHENG = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const BEI_KE = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' };
const SEASON_WX = { 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水', 子: '水', 丑: '土' };

/**
 * @param {{year,month,day,hour,minute,city,is_male}} birth
 * @returns {object} { four_pillars, day_yuan, wuxing_pct, strength, yongshen, solar }
 */
export function computeBazi(birth) {
  const ts = (birth.hour !== undefined && birth.hour !== null)
    ? toTrueSolar(birth) : { y: birth.year, m: birth.month, d: birth.day, h: birth.hour ?? 12, min: birth.minute ?? 0, deltaMin: 0, longitude: 120, known: false };
  const ec = Solar.fromYmdHms(ts.y, ts.m, ts.d, ts.h, ts.min, 0).getLunar().getEightChar();

  const gans = [ec.getYearGan(), ec.getMonthGan(), ec.getDayGan(), ec.getTimeGan()];
  const zhis = [ec.getYearZhi(), ec.getMonthZhi(), ec.getDayZhi(), ec.getTimeZhi()];
  const dayGan = gans[2];
  const dayWx = GAN_WX[dayGan];
  const monthZhi = zhis[1];

  // 五行分佈（天干各 10，地支本氣各 8，月令加權）
  const wx = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  gans.forEach((g) => { wx[GAN_WX[g]] += 10; });
  zhis.forEach((z, i) => { wx[ZHI_WX[z]] += i === 1 ? 16 : 8; });
  const total = Object.values(wx).reduce((a, b) => a + b, 0);
  const wuxingPct = Object.fromEntries(Object.entries(wx).map(([k, v]) => [k, Math.round((v / total) * 100)]));

  // 身強弱啟發：得令 + 同黨佔比
  const monthWx = SEASON_WX[monthZhi];
  let score = 0;
  if (dayWx === monthWx) score += 3; else if (BEI_SHENG[dayWx] === monthWx) score += 2; else if (KE[monthWx] === dayWx) score -= 1;
  const sameParty = wuxingPct[dayWx] + wuxingPct[BEI_SHENG[dayWx]];
  score += (sameParty - 40) / 12;
  const strength = score >= 3 ? '身強' : score >= 1 ? '偏強' : score >= -0.5 ? '中和' : '身弱';

  // 簡易用神
  let yongshen;
  if (strength === '身強' || strength === '偏強') yongshen = `官殺(${KE[dayWx]})／食傷(${SHENG[dayWx]})／財(${BEI_KE[dayWx]})`;
  else yongshen = `印(${BEI_SHENG[dayWx]})／比劫(${dayWx})`;

  const dominantElement = Object.entries(wuxingPct).sort((a, b) => b[1] - a[1])[0][0];

  return {
    four_pillars: {
      year: { gan: gans[0], zhi: zhis[0], ten_god: safe(() => ec.getYearShiShenGan()) },
      month: { gan: gans[1], zhi: zhis[1], ten_god: safe(() => ec.getMonthShiShenGan()) },
      day: { gan: gans[2], zhi: zhis[2], ten_god: '日主' },
      hour: { gan: gans[3], zhi: zhis[3], ten_god: safe(() => ec.getTimeShiShenGan()) },
    },
    day_yuan: dayGan,
    day_wuxing: dayWx,
    wuxing_pct: wuxingPct,
    dominantElement,
    strength,
    yongshen,
    nayin: { day: safe(() => ec.getDayNaYin()) },
    solar: { delta_min: ts.deltaMin, longitude: ts.longitude, known: ts.known },
  };
}

function safe(fn) { try { return fn(); } catch { return ''; } }
