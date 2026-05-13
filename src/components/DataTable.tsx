import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash,
} from "lucide-react";
import Menu, { MenuItem } from "./Menu";
import Pagination from "./Pagination";
import Select from "./Select";
import DataTableCardView, { CardViewConfig } from "./DataTableCardView";
import { useIsMobile } from "../hooks/useResponsive";

/**
 * Base data item interface - all data items must have an id
 *
 * All data passed to DataTable must implement this interface to ensure
 * proper row identification and selection handling.
 */
export interface BaseDataItem {
  /** Unique identifier for the data item */
  id: string | number;
}

/**
 * Column configuration for DataTable
 *
 * Defines how each column should be displayed, including width constraints,
 * custom rendering, sorting behavior, and alignment.
 */
export interface DataTableColumn<T> {
  /** Property key from data item to display in this column */
  key: keyof T | string;
  /** Column header text */
  header: string;
  /** Fixed width - supports CSS values ('120px', '15%', '1fr') or numbers (120) */
  width?: string | number;
  /** Minimum width constraint */
  minWidth?: string | number;
  /** Maximum width constraint */
  maxWidth?: string | number;
  /** Flex-grow value for flexible width columns */
  flex?: number;
  /** Custom render function for cell content */
  render?: (item: T, value: any) => React.ReactNode;
  /** Secondary line content (smaller, muted text below primary) */
  renderSecondary?: (item: T, value: any) => React.ReactNode;
  /**
   * Header text for the secondary line. Surfaced as the cell's native
   * tooltip on hover so users can identify the field even though the
   * column header above only labels the primary row.
   */
  secondaryHeader?: string;
  /**
   * Custom tooltip resolver for the primary cell. Receives item + value;
   * return a plain string. Falls back to `String(value)` when omitted so
   * users hovering a truncated cell can still read the full value.
   */
  tooltip?: (item: T, value: any) => string | undefined;
  /**
   * Custom tooltip resolver for the secondary cell. When omitted, the
   * tooltip becomes `${secondaryHeader}: ${value}` so the otherwise-
   * unlabeled second row stays self-describing.
   */
  secondaryTooltip?: (item: T, value: any) => string | undefined;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Additional CSS classes for column cells */
  className?: string;
  /** Horizontal text alignment in column */
  align?: "left" | "center" | "right";
  /** Vertical alignment of cell content - useful when rows have varying heights */
  verticalAlign?: "top" | "middle" | "bottom";
}

/**
 * Sort configuration
 *
 * Describes the current sort state for the table.
 */
export interface SortConfig {
  /** Column key being sorted */
  key: string;
  /** Sort direction */
  direction: "asc" | "desc";
  /** Optional display label for sort indicator */
  label?: string;
}

/**
 * Row action configuration for DataTable
 * Defines buttons that appear in the sticky actions column
 */
export interface DataTableAction<T> {
  /** Button label text */
  label: string;
  /** Optional icon - can be component reference or JSX element */
  icon?: React.ComponentType<any> | React.ReactNode;
  /** Click handler receives the row item */
  onClick: (item: T) => void;
  /** Button styling variant */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Optional conditional visibility */
  show?: (item: T) => boolean;
  /** Optional tooltip text */
  tooltip?: string;
}

/**
 * Expansion mode types
 */
export type ExpansionMode = "edit" | "details" | string; // string allows 'addRelated-[key]' | 'manageRelated-[key]'

/**
 * Configuration for different expansion modes
 */
export interface ExpandedRowConfig<T> {
  /** Edit mode - inline editing of the record */
  edit?: {
    render: (
      item: T,
      onSave: (updated: T) => Promise<void>,
      onCancel: () => void,
    ) => React.ReactNode;
    triggerOnDoubleClick?: boolean; // Default: true
    menuLabel?: string; // Default: 'Edit'
    menuIcon?: React.ComponentType<any>;
  };

  /** View details mode - read-only expanded view */
  details?: {
    render: (item: T) => React.ReactNode;
    triggerOnExpand?: boolean; // Default: true (when clicking chevron)
    triggerOnDoubleClick?: boolean; // Default: false
    menuLabel?: string; // Default: 'View Details'
    menuIcon?: React.ComponentType<any>;
  };

  /** Add related modes - creating related records */
  addRelated?: Array<{
    key: string; // Unique identifier for this add related mode
    label: string; // e.g., 'Add Line Item', 'Add Contact'
    icon?: React.ComponentType<any>;
    render: (
      parentItem: T,
      onSave: (newItem: any) => Promise<void>,
      onCancel: () => void,
    ) => React.ReactNode;
    showInMenu?: boolean; // Default: true
  }>;

  /** Manage related modes - viewing/editing related records */
  manageRelated?: Array<{
    key: string; // Unique identifier for this manage related mode
    label: string; // e.g., 'Manage Contacts', 'Manage Assignments'
    icon?: React.ComponentType<any>;
    render: (parentItem: T, onClose: () => void) => React.ReactNode;
    showInMenu?: boolean; // Default: true
  }>;
}

/**
 * Expansion state - tracks which row is expanded and in what mode
 */
interface ExpansionState {
  rowKey: string;
  mode: ExpansionMode;
}

/**
 * DataTable component props
 *
 * Feature-rich data table with sorting, filtering, selection, expansion,
 * row actions, and virtual scrolling support.
 */
interface DataTableProps<T extends BaseDataItem = BaseDataItem> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Show loading skeleton */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Message shown when data array is empty */
  emptyMessage?: string;
  /** Number of skeleton rows to show while loading */
  loadingRows?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when sort changes */
  onSortChange?: (sort: SortConfig | null) => void;
  /** Current sort configuration */
  currentSort?: SortConfig | null;
  /** Built-in edit handler - adds Edit action to menu */
  onEdit?: (item: T) => void | Promise<void>;
  /** Built-in delete handler - adds Delete action to menu */
  onDelete?: (item: T) => void | Promise<void>;
  /** Optional custom row actions (in addition to edit/delete) */
  actions?: DataTableAction<T>[];
  /** Enable context menu (right-click) for row actions (default: true when actions exist) */
  enableContextMenu?: boolean;
  /** Optional click handler for rows */
  onRowClick?: (item: T) => void;
  /** Optional double-click handler for rows */
  onRowDoubleClick?: (item: T) => void;
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  /** Controlled selected rows (set of row keys) */
  selectedRows?: Set<string>;
  /** Selection change callback */
  onRowSelect?: (selectedRows: string[]) => void;
  /** Function to extract unique key from row (defaults to row.id) */
  keyExtractor?: (row: T) => string;
  /** Enable row expansion (legacy - use expandedRowConfig instead) */
  expandable?: boolean;
  /** Controlled expanded rows (legacy - set of row keys) */
  expandedRows?: Set<string>;
  /** Render function for expanded row content (legacy - use expandedRowConfig instead) */
  renderExpandedRow?: (row: T) => React.ReactNode;
  /** NEW: Enhanced expansion configuration with multiple modes */
  expandedRowConfig?: ExpandedRowConfig<T>;
  /** Show the expand chevron column - hidden by default when using expandedRowConfig with double-click or menu */
  showExpandChevron?: boolean;

  // Visual customization props
  /** Enable zebra striping - true for default, 'odd' or 'even' for specific rows */
  striped?: boolean | "odd" | "even";
  /** Custom color for striped rows (Tailwind class like 'bg-primary-50' or 'bg-accent-50') */
  stripedColor?: string;
  /** Row density - affects padding and text size */
  density?: "compact" | "normal" | "comfortable";
  /** Custom class name for rows - static string or function returning class per row */
  rowClassName?: string | ((item: T, index: number) => string);
  /** Conditional row highlighting - returns color class (e.g., 'bg-warning-50') */
  rowHighlight?: (item: T) => string | undefined;
  /** ID of a single row to highlight */
  highlightedRowId?: string | number;
  /** Array of row IDs to temporarily highlight (flash animation) */
  highlightedRows?: (string | number)[];
  /** Duration in ms for temporary row highlight (default: 2000) */
  highlightDuration?: number;
  /** Enable cell borders */
  bordered?: boolean;
  /** Custom border color (Tailwind class like 'border-paper-200') */
  borderColor?: string;
  /** Disable hover effect on rows */
  disableHover?: boolean;
  /** Array of column keys to hide */
  hiddenColumns?: string[];
  /** Custom header class name */
  headerClassName?: string;
  /** Custom empty state render function */
  renderEmptyState?: () => React.ReactNode;
  /** Enable column resizing */
  resizable?: boolean;
  /** Callback when column widths change */
  onColumnResize?: (columnKey: string, width: number) => void;
  /** Enable column reordering */
  reorderable?: boolean;
  /** Callback when column order changes */
  onColumnReorder?: (newOrder: string[]) => void;
  /** Enable virtual scrolling for large datasets */
  virtualized?: boolean;
  /** Container height for virtual scrolling (default: '600px') */
  virtualHeight?: string;
  /** Row height for virtual scrolling (default: 60) */
  virtualRowHeight?: number;

  // Pagination props
  /** Enable built-in pagination (renders Pagination component above table) */
  paginated?: boolean;
  /** Current page number (1-indexed) */
  currentPage?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of items (for server-side pagination) */
  totalItems?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Available page size options (default: [10, 25, 50, 100]) */
  pageSizeOptions?: number[];
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Show page size selector (default: true when paginated) */
  showPageSizeSelector?: boolean;

  // Mobile view props
  /** Mobile view mode: 'auto' (detect viewport), 'card' (always cards), 'table' (always table) */
  mobileView?: "auto" | "card" | "table";
  /** Configuration for card view layout */
  cardConfig?: CardViewConfig<T>;
  /** Gap between cards in card view */
  cardGap?: "sm" | "md" | "lg";
  /** Custom class name for cards */
  cardClassName?: string;
}

