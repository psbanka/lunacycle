import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.base.config.mjs';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    // Override or add rules here
    rules: {
      // Disable react-refresh rule - plugin not needed for NX setup
      'react-refresh/only-export-components': 'off',
      // Allow empty functions for placeholder/stub code
      '@typescript-eslint/no-empty-function': 'warn',
      // Allow confirm() for simple dialogs (could upgrade to custom modal later)
      'no-restricted-globals': ['error', 'event', 'fdescribe'],
    },
  },
];
