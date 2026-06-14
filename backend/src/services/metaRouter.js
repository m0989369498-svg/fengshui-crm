/**
 * metaRouter.js — 動態玄學路由（體驗版，全本機純 JS）
 * 依資料完整度 Level 1-3 降級呼叫八字/姓名學/數字易經，
 * 把術數訊號「翻譯」成商業特徵（profile.dimensions），供 LLM 產白話策略。
 */
import { computeBazi } from '../engines/bazi.js';
import { computeXingming } from '../engines/xingming.js';
import { analyzeShuzi } from '../engines/shuziYijing.js';
import { AppError, ErrorCodes } from '../common/errors.js';

export function classifyDataLevel(c = {}) {
  const b = c.birth || {};
  if (b.year && b.month && b.day && b.hour !== undefined && b.hour !== null) return 'Level 1';
  if (c.name && c.name.trim().length >= 2) return 'Level 2';
  if (c.phone) return 'Level 3';
  return 'Level 0';
}

// 數字易經八星 → 商業性格（不洩卦象名）
const STAR_TRAIT = {
  生氣: '積極樂觀、愛抓新機會、貴人運強', 天醫: '理性務實、重視專業與理財', 延年: '穩重可靠、重長期關係、有決斷',
  伏位: '謹慎觀望、需要安全感', 禍害: '在意風險、需要被傾聽', 六煞: '重感情、容易猶豫', 絕命: '追求回報、情緒起伏大', 五鬼: '想法獨特、不走尋常路',
};

function addressDigits(addr) {
  if (!addr) return '';
  const norm = addr.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  const no = (norm.match(/(\d+)\s*號/) || [])[1];
  const fl = (norm.match(/(\d+)\s*樓/) || [])[1];
  const rm = (norm.match(/(\d+)\s*室/) || [])[1];
  let d = [no, fl, rm].filter(Boolean).join('');
  if (!d) d = (norm.match(/\d+/g) || []).join('');
  return d;
}

export function extractFeatures(customer = {}) {
  const dataLevel = classifyDataLevel(customer);
  if (dataLevel === 'Level 0') {
    throw new AppError(ErrorCodes.INSUFFICIENT_DATA, '資料不足：請至少提供姓名、手機，或完整出生年月日時。', 400);
  }
  const tags = []; const spatialTags = []; const raw = {};
  const profile = { dimensions: [] };
  const isMale = customer.gender !== 'female';

  let baziWx = null;
  if (dataLevel === 'Level 1') {
    const bz = computeBazi({ ...customer.birth, is_male: isMale });
    raw.bazi = bz; baziWx = bz.wuxing_pct;
    const fp = bz.four_pillars;
    tags.push(`日主${bz.day_yuan}`);
    tags.push(`四柱:${['year', 'month', 'day', 'hour'].map((k) => fp[k].gan + fp[k].zhi).join(' ')}`);
    tags.push(`日主${bz.strength}`);
    tags.push(`五行偏${bz.dominantElement}`);
    profile.bazi = { strength: bz.strength, yongshen: bz.yongshen, dominantElement: bz.dominantElement };
    profile.dimensions.push(`先天命格：${bz.strength}，喜用${bz.yongshen}，五行偏${bz.dominantElement}`);
  }

  if ((dataLevel === 'Level 1' || dataLevel === 'Level 2') && customer.name) {
    const xm = computeXingming(customer.name);
    if (xm) {
      raw.xingming = xm;
      tags.push(`三才${xm.sancai.verdict}`);
      profile.dimensions.push(`姓名人格特質：(${xm.ren_wx}型) ${xm.personality}`);
      profile.dimensions.push(`姓名三才運勢：${xm.sancai.verdict}`);
    }
  }

  if (customer.phone) {
    const sz = analyzeShuzi(customer.phone);
    if (!sz.error) {
      raw.phone = sz;
      tags.push(`${sz.dominant_star}磁場(手機)`);
      tags.push(`手機吉數${sz.lucky_pct}%`);
      const comp = Object.entries(sz.star_counts).sort((a, b) => b[1] - a[1])
        .map(([s, n]) => STAR_TRAIT[s] && `${STAR_TRAIT[s]}（${n >= 4 ? '強' : n >= 2 ? '中' : '微'}）`).filter(Boolean).join('；');
      if (comp) profile.dimensions.push(`號碼能量傾向：${comp}（整體偏正向 ${sz.lucky_pct}%）`);
    }
  }

  if (customer.address) {
    const d = addressDigits(customer.address);
    if (d && d.length >= 2) {
      const sz = analyzeShuzi(d);
      if (!sz.error) { raw.address = { digits: d, shuzi: sz }; spatialTags.push(`${sz.dominant_star}磁場(地址)`); }
    }
  }

  return { dataLevel, tags, spatialTags, profile, raw };
}
