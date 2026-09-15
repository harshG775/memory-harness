# Agent Rules

<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->


## shadcn/ui components

- Never hand-write a component that exists in the shadcn registry (e.g. `input`, `label`, `card`, `dialog`). Install it with the CLI instead:
  `pnpm dlx shadcn@latest add <component> [<component> ...]`
    - Multiple components can be installed in one call — pass them space-separated.
- Only write a component by hand if it has no shadcn registry equivalent, or the task explicitly asks for a custom one.
- After running `add`, read the generated file(s) rather than assuming their shape — the CLI may pull in extra dependencies or overwrite an existing file with customizations, so check `git diff` before continuing.
