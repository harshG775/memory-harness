import { cloudflare } from "@cloudflare/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

const config = defineConfig({
    staged: {
        "*": "vp check --fix",
    },
    fmt: {
        tabWidth: 4,
        printWidth: 120,
        sortImports: {},
        ignorePatterns: ["src/routeTree.gen.ts"],
    },
    lint: {
        jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
        rules: {
            "vite-plus/prefer-vite-plus-imports": "error",
        },
        options: { typeAware: true, typeCheck: true },
    },
    resolve: { tsconfigPaths: true },
    plugins: lazyPlugins(() => [
        devtools(),
        cloudflare({ viteEnvironment: { name: "ssr" } }),
        tailwindcss(),
        tanstackStart(),
        viteReact(),
        babel({ presets: [reactCompilerPreset()] }),
    ]),
    server: {
        allowedHosts: [".harshgaur.in"],
    },
});

export default config;
