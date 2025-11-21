// ============================================
// UI UTILITIES CLASS (FIXED VERSION)
// File: @/utils/ui-utils.ts
// ============================================

import { Check, X, Circle, AlertCircle, LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

// Type definitions for better TypeScript support
interface StatusDisplayOptions {
  showText?: boolean;
  showIcon?: boolean;
  size?: number;
}

interface StatusDisplayConfig {
  text: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  color: string;
  bgColor: string;
  iconColor: string;
}

interface StatusDisplayResult {
  text: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  color: string;
  bgColor: string;
  iconColor: string;
  display: JSX.Element;
}

interface CustomStatusConfig {
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  color: string;
  text: string;
  bgColor: string;
  iconColor?: string; // Make iconColor optional for custom mappings
}

export class UiUtils {
  /**
   * Get status display configuration for active/inactive states
   */
  static getStatusDisplay(
    isActive: boolean,
    options?: StatusDisplayOptions
  ): StatusDisplayResult {
    const { showText = true, showIcon = true, size = 16 } = options || {};

    const statusConfig: StatusDisplayConfig = isActive
      ? {
          text: "Active",
          icon: Check,
          color: "text-green-600",
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
        }
      : {
          text: "Inactive",
          icon: X,
          color: "text-red-600",
          bgColor: "bg-red-100",
          iconColor: "text-red-600",
        };

    const display = (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig.bgColor}`}
      >
        {showIcon && (
          <statusConfig.icon size={size} className={statusConfig.iconColor} />
        )}
        {showText && (
          <span className={`text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.text}
          </span>
        )}
      </div>
    );

    return {
      ...statusConfig,
      display,
    };
  }

  /**
   * Simple method to render status badge (most commonly used)
   */
  static renderStatusBadge(status: boolean | string | number): JSX.Element {
    const isActive = this.parseBoolean(status);
    const statusDisplay = this.getStatusDisplay(isActive, {
      showText: true,
      showIcon: true,
    });
    return statusDisplay.display;
  }

  /**
   * Simple method to render status icon only
   */
  static renderStatusIcon(status: boolean | string | number): JSX.Element {
    const isActive = this.parseBoolean(status);
    const statusDisplay = this.getStatusDisplay(isActive, {
      showText: false,
      showIcon: true,
    });
    return statusDisplay.display;
  }

  /**
   * Simple method to render status text only
   */
  static renderStatusText(status: boolean | string | number): JSX.Element {
    const isActive = this.parseBoolean(status);
    const statusDisplay = this.getStatusDisplay(isActive, {
      showText: true,
      showIcon: false,
    });
    return statusDisplay.display;
  }

  /**
   * Get enhanced status display with different variants
   */
  static getEnhancedStatusDisplay(
    status: boolean | string | number,
    variant: "simple" | "badge" | "icon-only" | "text-only" = "badge"
  ): StatusDisplayResult {
    const isActive = this.parseBoolean(status);

    const optionsMap: Record<string, StatusDisplayOptions> = {
      simple: { showText: true, showIcon: false },
      badge: { showText: true, showIcon: true },
      "icon-only": { showText: false, showIcon: true },
      "text-only": { showText: true, showIcon: false },
    };

    return this.getStatusDisplay(isActive, optionsMap[variant]);
  }

  /**
   * Parse boolean value from various formats
   */
  private static parseBoolean(value: boolean | string | number): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const str = value.toLowerCase().trim();
      return (
        str === "true" ||
        str === "1" ||
        str === "yes" ||
        str === "active" ||
        str === "enabled" ||
        str === "on"
      );
    }
    return Boolean(value);
  }

  /**
   * Custom status display for specific status types
   */
  static getCustomStatusDisplay(
    status: string,
    mappings: Record<string, CustomStatusConfig>
  ): StatusDisplayResult {
    const defaultConfig: StatusDisplayConfig = {
      icon: AlertCircle,
      color: "text-gray-600",
      text: "Unknown",
      bgColor: "bg-gray-100",
      iconColor: "text-gray-600", // Provide default iconColor
    };

    const customConfig = mappings[status];

    // Merge custom config with defaults, ensuring iconColor is always present
    const config: StatusDisplayConfig = customConfig
      ? {
          ...defaultConfig,
          ...customConfig,
          iconColor:
            customConfig.iconColor ||
            customConfig.color ||
            defaultConfig.iconColor,
        }
      : defaultConfig;

    const display = (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.bgColor}`}
      >
        <config.icon size={16} className={config.iconColor} />
        <span className={`text-xs font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    );

    return {
      ...config,
      display,
    };
  }

  /**
   * Quick status renderer for common use cases
   */
  static renderStatus(
    status: boolean | string | number,
    variant: "badge" | "icon" | "text" = "badge"
  ): JSX.Element {
    switch (variant) {
      case "badge":
        return this.renderStatusBadge(status);
      case "icon":
        return this.renderStatusIcon(status);
      case "text":
        return this.renderStatusText(status);
      default:
        return this.renderStatusBadge(status);
    }
  }

  /**
   * Render custom status directly
   */
  static renderCustomStatus(
    status: string,
    mappings: Record<string, CustomStatusConfig>
  ): JSX.Element {
    const statusDisplay = this.getCustomStatusDisplay(status, mappings);
    return statusDisplay.display;
  }
}
