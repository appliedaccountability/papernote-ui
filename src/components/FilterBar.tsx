import { X, Search } from "lucide-react";
import Input from "./Input";
import Select, { type SelectOption } from "./Select";
import Button from "./Button";

export interface FilterConfig {
  key: string;
  label: string;
  type:
    | "text"
    | "search"
    | "select"
    | "date"
    | "number"
    | "boolean"
    | "dateRange"
    | "toggle"
    | "switch"
    | "multiSelect";
  placeholder?: string;
  options?: Array<{ label: string; value: unknown }>;
}

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  className?: string;
  onClear?: () => void;
  showClearButton?: boolean;
}

export default function FilterBar({
  filters,
  values,
  onChange,
  className = "",
  onClear,
  showClearButton = false,
}: FilterBarProps) {
  const handleFilterChange = (key: string, value: unknown) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      // Default clear: set all values to null/empty
      const clearedValues: Record<string, unknown> = {};
      filters.forEach((filter) => {
        if (filter.type === "text" || filter.type === "search") {
          clearedValues[filter.key] = "";
        } else if (filter.type === "dateRange") {
          clearedValues[filter.key] = { from: undefined, to: undefined };
        } else if (filter.type === "multiSelect") {
          clearedValues[filter.key] = [];
        } else if (filter.type === "switch") {
          clearedValues[filter.key] = false;
        } else {
          clearedValues[filter.key] = null;
        }
      });
      onChange(clearedValues);
    }
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key];

    switch (filter.type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={filter.placeholder || `Filter by ${filter.label}`}
            value={(value as string) || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );

      case "select": {
        const selectOptions: SelectOption[] = [
          { value: "", label: `All ${filter.label}` },
          ...(filter.options?.map((opt) => ({
            value: String(opt.value),
            label: opt.label,
          })) || []),
        ];

        return (
          <Select
            options={selectOptions}
            value={String(value || "")}
            onChange={(newValue) =>
              handleFilterChange(filter.key, newValue || null)
            }
          />
        );
      }

      case "date":
        return (
          <input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="input"
          />
        );

      case "number":
        return (
          <input
            type="number"
            placeholder={filter.placeholder || `Filter by ${filter.label}`}
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) =>
              handleFilterChange(
                filter.key,
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="input"
          />
        );

      case "boolean": {
        const boolOptions: SelectOption[] = [
          { value: "", label: "All" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ];

        return (
          <Select
            options={boolOptions}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(newValue) =>
              handleFilterChange(
                filter.key,
                newValue === "" ? null : newValue === "true",
              )
            }
          />
        );
      }

      case "search":
        return (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-ink-400" />
            </div>
            <input
              type="text"
              placeholder={filter.placeholder || `Search ${filter.label}...`}
              value={(value as string) || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="input pl-9"
            />
          </div>
        );

      case "dateRange": {
        const rangeValue = (value as { from?: string; to?: string }) || {};
        return (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={rangeValue.from || ""}
              onChange={(e) =>
                handleFilterChange(filter.key, {
                  ...rangeValue,
                  from: e.target.value || undefined,
                })
              }
              className="input text-sm"
              aria-label={`${filter.label} from`}
            />
            <span className="text-ink-400 text-xs">to</span>
            <input
              type="date"
              value={rangeValue.to || ""}
              onChange={(e) =>
                handleFilterChange(filter.key, {
                  ...rangeValue,
                  to: e.target.value || undefined,
                })
              }
              className="input text-sm"
              aria-label={`${filter.label} to`}
            />
          </div>
        );
      }

      case "toggle": {
        const toggleOptions: SelectOption[] = [
          { value: "", label: "All" },
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ];
        const currentVal =
          value === null || value === undefined ? "" : String(value);
        return (
          <div
            className="flex rounded-lg border border-paper-300 overflow-hidden"
            role="group"
          >
            {toggleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  handleFilterChange(
                    filter.key,
                    opt.value === "" ? null : opt.value === "true",
                  )
                }
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentVal === opt.value
                    ? "bg-accent-500 text-white"
                    : "bg-white text-ink-600 hover:bg-paper-50"
                } ${opt.value !== "" ? "border-l border-paper-300" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );
      }

      case "switch": {
        // Single binary toggle — use when the filter is naturally on/off
        // (e.g. "Mine only", "Archived"), unlike `boolean` / `toggle` which
        // present an All/Yes/No tri-state. Stored value is a plain boolean.
        const checked = value === true;
        return (
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => handleFilterChange(filter.key, !checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 ${
              checked ? "bg-accent-500" : "bg-paper-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                checked ? "translate-x-6" : "translate-x-1"
              }`}
            />
            <span className="sr-only">{filter.label}</span>
          </button>
        );
      }

      case "multiSelect": {
        const selectedValues = Array.isArray(value) ? (value as string[]) : [];
        const msOptions = filter.options || [];
        return (
          <div className="relative">
            <Select
              options={[
                { value: "", label: `All ${filter.label}` },
                ...msOptions.map((o) => ({
                  value: String(o.value),
                  label: o.label,
                })),
              ]}
              value=""
              onChange={(newValue) => {
                if (!newValue) {
                  handleFilterChange(filter.key, []);
                } else if (!selectedValues.includes(newValue)) {
                  handleFilterChange(filter.key, [...selectedValues, newValue]);
                }
              }}
            />
            {selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedValues.map((sv) => {
                  const opt = msOptions.find((o) => String(o.value) === sv);
                  return (
                    <span
                      key={sv}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent-100 text-accent-700 rounded-full"
                    >
                      {opt?.label || sv}
                      <button
                        type="button"
                        onClick={() =>
                          handleFilterChange(
                            filter.key,
                            selectedValues.filter((v) => v !== sv),
                          )
                        }
                        className="hover:text-accent-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (filters.length === 0) return null;

  return (
    <div
      className={`bg-white bg-subtle-grain border border-paper-200 rounded-lg shadow-sm p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Filters */}
        <div className="flex-1 flex flex-wrap gap-4">
          {filters.map((filter) => (
            <div
              key={filter.key}
              className="flex flex-col space-y-1 min-w-[200px]"
            >
              <label className="label">{filter.label}</label>
              {renderFilter(filter)}
            </div>
          ))}
        </div>

        {/* Clear Button */}
        {showClearButton && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="md"
              onClick={handleClear}
              icon={<X className="h-4 w-4" />}
              iconPosition="left"
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
