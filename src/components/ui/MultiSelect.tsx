import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  value: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select options...",
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    openBelow: true,
  });

  const multiSelectRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = () => {
    if (!multiSelectRef.current) return;

    const rect = multiSelectRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelHeight = Math.min(300, options.length * 40 + 16);

    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openBelow = spaceBelow >= panelHeight || spaceBelow > spaceAbove;

    const top = openBelow
      ? rect.bottom + window.scrollY + 4
      : Math.max(8, rect.top + window.scrollY - panelHeight - 4);

    const left = Math.max(
      8,
      Math.min(
        rect.left + window.scrollX,
        viewportWidth + window.scrollX - rect.width - 8
      )
    );

    setDropdownPosition({
      top,
      left,
      width: rect.width,
      openBelow,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        multiSelectRef.current &&
        !multiSelectRef.current.contains(event.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) updateDropdownPosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const handleToggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      // Don't allow removing the last role
      const newValue = value.filter(v => v !== optionValue);
      if (newValue.length > 0) {
        onChange(newValue);
      }
    } else {
      // Add the role
      onChange([...value, optionValue]);
    }
  };


  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.filter(v => v !== optionValue);
    // Ensure at least one role remains selected
    if (newValue.length > 0) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative" ref={multiSelectRef}>
        <div
          onClick={() => {
            if (!disabled) {
              if (!isOpen) updateDropdownPosition();
              setIsOpen(!isOpen);
            }
          }}
          className={`
            flex items-center justify-between w-full min-h-[40px] px-3 py-2 rounded-md border bg-background transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50'}
            ${error ? 'border-destructive focus-visible:ring-destructive/50' : 'border-input'}
            ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
            ${className}
          `}
        >
          <div className="flex-1 min-w-0">
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {value.map(v => {
                  const option = options.find(opt => opt.value === v);
                  return option ? (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                    >
                      {option.label}
                      <button
                        type="button"
                        onClick={(e) => removeOption(v, e)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <svg
            className={`h-4 w-4 flex-shrink-0 ml-2 transition-colors duration-200 ${
              isOpen ? 'text-primary' : 'text-muted-foreground'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isOpen && createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999,
            }}
            className={`bg-popover border border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto ${
              !dropdownPosition.openBelow ? 'origin-top' : 'origin-bottom'
            } animate-in fade-in-0 zoom-in-95`}
          >
            <div className="p-2">
              {options.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleToggleOption(option.value)}
                  className="flex items-center space-x-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors duration-200"
                >
                  <div className="flex items-center justify-center w-4 h-4">
                    <input
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={() => {}} // Controlled by parent onClick
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                    />
                  </div>
                  <span className="text-sm text-foreground">{option.label}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export default MultiSelect;
