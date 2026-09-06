import type { ReactNode } from "react"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import appCss from "../styles.css?url"
import { ThemeProvider } from "#/components/providers/theme-provider"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

export const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "TanStack Start Starter",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
        ],
        scripts: [
            {
                children: THEME_INIT_SCRIPT,
            },
        ],
    }),
    shellComponent: RootDocument,
})

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body className="font-sans antialiased wrap-anywhere selection:bg-primary">
                <ThemeProvider>{children}</ThemeProvider>
                <TanStackDevtools
                    config={{
                        position: "bottom-right",
                    }}
                    plugins={[
                        {
                            name: "Tanstack Router",
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                    ]}
                />
                <Scripts />
            </body>
        </html>
    )
}
