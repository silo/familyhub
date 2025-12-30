// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettierConfig from 'eslint-config-prettier'

export default withNuxt([
  {
    ignores: ['android/**', 'ios/**', '.output/**', '.nuxt/**', 'dist/**', 'node_modules/**'],
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  prettierConfig,
])
