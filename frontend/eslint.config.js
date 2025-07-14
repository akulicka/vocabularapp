// ESLint Flat Config for React 18 + JSX Runtime + TypeScript-ready
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import pluginReact from 'eslint-plugin-react'
import babelParser from '@babel/eslint-parser'

export default defineConfig([
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        ecmaFeatures: {
          jsx: true,
        },
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ['@babel/preset-react'],
        },
      },
    },
    plugins: {
      react: pluginReact,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/self-closing-comp': 'warn',
      'react/react-in-jsx-scope': 'off',      
      'react/jsx-uses-react': 'off',         
      'react/jsx-uses-vars': 'warn',          
      'react/prop-types': 'off',               
    },
  },
])