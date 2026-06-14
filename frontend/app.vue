<script setup lang="ts">
import HealthBadge from '~/components/HealthBadge.vue';
import LoginGate from '~/components/LoginGate.vue';
const { t, locale, toggle } = useLocale();
const { enabled, authed, checked, checkStatus, logout } = useAuth();
onMounted(checkStatus);
</script>

<template>
  <div class="min-h-full flex flex-col">
    <LoginGate v-if="checked && enabled && !authed" />

    <header class="border-b border-gold-700/30 bg-ink-800/60 backdrop-blur sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gold-400/60 grid place-items-center text-gold-400 font-serif text-base sm:text-lg shrink-0">羅</div>
          <div class="min-w-0">
            <h1 class="heading text-base sm:text-lg leading-tight truncate">{{ t('不帶羅盤的風水師') }}</h1>
            <p class="text-[10px] sm:text-xs text-gold-200/50 -mt-0.5 hidden sm:block">{{ t('企業戰略儀表板 · 內網版') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <HealthBadge class="hidden sm:flex" />
          <button class="btn-ghost text-xs py-1 px-2 sm:px-3" :title="t('切換繁簡')" @click="toggle">
            {{ locale === 'zh-Hant' ? '繁' : '简' }}
          </button>
          <button v-if="enabled && authed" class="btn-ghost text-xs py-1 px-2" :title="t('登出')" @click="logout">⎋</button>
        </div>
      </div>
      <div class="bg-gold-line h-px" />
    </header>

    <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <NuxtPage />
    </main>

    <footer class="border-t border-gold-700/20 py-4 text-center text-[10px] sm:text-xs text-gold-200/30 px-4">
      {{ t('全內網部署 · 玄學訊號已轉化為白話商業策略 · 僅供內部業務使用') }}
    </footer>
  </div>
</template>
