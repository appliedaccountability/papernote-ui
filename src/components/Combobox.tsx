import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useId,
  useMemo,
} from "react";
import { Check, ChevronDown, Search, X, Plus } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface ComboboxHandle {
  focus: () => void;
  blur: () => void;
  open: () => void;
  close: () => void;
}

export interface ComboboxOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ComponentType<any>;
  /** Disabled state */
  disabled?: boolean;
}

export interface ComboboxProps {
  /** Selected value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Available options */
  options: ComboboxOption[];
  /** Search handler (for async/server-side filtering) */
  onSearch?: (query: string) => void;
  /** Create option handler */
  onCreateOption?: (value: string) => void;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Allow custom value input (typeahead mode) */
  allowCustomValue?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Validation state */
  validationState?: "error" | "success" | "warning" | null;
  /** Validation message */
  validationMessage?: string;
  /** Helper text */
  helperText?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /**
   * Render the dropdown through a windowing virtualizer. Use when the option
   * count can exceed a few hundred entries (e.g. server-driven typeahead over
   * Accounts / Contacts in a CRM dataset). Off by default so small dropdowns
   * keep their current DOM shape. Backed by `@tanstack/react-virtual`.
   */
  virtualized?: boolean;
  /**
   * Estimated row height in pixels, used by the virtualizer to size the
   * scroll container. Only applies when `virtualized={true}`. Defaults to
   * 36px which matches the current `text-sm py-2 px-3` row layout. Lift
   * this if you customize the row template via CSS.
   */
  itemHeight?: number;
}

/**
 * Combobox component - searchable select with typeahead and custom value support.
 *
 * Features:
 * - Typeahead search with filtering
 * - Create custom options
 * - Async search support
 * - Keyboard navigation
 * - Validation states
 * - Custom value input
 *
 * @example
 * ```tsx
 * <Combobox
 *   label="Country"
 *   value={country}
 *   onChange={setCountry}
 *   options={countryOptions}
 *   allowCustomValue
 *   onCreateOption={handleCreateCountry}
 * />
 * ```
 */
