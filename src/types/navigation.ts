/**
 * Navigation types for sidebar and header
 */

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  disabled?: boolean;
}

export interface NavGroupProps {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  isActive: (url: string) => boolean;
}
