<script setup lang="ts">
import type { AnalysisResult } from '~/stores/analysis';
import { useAnalysisStore } from '~/stores/analysis';

const props = defineProps<{ result: AnalysisResult; transcript?: string; streaming?: boolean }>();
const store = useAnalysisStore();
const { t } = useLocale();
const downloading = ref(false);
async function exportPdf() {
  downloading.value = true;
  try { await store.downloadPdf(); } finally { downloading.value = false; }
}

// 依 UI 規範：畫面只顯示「白話商業標籤」，隱藏/轉譯所有術數術語。
const STAR_LABEL: Record<string, string> = {
  生氣: '積極 · 貴人運強', 天醫: '理性 · 重視專業理財', 延年: '穩重 · 領導決策',
  伏位: '謹慎 · 觀望型', 禍害: '在意風險 · 需被傾聽', 六煞: '重感情 · 易猶豫',
  絕命: '追求回報 · 情緒起伏', 五鬼: '想法獨特 · 反傳統',
};

const businessTags = computed(() => {
  const out: { text: string; kind: 'person' | 'env' }[] = [];
  for (const t of props.result.features.tags || []) {
    const star = /^(\S+?)磁場\(手機\)$/.exec(t);
    if (star) { out.push({ text: STAR_LABEL[star[1]] || star[1], kind: 'person' }); continue; }
    if (t.includes('身強')) out.push({ text: '主見強，需被尊重', kind: 'person' });
    else if (t.includes('身弱')) out.push({ text: '需要引導與安全感', kind: 'person' });
    // 其餘 (日主/四柱/用神/五行/三才) 屬術數內部訊號，依規範不顯示
  }
  for (const t of props.result.features.spatialTags || []) {
    const star = /^(\S+?)磁場/.exec(t);
    out.push({ text: '居家環境：' + (STAR_LABEL[star?.[1] || ''] || '中性'), kind: 'env' });
  }
  return out;
});

// 將策略文字依【標題】切段呈現
const sections = computed(() => {
  const text = props.result.strategy || '';
  const re = /【([^】]+)】/g;
  const parts: { title: string; body: string }[] = [];
  let m: RegExpExecArray | null;
  const idx: { title: string; start: number }[] = [];
  while ((m = re.exec(text))) idx.push({ title: m[1], start: m.index + m[0].length });
  if (!idx.length) return [{ title: '策略建議', body: text.trim() }];
  for (let i = 0; i < idx.length; i++) {
    const end = i + 1 < idx.length ? text.indexOf('【', idx[i].start) : text.length;
    parts.push({ title: idx[i].title, body: text.slice(idx[i].start, end).trim() });
  }
  return parts;
});

const dataLevelLabel: Record<string, string> = {
  'Level 1': '高精度（完整生辰）',
  'Level 2': '中精度（姓名 + 號碼）',
  'Level 3': '基礎（僅號碼）',
};
</script>

<template>
  <section class="card p-6">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h2 class="heading text-base">{{ t('戰略建議') }}
        <span v-if="streaming" class="text-xs text-gold-400 animate-pulse">● {{ t('生成中') }}</span>
      </h2>
      <div class="flex items-center gap-2">
        <span class="pill">{{ t('分析精度') }}：{{ t(dataLevelLabel[result.features.dataLevel] || result.features.dataLevel) }}</span>
        <span class="pill">{{ t('引擎') }}：{{ result.provider === 'mock' ? t('內建示範') : result.model }}</span>
      </div>
    </div>

    <div v-if="transcript" class="mt-3 text-sm text-gold-200/70 bg-ink-700/60 rounded-lg p-3">
      🎙️ {{ t('語音辨識') }}：「{{ t(transcript) }}」
    </div>

    <div class="flex flex-wrap gap-2 mt-4">
      <span v-for="(tag, i) in businessTags" :key="i" class="pill"
        :class="tag.kind === 'env' ? 'opacity-70' : ''">{{ t(tag.text) }}</span>
    </div>

    <div class="divider-gold" />

    <div class="grid gap-4 strategy">
      <article v-for="(s, i) in sections" :key="i" class="bg-ink-700/40 rounded-xl p-4 border border-gold-700/20">
        <h3 class="text-gold-300 font-medium mb-1">{{ t(s.title) }}</h3>
        <p class="text-gold-50/90 leading-relaxed whitespace-pre-line">{{ t(s.body) }}</p>
      </article>
    </div>

    <p class="mt-4 text-[11px] text-gold-200/30">{{ t('本建議由 AI 綜合多源知識生成') }}</p>
  </section>
</template>