const Combobox = forwardRef<ComboboxHandle, ComboboxProps>(
  (
    {
      value = "",
      onChange,
      options,
      onSearch,
      onCreateOption,
      label,
      placeholder = "Search or select...",
      allowCustomValue = false,
      loading = false,
      validationState,
      validationMessage,
      helperText,
      required = false,
      disabled = false,
      className = "",
      size = "md",
      virtualized = false,
      itemHeight = 36,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Generate unique IDs for ARIA
    const labelId = useId();
    const listboxId = useId();
    const descriptionId = useId();

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }));

    // Filter options based on search query.
    // Memoized so the virtualizer's count input is stable across re-renders
    // when nothing relevant changed — TanStack Virtual remounts its internal
    // index map otherwise, breaking scroll position.
    const filteredOptions = useMemo(
      () =>
        options.filter((option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      [options, searchQuery],
    );

    // Virtualizer — only constructed when `virtualized` is on. The hook
    // itself is always called (Rules of Hooks), but `count: 0` is a no-op
    // and `useVirtualizer` doesn't read `getScrollElement` until items
    // exist, so the non-virtualized path pays only the hook call overhead.
    const rowVirtualizer = useVirtualizer({
      count: virtualized ? filteredOptions.length : 0,
      getScrollElement: () => scrollContainerRef.current,
      estimateSize: () => itemHeight,
      overscan: 8,
    });

    // Get display value
    const selectedOption = options.find((opt) => opt.value === value);
    const displayValue = isOpen
      ? searchQuery
      : selectedOption?.label || value || "";

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // Scroll highlighted option into view. Two paths:
    //  - virtualized: ask the virtualizer to scroll the row into view; the
    //    DOM child at `[highlightedIndex]` may not exist yet.
    //  - non-virtualized: walk the rendered <li> children directly.
    useEffect(() => {
      if (!isOpen) return;
      if (virtualized) {
        if (filteredOptions.length === 0) return;
        rowVirtualizer.scrollToIndex(highlightedIndex, { align: "auto" });
        return;
      }
      if (listRef.current) {
        const highlightedElement = listRef.current.children[
          highlightedIndex
        ] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, [
      highlightedIndex,
      isOpen,
      virtualized,
      filteredOptions.length,
      rowVirtualizer,
    ]);

    // Handle search input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      setIsOpen(true);
      setHighlightedIndex(0);

      // Trigger search callback for async filtering
      if (onSearch) {
        onSearch(query);
      }

      // If allowCustomValue, update value immediately
      if (allowCustomValue) {
        onChange?.(query);
      }
    };

    // Handle option selection
    const handleSelectOption = (option: ComboboxOption) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setSearchQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    };

    // Handle create custom option
    const handleCreateOption = () => {
      if (searchQuery.trim() && onCreateOption) {
        onCreateOption(searchQuery.trim());
        setSearchQuery("");
        setIsOpen(false);
      }
    };

    // Handle clear
    const handleClear = () => {
      onChange?.("");
      setSearchQuery("");
      inputRef.current?.focus();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev,
            );
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }
          break;

        case "Enter":
          e.preventDefault();
          if (isOpen && filteredOptions.length > 0) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          } else if (allowCustomValue && searchQuery.trim()) {
            onChange?.(searchQuery.trim());
            setIsOpen(false);
          }
          break;

        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery("");
          break;

        case "Tab":
          setIsOpen(false);
          setSearchQuery("");
          break;
      }
    };

    // Size classes
    const sizeClasses = {
      sm: "text-sm py-1.5 px-3",
      md: "text-sm py-2 px-3",
      lg: "text-base py-2.5 px-4",
    };

    const iconSizeClasses = {
      sm: "h-4 w-4",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    // Validation classes
    const validationClasses = {
      error: "border-error-500 focus:ring-error-500 focus:border-error-500",
      success:
        "border-success-500 focus:ring-success-500 focus:border-success-500",
      warning:
        "border-warning-500 focus:ring-warning-500 focus:border-warning-500",
    };

    const validationMessageColors = {
      error: "text-error-600",
      success: "text-success-600",
      warning: "text-warning-600",
    };

    // Check if can create custom option
    const canCreateOption =
      onCreateOption &&
      searchQuery.trim() &&
      !filteredOptions.some(
        (opt) => opt.label.toLowerCase() === searchQuery.toLowerCase(),
      );

    return (
      <div className={`relative ${className}`} ref={containerRef}>
        {/* Label */}
        {label && (
          <label
            id={labelId}
            className="block text-sm font-medium text-ink-700 mb-1"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Input */}
        <div className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              onMouseDown={(e) => {
                // Toggle close on click when the input is already focused + open.
                // Without this, the second click is a no-op because onFocus only
                // fires on focus transition.
                if (isOpen && document.activeElement === inputRef.current) {
                  e.preventDefault();
                  setIsOpen(false);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              className={`
              w-full rounded-md border bg-white
              ${sizeClasses[size]}
              ${validationState ? validationClasses[validationState] : "border-paper-300 focus:ring-primary-500 focus:border-primary-500"}
              ${disabled ? "bg-paper-100 text-ink-400 cursor-not-allowed" : ""}
              focus:outline-none focus:ring-2
              pr-20
            `}
              aria-labelledby={label ? labelId : undefined}
              aria-label={!label ? "Combobox" : undefined}
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                isOpen && filteredOptions.length > 0
                  ? `option-${highlightedIndex}`
                  : undefined
              }
              aria-invalid={validationState === "error" ? "true" : undefined}
              aria-describedby={validationMessage ? descriptionId : undefined}
              aria-required={required}
              role="combobox"
            />

            {/* Icons */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
              {loading && (
                <div className="animate-spin">
                  <Search className={`${iconSizeClasses[size]} text-ink-400`} />
                </div>
              )}
              {!loading && value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 text-ink-400 hover:text-ink-600 focus:outline-none"
                  aria-label="Clear"
                  tabIndex={-1}
                >
                  <X className={iconSizeClasses[size]} />
                </button>
              )}
              {!loading && !disabled && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    // preventDefault keeps the input from losing focus on
                    // mousedown so the toggle stays smooth. Manually re-focus
                    // when opening so keyboard nav works immediately.
                    e.preventDefault();
                    setIsOpen((o) => !o);
                    if (!isOpen) {
                      inputRef.current?.focus();
                    }
                  }}
                  className="p-0.5 text-ink-400 hover:text-ink-600 focus:outline-none"
                  aria-label={isOpen ? "Close options" : "Open options"}
                  tabIndex={-1}
                >
                  <ChevronDown
                    className={`${iconSizeClasses[size]} transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              )}
              {!loading && disabled && (
                <ChevronDown
                  className={`${iconSizeClasses[size]} text-ink-400 transition-transform`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Helper text or validation message */}
        {validationMessage && (
          <p
            id={descriptionId}
            className={`mt-1 text-xs ${validationState ? validationMessageColors[validationState] : "text-ink-500"}`}
            role="alert"
            aria-live="polite"
          >
            {validationMessage}
          </p>
        )}
        {helperText && !validationMessage && (
          <p className="mt-1 text-xs text-ink-500">{helperText}</p>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={scrollContainerRef}
            className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-paper-200 max-h-60 overflow-auto"
            role="listbox"
            id={listboxId}
            aria-label="Available options"
          >
            {loading ? (
              <div
                className="px-4 py-8 text-center text-ink-500 text-sm"
                role="status"
                aria-live="polite"
              >
                Loading...
              </div>
            ) : filteredOptions.length === 0 && !canCreateOption ? (
              <div
                className="px-4 py-8 text-center text-ink-500 text-sm"
                role="status"
                aria-live="polite"
              >
                No options found
              </div>
            ) : virtualized ? (
              <>
                <ul
                  ref={listRef}
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const option = filteredOptions[virtualRow.index];
                    const Icon = option.icon;
                    const isSelected = option.value === value;
                    const isHighlighted = virtualRow.index === highlightedIndex;

                    return (
                      <li
                        key={option.value}
                        id={`option-${virtualRow.index}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                        onClick={() => handleSelectOption(option)}
                        onMouseEnter={() =>
                          setHighlightedIndex(virtualRow.index)
                        }
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className={`
                        px-3 py-2 cursor-pointer flex items-center justify-between gap-2
                        ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}
                        ${isHighlighted ? "bg-primary-50" : ""}
                        ${isSelected ? "bg-primary-100 font-medium" : ""}
                        hover:bg-primary-50
                      `}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {Icon && (
                            <Icon
                              className={`${iconSizeClasses[size]} flex-shrink-0 text-ink-600`}
                            />
                          )}
                          <span className="truncate text-sm text-ink-900">
                            {option.label}
                          </span>
                        </div>
                        {isSelected && (
                          <Check
                            className={`${iconSizeClasses[size]} flex-shrink-0 text-primary-600`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Create option — sits outside the virtualized window so it
                    stays visible at the bottom of the dropdown regardless of
                    scroll position. */}
                {canCreateOption && (
                  <ul>
                    <li
                      role="option"
                      onClick={handleCreateOption}
                      className="px-3 py-2 cursor-pointer flex items-center gap-2 border-t border-paper-200 hover:bg-primary-50 bg-success-50"
                    >
                      <Plus
                        className={`${iconSizeClasses[size]} text-success-600`}
                      />
                      <span className="text-sm text-success-700 font-medium">
                        Create "{searchQuery}"
                      </span>
                    </li>
                  </ul>
                )}
              </>
            ) : (
              <ul ref={listRef}>
                {/* Filtered options */}
                {filteredOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={option.value}
                      id={`option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                      onClick={() => handleSelectOption(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`
                      px-3 py-2 cursor-pointer flex items-center justify-between gap-2
                      ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}
                      ${isHighlighted ? "bg-primary-50" : ""}
                      ${isSelected ? "bg-primary-100 font-medium" : ""}
                      hover:bg-primary-50
                    `}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {Icon && (
                          <Icon
                            className={`${iconSizeClasses[size]} flex-shrink-0 text-ink-600`}
                          />
                        )}
                        <span className="truncate text-sm text-ink-900">
                          {option.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check
                          className={`${iconSizeClasses[size]} flex-shrink-0 text-primary-600`}
                        />
                      )}
                    </li>
                  );
                })}

                {/* Create option */}
                {canCreateOption && (
                  <li
                    role="option"
                    onClick={handleCreateOption}
                    className="px-3 py-2 cursor-pointer flex items-center gap-2 border-t border-paper-200 hover:bg-primary-50 bg-success-50"
                  >
                    <Plus
                      className={`${iconSizeClasses[size]} text-success-600`}
                    />
                    <span className="text-sm text-success-700 font-medium">
                      Create "{searchQuery}"
                    </span>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  },
);

Combobox.displayName = "Combobox";
export default Combobox;
