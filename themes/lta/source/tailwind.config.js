const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

module.exports = {
  safelist: [
    'text-green',
    'text-green-dark',
    'text-yellow',
    'text-blue',
    'text-orange',
    'text-orange-dark',
    'text-extra-1',
    'text-extra-2',
    'text-extra-3'
  ],
  theme: {
    screens: {
      ...defaultTheme.screens,
      '<sm': { max: `${parseInt(defaultTheme.screens.sm) - 1}px` },
      '2xl': '1440px'
    },
    colors: {
      transparent: 'transparent',
      white: {
        DEFAULT: '#ffffff',
        100: 'rgba(255, 255, 255, 0.075)',
        200: 'rgba(255, 255, 255, 0.15)',
        300: 'rgba(255, 255, 255, 0.3)',
        700: 'rgba(255, 255, 255, 0.7)',
        '100-solid': '#131313',
        '200-solid': '#b2b2b2',
        '300-solid': '#4c4c4c',
        '700-solid': '#262626'
      },
      black: {
        DEFAULT: '#1a1a1a',
        100: 'rgba(26, 26, 26, 0.06)', // 6% of black
        200: 'rgba(26, 26, 26, 0.12)', // 12% of black
        400: 'rgba(26, 26, 26, 0.38)', // 38% of black
        600: 'rgba(26, 26, 26, 0.6)', // 60% of black
        900: 'rgba(26, 26, 26, 0.87)', // 87% of black
        '100-solid': '#f1f1f1',
        '200-solid': '#e4e4e4',
        '400-solid': '#a8a8a8',
        '600-solid': '#767676',
        '900-solid': '#383838'
      },
      green: {
        DEFAULT: '#58a66f',
        dark: '#26484c'
      },
      yellow: '#d9a832',
      blue: '#50abbd',
      orange: {
        DEFAULT: '#db8043',
        dark: '#ba6219'
      },
      stone: '#e6e0d5',
      extra: {
        1: '#e47e71',
        2: '#895c3e',
        3: '#8aa1f0'
      },
      ruby: '#cd172f',
      accent: 'var(--color-accent)',
      heading: 'var(--color-heading)',
      body: 'var(--color-body)',
      'body-2': 'var(--color-body-2, var(--color-body))',
      'body-3': 'var(--color-body-3, var(--color-body))',
      'body-4': 'var(--color-body-4, var(--color-body))',
      background: 'var(--color-background)',
      line: 'var(--color-line)',
      'line-2': 'var(--color-line-2)'
    },
    fontFamily: {
      sans: ['lft-etica', ...defaultTheme.fontFamily.sans],
      serif: ['ff-meta-serif-web-pro', 'Palatino', ...defaultTheme.fontFamily.serif],
      stateface: 'StateFaceRegular'
    },
    fontSize: {
      // Type Scale: Minor Second
      // https://type-scale.com/?size=18&scale=1.067
      '2xs': '.7625rem', // 12.20px
      xs: '.868125rem', // 13.89px
      sm: '0.988125rem', // 15.81px
      base: '1.125rem', // 18px
      lg: '1.366875rem', // 21.87px
      xl: '1.66rem', // 26.56px
      '2xl': '2.016875rem', // 32.27px
      '3xl': '2.45rem', // 39.20px
      '4xl': '2.975625rem', // 47.61px
      '5xl': '3.615rem' // 57.84px (not used)
    },
    letterSpacing: {
      normal: defaultTheme.letterSpacing.normal,
      wide: '0.06em'
    },
    lineHeight: {
      none: defaultTheme.lineHeight.none,
      tight: defaultTheme.lineHeight.tight,
      normal: defaultTheme.lineHeight.normal,
      loose: defaultTheme.lineHeight.loose
    },
    boxShadow: {
      DEFAULT: '0 0.375rem 1.5rem rgba(0,0,0,0.06)',
      dark: '0 0.375rem 1.5rem rgba(0,0,0,0.12)',
      darker: '0 0.375rem 1.5rem rgba(0,0,0,0.38)',
      hairline: '0 0 0 1px rgba(0,0,0,0.06)',
      double: '0 0.375rem 1.5rem rgba(0,0,0,0.06), 0 0 0.25rem rgba(0,0,0,0.06)',
      inset: 'inset 0 0.375rem 1.5rem rgba(0,0,0,0.06)',
      'inset-hairline': 'inset 0 0 0 1px rgba(0,0,0,0.06)',
      sm: '0 0.0625rem 0.125rem rgba(0,0,0,0.06)',
      none: defaultTheme.boxShadow.none
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1.5rem',
        md: '2rem',
        lg: '3rem',
        xl: '4rem',
        '2xl': '6rem'
      }
    },
    extend: {
      backgroundImage: {
        'gradient-to-280deg':
          'linear-gradient(280deg, var(--tw-gradient-stops))'
      },
      borderRadius: {
        DEFAULT: '.375rem', // 6px
        sm: '.1875rem', // 3px
        lg: '.5625rem', // 9px
        full: defaultTheme.borderRadius.full
      },
      height: {
        screen: 'var(--rh)'
      },
      minHeight: (theme) => ({
        6: theme('height.6'),
        8: theme('height.8'),
        10: theme('height.10'),
        12: theme('height.12'),
        24: theme('height.24'),
        36: theme('height.36')
      }),
      minWidth: (theme) => ({
        auto: theme('width.auto'),
        24: theme('width.24'),
        36: theme('width.36'),
        48: theme('width.48'),
        96: theme('width.96')
      }),
      maxHeight: {
        'none': 'none'
      },
      maxWidth: (theme) => ({
        xxs: theme('width.64'),
        'cols-1': theme('spacing.cols-1'),
        'cols-2': theme('spacing.cols-2'),
        'cols-3': theme('spacing.cols-3'),
        'cols-4': theme('spacing.cols-4'),
        'cols-5': theme('spacing.cols-5'),
        'cols-6': theme('spacing.cols-6'),
        'cols-7': theme('spacing.cols-7'),
        'cols-8': theme('spacing.cols-8'),
        'cols-9': theme('spacing.cols-9'),
        'cols-10': theme('spacing.cols-10'),
        'cols-11': theme('spacing.cols-11'),
        'cols-12': theme('spacing.cols-12')
      }),
      opacity: {
        6: '0.06',
        12: '0.12',
        38: '0.38',
        87: '0.87'
      },
      ringWidth: {
        3: '0.1875rem'
      },
      spacing: {
        18: '4.5rem',
        'site-header-height': 'var(--site-header-height)',
        'site-sidebar-width': '19rem',
        'breadcrumbs-height': '2.25rem',
        'cols-1': '3.75rem',
        'cols-2': '10.5rem',
        'cols-3': '17.25rem',
        'cols-4': '24rem',
        'cols-5': '30.75rem',
        'cols-6': '37.5rem',
        'cols-7': '44.25rem',
        'cols-8': '51rem',
        'cols-9': '57.75rem',
        'cols-10': '64.5rem',
        'cols-11': '71.25rem',
        'cols-12': '78rem'
      },
      scale: {
        200: '2'
      },
      transitionDelay: {
        0: '0s'
      },
      width: {
        screen: 'calc(var(--rw) - var(--layout-offset-width))'
      },
      zIndex: {
        '-1': '-1',
        1: '1',
        60: '60'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-container-bleed'),
    plugin(function({ addComponents, theme }) {
      addComponents([
        {
          '.bleed-container': {
            'position': 'relative',
            'width': theme('width.screen'),
            'left': theme('inset.1/2'),
            'right': theme('inset.1/2'),
            'margin-left': `calc(${theme('width.screen')} / -2)`,
            'margin-right': `calc(${theme('width.screen')} / -2)`
          },
          '.not-bleed-container': {
            'width': 'auto',
            'left': 'auto',
            'right': 'auto',
            'margin-left': 0,
            'margin-right': 0
          }
        }
      ])
    })
  ]
}
