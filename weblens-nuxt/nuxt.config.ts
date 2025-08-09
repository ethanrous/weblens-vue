// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

const mode = process.env.VITE_BUILD === 'true' ? 'production' : 'development'
process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

if (!process.env.VITE_PROXY_PORT && process.env.VITE_BUILD !== 'true') {
    process.env.VITE_PROXY_PORT = '8080'
    console.warn(`VITE_PROXY_PORT not set\nDefaulting proxy to ${process.env.VITE_PROXY_PORT}`)
}
if (!process.env.VITE_PROXY_HOST && process.env.VITE_BUILD !== 'true') {
    process.env.VITE_PROXY_HOST = '127.0.0.1'
    console.warn(`VITE_PROXY_HOST not set\nDefaulting proxy to ${process.env.VITE_PROXY_HOST}`)
}

// this sets a default port to 3000
const vitePort = Number(process.env.VITE_PORT) ? Number(process.env.VITE_PORT) : 3000

console.log(`Vite is running in ${mode} mode on port ${vitePort}`)

export default defineNuxtConfig({
    compatibilityDate: '2025-05-15',
    ssr: false,
    devtools: {
        enabled: true,

        timeline: {
            enabled: true,
        },
    },
    modules: ['@nuxt/eslint', '@nuxt/image', '@pinia/nuxt'],
    css: ['~/assets/css/base.css', '~/assets/css/main.css'],
    devServer: {
        port: 3000,
        host: '0.0.0.0',
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        },
    },
    nitro: {
        devProxy: {
            '/api/v1/ws': {
                target: `ws://${process.env.VITE_PROXY_HOST}:${process.env.VITE_PROXY_PORT}`,
                prependPath: true,
                changeOrigin: true,
                ws: true,
            },
            '/api/v1': {
                target: `http://${process.env.VITE_PROXY_HOST}:${process.env.VITE_PROXY_PORT}/api/v1`,
                changeOrigin: true,
                prependPath: true,
            },
        },
    },
    vite: {
        plugins: [tailwindcss()],
    },
})
