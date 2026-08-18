import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, LucideIcon } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  helperText?: string;
  error?: string;
  options: (SelectOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  icon?: LucideIcon;
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchable = false,
  required = false,
  disabled = false,
  className = '',
  id,
  icon: LeadingIcon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Filter options if searchable
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.description && opt.description.toLowerCase().includes(q))
    );
  });

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, searchable]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className={`w-full space-y-1.5 text-left relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
        >
          <span>{label}</span>
          {required && <span className="text-amber-500 font-black">*</span>}
        </label>
      )}

      {/* Main Select Trigger */}
      <div className="relative">
        <button
          id={selectId}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm font-medium rounded-xl border transition-all outline-none select-none text-left ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
              : error
              ? 'border-rose-500 bg-rose-50/10 text-rose-900 dark:text-rose-100 focus:ring-2 focus:ring-rose-500/20'
              : isOpen
              ? 'border-amber-500 dark:border-amber-400 bg-white dark:bg-slate-950 ring-2 ring-amber-500/20 shadow-md'
              : 'border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600 text-slate-900 dark:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {LeadingIcon && (
              <LeadingIcon className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-400" />
            )}
            {selectedOption?.icon && (
              <selectedOption.icon className="w-4 h-4 shrink-0 text-amber-500" />
            )}
            {selectedOption ? (
              <span className="truncate font-semibold text-slate-900 dark:text-white">
                {selectedOption.label}
              </span>
            ) : (
              <span className="truncate text-slate-400 dark:text-slate-400">
                {placeholder}
              </span>
            )}
          </div>

          <ChevronDown
            className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-500' : ''
            }`}
          />
        </button>

        {/* Dropdown Popover List */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-64 flex flex-col"
          >
            {/* Search Input if enabled or options > 6 */}
            {(searchable || normalizedOptions.length > 7) && (
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 sticky top-0 z-10">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* List items */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-52 divide-y divide-slate-100/50 dark:divide-slate-800/40">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  const OptionIcon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => {
                        if (option.disabled) return;
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                        option.disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {OptionIcon && (
                          <OptionIcon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-amber-500' : 'text-slate-400'
                            }`}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{option.label}</p>
                          {option.description && (
                            <p className="text-[10px] font-normal text-slate-400 dark:text-slate-400 truncate">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {option.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {option.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
