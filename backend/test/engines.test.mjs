import assert from 'assert';
import { analyzeShuzi } from '../src/engines/shuziYijing.js';
import { computeBazi } from '../src/engines/bazi.js';
import { computeXingming } from '../src/engines/xingming.js';
import { selectDates } from '../src/engines/dateSelection.js';
import { extractFeatures } from '../src/services/metaRouter.js';
import { generateStrategy } from '../src/services/strategyService.js';

const ok = (n) => console.log('  ✓', n);
console.log('體驗版引擎測試\n');

const sz = analyzeShuzi('0939828866');
assert(sz.dominant_star && sz.lucky_pct >= 0);
ok(`數字易經 0939828866 → 主導 ${sz.dominant_star}, 吉 ${sz.lucky_pct}%`);

const bz = computeBazi({ year: 1992, month: 10, day: 1, hour: 16, minute: 44, city: '台北', is_male: true });
assert(bz.four_pillars.day.gan && bz.strength);
ok(`八字 → 日主${bz.day_yuan}, ${bz.strength}, 真太陽時 ${bz.solar.delta_min}分`);

const xm = computeXingming('王建腾');
assert(xm && xm.sancai.verdict && xm.ren_wx);
ok(`姓名學 王建腾 → 三才${xm.sancai.verdict}, 人格${xm.ren_wx}型`);

const dt = selectDates({ start: '2026-06-20', end: '2026-07-20', purpose: '簽約', birth: { year: 1992, month: 10, day: 1 }, limit: 3 });
assert(Array.isArray(dt.picks) && dt.scanned === 31);
ok(`擇日 掃描 ${dt.scanned} 天 → ${dt.picks.length} 吉日 (首選 ${dt.picks[0]?.date} ${dt.picks[0]?.level})`);

const f = extractFeatures({ name: '王建腾', gender: 'male', birth: { year: 1992, month: 10, day: 1, hour: 16, minute: 44, city: '台北' }, phone: '0939828866' });
assert(f.dataLevel === 'Level 1' && f.profile.dimensions.length >= 2);
ok(`玄學路由 Level 1 → ${f.tags.length} 標籤, ${f.profile.dimensions.length} 深度維度`);

const r = await generateStrategy({ name: '王建腾', phone: '0939828866' }, { salesQuestion: '高價猶豫', lang: 'zh-Hant' });
assert(r.strategy.includes('顧客輪廓') && r.provider === 'mock');
const leak = ['生氣', '天醫', '延年', '伏位', '三才', '日主'].filter((w) => r.strategy.includes(w));
ok(`mock 策略 → provider=${r.provider}, ${r.strategy.length}字, 術數洩漏:${leak.length ? leak.join(',') : '無'}`);

console.log('\n✅ 全部通過');
