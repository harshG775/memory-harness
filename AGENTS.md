# Agent Rules

## shadcn/ui components

- Never hand-write a component that exists in the shadcn registry (e.g. `input`, `label`, `card`, `dialog`). Install it with the CLI instead:
  `pnpm dlx shadcn@latest add <component> [<component> ...]`
    - Multiple components can be installed in one call — pass them space-separated.
- Only write a component by hand if it has no shadcn registry equivalent, or the task explicitly asks for a custom one.
- After running `add`, read the generated file(s) rather than assuming their shape — the CLI may pull in extra dependencies or overwrite an existing file with customizations, so check `git diff` before continuing.
