import React, { useState, useRef, useEffect } from 'react';

const Select = ({ value, onChange, options, placeholder, disabled, className, errorClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder || 'Select...';
  const hasSelection = selectedOption && selectedOption.value !== '';

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(options[highlightedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (option) => {
    onChange({ target: { value: option.value } });
    setIsOpen(false);
  };

  const baseClasses = `select-component ${className || []}`.trim();
  const selectClasses = `
    select-trigger
    ${disabled ? 'disabled' : 'cursor-pointer'}
    ${isOpen ? 'open' : ''}
    ${errorClass ? 'error' : ''}
  `.trim();

  return (
    <div ref={containerRef} className={`select-wrapper relative inline-block w-full ${baseClasses}`}>
      <button
        type="button"
        className={`${selectClasses} w-full h-9 px-3 py-2 rounded-md border border-slate-300 bg-white text-left text-slate-900 text-sm leading-5 transition-all duration-200 flex items-center justify-between hover:border-sky-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-sky-400 hover:shadow-sm'} ${isOpen ? 'border-sky-500 ring-2 ring-sky-200' : ''} ${errorClass ? 'border-red-500 focus:ring-red-200' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`flex-1 truncate text-sm leading-5 ${hasSelection ? 'text-slate-900' : 'text-slate-400'}`}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="select-portal absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg top-full">
          <ul
            ref={listRef}
            className="select-list max-h-64 overflow-y-auto py-1"
            role="listbox"
          >
            {options.map((option, index) => (
              <li key={`${option.value}-${index}`} role="option" aria-selected={value === option.value}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm leading-5 transition-colors duration-150 ${
                    value === option.value
                      ? 'bg-sky-50 text-sky-700 border-l-4 border-sky-500'
                      : highlightedIndex === index
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  disabled={disabled}
                >
                  {option.label}
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-4 py-3 text-center text-slate-500 font-medium">
                No options available
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Select;
