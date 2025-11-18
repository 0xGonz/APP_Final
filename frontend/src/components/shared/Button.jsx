import { forwardRef } from 'react';

/**
 * Button Component
 *
 * A standardized button component with consistent styling across the application.
 *
 * @param {string} variant - Button style variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
 * @param {string} size - Button size: 'md' | 'sm'
 * @param {boolean} disabled - Whether button is disabled
 * @param {ReactNode} children - Button content
 * @param {string} className - Additional CSS classes
 * @param {Object} props - Additional button props
 */
const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white disabled:bg-gray-400',
      secondary:
        'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 disabled:bg-gray-50',
      success:
        'bg-success-600 hover:bg-success-700 active:bg-success-800 text-white disabled:bg-gray-400',
      danger:
        'bg-danger-600 hover:bg-danger-700 active:bg-danger-800 text-white disabled:bg-gray-400',
      ghost:
        'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 border border-gray-300',
    };

    const sizeStyles = {
      md: 'px-4 py-2 text-sm',
      sm: 'px-3 py-1.5 text-xs',
    };

    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <button ref={ref} disabled={disabled} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
