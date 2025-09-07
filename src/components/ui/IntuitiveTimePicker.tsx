import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TimePickerProps {
  label?: string;
  value: string; // HH:MM (24-hour format)
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  format?: '12' | '24';
}

interface TimeState {
  hours: number;
  minutes: number;
  period?: 'AM' | 'PM';
}

const IntuitiveTimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  error,
  className = '',
  placeholder = 'Select time...',
  disabled = false,
  size = 'md',
  format = '24'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputFocus, setInputFocus] = useState<'hours' | 'minutes' | 'period'>('hours');
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    openBelow: true,
  });

  const timePickerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  } as const;

  // Parse HH:MM string to TimeState
  const parseTimeString = (timeStr: string): TimeState => {
    if (!timeStr) return { hours: format === '12' ? 12 : 0, minutes: 0, period: 'AM' };
    
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours24 = parseInt(hoursStr) || 0;
    const minutes = parseInt(minutesStr) || 0;
    
    if (format === '12') {
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      return { hours: hours12, minutes, period };
    }
    
    return { hours: hours24, minutes };
  };

  // Convert TimeState to HH:MM string
  const timeStateToString = (timeState: TimeState): string => {
    let hours24 = timeState.hours;
    
    if (format === '12' && timeState.period) {
      if (timeState.period === 'AM' && timeState.hours === 12) {
        hours24 = 0;
      } else if (timeState.period === 'PM' && timeState.hours !== 12) {
        hours24 = timeState.hours + 12;
      }
    }
    
    return `${hours24.toString().padStart(2, '0')}:${timeState.minutes.toString().padStart(2, '0')}`;
  };

  const selectedTime = parseTimeString(value);

  const formatDisplayTime = (timeState: TimeState): string => {
    if (format === '12') {
      return `${timeState.hours.toString().padStart(2, '0')}:${timeState.minutes.toString().padStart(2, '0')} ${timeState.period}`;
    }
    return `${timeState.hours.toString().padStart(2, '0')}:${timeState.minutes.toString().padStart(2, '0')}`;
  };

  const updateDropdownPosition = () => {
    if (!timePickerRef.current) return;

    const rect = timePickerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelHeight = 400;

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
        viewportWidth + window.scrollX - Math.max(320, rect.width) - 8
      )
    );

    setDropdownPosition({
      top,
      left,
      width: Math.max(320, rect.width),
      openBelow,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target as Node) &&
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

  const handleTimeChange = (field: 'hours' | 'minutes' | 'period', newValue: number | string) => {
    let newTime = { ...selectedTime };
    
    if (field === 'hours') {
      if (format === '12') {
        newTime.hours = Math.max(1, Math.min(12, newValue as number));
      } else {
        newTime.hours = Math.max(0, Math.min(23, newValue as number));
      }
    } else if (field === 'minutes') {
      newTime.minutes = Math.max(0, Math.min(59, newValue as number));
    } else if (field === 'period') {
      newTime.period = newValue as 'AM' | 'PM';
    }
    
    onChange(timeStateToString(newTime));
  };

  const incrementValue = (field: 'hours' | 'minutes' | 'period') => {
    if (field === 'hours') {
      const maxHours = format === '12' ? 12 : 23;
      const minHours = format === '12' ? 1 : 0;
      const newHours = selectedTime.hours >= maxHours ? minHours : selectedTime.hours + 1;
      handleTimeChange('hours', newHours);
    } else if (field === 'minutes') {
      const newMinutes = selectedTime.minutes >= 59 ? 0 : selectedTime.minutes + 1;
      handleTimeChange('minutes', newMinutes);
    } else if (field === 'period' && selectedTime.period) {
      handleTimeChange('period', selectedTime.period === 'AM' ? 'PM' : 'AM');
    }
  };

  const decrementValue = (field: 'hours' | 'minutes' | 'period') => {
    if (field === 'hours') {
      const maxHours = format === '12' ? 12 : 23;
      const minHours = format === '12' ? 1 : 0;
      const newHours = selectedTime.hours <= minHours ? maxHours : selectedTime.hours - 1;
      handleTimeChange('hours', newHours);
    } else if (field === 'minutes') {
      const newMinutes = selectedTime.minutes <= 0 ? 59 : selectedTime.minutes - 1;
      handleTimeChange('minutes', newMinutes);
    } else if (field === 'period' && selectedTime.period) {
      handleTimeChange('period', selectedTime.period === 'AM' ? 'PM' : 'AM');
    }
  };

  const handleInputChange = (field: 'hours' | 'minutes', inputValue: string) => {
    const numValue = parseInt(inputValue) || 0;
    handleTimeChange(field, numValue);
  };

  const TimeColumn = ({ 
    label, 
    value, 
    field, 
    isPeriod = false 
  }: { 
    label: string; 
    value: number | string; 
    field: 'hours' | 'minutes' | 'period';
    isPeriod?: boolean;
  }) => (
    <div className="flex flex-col items-center space-y-2">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      <div className="flex flex-col items-center space-y-1">
        <button
          type="button"
          onClick={() => incrementValue(field)}
          className="p-1 rounded-full hover:bg-accent transition-colors duration-200 text-foreground hover:text-accent-foreground"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <div className="relative">
          <input
            type="text"
            value={isPeriod ? value : value.toString().padStart(2, '0')}
            onChange={(e) => !isPeriod && handleInputChange(field as 'hours' | 'minutes', e.target.value)}
            onFocus={() => setInputFocus(field)}
            className={`text-center text-lg font-bold border-2 rounded-lg transition-all duration-200 bg-background text-foreground ${
              inputFocus === field 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            } ${isPeriod ? 'cursor-pointer w-16 h-12' : 'w-12 h-12'}`}
            readOnly={isPeriod}
            onClick={() => isPeriod && incrementValue(field)}
          />
        </div>
        <button
          type="button"
          onClick={() => decrementValue(field)}
          className="p-1 rounded-full hover:bg-accent transition-colors duration-200 text-foreground hover:text-accent-foreground"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const QuickTimeButton = ({ timeState, label }: { timeState: TimeState; label: string }) => (
    <button
      type="button"
      onClick={() => {
        onChange(timeStateToString(timeState));
        setIsOpen(false);
      }}
      className="px-3 py-2 text-sm rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors duration-200 text-foreground hover:text-accent-foreground"
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative" ref={timePickerRef}>
        <div
          onClick={() => {
            if (!disabled) {
              if (!isOpen) updateDropdownPosition();
              setIsOpen(!isOpen);
            }
          }}
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
          <span className={`truncate ${!value ? 'text-muted-foreground' : 'text-foreground'}`}>
            {value ? formatDisplayTime(selectedTime) : placeholder}
          </span>
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
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
            className={`bg-popover border border-border rounded-md shadow-lg ${
              !dropdownPosition.openBelow ? 'origin-top' : 'origin-bottom'
            } animate-in fade-in-0 zoom-in-95`}
          >
            <div className="p-6">
              <div className="flex justify-center items-center space-x-8 mb-6">
                <TimeColumn 
                  label="Hours" 
                  value={selectedTime.hours} 
                  field="hours"
                />
                <div className="text-2xl font-bold text-foreground mt-8">:</div>
                <TimeColumn 
                  label="Minutes" 
                  value={selectedTime.minutes} 
                  field="minutes"
                />
                {format === '12' && (
                  <>
                    <div className="mt-8">
                      <div className="w-px h-12 bg-border"></div>
                    </div>
                    <TimeColumn 
                      label="Period" 
                      value={selectedTime.period || 'AM'} 
                      field="period"
                      isPeriod={true}
                    />
                  </>
                )}
              </div>
              
              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  <QuickTimeButton 
                    timeState={{ hours: format === '12' ? 9 : 9, minutes: 0, period: 'AM' }} 
                    label={format === '12' ? '9:00 AM' : '09:00'} 
                  />
                  <QuickTimeButton 
                    timeState={{ hours: format === '12' ? 12 : 12, minutes: 0, period: 'PM' }} 
                    label={format === '12' ? '12:00 PM' : '12:00'} 
                  />
                  <QuickTimeButton 
                    timeState={{ hours: format === '12' ? 6 : 18, minutes: 0, period: 'PM' }} 
                    label={format === '12' ? '6:00 PM' : '18:00'} 
                  />
                  <QuickTimeButton 
                    timeState={{ hours: format === '12' ? 9 : 21, minutes: 0, period: 'PM' }} 
                    label={format === '12' ? '9:00 PM' : '21:00'} 
                  />
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
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

export default IntuitiveTimePicker;
