import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button as UIButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  ghost: 'ghost',
  outline: 'outline',
} as const;

const sizeMap = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
  icon: 'icon',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}, ref) => (
  <UIButton
    ref={ref}
    type="button"
    variant={variantMap[variant]}
    size={sizeMap[size]}
    className={cn(fullWidth && 'w-full', className)}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
    {icon && iconPosition !== 'right' && icon}
    {label}
    {children}
    {icon && iconPosition === 'right' && icon}
  </UIButton>
));
Button.displayName = 'Button';

export default Button;
