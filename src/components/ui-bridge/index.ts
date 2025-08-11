// Temporary bridge exports
// Replaced Card exports with local implementation
export {
  Card,
  CardHeader,
  CardFooter,
  CardContent,
  CardBody,
  CardDescription,
  CardTitle,
} from './card';
// Replace Button with bridge wrapper implementation
export { Button } from './button';
// Keep HeroUI for remaining components until migrated
export { Badge } from './badge'; // migrated badge bridge
export { Avatar } from './avatar'; // migrated avatar bridge
export { Spinner } from './spinner'; // migrated spinner bridge

// New shadcn-based components (to migrate towards)
export * from '../ui/button';
export * from '../ui/badge';
export * from '../ui/avatar';
export * from '../ui/input';
export * from '../ui/textarea';
export * from '../ui/switch';

// NOTE: Gradually replace above HeroUI re-exports with local ones.
export { Breadcrumbs, BreadcrumbItem } from './breadcrumbs'; // temp pass-through until replaced
export { Divider } from './divider';
export { Link } from './link';
