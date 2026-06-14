<script setup lang="ts">
import type { Customer } from '~/stores/analysis';

const props = defineProps<{ customer: Customer }>();
const api = useApi();
const { t } = useLocale();

const purpose = ref('簽約');
const purposes = ref<string[]>(['簽約', '開業', '見客', '談判', '搬遷', '收款', '提案']);
const start = ref(new Date().toISOString().slice(0, 10));
const end = ref(new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
const loading = ref(false);
const error = ref('');
const picks = ref<any[]>([]);

onMounted(async () => {
  try { const d = await api.get<any>('/api/calendar/purposes'); if (d.purposes) purposes.value = d.purposes; } catch { /* 用預設 */ }
});

async function run() {
  loading.value = true; error.value = ''; picks.value = [];
  try {
    const d = await api.post<any>('/api/calendar/select', {
      start: start.value, end: end.value, purpose: purpose.value,
      birth: props.customer?.birth, limit: 5,
    });
    picks.value = d.picks || [];
  } catch (e: any) {
    error.value = e.message || '擇日失敗';
  } finally {
    loading.value = false;
  }
}

const levelColor: Record<string, string> = { 大吉: 'text-emerald-300', 吉: 'text-gold-300', 平: 'text-gold-200/60', 普通: 'text-gold-200/40' };

</script>

<template>
  <section class="card p-6">
    <h2 class="heading text-base mb-1">{{ t('商業擇日') }}</h2>
    <p class="text-xs text-gold-200/50 mb-4">{{ t('黃曆宜忌 → 本命沖合 → 吉時（依顧客生辰自動避沖）') }}</p>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">{{ t('用途') }}</label>
        <select v-model="purpose" class="field">
          <option v-for="p in purposes" :key="p" :value="p">{{ t(p) }}</option>
        </select>
      </div>
      <div class="flex items-end">
        <button class="btn-gold w-full" :disabled="loading" @click="run">
          {{ loading ? t('推算中…') : t('挑選吉日') }}
        </button>
      </div>
      <div><label class="label">{{ t('起') }}</label><input v-model="start" type="date" class="field" /></div>
      <div><label class="label">{{ t('迄') }}</label><input v-model="end" type="date" class="field" /></div>
    </div>

    <p v-if="error" class="text-red-300 text-sm mt-3">{{ t(error) }}</p>

    <ul v-if="picks.length" class="mt-4 space-y-2">
      <li v-for="p in picks" :key="p.date" class="bg-ink-700/40 rounded-lg p-3 border border-gold-700/20">
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ p.date }} <span class="text-gold-200/50">{{ t('週') }}{{ t(p.weekday) }}</span></span>
          <span :class="levelColor[p.level]" class="font-serif">{{ t(p.level) }}</span>
        </div>
        <div class="text-xs text-gold-200/60 mt-1">{{ t(p.reasons.join('、')) || '—' }}</div>
        <div class="text-xs text-gold-300/80 mt-1">
          {{ t('吉時') }}：{{ p.goodHours.map((h: any) => h.hourRange + (h.he ? t('(合命)') : '')).join('　') || '—' }}
        </div>
      </li>
    </ul>
  </section>
</template>
