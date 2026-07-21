/**
 * Lifetrenz Local Portal - UI Theme Configuration
 * Centralized, fully-documented single source of truth for every color in the application.
 * Both light and dark modes are completely customizable.
 */

export interface ThemeColors {
  // --- APP LAYOUT BACKGROUNDS ---
  /** Main application background behind all cards and panels */
  bg: string
  /** Translucent overlay background color used with backdrop-filter (blur) */
  bgTranslucent: string
  /** Primary card, modal, and major dashboard panel background */
  panel: string
  /** Soft nested elements, inputs, select dropdowns, and inactive indicators */
  panelSoft: string

  // --- TEXT & TYPOGRAPHY ---
  /** Primary readable text/ink color for headings, body, and table contents */
  ink: string
  /** Muted/secondary text color for descriptions, sub-labels, and metadata */
  muted: string

  // --- BORDERS & SEPARATORS ---
  /** Border and line color for dividers, tables, cards, and select elements */
  line: string

  // --- ACCENT & INTERACTIVE BRANDING ---
  /** Primary brand accent color for action buttons, focus states, and primary buttons */
  accent: string
  /** Accent color variant for hover, focus, or active states of buttons and cards */
  accentSecondary: string

  // --- SEMANTIC STATES ---
  /** Success status color for positive badges, success alerts, and completed logs */
  good: string
  /** Error/danger status color for critical validation errors, delete actions, and rejections */
  bad: string

  // --- SHIMMERS & LOADING ---
  /** Base background color for skeleton loading screens */
  shimmerBase: string
  /** Sweep highlighting gloss color for skeleton animation swipes */
  shimmerHighlight: string

  // --- CLAUDE-STYLE LIGHT/DARK BADGES ---
  /** Background color for success status pill badges */
  badgeSuccessBg: string
  /** Border outline color for success status pill badges */
  badgeSuccessBorder: string
  /** Text color inside success status pill badges */
  badgeSuccessText: string

  /** Background color for warning/alert status pill badges */
  badgeWarningBg: string
  /** Border outline color for warning/alert status pill badges */
  badgeWarningBorder: string
  /** Text color inside warning/alert status pill badges */
  badgeWarningText: string

  /** Background color for critical error/danger status pill badges */
  badgeErrorBg: string
  /** Border outline color for critical error/danger status pill badges */
  badgeErrorBorder: string
  /** Text color inside critical error/danger status pill badges */
  badgeErrorText: string

  /** Background color for informative/secondary status pill badges */
  badgeInfoBg: string
  /** Border outline color for informative/secondary status pill badges */
  badgeInfoText: string
  /** Text color inside informative/secondary status pill badges */
  badgeInfoBorder: string

  /** Background color for generic/neutral status pill badges */
  badgeNeutralBg: string
  /** Border outline color for generic/neutral status pill badges */
  badgeNeutralBorder: string
  /** Text color inside generic/neutral status pill badges */
  badgeNeutralText: string
}

