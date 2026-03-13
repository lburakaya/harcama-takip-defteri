import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl
              text-text-primary placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/50
              transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-accent-red/50 focus:ring-accent-red/30' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-accent-red">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-secondary">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-bg-card border border-border-custom rounded-xl
            text-text-primary placeholder:text-text-muted resize-none
            focus:outline-none focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/50
            transition-all duration-200
            ${error ? 'border-accent-red/50 focus:ring-accent-red/30' : ''}
            ${className}
          `}
          rows={3}
          {...props}
        />
        {error && <span className="text-xs text-accent-red">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
