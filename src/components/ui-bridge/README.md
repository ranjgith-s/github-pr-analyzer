# UI Bridge

Interim wrappers exporting HeroUI components under stable names so we can later swap internals to shadcn/ui without broad call-site churn.

Usage pattern during migration:

```ts
import { Card, Button, Badge } from '@/components/ui-bridge';
```

Do NOT import directly from `@heroui/react` in migrated files. A lint rule may later enforce this.

Swap order:

1. Establish pass-through wrappers (this state).
2. Introduce shadcn components in a parallel folder `ui`.
3. Replace internals of each export with shadcn implementation keeping external prop surface (where reasonable).
4. Remove unused HeroUI props after stabilization.
