import * as React from 'react';
import { cn } from '../../lib/utils';
import { createPortal } from 'react-dom';

// Temporary pass-through style modal replicating subset of HeroUI Modal props.
// Later replace with shadcn Dialog primitives while keeping call sites stable.
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'md',
  children,
}) => {
  if (!isOpen) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={cn(
          'relative w-full rounded-lg border bg-background shadow-lg focus:outline-none',
          sizeClasses[size]
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
Modal.displayName = 'Modal';

export const ModalContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={cn('flex flex-col max-h-[80vh] overflow-hidden', className)}
    {...rest}
  />
);
ModalContent.displayName = 'ModalContent';

export const ModalHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={cn(
      'px-5 py-4 border-b text-sm font-semibold flex items-center gap-2',
      className
    )}
    {...rest}
  />
);
ModalHeader.displayName = 'ModalHeader';

export const ModalBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => <div className={cn('p-5 overflow-y-auto flex-1', className)} {...rest} />;
ModalBody.displayName = 'ModalBody';

export const ModalFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={cn('px-5 py-4 border-t flex justify-end gap-2', className)}
    {...rest}
  />
);
ModalFooter.displayName = 'ModalFooter';
