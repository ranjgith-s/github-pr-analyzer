// Central export barrel for shadcn-based UI primitives.
// All legacy ui-bridge components have been migrated; import solely from here.
export * from './button';
export * from './badge';
export * from './avatar';
export * from './card';
export * from './input';
export * from './textarea';
export * from './switch';
export * from './dialog';
export * from './spinner';
// Legacy Breadcrumbs/Divider removed in favor of shadcn primitives below
// New shadcn breadcrumb & separator primitives
export {
  Breadcrumb as ShadBreadcrumb,
  BreadcrumbList as ShadBreadcrumbList,
  BreadcrumbItem as ShadBreadcrumbItem,
  BreadcrumbLink as ShadBreadcrumbLink,
  BreadcrumbPage as ShadBreadcrumbPage,
  BreadcrumbSeparator as ShadBreadcrumbSeparator,
  BreadcrumbEllipsis as ShadBreadcrumbEllipsis,
} from './breadcrumb';
export { Separator as ShadSeparator } from './separator';
export * from './link';
export * from './kbd';
export * from './chip';
export * from './button-group';
export * from './snippet';
export * from './pagination';
export * from './scroll-shadow';
export * from './select';
export * from './autocomplete';
export * from './table';
export * from './dropdown';
export * from './sidebar';
export * from './tooltip';
