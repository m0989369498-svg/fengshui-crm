<script setup lang="ts">
const api = useApi();
const { t } = useLocale();
const status = ref<'checking' | 'ok' | 'down'>('checking');
const detail = ref('');

async function check() {
  try {
    const h = await api.get<any>('/health');
    status.value = h?.ok ? 'ok' : 'down';
    const ai = h?.llm === 'mock' ? '內建示範' : `真AI(${h?.llm})`;
    detail.value = `引擎 本機運算 · AI ${ai}`;
  } catch {
    status.value = 'down';
    detail.value = '後端離線';
  }
}
onMounted(() => { check(); setInterval(check, 30000); });

const dot = computed(() => ({
  checking: 'bg-gold-200/40',
  ok: 'bg-emerald-400',
  down: 'bg-red-500',
}[status.value]));
</script>

<template>
  <div class="flex items-center gap-2 text-xs text-gold-200/70" :title="t(detail)">
    <span class="w-2 h-2 rounded-full" :class="dot" />
    <span>{{ t(detail) || t('檢查中…') }}</span>
  </div>
</template>
