import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                console: 'readonly',
                requestAnimationFrame: 'readonly',
                Image: 'readonly',
                Audio: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                performance: 'readonly',
                location: 'readonly',
                HTMLElement: 'readonly',
                HTMLCanvasElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLButtonElement: 'readonly',
                CanvasRenderingContext2D: 'readonly',
                KeyboardEvent: 'readonly',
                MouseEvent: 'readonly',
                TouchEvent: 'readonly',
                Event: 'readonly',
                confirm: 'readonly',
                alert: 'readonly',
                navigator: 'readonly',
                Map: 'readonly',
                Set: 'readonly',
                Promise: 'readonly',
                WheelEvent: 'readonly',
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'tests/**', 'playwright-report/**']
    }
];
