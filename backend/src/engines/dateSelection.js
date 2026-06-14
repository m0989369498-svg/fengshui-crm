/**
 * dateSelectionEngine.js — 動態商業擇日引擎（模組5）
 * ============================================================
 * 漏斗過濾：黃曆宜忌 → 本命相沖/相合 → 產出吉凶時辰。
 * 全本機（lunar-javascript），無外網。對外輸出白話商業建議（不丟術數原文）。
 */
import Lunar from 'lunar-javascript';
import { toTrueSolar } from './trueSolarTime.js';
const { Solar } = Lunar;

// 地支六沖 / 六合
const LIU_CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
const LIU_HE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };

// 商業用途 → 黃曆「宜」關鍵詞（lunar-javascript 為簡體）
const PURPOSE_YI = {
  簽約: ['开市', '立券', '交易', '纳财', '签约'],
  開業: ['开市', '开业', '纳财', '立券'],
  見客: ['会亲友', '出行', '纳采', '订盟'],
  談判: ['会亲友', '订盟', '纳采'],
  搬遷: ['移徙', '入宅', '安床'],
  動土: ['动土', '修造', '竖柱'],
  收款: ['纳财', '交易', '立券'],
  提案: ['会亲友', '出行', '订盟', '纳采'],
};

const HOUR_RANGE = {
  子: '23-01', 丑: '01-03', 寅: '03-05', 卯: '05-07', 辰: '07-09', 巳: '09-11',
  午: '11-13', 未: '13-15', 申: '15-17', 酉: '17-19', 戌: '19-21', 亥: '21-23',
};

/**
 * 取本命關鍵地支（日支最重，其次年支）。birth 可為空。
 * 若提供時辰+城市，先做真太陽時校正（近午夜出生可能改變日柱）。
 */
function natalZhi(birth) {
  if (!birth || !birth.year || !birth.month || !birth.day) return null;
  try {
    let solar;
    if (birth.hour !== undefined && birth.hour !== null) {
      const ts = toTrueSolar(birth);
      solar = Solar.fromYmdHms(ts.y, ts.m, ts.d, ts.h, ts.min, 0);
    } else {
      solar = Solar.fromYmd(birth.year, birth.month, birth.day);
    }
    const l = solar.getLunar();
    return { day: l.getDayInGanZhi()[1], year: l.getYearInGanZhiByLiChun()[1] };
  } catch {
    return null;
  }
}

/**
 * 擇日主函數。
 * @param {object} o
 * @param {string} o.start  'YYYY-MM-DD'
 * @param {string} o.end    'YYYY-MM-DD'
 * @param {string} [o.purpose='簽約']
 * @param {object} [o.birth] { year, month, day } 顧客或業務本命（用於沖合）
 * @param {number} [o.limit=5] 回傳前幾個吉日
 * @returns {{purpose, scanned, picks:Array}}
 */
export function selectDates(o) {
  const purpose = o.purpose || '簽約';
  const yiKeys = o.yiKeywords || PURPOSE_YI[purpose] || [];
  const natal = natalZhi(o.birth);
  const start = parseDate(o.start);
  const end = parseDate(o.end);
  if (!start || !end || end < start) throw new Error('日期區間無效');

  const picks = [];
  let scanned = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    scanned++;
    const day = evalDay(new Date(d), yiKeys, natal, purpose);
    if (day) picks.push(day);
  }
  picks.sort((a, b) => b.score - a.score);
  return { purpose, scanned, picks: picks.slice(0, o.limit || 5) };
}

function evalDay(date, yiKeys, natal, purpose) {
  const l = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
  const ganzhi = l.getDayInGanZhi();
  const dayZhi = ganzhi[1];
  const yi = l.getDayYi() || [];
  const ji = l.getDayJi() || [];
  const dayLuck = safe(() => l.getDayTianShenLuck()); // 吉=黃道 / 凶=黑道
  const reasons = [];
  let score = 0;

  // ── 漏斗1：黃曆宜忌 ──
  if (ji.includes('诸事不宜')) return null;
  const matchedYi = yiKeys.filter((k) => yi.includes(k));
  if (yiKeys.length && matchedYi.length === 0) return null; // 黃曆不宜此事 → 淘汰
  if (matchedYi.length) { score += 3 * matchedYi.length; reasons.push(`黃曆宜${purpose}`); }
  // 忌與用途衝突
  const jiHit = yiKeys.filter((k) => ji.includes(k));
  if (jiHit.length) return null;
  if (dayLuck === '吉') { score += 2; reasons.push('黃道吉日'); }
  else if (dayLuck === '凶') { score -= 1; }

  // ── 漏斗2：本命相沖/相合 ──
  if (natal) {
    if (LIU_CHONG[natal.day] === dayZhi) { return null; } // 沖本命日 → 直接淘汰
    if (LIU_CHONG[natal.year] === dayZhi) { score -= 2; reasons.push('與生年略沖，謹慎'); }
    if (LIU_HE[natal.day] === dayZhi) { score += 4; reasons.push('與本命相合，氣場契合'); }
    else if (LIU_HE[natal.year] === dayZhi) { score += 2; reasons.push('與生年相合'); }
  }

  // ── 漏斗3：吉時 ──
  const goodHours = pickGoodHours(l, natal);
  if (!goodHours.length) score -= 1;

  return {
    date: fmt(date),
    weekday: '日一二三四五六'[date.getDay()],
    score,
    level: score >= 8 ? '大吉' : score >= 5 ? '吉' : score >= 2 ? '平' : '普通',
    reasons,
    goodHours,
  };
}

function pickGoodHours(lunar, natal) {
  const out = [];
  const times = safe(() => lunar.getTimes()) || [];
  for (const t of times) {
    const gz = safe(() => t.getGanZhi());
    if (!gz) continue;
    const zhi = gz[1];
    const luck = safe(() => t.getTianShenLuck());
    if (luck !== '吉') continue; // 只取黃道吉時
    if (natal && LIU_CHONG[natal.day] === zhi) continue; // 時沖本命 → 跳過
    const heNatal = natal && (LIU_HE[natal.day] === zhi || LIU_HE[natal.year] === zhi);
    out.push({ ganzhi: gz, hourRange: HOUR_RANGE[zhi] || '', he: !!heNatal });
  }
  // 與本命相合的吉時優先
  out.sort((a, b) => Number(b.he) - Number(a.he));
  return out.slice(0, 3);
}

function safe(fn) { try { return fn(); } catch { return null; } }
function parseDate(s) { const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '')); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function fmt(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export const SUPPORTED_PURPOSES = Object.keys(PURPOSE_YI);
