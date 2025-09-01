import * as React from 'react';

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export type SidebarProviderProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Optional width controls via CSS vars
  style?: React.CSSProperties & {
    ['--sidebar-width']?: string;
    ['--sidebar-width-mobile']?: string;
  };
};

export function SidebarProvider({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  style,
}: SidebarProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) onOpenChange(value);
      else setUncontrolledOpen(value);
    },
    [onOpenChange]
  );

  const toggleSidebar = React.useCallback(
    () => setOpen(!open),
    [open, setOpen]
  );

  const ctx: SidebarContextValue = React.useMemo(
    () => ({ open, setOpen, toggleSidebar }),
    [open, setOpen, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={ctx}>
      <div
        style={{
          // Provide sensible defaults if not set by consumer
          ['--sidebar-width' as any]: '22rem',
          ['--sidebar-width-mobile' as any]: '20rem',
          ...style,
        }}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return ctx;
}

export type SidebarProps = {
  children?: React.ReactNode;
  side?: 'left' | 'right';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  className?: string;
};

/**
 * Minimal offcanvas sidebar built for "slide-in editor" use-cases.
 * Uses a fixed panel that slides from the right by default with an overlay.
 */
export function Sidebar({
  children,
  side = 'right',
  collapsible = 'offcanvas',
  className = '',
}: SidebarProps) {
  const { open, setOpen } = useSidebar();
  const isRight = side === 'right';
  const translateClosed = isRight ? 'translate-x-full' : '-translate-x-full';

  return (
    <>
      {/* Overlay */}
      {collapsible === 'offcanvas' && (
        <div
          role="presentation"
          onClick={() => setOpen(false)}
          className={[
            'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity',
            open ? 'opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          aria-hidden={!open}
        />
      )}

      {/* Panel */}
      <aside
        aria-hidden={!open}
        className={[
          'fixed top-0 z-50 h-screen w-[--sidebar-width] max-w-[90vw] border-l bg-background text-foreground shadow-xl transition-transform duration-300 ease-out flex flex-col',
          isRight ? 'right-0 border-l' : 'left-0 border-r',
          open ? 'translate-x-0' : translateClosed,
          className,
        ].join(' ')}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className,
      ].join(' ')}
    >
      <div className="p-4">{children}</div>
    </div>
  );
}

export function SidebarFooter({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'sticky bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className,
      ].join(' ')}
    >
      <div className="p-3">{children}</div>
    </div>
  );
}

export function SidebarContent({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={['flex-1 overflow-y-auto p-4', className].join(' ')}>
      {children}
    </div>
  );
}

export function SidebarTrigger({
  children,
  className = '',
  asChild = false,
}: {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}) {
  const { toggleSidebar } = useSidebar();
  const content = (
    <button
      type="button"
      onClick={toggleSidebar}
      className={[
        'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm shadow-sm hover:bg-accent',
        className,
      ].join(' ')}
    >
      {children ?? 'Toggle Sidebar'}
    </button>
  );
  return asChild ? <>{children}</> : content;
}
