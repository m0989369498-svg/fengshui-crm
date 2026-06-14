<script setup lang="ts">
import type { Customer } from '~/stores/analysis';

const customer = defineModel<Customer>('customer', { required: true });
const salesQuestion = defineModel<string>('salesQuestion', { required: true });

const emit = defineEmits<{ (e: 'submit'): void; (e: 'submitVoice', file: File): void }>();
const props = defineProps<{ loading: boolean }>();
const { t } = useLocale();

const knowBirth = ref(false);
function ensureBirth() {
  if (!customer.value.birth) customer.value.birth = { city: '台北' };
}
watch(knowBirth, (v) => { if (v) ensureBirth(); });

const audioFile = ref<File | null>(null);
function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null;
  audioFile.value = f;
}
function submitVoice() {
  if (audioFile.value) emit('submitVoice', audioFile.value);
}
</script>

<template>
  <section class="card p-6">
    <h2 class="heading text-base mb-1">{{ t('顧客資料') }}</h2>
    <p class="text-xs text-gold-200/50 mb-4">{{ t('資料越完整，策略越精準（系統會自動依完整度降級分析）') }}</p>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label">{{ t('姓名') }}</label>
        <input v-model="customer.name" class="field" :placeholder="t('王小明')" />
      </div>
      <div>
        <label class="label">{{ t('性別') }}</label>
        <select v-model="customer.gender" class="field">
          <option :value="undefined">{{ t('未提供') }}</option>
          <option value="male">{{ t('男') }}</option>
          <option value="female">{{ t('女') }}</option>
        </select>
      </div>
      <div>
        <label class="label">{{ t('手機（個人核心磁場）') }}</label>
        <input v-model="customer.phone" class="field" placeholder="0912345678" inputmode="numeric" />
      </div>
      <div>
        <label class="label">{{ t('居住地址（環境磁場 20%）') }}</label>
        <input v-model="customer.address" class="field" :placeholder="t('台北市信義區松高路19號8樓')" />
      </div>
    </div>

    <div class="mt-4">
      <label class="inline-flex items-center gap-2 text-sm text-gold-200/80 cursor-pointer">
        <input type="checkbox" v-model="knowBirth" class="accent-gold-500" />
        {{ t('知道完整出生年月日時（啟用最高精度分析）') }}
      </label>
    </div>

    <div v-if="knowBirth && customer.birth" class="grid grid-cols-3 gap-3 mt-3">
      <div><label class="label">{{ t('年') }}</label><input v-model.number="customer.birth.year" type="number" class="field" placeholder="1992" /></div>
      <div><label class="label">{{ t('月') }}</label><input v-model.number="customer.birth.month" type="number" class="field" placeholder="10" /></div>
      <div><label class="label">{{ t('日') }}</label><input v-model.number="customer.birth.day" type="number" class="field" placeholder="1" /></div>
      <div><label class="label">{{ t('時') }}</label><input v-model.number="customer.birth.hour" type="number" class="field" placeholder="16" /></div>
      <div><label class="label">{{ t('分') }}</label><input v-model.number="customer.birth.minute" type="number" class="field" placeholder="44" /></div>
      <div><label class="label">{{ t('出生城市') }}</label><input v-model="customer.birth.city" class="field" :placeholder="t('台北')" /></div>
    </div>

    <div class="divider-gold" />

    <label class="label">{{ t('業務情境 / 想解決的問題') }}</label>
    <textarea v-model="salesQuestion" rows="3" class="field"
      :placeholder="t('例：客戶對 18 萬年度顧問方案有興趣但一直猶豫，下一步怎麼推進？')" />

    <div class="flex flex-wrap items-center gap-3 mt-4">
      <button class="btn-gold" :disabled="props.loading" @click="emit('submit')">
        <span v-if="props.loading" class="animate-pulse">{{ t('推演中…') }}</span>
        <span v-else>{{ t('產生讀心策略') }}</span>
      </button>
    </div>
  </section>
</template>
