/**
 * shuziYijing.js — 數字易經磁場分析（純 JS）
 * 演算法移植自 num.fhfgft.com 八星磁場：取相鄰兩位數字 → 八大磁場卦象，
 * 含「伏位繼承前星」邏輯，統計吉凶與主導磁場。
 */
const MEANINGS = {
  11: '伏位', 19: '延年', 14: '生氣', 13: '天醫', 17: '禍害', 16: '六煞', 12: '絕命', 18: '五鬼',
  22: '伏位', 26: '延年', 28: '生氣', 27: '天醫', 23: '禍害', 29: '六煞', 21: '絕命', 24: '五鬼',
  33: '伏位', 34: '延年', 39: '生氣', 31: '天醫', 32: '禍害', 38: '六煞', 37: '絕命', 36: '五鬼',
  44: '伏位', 43: '延年', 41: '生氣', 49: '天醫', 46: '禍害', 47: '六煞', 48: '絕命', 42: '五鬼',
  66: '伏位', 62: '延年', 67: '生氣', 68: '天醫', 64: '禍害', 61: '六煞', 69: '絕命', 63: '五鬼',
  77: '伏位', 78: '延年', 76: '生氣', 72: '天醫', 71: '禍害', 74: '六煞', 73: '絕命', 79: '五鬼',
  88: '伏位', 87: '延年', 82: '生氣', 86: '天醫', 89: '禍害', 83: '六煞', 84: '絕命', 81: '五鬼',
  99: '伏位', 91: '延年', 93: '生氣', 94: '天醫', 98: '禍害', 92: '六煞', 96: '絕命', 97: '五鬼',
};

export const STAR_DESC = {
  伏位: '蓄勢待發，能量中性，不吉不凶。',
  延年: '生命力旺盛、獨當一面、穩重可靠，適合領導與長期規劃。',
  生氣: '最強吉星！常有貴人相助、迎來新轉機，能量充沛。',
  天醫: '代表財富積累與天生智慧，適合理財、醫療、顧問類職業。',
  禍害: '易有口舌是非、健康問題，需注意人際衝突與疾病。',
  六煞: '人際關係不佳、感情多波折，容易陷入糾紛或猶豫。',
  絕命: '起伏波動最大，非富即貧，易有意外、官司，需謹慎。',
  五鬼: '特立獨行、難以捉摸，不走尋常路，適合特種行業。',
};

const LUCKY = new Set(['生氣', '天醫', '延年']);
const UNLUCKY = new Set(['禍害', '六煞', '絕命', '五鬼']);

function letterToDigits(s) {
  return [...s.toUpperCase()].map((c) => {
    if (/[0-9]/.test(c)) return c;
    if (/[A-Z]/.test(c)) return String(c.charCodeAt(0) - 64);
    return '';
  }).join('');
}

function preprocess(number) {
  let n = letterToDigits(String(number).replace(/[^0-9A-Za-z]/g, ''));
  const s5 = n.startsWith('5'); const e5 = n.endsWith('5');
  n = n.replace(/5/g, '');
  if (s5) n = '5' + n;
  if (e5) n = n + '5';
  return n;
}

function lookupPair(pair) {
  if (pair.includes('0') || pair.includes('5')) return '伏位';
  return MEANINGS[Number(pair)] || '伏位';
}

/** 主分析。回傳 { dominant_star, lucky_pct, unlucky_pct, star_counts, pairs }。 */
export function analyzeShuzi(numberInput, inheritFuwei = true) {
  const cleaned = preprocess(numberInput);
  if (cleaned.length < 2) return { error: '數字過短，至少需要 2 位數字。' };

  const rawPairs = [];
  for (let i = 0; i < cleaned.length - 1; i++) {
    const pair = cleaned.slice(i, i + 2);
    rawPairs.push([pair, lookupPair(pair)]);
  }

  let pairs = rawPairs.map((p) => [...p]);
  if (inheritFuwei) {
    let lastNonFuwei = null;
    pairs = rawPairs.map(([pair, meaning]) => {
      if (meaning === '伏位') return [pair, lastNonFuwei || '伏位'];
      lastNonFuwei = meaning;
      return [pair, meaning];
    });
  }

  let lucky = 0; let unlucky = 0; let totalSig = 0;
  const starCounts = {};
  for (const [, m] of pairs) {
    if (m !== '伏位') {
      totalSig++;
      if (LUCKY.has(m)) lucky++; else unlucky++;
      starCounts[m] = (starCounts[m] || 0) + 1;
    }
  }
  const luckyPct = totalSig ? Math.round((lucky / totalSig) * 1000) / 10 : 0;
  const unluckyPct = totalSig ? Math.round((unlucky / totalSig) * 1000) / 10 : 0;
  const dominant = Object.keys(starCounts).length
    ? Object.entries(starCounts).sort((a, b) => b[1] - a[1])[0][0]
    : '伏位';

  return {
    input_processed: cleaned,
    dominant_star: dominant,
    lucky_count: lucky,
    unlucky_count: unlucky,
    lucky_pct: luckyPct,
    unlucky_pct: unluckyPct,
    star_counts: starCounts,
    pairs,
  };
}
