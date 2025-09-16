import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
  label?: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  minDate?: string;
  maxDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  className = '',
  placeholder = 'Sélectionner une date...',
  disabled = false,
  size = 'md',
  minDate,
  maxDate
}) => {
  // Define helper functions first
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    // Parse the date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    // Return in dd/mm/yyyy format
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() => {
    return value ? formatDisplayDate(value) : '';
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      // Parse the date string manually to avoid timezone issues
      const [year, month] = value.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    openBelow: true
  });
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  // Keep the input and month in sync when the external value changes
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      const target = new Date(y, m - 1, 1);
      setCurrentMonth(prev => (
        prev.getFullYear() === target.getFullYear() && prev.getMonth() === target.getMonth()
          ? prev
          : target
      ));
      setInputValue(formatDisplayDate(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  const parseInputDate = (input: string): string | null => {
    if (!input.trim()) return null;
    
    // First try DD/MM/YYYY format (European - priority format)
    const ddmmyyyy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(input);
    if (ddmmyyyy) {
      const [, dayStr, monthStr, yearStr] = ddmmyyyy;
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);
      
      if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        // Validate the date actually exists
        const testDate = new Date(year, month - 1, day);
        if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
    
    // Try ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {
      const [year, month, day] = input.split('-').map(Number);
      if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Validate the date actually exists
        const testDate = new Date(year, month - 1, day);
        if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
          return dateStr;
        }
      }
    }
    
    // Try parsing with Date constructor as fallback
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      if (year >= 1900 && year <= 2100) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    
    return null;
  };

  const updateDropdownPosition = () => {
    if (!datePickerRef.current) return;
    
    const rect = datePickerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const calendarHeight = 320; // Approximate calendar height
    
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    
    const openBelow = spaceBelow >= calendarHeight || spaceBelow > spaceAbove;
    
    let top = openBelow 
      ? rect.bottom + window.scrollY + 4
      : Math.max(8, rect.top + window.scrollY - calendarHeight - 4);
    
    const left = Math.max(8, Math.min(
      rect.left + window.scrollX,
      viewportWidth + window.scrollX - 280 - 8 // Calendar width is ~280px
    ));
    
    setDropdownPosition({
      top,
      left,
      width: Math.max(280, rect.width),
      openBelow
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current && 
        !datePickerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition();
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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date: Date) => {
    // Format date manually to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    if (minDate && dateString < minDate) return true;
    if (maxDate && dateString > maxDate) return true;
    return false;
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isDateDisabled(selectedDate)) return;
    
    // Format date manually to avoid timezone issues
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    onChange(dateString);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    if (!inputValue.trim()) {
      onChange('');
      return;
    }

    const parsedDate = parseInputDate(inputValue);
    if (parsedDate) {
      // Check if parsed date is within min/max constraints
      if ((minDate && parsedDate < minDate) || (maxDate && parsedDate > maxDate)) {
        // Reset to previous valid value
        setInputValue(value ? formatDisplayDate(value) : '');
        return;
      }
      
      onChange(parsedDate);
      // Update the calendar month to match the entered date
      const [year, month] = parsedDate.split('-').map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
    } else {
      // Invalid date format, reset to previous valid value
      setInputValue(value ? formatDisplayDate(value) : '');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputValue(value ? formatDisplayDate(value) : '');
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault();
      updateDropdownPosition();
      setIsOpen(true);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const selectedDate = value ? (() => {
      // Parse date string manually to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    })() : null;
    
    const days = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = selectedDate && 
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      const isDisabled = isDateDisabled(date);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`
            w-8 h-8 text-sm rounded-md transition-colors duration-150
            ${isSelected 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'hover:bg-accent hover:text-accent-foreground'
            }
            ${isToday && !isSelected 
              ? 'bg-accent/50 text-accent-foreground font-semibold' 
              : ''
            }
            ${isDisabled 
              ? 'text-muted-foreground/40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground/40' 
              : 'cursor-pointer text-foreground hover:text-accent-foreground'
            }
          `}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-sm font-semibold text-foreground">
            {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
          
          <button
            type="button"
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-foreground"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="w-8 h-6 text-xs font-medium text-muted-foreground text-center">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative" ref={datePickerRef}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onFocus={() => {
              if (!disabled && !isOpen) {
                updateDropdownPosition();
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full rounded-md border bg-background pr-10 transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50'}
              ${error ? 'border-destructive focus-visible:ring-destructive/50' : 'border-input'}
              ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
              ${sizeClasses[size]}
              ${className}
            `}
          />
          <button
            type="button"
            onClick={() => {
              if (!disabled) {
                if (!isOpen) {
                  updateDropdownPosition();
                }
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            disabled={disabled}
            className="absolute right-2 p-1 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
          >
            <svg 
              className="h-4 w-4 text-muted-foreground" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </button>
        </div>
        
        {isOpen && createPortal(
          <div 
            ref={calendarRef}
            style={{
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999
            }}
            className={`bg-popover border border-border rounded-md shadow-lg ${
              !dropdownPosition.openBelow ? 'origin-top' : 'origin-bottom'
            } animate-in fade-in-0 zoom-in-95`}
          >
            {renderCalendar()}
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

export default DatePicker;