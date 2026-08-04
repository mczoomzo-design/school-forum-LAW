/* ธีม Scholarly Exchange — Royal Blue + Teal
   สีทุกค่าอ้างอิงตัวแปร CSS ใน assets/css/app.css
   โหมดมืดจึงสลับได้ด้วยการเปลี่ยนค่าตัวแปรอย่างเดียว */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'var(--c-surface)',
        'surface-dim': 'var(--c-surface-dim)',
        'surface-container-lowest': 'var(--c-surface-lowest)',
        'surface-container-low': 'var(--c-surface-low)',
        'surface-container': 'var(--c-surface-container)',
        'surface-container-high': 'var(--c-surface-high)',
        'surface-container-highest': 'var(--c-surface-highest)',
        'on-surface': 'var(--c-on-surface)',
        'on-surface-variant': 'var(--c-on-surface-variant)',
        'inverse-surface': 'var(--c-inverse-surface)',
        'inverse-on-surface': 'var(--c-inverse-on-surface)',
        outline: 'var(--c-outline)',
        'outline-variant': 'var(--c-outline-variant)',
        primary: 'var(--c-primary)',
        'on-primary': 'var(--c-on-primary)',
        'primary-container': 'var(--c-primary-container)',
        'inverse-primary': 'var(--c-inverse-primary)',
        link: 'var(--c-link)',
        secondary: 'var(--c-secondary)',
        'on-secondary': 'var(--c-on-secondary)',
        'secondary-container': 'var(--c-secondary-container)',
        'on-secondary-container': 'var(--c-on-secondary-container)',
        'secondary-fixed': 'var(--c-secondary-fixed)',
        error: 'var(--c-error)',
        'on-error': 'var(--c-on-error)',
        'error-container': 'var(--c-error-container)',
        'on-error-container': 'var(--c-on-error-container)',
        warning: 'var(--c-warning)',
        'warning-container': 'var(--c-warning-container)',
        background: 'var(--c-surface)'
      },
      fontFamily: {
        display: ['"Be Vietnam Pro"', 'Sarabun', 'sans-serif'],
        body: ['Sarabun', '"Be Vietnam Pro"', 'sans-serif']
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'title-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        'body-md': ['16px', { lineHeight: '24px' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '500' }]
      },
      borderRadius: { DEFAULT: '0.5rem', md: '0.625rem', lg: '0.875rem', xl: '1.25rem', '2xl': '1.75rem' },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '40px' },
      maxWidth: { container: '1120px' },
      boxShadow: { hover: '0 10px 30px rgba(184,72,13,0.14)' }
    }
  }
};
