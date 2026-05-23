import { sxzz } from '@sxzz/eslint-config'

export default sxzz({
  baseline: {
    ignoreFeatures: ['top-level-await'],
  },
}).append({
  rules: {
    'no-console': 'off',
  },
})
