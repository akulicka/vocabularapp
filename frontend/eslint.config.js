// ESLint Flat Config for React 18 + JSX Runtime + TypeScript-ready
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import pluginReact from 'eslint-plugin-react'
import configPrettier from 'eslint-config-prettier/flat'
import babelParser from '@babel/eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default defineConfig([
    // JavaScript/JSX files
    {
        files: ['**/*.{js,jsx}'],
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
            ...configPrettier.rules,
        },
    },
    // TypeScript/TSX files
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            globals: globals.browser,
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react: pluginReact,
            '@typescript-eslint': tsPlugin,
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
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            ...configPrettier.rules,
        },
    },
])
