<script setup lang="ts">
const { t } = useLocale();
const api = useApi();
const items = ref<any[]>([]);
const loading = ref(false);
const expanded = ref<number | null>(null);

async function load() {
  loading.value = true;
  try {
    const d = await api.get<any>('/api/interaction/history?limit=30');
    items.value = d.items || [];
  } catch { /* ignore */ }
  finally { loading.value = false; }
}
onMounted(load);
defineExpose({ load });

function when(ts: string) { return (ts || '').slice(0, 16).replace('T', ' '); }
</script>

<template>
  <section class="card p-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="heading text-base">{{ t('互動歷史') }} <span class="text-xs text-gold-200/40">({{ items.length }})</span></h2>
      <button class="btn-ghost text-xs py-1" @click="load">{{ t('重新整理') }}</button>
    </div>

    <p v-if="!items.length && !loading" class="text-center text-gold-200/30 py-6 text-sm">{{ t('尚無互動紀錄') }}</p>

    <ul class="space-y-2 max-h-[32rem] overflow-auto">
      <li v-for="(it, i) in items" :key="i" class="bg-ink-700/40 rounded-lg border border-gold-700/20">
        <button class="w-full text-left p-3" @click="expanded = expanded === i ? null : i">
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium truncate">{{ it.customer?.name || t('未命名客戶') }}
              <span class="text-xs text-gold-200/40">{{ it.customer?.phone }}</span>
            </span>
            <span class="text-xs text-gold-200/40 shrink-0">{{ when(it.ts) }}</span>
          </div>
          <div v-if="it.salesQuestion" class="text-xs text-gold-200/50 truncate mt-0.5">{{ t(it.salesQuestion) }}</div>
        </button>
        <div v-if="expanded === i" class="px-3 pb-3 text-sm text-gold-50/85 whitespace-pre-line border-t border-gold-700/20 pt-2">
          {{ t(it.strategy || '') }}
        </div>
      </li>
    </ul>
  </section>
</template>
