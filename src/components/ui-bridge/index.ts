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
export { Breadcrumbs, BreadcrumbItem } from './breadcrumbs'; // now local TSX implementation
export { Divider } from './divider';
export { Link } from './link';
export { Kbd } from './kbd';
export { ScrollShadow } from './scroll-shadow';

// Modal suite (pass-through for now)
export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from './modal';
// Snippet (pass-through for now)
export { Snippet } from './snippet';
// ButtonGroup (pass-through for now)
export { ButtonGroup } from './button-group';
export {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from './table';

// Newly added bridge components
export {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from './dropdown';
export { Pagination } from './pagination';

// Newly added select, chip, autocomplete bridge wrappers
export { Select, SelectItem } from './select';
export { Chip } from './chip';
export { Autocomplete, AutocompleteItem } from './autocomplete';
