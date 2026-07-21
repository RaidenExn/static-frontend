import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'public']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      // Base JavaScript recommended rules
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules
    }
  },
  {
    // Progressive Quality Gate overrides (Ratchet Strategy)
    // Legacy files and hooks configured with warning thresholds for maintainability rules
    // to prevent further growth without breaking active local builds.
    files: [
      'src/components/ActivityPanel.tsx',
      'src/hooks/useEncounterActivities.ts',
      'src/hooks/usePortalState.ts',
      'src/components/IcdEditsPanel.tsx',
      'src/components/PromptPanel.tsx',
      'src/components/BulkResubmissionPanel.tsx',
      'src/components/SettingsPanel.tsx',
      'src/components/ObservationsPanel.tsx',
      'src/components/RcmActionCenter.tsx',
      'src/components/BulkRepeatTrackerExtraction.tsx',
      'src/components/ApiPanel.tsx',
      'src/components/EncounterSearch.tsx',
      'src/components/BypassPanel.tsx',
      'src/components/VisitPanel.tsx',
      'src/App.tsx',
      'src/utils.ts'
    ],
    rules: {
      complexity: ['warn', { max: 15 }],
      'max-depth': ['warn', { max: 4 }],
      'max-params': ['warn', { max: 4 }],
      'max-statements': ['warn', { max: 20 }],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      // Downgrade pre-existing rules to warnings to facilitate smooth continuous builds on legacy structures
      'no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'no-useless-assignment': 'warn',
      'no-empty': 'warn',
      'no-case-declarations': 'warn'
    }
  },
  {
    // Strict error rules for new and refactored components/hooks
    files: ['src/components/**/*.tsx', 'src/hooks/**/*.ts'],
    ignores: [
      'src/components/ActivityPanel.tsx',
      'src/hooks/useEncounterActivities.ts',
      'src/hooks/usePortalState.ts',
      'src/components/IcdEditsPanel.tsx',
      'src/components/PromptPanel.tsx',
      'src/components/BulkResubmissionPanel.tsx',
      'src/components/SettingsPanel.tsx',
      'src/components/ObservationsPanel.tsx',
      'src/components/RcmActionCenter.tsx',
      'src/components/BulkRepeatTrackerExtraction.tsx',
      'src/components/ApiPanel.tsx',
      'src/components/EncounterSearch.tsx',
      'src/components/BypassPanel.tsx',
      'src/components/VisitPanel.tsx',
      'src/App.tsx',
      'src/utils.ts'
    ],
    rules: {
      complexity: ['error', { max: 15 }],
      'max-depth': ['error', { max: 4 }],
      'max-params': ['error', { max: 4 }],
      'max-statements': ['error', { max: 20 }],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-hooks/set-state-in-effect': 'error',
      'no-useless-assignment': 'error',
      'no-empty': 'error',
      'no-case-declarations': 'error'
    }
  }
])
