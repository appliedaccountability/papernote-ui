// Page Navigation Dots Component for notebook-style applications
// Auto-detects sections in the page and provides navigation dots in the gutter
// Can also accept external sections (e.g., from iframe PostMessage)

import React, { useEffect, useState } from "react";

interface Section {
  id: string;
  label: string;
}

export interface PageNavigationProps {
  className?: string;
  /** External sections to display (overrides auto-detection) */
  sections?: Section[];
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  className = "",
  sections: externalSections,
}) => {
  const [detectedSections, setDetectedSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  // Use external sections if provided, otherwise use detected sections
  const sections =
    externalSections && externalSections.length > 0
      ? externalSections
      : detectedSections;

  useEffect(() => {
    // Skip auto-detection if external sections prop is provided (even if empty array)
    // This allows parent to explicitly control whether to show PageNavigation
    if (externalSections !== undefined) {
      return;
    }

    // Auto-detect sections with IDs in the page
    const detectSections = () => {
      const elements = document.querySelectorAll(
        '[id^="section-"], [data-section]',
      );
      const detected: Section[] = [];

      elements.forEach((el) => {
        const id = el.id || el.getAttribute("data-section") || "";
        const label =
          el.getAttribute("aria-label") || el.getAttribute("data-label") || id;
        if (id) {
          detected.push({ id, label });
        }
      });

      setDetectedSections(detected);
      if (detected.length > 0) {
        setActiveSection(detected[0].id);
      }
    };

    detectSections();
    // Re-detect on DOM mutations
    const observer = new MutationObserver(detectSections);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [externalSections]);

  useEffect(() => {
    // Skip scroll spy for external sections (from iframe) since we can't detect scroll in iframe
    if (externalSections && externalSections.length > 0) {
      // Set first section as active by default
      if (externalSections.length > 0) {
        setActiveSection(externalSections[0].id);
      }
      return undefined;
    }

    // Scroll spy - listen to the correct scroll container
    const findScrollContainer = () => {
      const container = document.querySelector(".flex-1.overflow-auto");
      return (container as HTMLElement) || null;
    };

    const handleScroll = () => {
      const scrollContainer = findScrollContainer();
      if (!scrollContainer) return;

      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;
      const containerTop = scrollContainer.getBoundingClientRect().top;

      // Check if we're near the bottom (within 100px)
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      if (isNearBottom && sections.length > 0) {
        setActiveSection(sections[sections.length - 1].id);
        return;
      }

      for (const section of sections) {
        const element =
          document.getElementById(section.id) ||
          document.querySelector(`[data-section="${section.id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top - containerTop;
          const elementBottom = elementTop + rect.height;

          // Check if section is in view (with some offset for better UX)
          if (elementTop <= 200 && elementBottom > 200) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    const scrollContainer = findScrollContainer();
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      // Run once on mount to set initial active section
      handleScroll();
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }

    return undefined;
  }, [sections]);

  const scrollToSection = (id: string) => {
    // For external sections (from iframe), we can't scroll directly
    // Instead, we could send a message back to the iframe
    if (externalSections && externalSections.length > 0) {
      // Find the iframe
      const iframe = document.querySelector(
        'iframe[title="Conductor Admin"]',
      ) as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        // Send scroll request to iframe
        iframe.contentWindow.postMessage(
          {
            type: "SCROLL_TO_SECTION",
            sectionId: id,
          },
          "*",
        );
      }
      setActiveSection(id);
      return;
    }

    // For local sections, scroll normally
    const element =
      document.getElementById(id) ||
      document.querySelector(`[data-section="${id}"]`);
    if (element) {
      // Find the scrollable container
      const scrollContainer = document.querySelector(
        ".flex-1.overflow-auto",
      ) as HTMLElement;
      if (scrollContainer) {
        // Scroll within the container
        const elementTop = element.offsetTop - scrollContainer.offsetTop;
        scrollContainer.scrollTo({ top: elementTop - 100, behavior: "smooth" });
      } else {
        // Fallback to window scroll
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setActiveSection(id);
    }
  };

  if (sections.length === 0) return null;

  return (
    <nav className={className} aria-label="Page sections">
      <div className="flex flex-col gap-2 items-center">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`page-nav-dot ${activeSection === section.id ? "active" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={section.label}
            title={section.label}
            onClick={() => scrollToSection(section.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToSection(section.id);
              }
            }}
          />
        ))}
      </div>
    </nav>
  );
};

export default PageNavigation;