/**
 * ActionMenu - Inline dropdown menu for row actions
 */
function ActionMenu<T>({
  actions,
  item,
}: {
  actions: DataTableAction<T>[];
  item: T;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Update position when menu opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224; // 224px = w-56 (14rem * 16px)

      let left = rect.right - menuWidth;
      let top = rect.bottom + 4; // 4px below button (mt-1)

      // Ensure menu doesn't go off-screen to the left
      if (left < 8) {
        left = 8;
      }

      // Ensure menu doesn't go off-screen to the right
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }

      // Ensure menu doesn't go off-screen vertically
      const estimatedMenuHeight = 150; // rough estimate
      if (top + estimatedMenuHeight > window.innerHeight) {
        top = rect.top - estimatedMenuHeight - 4;
      }

      setPosition({ top, left });
    }
  }, [isOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const visibleActions = actions.filter(
    (action) => !action.show || action.show(item),
  );

  if (visibleActions.length === 0) return null;

  const dropdownContent = isOpen && (
    <div
      ref={menuRef}
      className="fixed w-56 bg-white rounded-lg shadow-lg border border-paper-300 py-1"
      style={{
        zIndex: 999999,
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {visibleActions.map((action, idx) => {
        let iconElement: React.ReactNode = null;
        if (action.icon) {
          if (React.isValidElement(action.icon)) {
            iconElement = action.icon;
          } else {
            iconElement = React.createElement(action.icon as any, {
              className: "h-4 w-4 flex-shrink-0",
            });
          }
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              try {
                await action.onClick(item);
              } catch (error) {
                console.error("DataTable action error:", error);
              }
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              action.variant === "danger"
                ? "text-error-600 hover:bg-error-50 hover:text-error-700"
                : "text-ink-700 hover:bg-paper-50"
            }`}
            title={action.tooltip}
          >
            {iconElement}
            <span className="flex-1 text-left">{action.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-center w-7 h-7 text-ink-600 hover:text-ink-900 hover:bg-paper-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent-400"
        style={{ padding: 0 }}
        aria-label="Actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}

/**
 * Helper function to generate column styles from width configuration
 */
function getColumnStyle<T>(
  column: DataTableColumn<T>,
  dynamicWidth?: number,
): React.CSSProperties {
  const style: React.CSSProperties = {};

  // Use dynamic width if provided (from resizing)
  if (dynamicWidth !== undefined) {
    style.width = `${dynamicWidth}px`;
  } else if (column.width !== undefined) {
    style.width =
      typeof column.width === "number" ? `${column.width}px` : column.width;
  }

  if (column.minWidth !== undefined) {
    style.minWidth =
      typeof column.minWidth === "number"
        ? `${column.minWidth}px`
        : column.minWidth;
  }

  if (column.maxWidth !== undefined) {
    style.maxWidth =
      typeof column.maxWidth === "number"
        ? `${column.maxWidth}px`
        : column.maxWidth;
  }

  if (column.flex !== undefined) {
    style.flexGrow = column.flex;
    style.flexShrink = 1;
    style.flexBasis = 0;
  }

  if (column.align) {
    style.textAlign = column.align;
  }

  if (column.verticalAlign) {
    style.verticalAlign = column.verticalAlign;
  }

  return style;
}

/**
 * DataTable - Feature-rich data table component
 *
 * Features:
 * - Column sorting with visual indicators (3-state: asc → desc → none)
 * - Loading states (skeleton + overlay)
 * - Empty and error states
 * - Row actions with sticky column
 * - Row selection with checkboxes (individual + select all)
 * - Row expansion with custom content
 * - Click and double-click handlers
 * - Sticky header and action columns
 * - Fixed layout for stability
 * - Custom cell rendering
 * - Controlled or uncontrolled selection and expansion
 * - Column width configuration (width, minWidth, maxWidth, flex)
 *
 * @example
 * ```tsx
 * const columns: DataTableColumn<User>[] = [
 *   { key: 'name', header: 'Name', sortable: true, width: '200px', minWidth: '150px' },
 *   { key: 'email', header: 'Email', sortable: true, width: '250px' },
 *   { key: 'role', header: 'Role', width: '120px' },
 * ];
 *
 * const actions: DataTableAction<User>[] = [
 *   { label: 'Edit', icon: Edit, onClick: handleEdit },
 *   { label: 'Delete', icon: Trash, onClick: handleDelete, variant: 'danger' },
 * ];
 *
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   loading={loading}
 *   actions={actions}
 *   onSortChange={setSort}
 *   onRowDoubleClick={handleRowDoubleClick}
 *   selectable
 *   onRowSelect={handleSelection}
 *   expandable
 *   renderExpandedRow={(user) => <UserDetails user={user} />}
 * />
 * ```
 */
export default function DataTable<T extends BaseDataItem = BaseDataItem>({
  data,
  columns,
  loading = false,
  error = null,
  emptyMessage = "No data available",
  loadingRows = 5,
  className = "",
  onSortChange,
  currentSort = null,
  onEdit,
  onDelete,
  actions = [],
  enableContextMenu = true,
  onRowClick,
  onRowDoubleClick,
  selectable = false,
  selectedRows: externalSelectedRows,
  onRowSelect,
  keyExtractor,
  expandable = false,
  expandedRows: externalExpandedRows,
  renderExpandedRow,
  expandedRowConfig,
  showExpandChevron = false,
  // Visual customization props
  striped = false,
  stripedColor,
  density = "normal",
  rowClassName,
  rowHighlight,
  highlightedRowId,
  highlightedRows = [],
  highlightDuration = 2000,
  bordered = false,
  borderColor = "border-paper-200",
  disableHover = false,
  hiddenColumns = [],
  headerClassName = "",
  renderEmptyState: customRenderEmptyState,
  resizable = false,
  onColumnResize,
  reorderable = false,
  onColumnReorder,
  virtualized = false,
  virtualHeight = "600px",
  virtualRowHeight = 60,
  // Pagination props
  paginated = false,
  currentPage = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  showPageSizeSelector = true,
  // Mobile view props
  mobileView = "auto",
  cardConfig,
  cardGap = "md",
  cardClassName,
}: DataTableProps<T>) {
  // Mobile detection for auto mode
  const isMobileViewport = useIsMobile();
  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartWidth, setResizeStartWidth] = useState<number>(0);

  // Column reordering state
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Virtual scrolling state
  const [scrollTop, setScrollTop] = useState(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Row hover state (for coordinating primary + secondary row highlighting)
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);

  // Keyboard navigation state
  const [focusedCell, setFocusedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [announcement, setAnnouncement] = useState<string>("");
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  // Temporary row highlight state (for flash animation)
  const [flashingRows, setFlashingRows] = useState<Set<string>>(new Set());
  const flashTimeoutRef = useRef<number | null>(null);

  // Context menu state
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    item: T | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  // Filter columns based on hiddenColumns
  const baseVisibleColumns = columns.filter(
    (col) => !hiddenColumns.includes(String(col.key)),
  );

  // Initialize column order on mount or when columns change
  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(baseVisibleColumns.map((col) => String(col.key)));
    }
  }, [baseVisibleColumns, columnOrder.length]);

  // Handle temporary row highlighting (flash animation)
  useEffect(() => {
    if (highlightedRows.length > 0) {
      // Add new highlighted rows to flashing set
      const newFlashingRows = new Set(highlightedRows.map((id) => String(id)));
      setFlashingRows(newFlashingRows);

      // Clear any existing timeout
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
      }

      // Set timeout to clear the flash
      flashTimeoutRef.current = window.setTimeout(() => {
        setFlashingRows(new Set());
      }, highlightDuration);
    }

    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [highlightedRows, highlightDuration]);

  // Apply column order
  const visibleColumns =
    reorderable && columnOrder.length > 0
      ? columnOrder
          .map((key) =>
            baseVisibleColumns.find((col) => String(col.key) === key),
          )
          .filter((col): col is DataTableColumn<T> => col !== undefined)
      : baseVisibleColumns;

  // Density classes
  const densityClasses = {
    compact: {
      cell: "px-3 py-1",
      text: "text-xs",
      header: "px-3 py-2",
    },
    normal: {
      cell: "px-6 py-1.5",
      text: "text-sm",
      header: "px-6 py-3",
    },
    comfortable: {
      cell: "px-6 py-3",
      text: "text-base",
      header: "px-6 py-4",
    },
  };

  const currentDensity = densityClasses[density];

  // Key extractor function - defined early for use in other functions
  const getRowKey = keyExtractor || ((row: T) => String(row.id));

  // Calculate if there are any actions (for keyboard navigation column calculation)
  // This is computed early so it can be used in keyboard handlers
  const hasAnyActions = !!(
    onEdit ||
    onDelete ||
    actions.length > 0 ||
    expandedRowConfig?.edit ||
    expandedRowConfig?.details ||
    expandedRowConfig?.addRelated?.length ||
    expandedRowConfig?.manageRelated?.length
  );

  // Get row background class based on striping and highlighting
  const getRowBackgroundClass = (item: T, index: number): string => {
    const classes: string[] = [];
    const rowKey = getRowKey(item);

    // Check for temporary flash highlight (takes priority)
    if (flashingRows.has(rowKey)) {
      classes.push("animate-row-flash");
    }
    // Check for highlighted row
    else if (
      highlightedRowId !== undefined &&
      rowKey === String(highlightedRowId)
    ) {
      classes.push("bg-accent-100");
    }
    // Check for custom row highlight
    else if (rowHighlight) {
      const highlightClass = rowHighlight(item);
      if (highlightClass) {
        classes.push(highlightClass);
      }
    }
    // Check for striping
    else if (striped) {
      const isOdd = index % 2 === 0; // 0-indexed, so even index = odd row
      const shouldStripe =
        striped === true
          ? isOdd
          : striped === "odd"
            ? isOdd
            : striped === "even"
              ? !isOdd
              : false;

      if (shouldStripe) {
        classes.push(stripedColor || "bg-paper-50");
      }
    }

    // Add custom row class
    if (rowClassName) {
      if (typeof rowClassName === "string") {
        classes.push(rowClassName);
      } else {
        classes.push(rowClassName(item, index));
      }
    }

    return classes.join(" ");
  };
  // NEW: Expansion mode state management (for expandedRowConfig)
  const [expansionState, setExpansionState] = useState<ExpansionState | null>(
    null,
  );

  // Column resize handlers
  const handleResizeStart = (
    e: React.MouseEvent,
    columnKey: string,
    currentWidth: number,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  };

  // Column reorder handlers
  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggingColumn(columnKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", columnKey);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingColumn && draggingColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragEnd = () => {
    setDraggingColumn(null);
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetColumnKey) return;

    const newOrder = [...columnOrder];
    const dragIndex = newOrder.indexOf(draggingColumn);
    const dropIndex = newOrder.indexOf(targetColumnKey);

    // Remove from old position
    newOrder.splice(dragIndex, 1);
    // Insert at new position
    newOrder.splice(dropIndex, 0, draggingColumn);

    setColumnOrder(newOrder);
    onColumnReorder?.(newOrder);
    setDraggingColumn(null);
    setDragOverColumn(null);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + delta); // Min width 50px
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      if (resizingColumn && columnWidths[resizingColumn]) {
        onColumnResize?.(resizingColumn, columnWidths[resizingColumn]);
      }
      setResizingColumn(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    resizingColumn,
    resizeStartX,
    resizeStartWidth,
    columnWidths,
    onColumnResize,
  ]);

  // Build combined actions: built-in edit/delete + custom actions + expansion mode actions
  const builtInActions: DataTableAction<T>[] = [];

  // Legacy onEdit (still supported)
  if (onEdit) {
    builtInActions.push({
      label: "Edit",
      icon: Edit,
      onClick: onEdit,
      variant: "secondary",
      tooltip: "Edit item",
    });
  }

  // NEW: Edit mode from expandedRowConfig
  if (expandedRowConfig?.edit && !onEdit) {
    const editConfig = expandedRowConfig.edit;
    builtInActions.push({
      label: editConfig.menuLabel || "Edit",
      icon: editConfig.menuIcon || Edit,
      onClick: (item: T) => {
        const rowKey = getRowKey(item);
        handleExpansionWithMode(rowKey, "edit");
      },
      variant: "secondary",
      tooltip: "Edit inline",
    });
  }

  // NEW: View details mode from expandedRowConfig
  if (expandedRowConfig?.details) {
    const detailsConfig = expandedRowConfig.details;
    builtInActions.push({
      label: detailsConfig.menuLabel || "View Details",
      icon: detailsConfig.menuIcon,
      onClick: (item: T) => {
        const rowKey = getRowKey(item);
        handleExpansionWithMode(rowKey, "details");
      },
      variant: "ghost",
      tooltip: "View details",
    });
  }

  // NEW: Add related modes from expandedRowConfig
  if (expandedRowConfig?.addRelated) {
    expandedRowConfig.addRelated.forEach((config) => {
      if (config.showInMenu !== false) {
        builtInActions.push({
          label: config.label,
          icon: config.icon,
          onClick: (item: T) => {
            const rowKey = getRowKey(item);
            handleExpansionWithMode(rowKey, `addRelated-${config.key}`);
          },
          variant: "secondary",
          tooltip: config.label,
        });
      }
    });
  }

  // NEW: Manage related modes from expandedRowConfig
  if (expandedRowConfig?.manageRelated) {
    expandedRowConfig.manageRelated.forEach((config) => {
      if (config.showInMenu !== false) {
        builtInActions.push({
          label: config.label,
          icon: config.icon,
          onClick: (item: T) => {
            const rowKey = getRowKey(item);
            handleExpansionWithMode(rowKey, `manageRelated-${config.key}`);
          },
          variant: "ghost",
          tooltip: config.label,
        });
      }
    });
  }

  // Combine all actions: built-in first, then custom actions, then delete last
  // Delete is stored separately to ensure it's always last
  let deleteAction: DataTableAction<T> | null = null;
  if (onDelete) {
    deleteAction = {
      label: "Delete",
      icon: Trash,
      onClick: onDelete,
      variant: "danger",
      tooltip: "Delete item",
    };
  }

  // Build final actions array with consistent ordering:
  // 1. Edit (first - most common action)
  // 2. View Details
  // 3. Add Related actions
  // 4. Manage Related actions
  // 5. Custom actions (from actions prop)
  // 6. Delete (always last - destructive action)
  const allActions: DataTableAction<T>[] = [
    ...builtInActions,
    ...actions,
    ...(deleteAction ? [deleteAction] : []),
  ];

  // Convert actions to menu items for context menu
  const convertActionsToMenuItems = (item: T): MenuItem[] => {
    const visibleActions = allActions.filter(
      (action) => !action.show || action.show(item),
    );

    return visibleActions.map((action, idx) => {
      let iconElement: React.ReactNode = null;
      if (action.icon) {
        if (React.isValidElement(action.icon)) {
          iconElement = action.icon;
        } else {
          iconElement = React.createElement(action.icon as any, {
            className: "h-4 w-4",
          });
        }
      }

      return {
        id: `action-${idx}`,
        label: action.label,
        icon: iconElement,
        onClick: () => action.onClick(item),
        danger: action.variant === "danger",
      };
    });
  };

  // Selection state management
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(
    new Set(),
  );

  // Expansion state management
  const [internalExpandedRows, setInternalExpandedRows] = useState<Set<string>>(
    new Set(),
  );

  // Use external selection if provided, otherwise internal
  const selectedRowsSet =
    externalSelectedRows !== undefined
      ? externalSelectedRows
      : internalSelectedRows;
  const setSelectedRows = (newSet: Set<string>) => {
    if (externalSelectedRows !== undefined) {
      // Controlled component - notify parent
      onRowSelect?.(Array.from(newSet));
    } else {
      // Uncontrolled component - update internal state
      setInternalSelectedRows(newSet);
      onRowSelect?.(Array.from(newSet));
    }
  };

  // Handle row selection
  const handleRowSelect = (rowKey: string) => {
    const newSelected = new Set(selectedRowsSet);
    if (newSelected.has(rowKey)) {
      newSelected.delete(rowKey);
    } else {
      newSelected.add(rowKey);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRowsSet.size === data.length && data.length > 0) {
      setSelectedRows(new Set());
    } else {
      const allKeys = new Set(data.map(getRowKey));
      setSelectedRows(allKeys);
    }
  };

  // Use external expansion if provided, otherwise internal
  const expandedRowsSet =
    externalExpandedRows !== undefined
      ? externalExpandedRows
      : internalExpandedRows;
  const setExpandedRows = (newSet: Set<string>) => {
    if (externalExpandedRows !== undefined) {
      // Controlled component - parent manages state
      // Don't update internal state
    } else {
      // Uncontrolled component - update internal state
      setInternalExpandedRows(newSet);
    }
  };

  // Handle row expansion
  const handleRowExpand = (rowKey: string) => {
    const newExpanded = new Set(expandedRowsSet);
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey);
    } else {
      newExpanded.add(rowKey);
    }
    setExpandedRows(newExpanded);
  };

  // NEW: Handle expansion with mode (for expandedRowConfig)
  const handleExpansionWithMode = (rowKey: string, mode: ExpansionMode) => {
    // If same row and mode, collapse
    if (expansionState?.rowKey === rowKey && expansionState?.mode === mode) {
      setExpansionState(null);
    } else {
      // Expand with new mode (collapses any existing expansion)
      setExpansionState({ rowKey, mode });
    }
  };

  // NEW: Handle collapse
  const handleCollapseExpansion = () => {
    setExpansionState(null);
  };

  // Keyboard navigation handler
  const handleKeyboardNavigation = useCallback(
    (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
      if (!data.length) return;

      const totalRows = data.length;
      const totalCols = visibleColumns.length;

      // If no cell is focused, focus first data cell on first arrow key
      if (!focusedCell) {
        if (
          ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          e.preventDefault();
          setFocusedCell({ row: 0, col: 0 });
          const colHeader = visibleColumns[0]?.header || "first column";
          setAnnouncement(`Row 1, ${colHeader}`);
          return;
        }
        return;
      }

      const { row, col } = focusedCell;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (row < totalRows - 1) {
            const newRow = row + 1;
            setFocusedCell({ row: newRow, col });
            const rowItem = data[newRow];
            const colHeader = visibleColumns[col]?.header || "";
            const cellValue =
              rowItem[visibleColumns[col]?.key as keyof typeof rowItem];
            setAnnouncement(
              `Row ${newRow + 1}, ${colHeader}: ${cellValue || "empty"}`,
            );
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (row > 0) {
            const newRow = row - 1;
            setFocusedCell({ row: newRow, col });
            const rowItem = data[newRow];
            const colHeader = visibleColumns[col]?.header || "";
            const cellValue =
              rowItem[visibleColumns[col]?.key as keyof typeof rowItem];
            setAnnouncement(
              `Row ${newRow + 1}, ${colHeader}: ${cellValue || "empty"}`,
            );
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (col < totalCols - 1) {
            const newCol = col + 1;
            setFocusedCell({ row, col: newCol });
            const rowItem = data[row];
            const colHeader = visibleColumns[newCol]?.header || "";
            const cellValue =
              rowItem[visibleColumns[newCol]?.key as keyof typeof rowItem];
            setAnnouncement(`${colHeader}: ${cellValue || "empty"}`);
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (col > 0) {
            const newCol = col - 1;
            setFocusedCell({ row, col: newCol });
            const rowItem = data[row];
            const colHeader = visibleColumns[newCol]?.header || "";
            const cellValue =
              rowItem[visibleColumns[newCol]?.key as keyof typeof rowItem];
            setAnnouncement(`${colHeader}: ${cellValue || "empty"}`);
          }
          break;

        case "Home":
          e.preventDefault();
          if (e.ctrlKey) {
            // Ctrl+Home: Go to first cell
            setFocusedCell({ row: 0, col: 0 });
            setAnnouncement(
              `First cell, Row 1, ${visibleColumns[0]?.header || ""}`,
            );
          } else {
            // Home: Go to first cell in current row
            setFocusedCell({ row, col: 0 });
            const rowItem = data[row];
            const cellValue =
              rowItem[visibleColumns[0]?.key as keyof typeof rowItem];
            setAnnouncement(
              `${visibleColumns[0]?.header || ""}: ${cellValue || "empty"}`,
            );
          }
          break;

        case "End":
          e.preventDefault();
          if (e.ctrlKey) {
            // Ctrl+End: Go to last cell
            const lastRow = totalRows - 1;
            const lastCol = totalCols - 1;
            setFocusedCell({ row: lastRow, col: lastCol });
            setAnnouncement(
              `Last cell, Row ${lastRow + 1}, ${visibleColumns[lastCol]?.header || ""}`,
            );
          } else {
            // End: Go to last cell in current row
            const lastCol = totalCols - 1;
            setFocusedCell({ row, col: lastCol });
            const rowItem = data[row];
            const cellValue =
              rowItem[visibleColumns[lastCol]?.key as keyof typeof rowItem];
            setAnnouncement(
              `${visibleColumns[lastCol]?.header || ""}: ${cellValue || "empty"}`,
            );
          }
          break;

        case "Enter":
          e.preventDefault();
          {
            const rowItem = data[row];
            const rowKey = getRowKey(rowItem);

            // Priority: Edit mode > Details mode > Row double-click handler
            if (onEdit) {
              onEdit(rowItem);
              setAnnouncement("Opening edit mode");
            } else if (expandedRowConfig?.edit) {
              handleExpansionWithMode(rowKey, "edit");
              setAnnouncement("Opening inline edit");
            } else if (expandedRowConfig?.details) {
              handleExpansionWithMode(rowKey, "details");
              setAnnouncement("Opening details view");
            } else if (onRowDoubleClick) {
              onRowDoubleClick(rowItem);
              setAnnouncement("Activating row");
            } else if (onRowClick) {
              onRowClick(rowItem);
              setAnnouncement("Row selected");
            }
          }
          break;

        case " ":
          // Space: Toggle selection if selectable
          if (selectable) {
            e.preventDefault();
            const rowItem = data[row];
            const rowKey = getRowKey(rowItem);
            handleRowSelect(rowKey);
            const isNowSelected = !selectedRowsSet.has(rowKey);
            setAnnouncement(isNowSelected ? "Row selected" : "Row deselected");
          }
          break;

        case "Escape":
          e.preventDefault();
          setFocusedCell(null);
          setAnnouncement("Table navigation exited");
          // Return focus to table container
          tableBodyRef.current?.closest("table")?.focus();
          break;

        case "PageDown":
          e.preventDefault();
          {
            const jumpSize = 10;
            const newRow = Math.min(row + jumpSize, totalRows - 1);
            setFocusedCell({ row: newRow, col });
            const colHeader = visibleColumns[col]?.header || "";
            setAnnouncement(`Row ${newRow + 1} of ${totalRows}, ${colHeader}`);
          }
          break;

        case "PageUp":
          e.preventDefault();
          {
            const jumpSize = 10;
            const newRow = Math.max(row - jumpSize, 0);
            setFocusedCell({ row: newRow, col });
            const colHeader = visibleColumns[col]?.header || "";
            setAnnouncement(`Row ${newRow + 1} of ${totalRows}, ${colHeader}`);
          }
          break;
      }
    },
    [
      data,
      visibleColumns,
      focusedCell,
      selectable,
      expandedRowConfig,
      onEdit,
      onRowDoubleClick,
      onRowClick,
      getRowKey,
      handleExpansionWithMode,
      handleRowSelect,
      selectedRowsSet,
    ],
  );

  // Focus the appropriate cell when focusedCell changes
  useEffect(() => {
    if (focusedCell && tableBodyRef.current) {
      const { row, col } = focusedCell;
      const rows = tableBodyRef.current.querySelectorAll("tr[data-row-index]");
      const targetRow = rows[row] as HTMLTableRowElement | undefined;
      if (targetRow) {
        // Calculate actual column index including extra columns
        const hasSelectionCol = selectable;
        const hasExpandCol =
          (expandable || expandedRowConfig) && showExpandChevron;
        const hasActionsCol = hasAnyActions;
        const extraColsBefore =
          (hasSelectionCol ? 1 : 0) +
          (hasExpandCol ? 1 : 0) +
          (hasActionsCol ? 1 : 0);

        const cells = targetRow.querySelectorAll("td");
        const targetCell = cells[col + extraColsBefore] as
          | HTMLTableCellElement
          | undefined;
        if (targetCell) {
          targetCell.focus();
          // Scroll into view if needed
          targetCell.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }
    }
  }, [
    focusedCell,
    selectable,
    expandable,
    expandedRowConfig,
    showExpandChevron,
    hasAnyActions,
  ]);

  // Handle column header click for sorting
  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || !onSortChange) return;

    const columnKey = String(column.key);

    // If clicking the same column, toggle direction
    if (currentSort?.key === columnKey) {
      if (currentSort.direction === "asc") {
        onSortChange({
          key: columnKey,
          direction: "desc",
          label: column.header,
        });
      } else {
        // Remove sort on third click
        onSortChange(null);
      }
    } else {
      // New column - start with ascending
      onSortChange({ key: columnKey, direction: "asc", label: column.header });
    }
  };

  // Get sort icon SVG for column (matches reference ui-preview.html)
  const getSortIcon = (column: DataTableColumn<T>) => {
    if (!column.sortable) return null;

    const columnKey = String(column.key);
    const isActive = currentSort?.key === columnKey;
    const isAscending = currentSort?.direction === "asc";

    // Inactive state - show neutral up/down arrows
    if (!isActive) {
      return (
        <svg
          className="ml-2 w-4 h-4 text-ink-400 group-hover:text-ink-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    // Active ascending state - show up arrow highlighted
    if (isAscending) {
      return (
        <svg
          className="ml-2 w-4 h-4 text-accent-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
      );
    }

    // Active descending state - show down arrow highlighted
    return (
      <svg
        className="ml-2 w-4 h-4 text-accent-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 17l-4 4m0 0l-4-4m4 4V3"
        />
      </svg>
    );
  };

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <>
      {Array.from({ length: loadingRows }, (_, i) => (
        <tr
          key={`loading-${i}`}
          className={`animate-pulse table-row-stable ${bordered ? `border-b ${borderColor}` : ""}`}
        >
          {selectable && (
            <td
              className={`sticky left-0 bg-white ${currentDensity.cell} border-b ${borderColor} z-10 align-middle`}
            >
              <div className="h-4 w-4 bg-paper-200 rounded"></div>
            </td>
          )}
          {expandable && (
            <td
              className={`sticky left-0 bg-white px-2 ${currentDensity.cell} border-b ${borderColor} z-10`}
            >
              <div className="h-4 w-4 bg-paper-200 rounded"></div>
            </td>
          )}
          {allActions.length > 0 && (
            <td
              className={`sticky left-0 bg-white px-2 ${currentDensity.cell} border-b ${borderColor} z-10`}
            >
              <div className="h-8 w-8 bg-paper-200 rounded"></div>
            </td>
          )}
          {visibleColumns.map((column, colIndex) => {
            const columnKey = String(column.key);
            const dynamicWidth = columnWidths[columnKey];
            return (
              <td
                key={`loading-${i}-${colIndex}`}
                className={`${currentDensity.cell} whitespace-nowrap table-row-stable ${bordered ? `border ${borderColor}` : ""}`}
                style={getColumnStyle(column, dynamicWidth)}
              >
                <div className="h-4 bg-paper-200 rounded mb-1"></div>
                <div className="h-3 bg-paper-200 rounded w-3/4"></div>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );

  // Render empty state
  const renderEmptyStateContent = () => {
    if (customRenderEmptyState) {
      return (
        <tr>
          <td
            colSpan={
              visibleColumns.length +
              (allActions.length > 0 ? 1 : 0) +
              (selectable ? 1 : 0) +
              (expandable ? 1 : 0)
            }
          >
            {customRenderEmptyState()}
          </td>
        </tr>
      );
    }
    return (
      <tr>
        <td
          colSpan={
            visibleColumns.length +
            (allActions.length > 0 ? 1 : 0) +
            (selectable ? 1 : 0) +
            (expandable ? 1 : 0)
          }
          className={`${currentDensity.cell} py-8 text-center text-ink-500`}
        >
          {error || emptyMessage}
        </td>
      </tr>
    );
  };

  // Virtual scrolling calculations
  const getVisibleRange = () => {
    if (!virtualized) return { start: 0, end: data.length };

    const overscan = 5;
    const start = Math.max(
      0,
      Math.floor(scrollTop / virtualRowHeight) - overscan,
    );
    const visibleCount = Math.ceil(parseInt(virtualHeight) / virtualRowHeight);
    const end = Math.min(data.length, start + visibleCount + overscan * 2);

    return { start, end };
  };

  const { start: visibleStart, end: visibleEnd } = getVisibleRange();

  // Handle scroll for virtual scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (virtualized) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };

  // Render data rows
  const renderDataRows = () => {
    const rowsToRender = virtualized
      ? data.slice(visibleStart, visibleEnd)
      : data;

    return rowsToRender.map((item, idx) => {
      const index = virtualized ? visibleStart + idx : idx;
      const rowKey = getRowKey(item);
      const isSelected = selectedRowsSet.has(rowKey);
      const isExpanded = expandedRowsSet.has(rowKey);
      const rowBgClass = getRowBackgroundClass(item, index);
      const borderClass = bordered
        ? `border-b ${borderColor}`
        : !visibleColumns.some((col) => !!col.renderSecondary)
          ? `border-b ${borderColor}`
          : "";
      const hasSecondaryRow = visibleColumns.some(
        (col) => !!col.renderSecondary,
      );

      // Hover state for row pair (primary + secondary)
      const isHovered = hoveredRowKey === rowKey;
      const hoverClass = disableHover ? "" : isHovered ? "bg-paper-100" : "";

      // Check if this row is keyboard-focused
      const isKeyboardFocused = focusedCell?.row === index;

      return (
        <React.Fragment key={rowKey}>
          <tr
            data-row-index={index}
            className={`table-row-stable ${onRowDoubleClick || onRowClick || onEdit || expandedRowConfig?.edit || expandedRowConfig?.details || expandedRowConfig?.addRelated?.length || expandedRowConfig?.manageRelated?.length ? "cursor-pointer" : ""} ${isSelected ? "bg-accent-50 border-l-2 border-accent-500" : hoverClass || rowBgClass} ${borderClass} ${isKeyboardFocused ? "ring-2 ring-inset ring-accent-400" : ""}`}
            onMouseEnter={() => !disableHover && setHoveredRowKey(rowKey)}
            onMouseLeave={() => !disableHover && setHoveredRowKey(null)}
            onClick={() => onRowClick?.(item)}
            onContextMenu={(e) => {
              if (enableContextMenu && allActions.length > 0) {
                e.preventDefault();
                e.stopPropagation();

                const x = e.clientX;
                const y = e.clientY;

                setContextMenuState({
                  isOpen: true,
                  position: { x, y },
                  item,
                });
              }
            }}
            onDoubleClick={() => {
              // Priority 1: If there's an onEdit handler (legacy), trigger it
              if (onEdit) {
                onEdit(item);
              }
              // Priority 2: If there's an expandable edit mode, trigger it
              else if (expandedRowConfig?.edit) {
                handleExpansionWithMode(rowKey, "edit");
              }
              // Priority 3: If there's an expandable details mode, trigger it
              else if (expandedRowConfig?.details) {
                handleExpansionWithMode(rowKey, "details");
              }
              // Priority 4: If there's any addRelated mode, trigger the first one
              else if (
                expandedRowConfig?.addRelated &&
                expandedRowConfig.addRelated.length > 0
              ) {
                handleExpansionWithMode(
                  rowKey,
                  `addRelated-${expandedRowConfig.addRelated[0].key}`,
                );
              }
              // Priority 5: If there's any manageRelated mode, trigger the first one
              else if (
                expandedRowConfig?.manageRelated &&
                expandedRowConfig.manageRelated.length > 0
              ) {
                handleExpansionWithMode(
                  rowKey,
                  `manageRelated-${expandedRowConfig.manageRelated[0].key}`,
                );
              }
              // Priority 6: Legacy onRowDoubleClick handler
              else {
                onRowDoubleClick?.(item);
              }
            }}
            title={
              onEdit
                ? "Double-click to edit"
                : expandedRowConfig?.edit
                  ? "Double-click to edit inline"
                  : expandedRowConfig?.details
                    ? "Double-click to view details"
                    : expandedRowConfig?.addRelated &&
                        expandedRowConfig.addRelated.length > 0
                      ? `Double-click to ${expandedRowConfig.addRelated[0].label}`
                      : expandedRowConfig?.manageRelated &&
                          expandedRowConfig.manageRelated.length > 0
                        ? `Double-click to ${expandedRowConfig.manageRelated[0].label}`
                        : onRowDoubleClick
                          ? "Double-click for details"
                          : onRowClick
                            ? "Click to select"
                            : undefined
            }
          >
            {selectable && (
              <td
                className={`sticky left-0 z-10 ${bordered ? `border ${borderColor}` : ""}`}
                style={{
                  backgroundColor: "inherit",
                  verticalAlign: "middle",
                  padding: "0.375rem 0.75rem",
                  textAlign: "center",
                }}
                rowSpan={hasSecondaryRow ? 2 : 1}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRowSelect(rowKey)}
                  className="w-4 h-4 text-accent-600 border-paper-300 rounded focus:ring-accent-400"
                  aria-label={`Select row ${rowKey}`}
                />
              </td>
            )}
            {(expandable || expandedRowConfig) && showExpandChevron && (
              <td
                className={`sticky left-0 px-2 ${currentDensity.cell} z-10 ${bordered ? `border ${borderColor}` : ""}`}
                style={{ backgroundColor: "inherit", verticalAlign: "middle" }}
                rowSpan={hasSecondaryRow ? 2 : 1}
              >
                <button
                  onClick={() => {
                    // NEW: Enhanced logic for expandedRowConfig
                    if (
                      expandedRowConfig?.details &&
                      expandedRowConfig.details.triggerOnExpand !== false
                    ) {
                      // Trigger details mode if configured
                      handleExpansionWithMode(rowKey, "details");
                    } else if (
                      expandedRowConfig?.edit &&
                      expandedRowConfig.edit.triggerOnDoubleClick !== false
                    ) {
                      // Fallback to edit mode if no details but edit is available
                      handleExpansionWithMode(rowKey, "edit");
                    } else {
                      // Legacy: use handleRowExpand
                      handleRowExpand(rowKey);
                    }
                  }}
                  className="text-ink-500 hover:text-ink-900 transition-colors"
                  aria-label={
                    isExpanded || expansionState?.rowKey === rowKey
                      ? "Collapse row"
                      : "Expand row"
                  }
                >
                  {isExpanded || expansionState?.rowKey === rowKey ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </td>
            )}
            {allActions.length > 0 && (
              <td
                className="sticky left-0 whitespace-nowrap shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)] z-10"
                style={{
                  width: "28px",
                  padding: "0",
                  backgroundColor: "inherit",
                  verticalAlign: "middle",
                }}
                onClick={(e) => e.stopPropagation()}
                rowSpan={hasSecondaryRow ? 2 : 1}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                  }}
                >
                  <ActionMenu actions={allActions} item={item} />
                </div>
              </td>
            )}
            {visibleColumns.map((column, colIdx) => {
              const columnKey = String(column.key);
              const dynamicWidth = columnWidths[columnKey];
              const value =
                typeof column.key === "string"
                  ? item[column.key as keyof T]
                  : item[column.key];

              const primaryContent = column.render
                ? column.render(item, value)
                : String(value || "");

              // Tooltip: caller-provided > raw value stringified. Empty
              // strings get dropped so we don't render an empty title
              // attribute (which the browser would still show as a
              // 0-width tooltip box on hover).
              const primaryTooltipText = column.tooltip
                ? column.tooltip(item, value)
                : value !== null && value !== undefined && value !== ""
                  ? String(value)
                  : undefined;

              // Reduce left padding on first column when there are action buttons
              const isFirstColumn = colIdx === 0;
              const paddingClass =
                isFirstColumn && allActions.length > 0 ? "pl-3" : "";

              // Check if this cell is keyboard-focused
              const isCellFocused =
                focusedCell?.row === index && focusedCell?.col === colIdx;

              return (
                <td
                  key={`${item.id}-${columnKey}`}
                  className={`${currentDensity.cell} ${paddingClass} ${column.className || ""} ${bordered ? `border ${borderColor}` : ""} ${isCellFocused ? "outline outline-2 outline-accent-500 outline-offset-[-2px]" : ""}`}
                  style={getColumnStyle(column, dynamicWidth)}
                  tabIndex={isCellFocused ? 0 : -1}
                  role="gridcell"
                  aria-colindex={colIdx + 1}
                >
                  <div
                    className={`${currentDensity.text} leading-tight`}
                    title={primaryTooltipText}
                  >
                    {primaryContent}
                  </div>
                </td>
              );
            })}
          </tr>

          {/* Secondary row - only render if any column has renderSecondary */}
          {hasSecondaryRow && (
            <tr
              className={`secondary-row ${isSelected ? "bg-accent-50 border-l-2 border-accent-500" : hoverClass || rowBgClass} border-b ${borderColor}`}
              onMouseEnter={() => !disableHover && setHoveredRowKey(rowKey)}
              onMouseLeave={() => !disableHover && setHoveredRowKey(null)}
            >
              {/* Selectable checkbox uses rowspan from primary row, no cell needed here */}
              {/* Expand chevron uses rowspan from primary row, no cell needed here */}
              {/* Actions column uses rowspan from primary row, no cell needed here */}
              {visibleColumns.map((column, colIdx) => {
                const columnKey = String(column.key);
                const dynamicWidth = columnWidths[columnKey];
                const value =
                  typeof column.key === "string"
                    ? item[column.key as keyof T]
                    : item[column.key];
                const secondaryContent = column.renderSecondary
                  ? column.renderSecondary(item, value)
                  : null;

                // Tooltip on the secondary row prefixes the field label when
                // available so the otherwise-unlabeled second row stays
                // self-describing on hover. Caller can override entirely
                // via `secondaryTooltip`.
                const hasSecondaryValue =
                  value !== null && value !== undefined && value !== "";
                let secondaryTooltipText: string | undefined;
                if (column.secondaryTooltip) {
                  secondaryTooltipText = column.secondaryTooltip(item, value);
                } else if (hasSecondaryValue) {
                  secondaryTooltipText = column.secondaryHeader
                    ? `${column.secondaryHeader}: ${value}`
                    : String(value);
                } else if (column.secondaryHeader) {
                  secondaryTooltipText = column.secondaryHeader;
                }

                // Reduce left padding on first column when there are action buttons
                const isFirstColumn = colIdx === 0;
                const paddingClass =
                  isFirstColumn && allActions.length > 0 ? "pl-3" : "";

                return (
                  <td
                    key={`${item.id}-${columnKey}-secondary`}
                    className={`${currentDensity.cell} py-0.5 ${paddingClass} ${column.className || ""} ${bordered ? `border ${borderColor}` : ""}`}
                    style={getColumnStyle(column, dynamicWidth)}
                  >
                    <div
                      className="text-xs text-ink-500 leading-tight"
                      title={secondaryTooltipText}
                    >
                      {secondaryContent || <span className="invisible">—</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          )}

          {/* Expanded row content - Legacy mode */}
          {expandable && isExpanded && renderExpandedRow && (
            <tr>
              <td
                colSpan={
                  visibleColumns.length +
                  (selectable ? 1 : 0) +
                  ((expandable || expandedRowConfig) && showExpandChevron
                    ? 1
                    : 0) +
                  (allActions.length > 0 ? 1 : 0)
                }
                className={`${currentDensity.cell} py-4 bg-paper-50`}
              >
                {renderExpandedRow(item)}
              </td>
            </tr>
          )}

          {/* Expanded row content - NEW: Multiple expansion modes */}
          {expansionState &&
            expansionState.rowKey === rowKey &&
            expandedRowConfig &&
            (() => {
              const mode = expansionState.mode;
              let content: React.ReactNode = null;
              let bgColorClass = "bg-paper-50"; // Default

              // Edit mode
              if (mode === "edit" && expandedRowConfig.edit) {
                bgColorClass =
                  "bg-paper-100/80 border-t border-b border-paper-300/80";
                content = expandedRowConfig.edit.render(
                  item,
                  async (_updated: T) => {
                    // Handle save
                    handleCollapseExpansion();
                  },
                  () => {
                    // Handle cancel
                    handleCollapseExpansion();
                  },
                );
              }

              // Details mode
              else if (mode === "details" && expandedRowConfig.details) {
                bgColorClass =
                  "bg-primary-50/80 border-t border-b border-primary-200/80";
                content = expandedRowConfig.details.render(item);
              }

              // Add related modes
              else if (
                mode.startsWith("addRelated-") &&
                expandedRowConfig.addRelated
              ) {
                const key = mode.replace("addRelated-", "");
                const config = expandedRowConfig.addRelated.find(
                  (c) => c.key === key,
                );
                if (config) {
                  bgColorClass =
                    "bg-success-50/80 border-t border-b border-success-200/80";
                  content = config.render(
                    item,
                    async (_newItem: any) => {
                      // Handle save
                      handleCollapseExpansion();
                    },
                    () => {
                      // Handle cancel
                      handleCollapseExpansion();
                    },
                  );
                }
              }

              // Manage related modes
              else if (
                mode.startsWith("manageRelated-") &&
                expandedRowConfig.manageRelated
              ) {
                const key = mode.replace("manageRelated-", "");
                const config = expandedRowConfig.manageRelated.find(
                  (c) => c.key === key,
                );
                if (config) {
                  bgColorClass =
                    "bg-slate-50/80 border-t border-b border-slate-200/80";
                  const handleClose = () => setExpansionState(null);
                  content = config.render(item, handleClose);
                }
              }

              if (!content) return null;

              return (
                <tr key={`expanded-${rowKey}`}>
                  <td
                    colSpan={
                      visibleColumns.length +
                      (selectable ? 1 : 0) +
                      ((expandable || expandedRowConfig) && showExpandChevron
                        ? 1
                        : 0) +
                      (allActions.length > 0 ? 1 : 0)
                    }
                    className={`${currentDensity.cell} py-4 ${bgColorClass} animate-expand`}
                  >
                    {content}
                  </td>
                </tr>
              );
            })()}
        </React.Fragment>
      );
    });
  };

  const tableContent = (
    <div
      className={`bg-white rounded-lg shadow border-2 ${borderColor} ${virtualized ? "overflow-hidden" : "overflow-x-auto overflow-y-visible"} ${className}`}
      style={{ position: "relative" }}
    >
      {/* Loading overlay for when data is being refreshed */}
      {loading && data.length > 0 && (
        <div
          className="absolute inset-0 bg-white/75 flex items-center justify-center z-20"
          style={{ backdropFilter: "blur(2px)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="loading-spinner"
              style={{ width: "32px", height: "32px", borderWidth: "3px" }}
            ></div>
            <span className="text-sm font-medium text-ink-600">Loading...</span>
          </div>
        </div>
      )}

      <table
        className={`table-stable w-full ${bordered ? "border-collapse" : ""}`}
        role="grid"
        aria-label="Data table"
        aria-rowcount={data.length}
        aria-colcount={visibleColumns.length}
      >
        <colgroup>
          {selectable && <col className="w-12" />}
          {(expandable || expandedRowConfig) && showExpandChevron && (
            <col className="w-10" />
          )}
          {allActions.length > 0 && <col style={{ width: "28px" }} />}
          {visibleColumns.map((column, index) => {
            const columnKey = String(column.key);
            const dynamicWidth = columnWidths[columnKey];
            return (
              <col key={index} style={getColumnStyle(column, dynamicWidth)} />
            );
          })}
        </colgroup>
        <thead className={`bg-paper-100 sticky top-0 z-10 ${headerClassName}`}>
          <tr className="table-header-row">
            {selectable && (
              <th
                className={`sticky left-0 bg-paper-100 ${currentDensity.header} border-b ${borderColor} z-20 w-12 ${bordered ? `border ${borderColor}` : ""}`}
              >
                <input
                  type="checkbox"
                  checked={
                    selectedRowsSet.size === data.length && data.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-accent-600 border-paper-300 rounded focus:ring-accent-400"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {(expandable || expandedRowConfig) && showExpandChevron && (
              <th
                className={`sticky left-0 bg-paper-100 px-2 ${currentDensity.header} border-b ${borderColor} z-19 w-10 ${bordered ? `border ${borderColor}` : ""}`}
              >
                {/* Empty header for expand column */}
              </th>
            )}
            {allActions.length > 0 && (
              <th
                className={`sticky left-0 bg-paper-100 text-center text-xs font-medium text-ink-700 uppercase tracking-wider border-b ${borderColor} z-20 ${bordered ? `border ${borderColor}` : ""}`}
                style={{ width: "28px", padding: "0" }}
              >
                {/* Actions column header */}
              </th>
            )}
            {visibleColumns.map((column, colIdx) => {
              const columnKey = String(column.key);
              const dynamicWidth = columnWidths[columnKey];
              const thRef = useRef<HTMLTableCellElement>(null);
              const isDragging = draggingColumn === columnKey;
              const isDragOver = dragOverColumn === columnKey;

              // Reduce left padding on first column when there are action buttons (match body cells)
              const isFirstColumn = colIdx === 0;
              const headerPaddingClass =
                isFirstColumn && allActions.length > 0 ? "pl-3" : "";

              return (
                <th
                  key={columnKey}
                  ref={thRef}
                  draggable={reorderable}
                  onDragStart={(e) =>
                    reorderable && handleDragStart(e, columnKey)
                  }
                  onDragOver={(e) =>
                    reorderable && handleDragOver(e, columnKey)
                  }
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => reorderable && handleDrop(e, columnKey)}
                  className={`
                    ${currentDensity.header} ${headerPaddingClass} text-left border-b ${borderColor} ${bordered ? `border ${borderColor}` : ""} relative
                    ${reorderable ? "cursor-move" : ""}
                    ${isDragging ? "opacity-50" : ""}
                    ${isDragOver ? "bg-accent-100" : ""}
                  `}
                  style={getColumnStyle(column, dynamicWidth)}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column)}
                      className="group inline-flex items-center text-xs font-medium text-ink-500 uppercase tracking-wider hover:text-ink-900 transition-colors"
                    >
                      <span>{column.header}</span>
                      {getSortIcon(column)}
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">
                      {column.header}
                    </span>
                  )}
                  {resizable && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent-400 group"
                      onMouseDown={(e) => {
                        const currentWidth = thRef.current?.offsetWidth || 100;
                        handleResizeStart(e, columnKey, currentWidth);
                      }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-paper-300 group-hover:bg-accent-400 transition-colors" />
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody
          ref={tableBodyRef}
          className="bg-white table-loading transition-opacity duration-200"
          onKeyDown={handleKeyboardNavigation}
          tabIndex={0}
          role="rowgroup"
          aria-label="Table data"
        >
          {loading && data.length === 0
            ? renderLoadingSkeleton()
            : data.length === 0
              ? renderEmptyStateContent()
              : renderDataRows()}
        </tbody>
      </table>
    </div>
  );

  // Wrap in scrollable container if virtualized
  const finalContent = virtualized ? (
    <div
      ref={tableContainerRef}
      onScroll={handleScroll}
      style={{ height: virtualHeight, overflow: "auto" }}
      className="rounded-lg"
    >
      {tableContent}
    </div>
  ) : (
    tableContent
  );

  // Calculate pagination values
  const effectiveTotalItems = totalItems ?? data.length;
  const totalPages = Math.ceil(effectiveTotalItems / pageSize);

  // Page size selector options
  const pageSizeSelectOptions = pageSizeOptions.map((size) => ({
    value: String(size),
    label: `${size} per page`,
  }));

  // Render pagination controls
  const renderPaginationControls = () => {
    if (!paginated) return null;

    return (
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-4">
          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-600">Show:</span>
              <Select
                options={pageSizeSelectOptions}
                value={String(pageSize)}
                onChange={(value) => onPageSizeChange?.(Number(value))}
              />
            </div>
          )}
          <span className="text-sm text-ink-600">
            {effectiveTotalItems > 0 ? (
              <>
                Showing {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, effectiveTotalItems)} of{" "}
                {effectiveTotalItems}
              </>
            ) : (
              "No items"
            )}
          </span>
        </div>
        {totalPages > 1 && onPageChange && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    );
  };

  // Determine if we should show card view
  const shouldShowCardView =
    mobileView === "card" || (mobileView === "auto" && isMobileViewport);

  // Card view content
  const cardViewContent = shouldShowCardView ? (
    <DataTableCardView
      data={data}
      columns={visibleColumns}
      cardConfig={cardConfig}
      loading={loading}
      loadingRows={loadingRows}
      emptyMessage={emptyMessage}
      onCardClick={onRowClick}
      onCardLongPress={(item, event) => {
        if (enableContextMenu && allActions.length > 0) {
          event.preventDefault();
          const clientX =
            "touches" in event
              ? event.touches[0].clientX
              : (event as React.MouseEvent).clientX;
          const clientY =
            "touches" in event
              ? event.touches[0].clientY
              : (event as React.MouseEvent).clientY;
          setContextMenuState({
            isOpen: true,
            position: { x: clientX, y: clientY },
            item,
          });
        }
      }}
      selectable={selectable}
      selectedRows={selectedRowsSet}
      onSelectionChange={onRowSelect ? (rows) => onRowSelect(rows) : undefined}
      keyExtractor={getRowKey}
      actions={allActions}
      onEdit={onEdit}
      onDelete={onDelete}
      className={className}
      cardClassName={cardClassName}
      gap={cardGap}
    />
  ) : null;

  // Render with context menu
  return (
    <>
      {/* Screen reader announcement region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      {renderPaginationControls()}
      {shouldShowCardView ? cardViewContent : finalContent}
      {contextMenuState.isOpen && contextMenuState.item && (
        <Menu
          items={convertActionsToMenuItems(contextMenuState.item)}
          position={contextMenuState.position}
          onClose={() =>
            setContextMenuState({
              isOpen: false,
              position: { x: 0, y: 0 },
              item: null,
            })
          }
        />
      )}
    </>
  );
}
