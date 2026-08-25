import { defineConfig, loadEnv } from "vite"
import { devtools } from "@tanstack/devtools-vite"

import { tanstackStart } from "@tanstack/react-start/plugin/vite"

import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"

const config = defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "") as Record<string, string | undefined>
    const ALLOWED_HOSTS = (env.ALLOWED_HOSTS ?? "").split(",")
        .map((host) => host.trim())
        .filter(Boolean)

    return {
        resolve: { tsconfigPaths: true },
        plugins: [
            devtools(),
            nitro({ rollupConfig: { external: [/^@sentry\//] } }),
            tailwindcss(),
            tanstackStart(),
            viteReact(),
        ],
        server: {
            port: 8080,
            allowedHosts: ALLOWED_HOSTS.length ? ALLOWED_HOSTS : undefined,
        },
    }
})

export default config
