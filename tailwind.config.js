/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  // 使用 prefix 避免与现有 CSS 冲突
  prefix: 'tw-',
  theme: {
    extend: {
      colors: {
        // 继承现有 CSS 变量
        primary: 'var(--primary-color)',
        'primary-hover': 'var(--primary-hover)',
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-card': 'var(--bg-card)',
      }
    },
  },
  plugins: [],
}
