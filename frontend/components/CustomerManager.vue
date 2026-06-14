<script setup lang="ts">
import { useCustomerStore, type CustomerRecord } from '~/stores/customers';
import type { Customer } from '~/stores/analysis';

const emit = defineEmits<{ (e: 'analyze', customer: Customer): void }>();
const { t } = useLocale();
const store = useCustomerStore();

const q = ref('');
const showNew = ref(false);
const draft = ref<Partial<CustomerRecord>>({ gender: undefined });

onMounted(() => store.load());
let timer: any;
watch(q, () => { clearTimeout(timer); timer = setTimeout(() => store.load(q.value), 300); });

async function create() {
  if (!draft.value.name && !draft.value.phone) return;
  const c = await store.create(draft.value);
  if (c) { showNew.value = false; draft.value = { gender: undefined }; }
}

function analyze(c: CustomerRecord) {
  emit('analyze', { name: c.name, gender: c.gender, phone: c.phone, address: c.address, birth: c.birth });
}
</script>

<template>
  <section class="card p-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="heading text-base">{{ t('客戶檔案') }} <span class="text-xs text-gold-200/40">({{ store.list.length }})</span></h2>
      <button class="btn-ghost text-xs py-1" @click="showNew = !showNew">{{ showNew ? t('取消') : t('＋ 新增') }}</button>
    </div>

    <input v-model="q" class="field mb-3" :placeholder="t('搜尋姓名或手機…')" />

    <div v-if="showNew" class="bg-ink-700/40 rounded-lg p-3 mb-3 grid grid-cols-2 gap-2">
      <input v-model="draft.name" class="field" :placeholder="t('姓名')" />
      <input v-model="draft.phone" class="field" :placeholder="t('手機')" inputmode="numeric" />
      <select v-model="draft.gender" class="field">
        <option :value="undefined">{{ t('性別') }}</option>
        <option value="male">{{ t('男') }}</option>
        <option value="female">{{ t('女') }}</option>
      </select>
      <input v-model="draft.note" class="field" :placeholder="t('備註')" />
      <button class="btn-gold col-span-2 py-1.5" @click="create">{{ t('建立客戶') }}</button>
    </div>

    <p v-if="store.error" class="text-red-300 text-sm mb-2">{{ store.error.message }}</p>

    <ul class="space-y-2 max-h-[28rem] overflow-auto">
      <li v-for="c in store.list" :key="c.id"
        class="bg-ink-700/40 rounded-lg p-3 border border-gold-700/20 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <div class="font-medium truncate">{{ c.name || t('未命名') }}
            <span class="text-xs text-gold-200/40">{{ c.phone }}</span>
          </div>
          <div v-if="c.note" class="text-xs text-gold-200/40 truncate">{{ c.note }}</div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="btn-gold text-xs py-1 px-3" @click="analyze(c)">{{ t('分析') }}</button>
          <button class="btn-ghost text-xs py-1 px-2" @click="store.remove(c.id)" :title="t('刪除')">✕</button>
        </div>
      </li>
      <li v-if="!store.list.length && !store.loading" class="text-center text-gold-200/30 py-6 text-sm">
        {{ t('尚無客戶，點「新增」建立第一筆。') }}
      </li>
    </ul>
  </section>
</template>
