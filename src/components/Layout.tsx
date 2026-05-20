// Layout Component - Complete app layout with sidebar, gutter, and content
// This enforces the notebook-style page and gutter layout pattern

import React from "react";
import { PageNavigation } from "./PageNavigation";

export interface Section {
  /** Unique identifier for the section */
  id: string;
  /** Display label for the section in navigation */
  label: string;
}

export interface LayoutProps {
  /** Sidebar content - typically the Sidebar component with navigation items */
  sidebar: React.ReactNode;
  /** Main page content - wrap in Page or PageLayout components for notebook styling */
  children: React.ReactNode;
  /** Optional status bar component displayed at the bottom of the layout */
  statusBar?: React.ReactNode;
  /** Additional CSS classes to apply to the layout container */
  className?: string;
  /** Page sections for navigation dots in the gutter (auto-detected from section IDs in content) */
  sections?: Section[];
}

/**
 * Layout - Complete application layout with sidebar, gutter, and scrollable content
 *
 * The top-level layout component that creates the classic notebook application structure:
 * - **Sidebar** - Fixed 256px wide navigation sidebar with notebook binding effect
 * - **Gutter** - 32px space between sidebar and content, contains page navigation dots
 * - **Content area** - Flexible, independently scrollable main content region
 * - **Status bar** - Optional fixed bar at the bottom for status information
 *
 * The gutter contains PageNavigation dots that automatically track scroll position when sections
 * are provided. This creates the table-of-contents navigation experience.
 *
 * @example Basic usage with sidebar and content
 * ```tsx
 * <Layout
 *   sidebar={
 *     <Sidebar
 *       items={[
 *         { id: 'home', label: 'Home', icon: <Home />, href: '/' },
 *         { id: 'settings', label: 'Settings', icon: <Settings />, href: '/settings' }
 *       ]}
 *       currentPath="/"
 *     />
 *   }
 *   statusBar={<StatusBar />}
 * >
 *   <Page>
 *     <h1>Dashboard</h1>
 *     <Card>Your content</Card>
 *   </Page>
 * </Layout>
 * ```
 *
 * @example With page sections for navigation dots
 * ```tsx
 * <Layout
 *   sidebar={<Sidebar items={items} />}
 *   sections={[
 *     { id: 'overview', label: 'Overview' },
 *     { id: 'stats', label: 'Statistics' },
 *     { id: 'settings', label: 'Settings' }
 *   ]}
 * >
 *   <Page>
 *     <section id="overview">...</section>
 *     <section id="stats">...</section>
 *     <section id="settings">...</section>
 *   </Page>
 * </Layout>
 * ```
 */
export const Layout: React.FC<LayoutProps> = ({
  sidebar,
  children,
  statusBar,
  className = "",
  sections,
}) => {
  return (
    <div className={`h-screen flex flex-col bg-paper-100 ${className}`}>
      {/* Main layout - sidebar, gutter, and content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - fixed width, no shrink */}
        {sidebar}

        {/* Gutter area - between sidebar and content with page navigation */}
        <div className="w-8 h-full bg-paper-100 flex-shrink-0 relative z-10 flex items-start justify-center pt-32">
          <PageNavigation sections={sections} />
        </div>

        {/* Main content area - scrollable */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>

      {/* Status Bar - at bottom (optional) */}
      {statusBar}
    </div>
  );
};

export default Layout;
