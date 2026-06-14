<script setup lang="ts">
const { t } = useLocale();
const { login } = useAuth();
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  if (!password.value) return;
  busy.value = true; error.value = '';
  const ok = await login(password.value);
  busy.value = false;
  if (!ok) error.value = t('密碼錯誤');
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-ink-900/95 backdrop-blur grid place-items-center px-6">
    <div class="card p-8 w-full max-w-sm text-center">
      <div class="w-12 h-12 rounded-full border border-gold-400/60 grid place-items-center text-gold-400 font-serif text-xl mx-auto mb-3">羅</div>
      <h1 class="heading text-lg mb-1">{{ t('不帶羅盤的風水師') }}</h1>
      <p class="text-xs text-gold-200/50 mb-5">{{ t('請輸入存取密碼') }}</p>
      <input v-model="password" type="password" class="field text-center" :placeholder="t('密碼')"
        @keyup.enter="submit" autofocus />
      <p v-if="error" class="text-red-300 text-sm mt-2">{{ error }}</p>
      <button class="btn-gold w-full mt-4" :disabled="busy || !password" @click="submit">
        {{ busy ? t('驗證中…') : t('進入') }}
      </button>
    </div>
  </div>
</template>