export const THEME_CONFIG: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    // --- APP LAYOUT BACKGROUNDS ---
    bg: '#faf9f5', // Main app background (soft warm gray)
    bgTranslucent: 'rgba(250, 249, 245, 0.45)', // Translucent frosted overlay (45% opacity)
    panel: '#ffffff', // Card panels & modals (pure white)
    panelSoft: '#faf8f2', // Nested inputs & select dropdowns (soft sand)

    // --- TEXT & TYPOGRAPHY ---
    ink: '#1d1916', // High-density readable headings & body (charcoal black)
    muted: '#7a736e', // Timestamps, secondary subtitles & helper notes (stone gray)

    // --- BORDERS & SEPARATORS ---
    line: '#e5e2db', // Borders, list separators & input contours (soft warm gray)

    // --- ACCENT & INTERACTIVE BRANDING ---
    accent: '#cc7129', // Buttons, switches & active tabs (premium copper orange)
    accentSecondary: '#a6541b', // Buttons on-hover and click states (dark copper)

    // --- SEMANTIC STATES ---
    good: '#137333', // Verified claims, full payment pill (emerald green)
    bad: '#c5221f', // Validation failed, rejection alerts (crimson red)

    // --- SHIMMERS & LOADING ---
    shimmerBase: '#f4f1ea', // Skeleton container loading blocks background
    shimmerHighlight: '#e5e2db', // Shimmer animation sweep glow highlight

    // --- CLAUDE-STYLE LIGHT/DARK BADGES ---
    badgeSuccessBg: 'rgba(19, 115, 51, 0.04)', // Light green badge background
    badgeSuccessBorder: 'rgba(19, 115, 51, 0.16)', // Light green badge border
    badgeSuccessText: '#137333', // Light green badge text

    badgeWarningBg: 'rgba(217, 119, 6, 0.04)', // Light amber badge background
    badgeWarningBorder: 'rgba(217, 119, 6, 0.16)', // Light amber badge border
    badgeWarningText: '#b45309', // Light amber badge text

    badgeErrorBg: 'rgba(197, 34, 31, 0.04)', // Light crimson badge background
    badgeErrorBorder: 'rgba(197, 34, 31, 0.16)', // Light crimson badge border
    badgeErrorText: '#c5221f', // Light crimson badge text

    badgeInfoBg: 'rgba(26, 84, 184, 0.04)', // Light royal-blue badge background
    badgeInfoBorder: 'rgba(26, 84, 184, 0.16)', // Light royal-blue badge border
    badgeInfoText: '#1a54b8', // Light royal-blue badge text

    badgeNeutralBg: 'rgba(0, 0, 0, 0.03)', // Light stone-gray badge background
    badgeNeutralBorder: 'rgba(0, 0, 0, 0.08)', // Light stone-gray badge border
    badgeNeutralText: '#5f6368' // Light stone-gray badge text
  },
  dark: {
    // --- APP LAYOUT BACKGROUNDS ---
    bg: '#121110', // Dark dashboard viewport background (high density rich black)
    bgTranslucent: 'rgba(18, 17, 16, 0.45)', // Translucent frosted overlay (45% opacity)
    panel: '#1b1a19', // Primary card backdrop panel & modal content area (charcoal black)
    panelSoft: '#242220', // Nested inputs, search rows & action headers (warm black)

    // --- TEXT & TYPOGRAPHY ---
    ink: '#f3f1ed', // Primary highly-readable titles, values & labels (milk white)
    muted: '#968f89', // Sub-labels, descriptive logs & timestamps (stone gray)

    // --- BORDERS & SEPARATORS ---
    line: '#2f2c2a', // Container boundaries & grid lines (dark obsidian)

    // --- ACCENT & INTERACTIVE BRANDING ---
    accent: '#f09a52', // Buttons, switches & active state highlight (vibrant gold-copper)
    accentSecondary: '#f5b67a', // Buttons on-hover and click states (warm gold)

    // --- SEMANTIC STATES ---
    good: '#81c995', // Approved claims & successful validation states (mint green)
    bad: '#f28b82', // Failed validations & critical warnings (pastel red)

    // --- SHIMMERS & LOADING ---
    shimmerBase: '#1b1a19', // Skeleton loading base panels
    shimmerHighlight: '#2f2c2a', // Skeleton shimmer swipe glow

    // --- CLAUDE-STYLE LIGHT/DARK BADGES ---
    badgeSuccessBg: 'rgba(129, 201, 149, 0.06)', // Dark mint badge background
    badgeSuccessBorder: 'rgba(129, 201, 149, 0.20)', // Dark mint badge border
    badgeSuccessText: '#81c995', // Dark mint badge text

    badgeWarningBg: 'rgba(253, 180, 75, 0.06)', // Dark warm-amber badge background
    badgeWarningBorder: 'rgba(253, 180, 75, 0.20)', // Dark warm-amber badge border
    badgeWarningText: '#fdb44b', // Dark warm-amber badge text

    badgeErrorBg: 'rgba(242, 139, 130, 0.06)', // Dark coral-red badge background
    badgeErrorBorder: 'rgba(242, 139, 130, 0.20)', // Dark coral-red badge border
    badgeErrorText: '#f28b82', // Dark coral-red badge text

    badgeInfoBg: 'rgba(138, 180, 248, 0.06)', // Dark sky-blue badge background
    badgeInfoBorder: 'rgba(138, 180, 248, 0.20)', // Dark sky-blue badge border
    badgeInfoText: '#8ab4f8', // Dark sky-blue badge text

    badgeNeutralBg: 'rgba(255, 255, 255, 0.04)', // Dark stone-gray badge background
    badgeNeutralBorder: 'rgba(255, 255, 255, 0.08)', // Dark stone-gray badge border
    badgeNeutralText: '#9aa0a6' // Dark stone-gray badge text
  }
}
