# @papernote/ui

[![npm version](https://img.shields.io/npm/v/@papernote/ui.svg)](https://www.npmjs.com/package/@papernote/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Storybook](https://img.shields.io/badge/Storybook-8.0-ff4785)](https://storybook.js.org/)

A modern React component library with a paper notebook aesthetic - minimal, professional, and expressive. Built with TypeScript, Tailwind CSS, and designed for production use.

Built and maintained by [Applied Accountability Services](https://appliedaccountability.com).

## 📖 Documentation

**[📚 View Full Documentation →](https://kwhittenberger.github.io/papernote-ui/)**

- **[🚀 Getting Started](https://kwhittenberger.github.io/papernote-ui/getting-started)** - Installation and setup guide
- **[📦 Components](https://kwhittenberger.github.io/papernote-ui/components/)** - Browse all 115+ components
- **[🎨 Design System](https://kwhittenberger.github.io/papernote-ui/design-system)** - Colors, typography, and design tokens
- **[🧪 Testing Guide](https://kwhittenberger.github.io/papernote-ui/development/testing-guide)** - Writing tests for components
- **[🤝 Contributing](https://kwhittenberger.github.io/papernote-ui/development/contributing)** - How to contribute

> **Quick Links:** **[🎨 Storybook](https://main--691fcf89b3393605ea470e93.chromatic.com/)** • **[📦 npm](https://www.npmjs.com/package/@papernote/ui)**

## ✨ Features

- 🎨 **Paper Notebook Aesthetic** - Subtle grain textures, muted warm colors, inspired by quality paper notebooks
- ⚡ **115+ Components** - Comprehensive set of production-ready React components
- 📚 **45+ Storybook Stories** - Extensive documentation with 500+ interactive examples
- 🎯 **TypeScript First** - Full TypeScript support with comprehensive type definitions
- 🎨 **Tailwind CSS v3** - Built on Tailwind with custom design tokens
- ♿ **Accessible** - WCAG AA compliant with ARIA attributes and keyboard navigation
- 🚀 **Tree-shakeable** - Import only what you need
- 📱 **Responsive** - Mobile-first design with responsive utilities
- 🔧 **Virtual Scrolling** - High-performance rendering for large datasets (DataTable)
- 🎯 **forwardRef Support** - All form components support ref forwarding

## 📦 Installation

```bash
npm install @papernote/ui
# or
yarn add @papernote/ui
# or
pnpm add @papernote/ui
```

### Peer Dependencies

```bash
npm install react react-dom react-router-dom lucide-react tailwindcss
```

## 🚀 Quick Start

### 1. Import Styles

In your main entry file (e.g., `src/main.tsx`):

```tsx
import '@papernote/ui/styles';
```

### 2. Configure Tailwind

In your `tailwind.config.js`:

```javascript
import notebookConfig from '@papernote/ui/tailwind-config';

export default {
  ...notebookConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@papernote/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

### 3. Use Components

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@papernote/ui';

function App() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to @papernote/ui</CardTitle>
      </CardHeader>
      <CardContent>
        <p>A beautiful component library with paper notebook aesthetic</p>
        <Button variant="primary">Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## 🧩 Component Categories

### Form Components (15+)
- **Button** - Primary, secondary, ghost, danger, outline variants with loading states
- **Input** - Text input with prefix/suffix icons, clearable, validation states
- **Select** - Searchable dropdown with clearable option
- **MultiSelect** - Multiple selection dropdown
- **Textarea** - Auto-expanding text area with resize control
- **Checkbox** - Checkbox with icon support
- **Radio** - Radio buttons with icon support
- **Switch** - Toggle switch with loading state
- **Slider** - Range input with value display
- **DatePicker** - Calendar date picker with events and range mode
- **TimePicker** - Time selection input
- **ColorPicker** - Color selector with presets
- **FileUpload** - Drag-and-drop file upload
- **PasswordInput** - Password field with show/hide toggle
- **NumberInput** - Numeric input with step controls

### Layout Components (12+)
- **Card** - Container with Header, Title, Content, Footer sections
- **Stack** - Vertical/horizontal flex layout
- **Grid** - Responsive grid system with GridItem
- **Box** - Generic container with spacing utilities
- **Text** - Typography component with size variants
- **Page** - Notebook-style page background with ruled lines
- **PageLayout** - Standard page layout with title and description
- **Layout** - Complete app layout with sidebar and gutter navigation
- **AppLayout** - Layout with expandable toolbar and status bar
- **Dashboard** - Dashboard container with DashboardHeader and DashboardContent
- **TwoColumnContent** - 1/3 sidebar + 2/3 main content layout
- **Separator** - Horizontal/vertical divider

### Navigation Components (10+)
- **Sidebar** - Collapsible navigation sidebar with nested items
- **Breadcrumbs** - Path navigation with custom separators
- **Pagination** - Page navigation with size options
- **Tabs** - Tab navigation (underline and pill variants, vertical/horizontal)
- **StepIndicator** - Progress stepper
- **TreeView** - Hierarchical tree navigation with expand/collapse
- **CommandPalette** - Keyboard-driven command launcher (Cmd+K style)
- **PageNavigation** - Scrollspy navigation dots for page sections
- **Dropdown** - Action menu with icons and dividers
- **Menu** - Context menu component

### Data Display Components (10+)
- **DataTable** - Feature-rich table with sorting, filtering, selection, row actions, expansion, virtual scrolling
- **Table** - Basic table component
- **Badge** - Status indicators with dot variant
- **StatusBadge** - Status badges with color variants
- **Avatar** - User avatars with fallback initials
- **Timeline** - Vertical/horizontal event timeline
- **KanbanBoard** - Drag-and-drop kanban board
- **Calendar** - Full calendar with event markers
- **CurrencyDisplay** - Formatted currency display
- **DateDisplay** - Formatted date display
- **StatCard** - Statistics card with trends

### Feedback Components (8+)
- **Toast** - Notification system (success, error, warning, info) with position control
- **Alert** - Notification banners with action buttons
- **Modal** - Dialog with multiple sizes and animation variants
- **Drawer** - Side-sliding panel (left, right, top, bottom)
- **Tooltip** - Hover tooltips with positioning
- **EmptyState** - No data/empty states
- **Loading** - Spinners, dots, pulse loaders
- **Skeleton** - Loading placeholders (SkeletonCard, SkeletonTable)
- **LoadingOverlay** - Full-screen loading overlay
- **ConfirmDialog** - Confirmation dialogs

### Advanced Components (15+)
- **Accordion** - Collapsible panels with custom icons
- **Transfer** - Dual-list item transfer with search
- **Carousel** - Image/content carousel with auto-play
- **Stepper** - Multi-step wizard (horizontal/vertical)
- **Rating** - Star rating input with half-star support
- **Progress** - Linear and circular progress indicators
- **Popover** - Rich content popovers with positioning
- **ButtonGroup** - Toggle button groups (single/multiple selection)
- **Autocomplete** - Auto-suggest input
- **Combobox** - Searchable select with custom options
- **DateRangePicker** - Date range selection
- **RichTextEditor** - WYSIWYG editor
- **MarkdownEditor** - Markdown editing
- **InfiniteScroll** - Infinite scroll loading
- **ContextMenu** - Right-click context menus

### Utility Components (5+)
- **Show/Hide** - Responsive visibility utilities
- **ErrorBoundary** - Error boundary wrapper
- **ThemeToggle** - Dark/light mode toggle
- **QueryTransparency** - SQL query explanation
- **NotificationIndicator** - Badge notification dots

## 🎨 Design System

### Color Palette

The library uses a muted, warm color palette inspired by paper and ink:

```javascript
{
  paper: {
    50: '#fafaf9',   // Off-white background
    100: '#f5f5f4',  // Light gray
    200: '#e7e5e4',  // Border gray
    300: '#d6d3d1',  // Subtle border
  },
  ink: {
    600: '#57534e',  // Body text
    700: '#44403c',  // Headings
    900: '#1c1917',  // High contrast
  },
  accent: '#8b8878',    // Warm gray accents
  primary: '#64748b',   // Slate blue
  success: '#10b981',   // Muted emerald
  warning: '#f59e0b',   // Soft amber
  error: '#ef4444',     // Muted red
}
```

### Typography

- **Font Family**: System font stack (ui-sans-serif, system-ui, sans-serif)
- **Font Sizes**: 12px (xs) to 48px (4xl)
- **Line Heights**: 1.5 (body), 1.2 (headings)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Shadows & Effects

- Subtle paper-like box shadows
- SVG noise texture for paper grain
- Smooth transitions (150ms-300ms)
- Border radius: 0.375rem (6px) standard

## 📚 Component Examples

### Button with Loading State

```tsx
import { Button } from '@papernote/ui';
import { Save } from 'lucide-react';

<Button 
  variant="primary" 
  size="md" 
  loading={isSaving}
  icon={<Save />}
  onClick={handleSave}
>
  Save Changes
</Button>
```

### Toast Notifications

```tsx
import { addSuccessMessage, addErrorMessage, ToastContainer } from '@papernote/ui';

function App() {
  const handleSuccess = () => {
    addSuccessMessage('Changes saved successfully!');
  };

  const handleError = () => {
    addErrorMessage('Failed to save changes', 'Please try again');
  };

  return (
    <>
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button onClick={handleError}>Show Error</Button>
      <ToastContainer position="top-right" />
    </>
  );
}
```

### DataTable with Advanced Features

```tsx
import { DataTable } from '@papernote/ui';
import { Edit, Trash } from 'lucide-react';

const columns = [
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'email', header: 'Email', sortable: true },
  { 
    key: 'status', 
    header: 'Status',
    render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'default'}>{row.status}</Badge>
  },
];

const actions = [
  { 
    label: 'Edit', 
    icon: <Edit className="h-4 w-4" />, 
    onClick: (row) => handleEdit(row) 
  },
  { 
    label: 'Delete', 
    icon: <Trash className="h-4 w-4" />, 
    onClick: (row) => handleDelete(row), 
    variant: 'danger' as const 
  },
];

<DataTable
  data={users}
  columns={columns}
  actions={actions}
  loading={loading}
  selectable
  onRowSelect={(selectedRows) => console.log(selectedRows)}
  expandable
  renderExpandedRow={(row) => <UserDetails user={row} />}
  virtualized // Enable for 10,000+ rows
  virtualHeight="600px"
/>
```

### Form with Validation

```tsx
import { Input, Textarea, Select, Button, Card } from '@papernote/ui';
import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    message: ''
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Select
            label="Category"
            options={[
              { value: 'general', label: 'General Inquiry' },
              { value: 'support', label: 'Support' },
              { value: 'feedback', label: 'Feedback' }
            ]}
            value={formData.category}
            onChange={setFormData({ ...formData, category: value })}
          />
          <Textarea
            label="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
          />
          <Button variant="primary" type="submit">
            Send Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Layout with Sidebar

```tsx
import { Layout, Sidebar, Page, StatusBar } from '@papernote/ui';
import { Home, Users, Settings } from 'lucide-react';

const menuItems = [
  { id: 'home', label: 'Home', icon: <Home />, href: '/' },
  { id: 'users', label: 'Users', icon: <Users />, href: '/users' },
  { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' },
];

function App() {
  return (
    <Layout
      sidebar={<Sidebar items={menuItems} />}
      statusBar={<StatusBar />}
    >
      <Page>
        {/* Your page content */}
      </Page>
    </Layout>
  );
}
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Build Storybook
npm run build-storybook

# Type check
npm run typecheck

# Lint
npm run lint
```

## 📖 Documentation

- **[Storybook Live Demo](https://main--691fcf89b3393605ea470e93.chromatic.com/)** - Interactive component playground with 500+ examples
- **[npm Package](https://www.npmjs.com/package/@papernote/ui)** - Package registry
- **[GitHub Repository](https://github.com/kwhittenberger/papernote-ui)** - Source code

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - Copyright (c) 2025 kwhittenberger

See [LICENSE](./LICENSE) for full details.

## 🙏 Credits

Inspired by the minimal, professional aesthetic of quality paper notebooks and Claude's interface design.

## 🔗 Links

- [npm Package](https://www.npmjs.com/package/@papernote/ui)
- [Live Storybook](https://main--691fcf89b3393605ea470e93.chromatic.com/)
- [GitHub Repository](https://github.com/kwhittenberger/papernote-ui)
- [Report Issues](https://github.com/kwhittenberger/papernote-ui/issues)
