// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  /*  app: {
    baseURL: '/Sched-Committee/',
  }, */
  build: {
    transpile: ['@vuepic/vue-datepicker'],
  },
  /*  nitro: {
    preset: 'github-pages',
  }, */

  css: [
    '~/assets/css/main.css',
  ],
  colorMode: {
    preference: 'light',
  },

  devtools: { enabled: false },
  modules: [
    // Simple usage
    '@nuxtjs/eslint-module',
    // '@nuxtjs/tailwindcss', // nuxtUI already has tailwind and color mode
    'nuxt-icon',
    'nuxt-headlessui',
    // '@nuxtjs/ionic',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@hypernym/nuxt-anime',
    '@formkit/auto-animate/nuxt',
  ],
  eslint: {
    /* module options */
  },
  headlessui: {
    prefix: 'Headless',
  },

  ssr: false,

});
