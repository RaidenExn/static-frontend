import {
  createTheme,
  Button,
  ActionIcon,
  Badge,
  Card,
  Paper,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Table,
  Tabs,
  Notification,
  Modal,
  Popover,
  Tooltip,
  Menu,
  Drawer,
  Combobox,
  CSSVariablesResolver
} from '@mantine/core'
import { THEME_CONFIG } from './ui/themeConfig'

export const theme = createTheme({
  primaryColor: 'dark',
  primaryShade: { light: 9, dark: 8 }, // Use high-contrast dark shade for dark mode to prevent white-on-white text
  defaultRadius: 'sm', // Sharp, modern Mira style (4px / 0.25rem)
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Courier New, monospace',

  components: {
    Button: Button.extend({
      defaultProps: {
        size: 'xs'
      }
    }),

    ActionIcon: ActionIcon.extend({
      defaultProps: {
        size: 'xs'
      }
    }),

    Badge: Badge.extend({
      defaultProps: {
        size: 'xs',
        variant: 'light'
      }
    }),

    Card: Card.extend({
      defaultProps: {
        withBorder: true,
        shadow: 'none',
        padding: 'xs'
      },
      styles: () => ({
        root: {
          fontSize: 'var(--mantine-font-size-xs)',
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--line)',
          borderRadius: 'var(--mantine-radius-default)',
          transition: 'background-color 0.15s ease, border-color 0.15s ease'
        }
      })
    }),

    Paper: Paper.extend({
      defaultProps: {
        withBorder: true,
        shadow: 'none',
        p: 'xs'
      },
      styles: () => ({
        root: {
          fontSize: 'var(--mantine-font-size-xs)',
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--line)',
          borderRadius: 'var(--mantine-radius-default)',
          transition: 'background-color 0.15s ease, border-color 0.15s ease'
        }
      })
    }),

    TextInput: TextInput.extend({
      defaultProps: {
        size: 'xs'
      }
    }),

    NumberInput: NumberInput.extend({
      defaultProps: {
        size: 'xs'
      }
    }),

    Select: Select.extend({
      defaultProps: {
        size: 'xs'
      }
    }),

    Textarea: Textarea.extend({
      defaultProps: {
        size: 'xs'
      }
    }),

    Table: Table.extend({
      defaultProps: {
        verticalSpacing: 'xs',
        horizontalSpacing: 'xs',
        highlightOnHover: true,
        withTableBorder: false,
        withColumnBorders: false
      }
    }),

    Tabs: Tabs.extend({
      defaultProps: {
        variant: 'pills'
      },
      styles: () => ({
        root: {
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--mantine-spacing-xs)'
        },
        list: {
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-default)',
          padding: 'var(--mantine-spacing-xs)',
          backgroundColor: 'var(--mantine-color-default-hover)',
          gap: 'var(--mantine-spacing-xs)'
        },
        tab: {
          padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
          borderRadius: 'var(--mantine-radius-default)',
          fontSize: 'var(--mantine-font-size-xs)',
          fontWeight: 600,
          border: '1px solid transparent',
          backgroundColor: 'transparent',
          color: 'var(--mantine-color-dimmed)',
          transition: 'all 0.15s ease'
        }
      })
    }),

    Notification: Notification.extend({
      styles: (theme, props) => {
        // Map the requested color dynamically using native Mantine colors
        const color = props.color || 'blue'
        return {
          root: {
            padding: '12px 14px',
            borderRadius: 'var(--mantine-radius-default, var(--mantine-radius-sm, 4px))',
            border: `1px solid var(--line, rgba(255, 255, 255, 0.08))`,
            backgroundColor: `var(--bg-translucent, rgba(255, 255, 255, 0.45))`,
            backdropFilter: "var(--backdrop-filter, blur(16px))",
            WebkitBackdropFilter: "var(--backdrop-filter, blur(16px))",
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 15px -3px rgba(0, 0, 0, 0.08)',
            alignItems: 'center',
            minHeight: 'auto',
            width: '350px',
            pointerEvents: 'auto',
            // Promote to its own hardware-accelerated GPU compositor layer
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)'
          },
          icon: {
            width: '24px',
            height: '24px',
            minWidth: '24px',
            borderRadius: '50%',
            marginRight: '10px',
            backgroundColor: `var(--mantine-color-${color}-light)`,
            border: `1px solid var(--mantine-color-${color}-light-border)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          title: {
            fontSize: 'var(--mantine-font-size-xs)',
            fontWeight: 800,
            color: 'var(--text-primary, var(--mantine-color-text))',
            lineHeight: 1.2,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          },
          description: {
            fontSize: 'var(--mantine-font-size-xs)',
            color: 'var(--text-muted, var(--mantine-color-dimmed))',
            lineHeight: 1.4,
            marginTop: '2px'
          },
          closeButton: {
            width: '18px',
            height: '18px',
            minWidth: '18px',
            color: 'var(--muted, var(--mantine-color-dimmed))',
            transition: 'all 0.15s ease',
            borderRadius: 'var(--mantine-radius-default, var(--mantine-radius-sm, 4px))',
            '&:hover': {
              backgroundColor: 'var(--panel-soft, rgba(255, 255, 255, 0.04))',
              color: 'var(--text-primary, var(--mantine-color-text))'
            }
          }
        }
      }
    }),

    Modal: Modal.extend({
      defaultProps: {
        withCloseButton: true,
        zIndex: 10000
      },
      styles: () => ({
        content: {
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--line)',
          borderRadius: 'var(--mantine-radius-default)',
          border: '1px solid var(--line)',
          boxShadow: 'none'
        },
        header: {
          backgroundColor: 'var(--panel)',
          borderBottom: '1px solid var(--line)'
        },
        body: {
          backgroundColor: 'var(--panel)'
        },
        close: {
          color: 'var(--muted)',
          backgroundColor: 'transparent',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-default-hover)',
            color: 'var(--text-primary)'
          }
        }
      })
    }),

    Popover: Popover.extend({
      defaultProps: {
        zIndex: 10000
      }
    }),

    Tooltip: Tooltip.extend({
      defaultProps: {
        zIndex: 10000,
        openDelay: 0,
        closeDelay: 0,
        withArrow: true,
        radius: 'xs',
        transitionProps: { transition: 'fade', duration: 100 }
      },
      styles: () => ({
        tooltip: {
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 8px',
          letterSpacing: '0.02em',
          backgroundColor: 'var(--mantine-color-black, #1a1b1e)',
          color: 'var(--mantine-color-white, #ffffff)',
          border: '1px solid var(--line, rgba(255, 255, 255, 0.15))',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'none',
          pointerEvents: 'none'
        },
        arrow: {
          borderColor: 'var(--line, rgba(255, 255, 255, 0.15))'
        }
      })
    }),

    Menu: Menu.extend({
      defaultProps: {
        zIndex: 10000
      }
    }),

    Drawer: Drawer.extend({
      defaultProps: {
        zIndex: 10000
      }
    }),

    Combobox: Combobox.extend({
      defaultProps: {
        zIndex: 10000
      }
    })
  }
})

export const resolver: CSSVariablesResolver = () => ({
  variables: {
    '--border-radius': 'var(--mantine-radius-default)',
    '--shadow': 'none'
  },
  light: {
    '--bg-app': THEME_CONFIG.light.bg,
    '--bg-panel': THEME_CONFIG.light.panel,
    '--border-subtle': THEME_CONFIG.light.line,
    '--text-primary': THEME_CONFIG.light.ink,
    '--text-muted': THEME_CONFIG.light.muted,
    '--action-bg': THEME_CONFIG.light.accent,
    '--action-bg-hover': THEME_CONFIG.light.accentSecondary,
    '--action-secondary-bg': THEME_CONFIG.light.panelSoft,

    // Compatibility Mapping
    '--bg': 'var(--bg-app)',
    '--bg-translucent': THEME_CONFIG.light.bgTranslucent,
    '--panel': 'var(--bg-panel)',
    '--panel-soft': 'var(--action-secondary-bg)',
    '--ink': 'var(--text-primary)',
    '--muted': 'var(--text-muted)',
    '--line': 'var(--border-subtle)',
    '--accent': 'var(--action-bg)',
    '--accent-2': 'var(--action-bg-hover)',
    '--good': THEME_CONFIG.light.good,
    '--bad': THEME_CONFIG.light.bad,

    // Mantine core CSS overrides for absolute design system harmony
    '--mantine-color-text': 'var(--text-primary)',
    '--mantine-color-body': 'var(--bg-panel)',

    // Claude-style light badge system
    '--badge-success-bg': THEME_CONFIG.light.badgeSuccessBg,
    '--badge-success-border': THEME_CONFIG.light.badgeSuccessBorder,
    '--badge-success-text': THEME_CONFIG.light.badgeSuccessText,
    '--badge-warning-bg': THEME_CONFIG.light.badgeWarningBg,
    '--badge-warning-border': THEME_CONFIG.light.badgeWarningBorder,
    '--badge-warning-text': THEME_CONFIG.light.badgeWarningText,
    '--badge-error-bg': THEME_CONFIG.light.badgeErrorBg,
    '--badge-error-border': THEME_CONFIG.light.badgeErrorBorder,
    '--badge-error-text': THEME_CONFIG.light.badgeErrorText,
    '--badge-info-bg': THEME_CONFIG.light.badgeInfoBg,
    '--badge-info-border': THEME_CONFIG.light.badgeInfoBorder,
    '--badge-info-text': THEME_CONFIG.light.badgeInfoText,
    '--badge-neutral-bg': THEME_CONFIG.light.badgeNeutralBg,
    '--badge-neutral-border': THEME_CONFIG.light.badgeNeutralBorder,
    '--badge-neutral-text': THEME_CONFIG.light.badgeNeutralText
  },
  dark: {
    '--bg-app': THEME_CONFIG.dark.bg,
    '--bg-panel': THEME_CONFIG.dark.panel,
    '--border-subtle': THEME_CONFIG.dark.line,
    '--text-primary': THEME_CONFIG.dark.ink,
    '--text-muted': THEME_CONFIG.dark.muted,
    '--action-bg': THEME_CONFIG.dark.accent,
    '--action-bg-hover': THEME_CONFIG.dark.accentSecondary,
    '--action-secondary-bg': THEME_CONFIG.dark.panelSoft,

    // Compatibility Mapping
    '--bg': 'var(--bg-app)',
    '--bg-translucent': THEME_CONFIG.dark.bgTranslucent,
    '--panel': 'var(--bg-panel)',
    '--panel-soft': 'var(--action-secondary-bg)',
    '--ink': 'var(--text-primary)',
    '--muted': 'var(--text-muted)',
    '--line': 'var(--border-subtle)',
    '--accent': 'var(--action-bg)',
    '--accent-2': 'var(--action-bg-hover)',
    '--good': THEME_CONFIG.dark.good,
    '--bad': THEME_CONFIG.dark.bad,

    // Mantine core CSS overrides for absolute design system harmony
    '--mantine-color-text': 'var(--text-primary)',
    '--mantine-color-body': 'var(--bg-panel)',

    // Claude-style dark badge system
    '--badge-success-bg': THEME_CONFIG.dark.badgeSuccessBg,
    '--badge-success-border': THEME_CONFIG.dark.badgeSuccessBorder,
    '--badge-success-text': THEME_CONFIG.dark.badgeSuccessText,
    '--badge-warning-bg': THEME_CONFIG.dark.badgeWarningBg,
    '--badge-warning-border': THEME_CONFIG.dark.badgeWarningBorder,
    '--badge-warning-text': THEME_CONFIG.dark.badgeWarningText,
    '--badge-error-bg': THEME_CONFIG.dark.badgeErrorBg,
    '--badge-error-border': THEME_CONFIG.dark.badgeErrorBorder,
    '--badge-error-text': THEME_CONFIG.dark.badgeErrorText,
    '--badge-info-bg': THEME_CONFIG.dark.badgeInfoBg,
    '--badge-info-border': THEME_CONFIG.dark.badgeInfoBorder,
    '--badge-info-text': THEME_CONFIG.dark.badgeInfoText,
    '--badge-neutral-bg': THEME_CONFIG.dark.badgeNeutralBg,
    '--badge-neutral-border': THEME_CONFIG.dark.badgeNeutralBorder,
    '--badge-neutral-text': THEME_CONFIG.dark.badgeNeutralText
  }
})
