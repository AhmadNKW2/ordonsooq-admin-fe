---
applyTo: '**'
---

# General Instructions

## Package Manager
- ALWAYS use `pnpm` for all package management operations
- Never use `npm` or `yarn`
- Examples: `pnpm install`, `pnpm add <package>`, `pnpm remove <package>`, `pnpm dev`

## Documentation
- Do NOT create markdown files to document changes unless explicitly requested
- Do NOT create summary or changelog files after completing work
- Focus on code implementation, not documentation generation

## Styling
- Do NOT use `cn` utilities or similar className merging utilities
- Use plain className strings for styling components
- ALWAYS use colors and styles from `globals.css` (CSS variables) instead of arbitrary Tailwind colors
- Use the project's design system variables:
  - Colors: `var(--color-primary)`, `var(--color-secondary)`, `var(--color-danger)`, etc.
  - Use Tailwind classes that reference these variables: `bg-primary`, `text-secondary`, `border-danger`
  - DO NOT use arbitrary colors like `bg-blue-500`, `text-red-600`, `border-gray-300`
  - Exception: Utility grays (`bg-gray-50`, `text-gray-600`) are allowed for backgrounds and text only when no design system variable exists
- Use design system spacing, borders, and shadows defined in globals.css
- Examples:
  - ✅ CORRECT: `bg-primary text-white`, `border-secondary`, `text-danger`
  - ❌ WRONG: `bg-blue-600 text-white`, `border-blue-500`, `text-red-500`