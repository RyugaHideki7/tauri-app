import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  searchPlaceholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  error, 
  className = '',
  placeholder = 'Select an option...',
  disabled = false,
  size = 'md',
  searchPlaceholder = 'Search...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    openBelow: true
  });
  
  const selectRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm', 
    lg: 'h-12 px-6 text-base'
  };

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
        setSearchTerm('');
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
      } else {
        setIsOpen(false);
      }
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

  const updateDropdownPosition = () => {
    if (!selectRef.current) return;
    
    const rect = selectRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dropdownHeight = Math.min(280, filteredOptions.length * 36 + 48); // Max 280px or content height + search input
    
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    
    const openBelow = spaceBelow >= dropdownHeight || spaceBelow > spaceAbove;
    
    let top = openBelow 
      ? rect.bottom + window.scrollY + 4
      : Math.max(8, rect.top + window.scrollY - dropdownHeight - 4);
    
    const left = Math.max(8, Math.min(
      rect.left + window.scrollX,
      viewportWidth + window.scrollX - rect.width - 8
    ));
    
    setDropdownPosition({
      top,
      left,
      width: rect.width,
      openBelow
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (!isOpen) {
          updateDropdownPosition();
          setIsOpen(true);
        } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          const option = filteredOptions[focusedIndex];
          if (!option.disabled) {
            onChange(option.value);
            setIsOpen(false);
            setFocusedIndex(-1);
            setSearchTerm('');
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          updateDropdownPosition();
          setIsOpen(true);
        } else {
          const nextIndex = focusedIndex < filteredOptions.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(nextIndex);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : filteredOptions.length - 1;
          setFocusedIndex(prevIndex);
        }
        break;
    }
  };

  const handleOptionClick = (option: SearchableSelectOption, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (option.disabled) return;
    
    onChange(option.value);
    setIsOpen(false);
    setFocusedIndex(-1);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative" ref={selectRef}>
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            if (!disabled) {
              if (!isOpen) {
                updateDropdownPosition();
              }
              setIsOpen(!isOpen);
            }
          }}
          onKeyDown={handleKeyDown}
          className={`
            flex items-center justify-between w-full rounded-md border bg-background transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50'}
            ${error ? 'border-destructive focus-visible:ring-destructive/50' : 'border-input'}
            ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
            ${sizeClasses[size]}
            ${className}
          `}
        >
          <span className={`truncate ${!selectedOption ? 'text-muted-foreground' : 'text-foreground'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg 
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
            ref={optionsRef}
            role="listbox"
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999
            }}
            className={`bg-popover border border-border rounded-md shadow-md max-h-70 overflow-hidden ${
              !dropdownPosition.openBelow ? 'origin-top' : 'origin-bottom'
            } animate-in fade-in-0 zoom-in-95`}
          >
            {/* Search Input */}
            <div className="p-2 border-b border-border">
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedIndex(-1);
                }}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground"
              />
            </div>
            
            {/* Options */}
            <div className="max-h-48 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    onMouseDown={(e) => handleOptionClick(option, e)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      px-3 py-2 text-sm cursor-pointer transition-colors duration-150 text-popover-foreground
                      ${option.disabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                      }
                      ${option.value === value 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : ''
                      }
                      ${focusedIndex === index && !option.disabled && option.value !== value
                        ? 'bg-accent text-accent-foreground' 
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{option.label}</span>
                      {option.value === value && (
                        <svg className="h-4 w-4 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              )}
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

export default SearchableSelect;
