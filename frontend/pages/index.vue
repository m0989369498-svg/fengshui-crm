<script setup lang="ts">
import { useAnalysisStore, type Customer } from '~/stores/analysis';
import CustomerForm from '~/components/CustomerForm.vue';
import StrategyResult from '~/components/StrategyResult.vue';
import DateSelector from '~/components/DateSelector.vue';
import CustomerManager from '~/components/CustomerManager.vue';
import HistoryPanel from '~/components/HistoryPanel.vue';
import FollowupChat from '~/components/FollowupChat.vue';

const store = useAnalysisStore();
const { t } = useLocale();

const tab = ref<'analyze' | 'customers' | 'history'>('analyze');
const tabs = [
  { key: 'analyze', label: '戰略分析' },
  { key: 'customers', label: '客戶檔案' },
  { key: 'history', label: '互動歷史' },
] as const;

const customer = ref<Customer>({ gender: undefined });
const salesQuestion = ref('');
const operator = ref('業務-Enoch(工號A001)');
const transcript = ref('');

async function onSubmit() {
  transcript.value = '';
  await store.generateStream(customer.value, salesQuestion.value, operator.value);
}
async function onSubmitVoice(file: File) {
  const tx = await store.generateFromVoice(customer.value, file, operator.value);
  if (tx) { transcript.value = tx; salesQuestion.value = tx; }
}
function fromCustomer(c: Customer) {
  customer.value = { ...c };
  tab.value = 'analyze';
  store.result = null;
}

const followContext = computed(() => {
  if (!store.result) return '';
  const c = customer.value;
  return `客戶：${c.name || ''} ${c.phone || ''}。先前策略摘要：${(store.result.strategy || '').slice(0, 400)}`;
});
</script>

<template>
  <div>
    <!-- 分頁 -->
    <div class="flex gap-1 mb-6 bg-ink-800/60 rounded-xl p-1 w-full sm:w-auto sm:inline-flex border border-gold-700/20">
      <button v-for="tb in tabs" :key="tb.key"
        class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm transition"
        :class="tab === tb.key ? 'bg-gradient-to-b from-gold-400 to-gold-600 text-ink-900 font-medium' : 'text-gold-200/70 hover:text-gold-100'"
        @click="tab = tb.key">{{ t(tb.label) }}</button>
    </div>

    <!-- 戰略分析 -->
    <div v-show="tab === 'analyze'" class="grid lg:grid-cols-2 gap-6 items-start">
      <div class="space-y-6">
        <CustomerForm v-model:customer="customer" v-model:salesQuestion="salesQuestion"
          :loading="store.loading" @submit="onSubmit" @submitVoice="onSubmitVoice" />
        <DateSelector :customer="customer" />
      </div>

      <div class="space-y-4">
        <div v-if="store.error && !store.streaming" class="card p-5 border-red-500/40">
          <div class="flex items-center gap-2 text-red-300"><span class="text-lg">⚠</span>
            <h3 class="font-medium">{{ t(store.error.message) }}</h3></div>
          <p class="text-xs text-gold-200/40 mt-1">{{ t('錯誤碼') }}：{{ store.error.code }}</p>
        </div>

        <div v-else-if="store.loading && !store.result?.strategy" class="card p-6">
          <div class="animate-pulse space-y-3">
            <div class="h-4 bg-ink-600 rounded w-1/3" /><div class="h-3 bg-ink-600 rounded w-full" />
            <div class="h-3 bg-ink-600 rounded w-5/6" /><div class="h-3 bg-ink-600 rounded w-2/3" />
          </div>
          <p class="text-xs text-gold-200/40 mt-4">{{ t('正在融合命理訊號與銷售心理知識庫，推演戰略中…') }}</p>
        </div>

        <template v-else-if="store.result">
          <StrategyResult :result="store.result" :transcript="transcript" :streaming="store.streaming" />
          <FollowupChat v-if="!store.streaming" :customerContext="followContext" />
        </template>

        <div v-else class="card p-8 text-center text-gold-200/40">
          <div class="text-4xl mb-3 font-serif text-gold-400/60">羅</div>
          <p>{{ t('填入顧客資料與業務情境，讓系統把玄學訊號翻譯成可執行的成交策略。') }}</p>
        </div>
      </div>
    </div>

    <!-- 客戶檔案 -->
    <div v-show="tab === 'customers'" class="max-w-2xl">
      <CustomerManager @analyze="fromCustomer" />
    </div>

    <!-- 互動歷史 -->
    <div v-show="tab === 'history'" class="max-w-3xl">
      <HistoryPanel />
    </div>
  </div>
</template>
