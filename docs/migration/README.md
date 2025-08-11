# Component Library Migration Plan

Migrate from `@heroui` to `shadcn/ui` components incrementally with a focus on stability, test coverage, and metrics visibility.

## Guiding Principles

- Small, reviewable PRs (1-3 components max) to keep lead time & MTTR low.
- Maintain green test suite at every step.
- Avoid big bang; ship vertical slices.
- Track: PR cycle time, change failure rate (regressions), and component migration burndown (# remaining / total).
- Prefer drop-in wrapper abstractions to minimize churn.

## High-Level Phases

1. **Foundation & Tooling** – Install shadcn/ui, configure Tailwind tokens, create compatibility wrappers.
2. **Low-Risk Primitives** – Replace Card, Badge, Avatar, Spinner with wrappers mapping old props -> new.
3. **Form & Input Elements** – Replace Input, Textarea, Select, Switch, Autocomplete strategy.
4. **Composite Components** – Table, Modal, Dropdown, Pagination replacements.
5. **Page-Level Refactors** – Migrate each page container once child components are ready.
6. **Cleanup** – Remove HeroUI dependencies, mocks, theme provider, update docs.

## Component Inventory & Mapping

| Category     | HeroUI         | Target shadcn/ui                          | Notes                                         |
|--------------|----------------|-------------------------------------------|-----------------------------------------------|
| Layout/Card  | `Card`         | `Card` (ui/card)                          | Similar API; create wrapper first.            |
| Status       | `Badge`        | `Badge` (ui/badge)                        | Color mapping required.                       |
| Feedback     | `Spinner`      | `Loader2` icon + `aria-busy`              | Provide `<LoadingSpinner />` wrapper.         |
| Avatar       | `Avatar`       | `Avatar` (ui/avatar)                      | Straight mapping.                             |
| Buttons      | `Button`       | `Button`                                  | Variants map (primary => default).            |
| Inputs       | `Input`        | `Input`                                   | Clearable handled manually.                   |
| Textarea     | `Textarea`     | `Textarea`                                | Similar.                                      |
| Select       | `Select`       | `Select` (ui/select)                      | Interaction differences.                      |
| Switch       | `Switch`       | `Switch`                                  | API close.                                    |
| Modal        | `Modal`        | `Dialog`                                  | Accessibility differences; audit focus traps. |
| Dropdown     | `Dropdown*`    | `DropdownMenu`                            | Trigger / Content adjust.                     |
| Breadcrumbs  | `Breadcrumbs`  | Custom using `Breadcrumb` (ui/breadcrumb) | Replace.                                      |
| Table        | `Table*`       | `Table` + custom sorting/pagination       | Manual composition.                           |
| Chip         | `Chip`         | `Badge` / `Badge variant`                 | Consolidate.                                  |
| Pagination   | `Pagination`   | Custom component                          | Build simple paginator.                       |
| Snippet      | `Snippet`      | Custom (code block + copy)                | Implement copy logic.                         |
| Autocomplete | `Autocomplete` | Command + Input                           | Use `Command` + filtering list.               |

## Wrapper Strategy

Create `src/components/ui-bridge/` with interim wrappers exporting HeroUI-compatible names but internally using shadcn once replaced. Migration steps:

1. Introduce wrappers still delegating to HeroUI (baseline tests).
2. Switch wrapper internals to shadcn implementation (no call-site changes).
3. Gradually replace direct `@heroui/react` imports with local wrapper imports.
4. Remove unused props / adapt after stable.

## Color Variant Mapping (Draft)

HeroUI => shadcn

- `primary` -> default
- `secondary` -> secondary
- `danger` -> destructive
- `warning` -> warning (custom) add to tailwind config
- `success` -> success (custom) add to tailwind config
- `default` -> outline / ghost depending on context

Add custom semantic colors via Tailwind config extension.

## Theming

Current `HeroUIProvider` removed; rely on Tailwind + `ThemeProvider` (next-themes) if dark mode toggle required. Replace `ThemeModeContext` provider to manipulate `class="dark"` (already toggling) – just remove HeroUI provider.

## Metrics & Tracking

Add instrumentation (per PR) in description template:

- Components migrated (checklist)
- Number of lines changed
- Number of tests added/updated
- Bundle size delta (before vs after) (use `pnpm build && stat` script)
- Cumulative Remaining Components (count not yet swapped to wrapper)

Automate a script `scripts/migration-status.ts` to scan codebase for `@heroui/react` imports; output JSON consumed by badge in README.

## Risk Mitigation

- Parallel wrappers reduce regression scope.
- Keep story-based visual regression (if Storybook later) for critical components (Card, Button, Table).
- For complex interactive components (Table, Modal, Autocomplete) create playground pages under `/docs/dev/` before swapping production usage.

## Rollback Plan

If shadcn implementation causes issues, revert wrapper commit; since call sites unchanged risk confined.

## Detailed Step Plan

1. Install shadcn CLI & base components (card, button, badge, avatar, input, textarea, switch). **Status:** All base components manually scaffolded (button, card, badge, avatar, input, textarea, switch). Lint formatting adjustments pending for style consistency; CLI still optional.
2. Create `ui-bridge` wrappers: `Card.tsx`, `Button.tsx`, `Badge.tsx`, `Avatar.tsx`, `Spinner.tsx` (still re-export HeroUI initially) + export barrel. **Status:** Implemented pass-through via `src/components/ui-bridge/index.ts`.
3. Update imports in a single low-risk component (`DeveloperMetricCard`) to use bridge.
4. Add test ensuring visual structure unaffected (snapshot / role queries).
5. Swap wrapper internals for Card & Badge to shadcn versions; run tests.
6. Migrate simple components: `GlowingCard`, `DeveloperMetricCard`, `SearchUserBox`, `SearchRepoBox`.
7. Implement Input clearable logic manually; remove HeroUI Input usage there.
8. Introduce Dialog (Modal replacement) wrapper; migrate `ShareQueryModal`.
9. Replace `LoadingOverlay` Spinner with wrapper + icon.
10. Implement DropdownMenu wrapper; migrate usages in `QueryDisplay` and related.
11. Build Pagination primitive (prev/next + numeric) used in `MetricsTable`.
12. Rebuild Table using semantic `<table>` + styled components from shadcn (or composition) and migrate `MetricsTable`.
13. Rebuild Autocomplete using `Command` component (Command palette) + positioning; migrate `QueryAutocomplete` & `VisualFilterBuilder` selects.
14. Replace Breadcrumbs with custom simple component.
15. Migrate `Header`, `Login`, pages to wrappers.
16. Remove direct `@heroui/react` imports (lint rule to forbid) and run migration status script.
17. Remove HeroUI dependency from `package.json`; update README and docs.

## Progress Log

- Migrated VisualFilterBuilder to use bridge components (Select, Chip, Autocomplete, Card, CardBody) removing direct `@heroui/react` imports.
- Added bridge wrappers: `select.tsx` (Select, SelectItem), `chip.tsx` (Chip), `autocomplete.tsx` (Autocomplete, AutocompleteItem) and exported via `ui-bridge/index.ts`.
- Remaining direct `@heroui/react` imports limited to bridge layer, breadcrumbs pass-through, and test mocks.

### Recent Updates

- Migrated Card usages (Home, RepoMetrics, GlowingCard, PullRequest, SearchUserBox, SearchRepoBox, LoadingOverlay) to bridge `Card`.
- Migrated Input usages (SearchUserBox, SearchRepoBox) to bridge `Input` (shadcn primitive).
- Migrated Switch usage (ColorModeToggle, QueryDisplay toggle) to bridge `Switch` (Radix primitive) and adapted props.
- Migrated Button usages in PullRequest (except Breadcrumbs), QueryDisplay header buttons kept; some remaining Button usages still direct via heroui in complex composite components.
- Added Card bridge wrapper supporting `as`, `shadow`, `isPressable/isHoverable`.
- Implemented bridge wrappers for `Badge`, `Avatar` (size mapping), and `Spinner` (Loader2 icon) replacing HeroUI re-exports.
- Updated LoadingOverlay to use bridge Card & Spinner (now internal bridge spinner).
- Replaced direct `@heroui/react` Card imports in `DeveloperProfilePage` with bridge, and Breadcrumb imports in `Header` & `PullRequest` now via bridge pass-through temporary wrapper. Added temporary breadcrumbs bridge file.
- Added bridge wrappers for `Divider`, `Link`, `Kbd`, and `ScrollShadow`; migrated `QueryAutocomplete` to bridge components (removed direct HeroUI imports).
- Migrated `ShareQueryModal` to use bridge Modal suite, Snippet, ButtonGroup, Divider, Input, Textarea, Button (removed direct HeroUI imports there).
- Scaffolded initial semantic Table bridge components (`Table`, `TableHeader`, `TableBody`, `TableColumn`, `TableRow`, `TableCell`).
- Implemented bridge `Dropdown` (trigger, menu, item) and `Pagination` components and migrated `MetricsTable` to use bridge Table + Dropdown + Pagination + Input + Button (removed direct `@heroui/react` imports there).
- Replaced HeroUI Breadcrumbs pass-through with custom bridge implementation (no direct `@heroui/react` usage) using semantic nav/ol/li structure.
- Migrated Breadcrumbs bridge to TSX implementation (semantic nav/ol/li, Tailwind styling) and removed direct HeroUI dependency.
- Remaining HeroUI usage now confined to bridge wrappers (Select, Chip, Autocomplete) and test mocks pending full replacement.

### Pending Next

- Implement remaining composite bridges: Autocomplete (command-based), Chip (map to Badge), Breadcrumbs final (replace pass-through), Select.
- Migrate `VisualFilterBuilder` to bridge Autocomplete/Select/Chip; cleanup remaining direct imports elsewhere.
- Introduce migration status script to list remaining component imports.

## Acceptance Criteria

- Zero remaining `@heroui/react` imports.
- All tests passing with equal or improved coverage.
- Lighthouse / bundle size not worse (> +5%).
- Dark mode still functional.
- Documentation updated (README + migration doc).

## Open Questions

- Need design confirmation for new color palette mapping (esp. warning/success).
- Decide whether to include Storybook now or later.
- Determine minimal pagination UX (numbers vs simple next/prev) acceptable.

## Next Actions

- [ ] Normalize formatting (Prettier) on new ui components
- [ ] Introduce bridge swap for first component (Card) in a sample feature
- [ ] Add migration status script
- [ ] Begin component migrations per step plan
