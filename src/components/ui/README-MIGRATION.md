# UI Migration Notes

This folder now uses shadcn/ui primitives. Legacy components Breadcrumbs, BreadcrumbItem, and Divider were removed. Use the re-exported shadcn equivalents:

- Breadcrumbs → ShadBreadcrumb + ShadBreadcrumbList + ShadBreadcrumbItem/Link/Page/Separator
- Divider → ShadSeparator
- CardBody → CardContent
- Button legacy props: variant="flat|light|bordered|solid|default" and color still map for compatibility, but prefer shadcn variants (default, outline, ghost, destructive, secondary, link).

If you see import errors for Breadcrumbs or Divider, replace imports from '../ui' accordingly.
