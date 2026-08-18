import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: LucideIcon;
  actionButton?: React.ReactNode;
  requiredIndicator?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      icon: Icon,
      actionButton,
      requiredIndicator,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const isRequired = required || requiredIndicator;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
          >
            <span>{label}</span>
            {isRequired && <span className="text-amber-500 font-black">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={isRequired}
            className={`w-full text-sm font-medium rounded-xl border py-2.5 transition-all outline-none ${
              Icon ? 'pl-10' : 'pl-3.5'
            } ${actionButton ? 'pr-20' : 'pr-3.5'} ${
              error
                ? 'border-rose-500 bg-rose-50/10 text-rose-900 dark:text-rose-100 placeholder-rose-400 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
            } ${className}`}
            {...props}
          />
          {actionButton && <div className="absolute right-1.5 flex items-center">{actionButton}</div>}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  requiredIndicator?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, requiredIndicator, required, className = '', id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const isRequired = required || requiredIndicator;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
          >
            <span>{label}</span>
            {isRequired && <span className="text-amber-500 font-black">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={isRequired}
          className={`w-full text-sm font-medium rounded-xl border p-3 transition-all outline-none ${
            error
              ? 'border-rose-500 bg-rose-50/10 text-rose-900 dark:text-rose-100 placeholder-rose-400 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

