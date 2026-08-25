Welcome to your new TanStack Start app!

# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Deploy with Nitro

This project uses Nitro as a generic server adapter, so it can run on any Node-compatible host.

```bash
npm run build
node dist/server/index.mjs
```

The build output is a self-contained Node server. To deploy, push the `dist/` directory to your host (Render, Fly.io, your own VPS, etc.) and run the server command above.

For host-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda, etc.) and tuning, see https://v3.nitro.build/deploy.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router"
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

export const Route = createRootRoute({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "My App" },
        ],
    }),
    shellComponent: ({ children }) => (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <header>
                    <nav>
                        <Link to="/">Home</Link>
                        <Link to="/about">About</Link>
                    </nav>
                </header>
                {children}
                <Scripts />
            </body>
        </html>
    ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from "@tanstack/react-start"

const getServerTime = createServerFn({
    method: "GET",
}).handler(async () => {
    return new Date().toISOString()
})

// Use in a component
function MyComponent() {
    const [time, setTime] = useState("")

    useEffect(() => {
        getServerTime().then(setTime)
    }, [])

    return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { json } from "@tanstack/react-start"

export const Route = createFileRoute("/api/hello")({
    server: {
        handlers: {
            GET: () => json({ message: "Hello, World!" }),
        },
    },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/people")({
    loader: async () => {
        const response = await fetch("https://swapi.dev/api/people")
        return response.json()
    },
    component: PeopleComponent,
})

function PeopleComponent() {
    const data = Route.useLoaderData()
    return (
        <ul>
            {data.results.map((person) => (
                <li key={person.name}>{person.name}</li>
            ))}
        </ul>
    )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

## Obsidian Vault MCP Server

This app exposes an MCP endpoint at `/mcp` with tools (`read_note`,
`write_note`, `list_notes`, `search_notes`) for reading and writing
markdown notes in an Obsidian vault on disk.

### Setup

1. Copy `.env.example` to `.env` and set the two required variables:
    - `OBSIDIAN_VAULT_PATH` — absolute path to the vault folder on disk
      (e.g. shared storage inside Termux on Android).
    - `MCP_AUTH_TOKEN` — a long random secret (e.g. `openssl rand -hex 32`)
      that clients must send as a bearer token.
2. Start the dev server:

    ```bash
    pnpm dev
    ```

3. Point your MCP client at `http://localhost:3000/mcp`, sending
   `Authorization: Bearer <MCP_AUTH_TOKEN>` on every request. Requests
   without a valid token get a `401`.

### Connecting from Claude Code / Cursor

Clients that support custom headers can use the static token directly:

```bash
claude mcp add obsidian-vault https://your-tunnel-hostname/mcp \
  --transport http \
  --header "Authorization: Bearer <MCP_AUTH_TOKEN>"
```

### Connecting from claude.ai (web)

The web app's **Settings → Connectors → Add custom connector** dialog only
takes a server URL (plus optional pre-registered OAuth Client ID/Secret) —
it has no field for a raw bearer token. To support it, this route also
implements a minimal single-user OAuth 2.1 wrapper around the same
`MCP_AUTH_TOKEN` secret:

- `/.well-known/oauth-authorization-server` and
  `/.well-known/oauth-protected-resource` — discovery metadata.
- `/oauth/register` — dynamic client registration (so you can leave the
  Client ID/Secret fields blank in the dialog).
- `/oauth/authorize` — shows a one-field HTML form asking for your
  `MCP_AUTH_TOKEN`; this is the actual auth gate, not a rubber stamp.
- `/oauth/token` — exchanges a PKCE-verified authorization code for an
  opaque access token that `/mcp` will also accept as a bearer token.

To connect: add a custom connector with URL `https://your-tunnel-hostname/mcp`,
leave the OAuth fields blank, click Add, and enter your `MCP_AUTH_TOKEN`
when the authorize page prompts for it.

**POC limitation:** registered clients, authorization codes, and issued
OAuth access tokens are all kept in memory — a server restart clears them
and any client connected via OAuth (including claude.ai) will need to
reconnect and re-enter the token. The static `MCP_AUTH_TOKEN` bearer
header (used by Claude Code/Cursor) is unaffected by restarts.

### Exposing via Cloudflare Tunnel

This route is designed to be published through a Cloudflare Tunnel to a
public hostname. The bearer token is the only line of defense once the
route is public, so:

- Treat `MCP_AUTH_TOKEN` like a password — keep it out of source control
  (`.env` is gitignored) and configure the same value on the MCP client
  side.
- The tunnel should terminate TLS so the token isn't sent in the clear.

**Follow-up for production use:** this POC has no rate limiting on
`/mcp`, so a leaked token currently allows unlimited requests.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
