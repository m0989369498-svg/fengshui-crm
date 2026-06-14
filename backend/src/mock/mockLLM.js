/**
 * mockLLM.js — 零設定內建策略產生器
 * 不需任何 API 金鑰，依玄學特徵組出「白話商業策略」，讓體驗版開箱即玩。
 * 想要真 AI：在 .env 設 LLM_PROVIDER=openai|deepseek|ollama + 金鑰即自動切換。
 */

// 手機主導磁場 → 溝通要點
const STAR_PLAYBOOK = {
  生氣: { trait: '積極樂觀、喜歡新機會、貴人運強', talk: '多談願景與成長空間、把方案包裝成「新的機會」', avoid: '冗長的風險細節會讓他失去耐心' },
  天醫: { trait: '理性務實、重視專業與回報', talk: '用數據、案例、ROI 說話，展現你的專業度', avoid: '空泛的情懷訴求打動不了他' },
  延年: { trait: '穩重可靠、重視長期關係', talk: '強調售後與長期陪伴、建立信任再談成交', avoid: '急促逼單會讓他卻步' },
  伏位: { trait: '謹慎保守、需要安全感', talk: '降低決策壓力、提供保證與退路、慢慢來', avoid: '製造稀缺與緊迫感反而會嚇跑他' },
  禍害: { trait: '在意風險、容易焦慮', talk: '先傾聽他的顧慮、逐一化解、給足安全感', avoid: '忽略他的擔憂直接推銷' },
  六煞: { trait: '重感情、容易猶豫', talk: '用關係與情感連結、給他「不會選錯」的信心', avoid: '逼他立刻下決定' },
  絕命: { trait: '追求回報、敢冒險', talk: '談高報酬與差異化、給他刺激感', avoid: '太保守的方案勾不起興趣' },
  五鬼: { trait: '想法獨特、反傳統', talk: '尊重他的獨特見解、給客製化與彈性', avoid: '標準化話術他會反感' },
};

function pickStar(features) {
  const t = (features.tags || []).map((x) => /^(\S+?)磁場\(手機\)$/.exec(x)).find(Boolean);
  return t ? t[1] : null;
}

/** 產出 4 段白話策略（繁體；簡體由前端 opencc 正規化）。 */
export function generateMockStrategy({ customer = {}, features = {}, salesQuestion = '' }) {
  const star = pickStar(features);
  const pb = STAR_PLAYBOOK[star] || STAR_PLAYBOOK['伏位'];
  const name = (customer.name || '這位客戶').replace(/[\r\n]/g, ' ').slice(0, 20);
  const dims = features.profile?.dimensions || [];
  const personality = (dims.find((d) => d.startsWith('姓名人格')) || '').replace(/^姓名人格特質：/, '');
  const strength = features.profile?.bazi?.strength;
  const luckyTag = (features.tags || []).find((t) => t.startsWith('手機吉數')) || '';

  const decideStyle = star && ['生氣', '絕命', '五鬼'].includes(star) ? '偏果斷、相信直覺' : star && ['伏位', '禍害', '六煞'].includes(star) ? '偏謹慎、需要時間消化' : '理性權衡、看重實際效益';
  const concern = star && ['伏位', '禍害', '六煞'].includes(star) ? '怕做錯決定、在意保障' : star && ['天醫', '延年'].includes(star) ? '在意值不值得、是否專業可靠' : '在意能不能帶來實際好處';

  const lines = [];
  lines.push('【顧客輪廓】');
  lines.push(`· 性格特質：${pb.trait}${personality ? '；' + personality : ''}。`);
  lines.push(`· 決策風格：${decideStyle}${strength ? `（本命${strength}，${strength.includes('強') ? '有主見、需要被尊重' : '較需引導與安全感'}）` : ''}。`);
  lines.push(`· 溝通偏好與在意點：${concern}；${pb.talk}。`);
  lines.push(`· 地雷與顧慮：${pb.avoid}。`);
  lines.push('');
  lines.push('【溝通策略】');
  lines.push(`1. 談什麼：${pb.talk}。`);
  lines.push('2. 用什麼語氣：專業、誠懇、不急不徐，先建立信任再談價值。');
  lines.push(`3. 避開什麼：${pb.avoid}。`);
  lines.push('');
  lines.push('【成交切入】');
  lines.push(`「${name}，我理解你最在意的是${concern.split('、')[0]}。不如我先針對這點，給你一個最適合你的方案，你再決定要不要往下走，完全不勉強。」`);
  lines.push('');
  lines.push('【下一步行動】');
  lines.push(`本週內主動聯繫${name}，${star && ['伏位', '禍害', '六煞'].includes(star) ? '提供一份能降低他疑慮的資料（保證/案例），不催促' : '直接約一次簡短會談，帶上能展現價值的具體方案'}。`);
  if (salesQuestion) lines.push(`（針對你的提問「${salesQuestion.slice(0, 40)}」：${star && ['伏位', '禍害', '六煞'].includes(star) ? '先別逼單，用安全感換時間' : '可以更主動推進，他吃積極這一套'}。）`);
  return lines.join('\n');
}
