// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // 對外測試：瀏覽器一律走「同源相對路徑」，由 Nuxt 伺服器反向代理到後端。
  // 這樣只需對外開放一個埠(3000)，且不會有跨網域/混合內容問題。
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? '',
    },
  },

  // 反向代理：/api/** 與 /health 轉發到本機後端 Express(:3001)
  routeRules: {
    '/api/**': { proxy: `${process.env.BACKEND_ORIGIN || 'http://127.0.0.1:3001'}/api/**` },
    '/health': { proxy: `${process.env.BACKEND_ORIGIN || 'http://127.0.0.1:3001'}/health` },
  },

  app: {
    head: {
      title: '不帶羅盤的風水師 · 戰略儀表板',
      htmlAttrs: { lang: 'zh-Hant' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '結合東方玄學與行為科學的企業級 CRM 戰略儀表板' },
      ],
    },
  },
});
