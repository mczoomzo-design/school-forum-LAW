/* ธีม Scholarly Exchange — Royal Blue + Teal (ตรงตาม DESIGN.md) */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        surface: '#f8f9fa',
        'surface-dim': '#d9dadb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#edeeef',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'on-surface': '#191c1d',
        'on-surface-variant': '#444650',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        outline: '#757682',
        'outline-variant': '#c5c6d2',
        primary: '#00113a',
        'on-primary': '#ffffff',
        'primary-container': '#002366',
        'on-primary-container': '#758dd5',
        'inverse-primary': '#b3c5ff',
        secondary: '#006a6a',
        'on-secondary': '#ffffff',
        'secondary-container': '#90efef',
        'on-secondary-container': '#006e6e',
        tertiary: '#0d151a',
        'tertiary-container': '#22292f',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        warning: '#b45309',
        'warning-container': '#fef3c7',
        'primary-fixed': '#dbe1ff',
        'secondary-fixed': '#93f2f2',
        background: '#f8f9fa'
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
      borderRadius: { DEFAULT: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem' },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '40px' },
      maxWidth: { container: '1120px' },
      boxShadow: { hover: '0 4px 12px rgba(0,35,102,0.08)' }
    }
  }
};
