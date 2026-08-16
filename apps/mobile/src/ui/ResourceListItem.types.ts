export type ResourceListContent = {
  title: string;
  subtitle?: string;
  leading?: string;
  /** Optional status chip (e.g. “Next up”); timeline + active also defaults one. */
  badge?: string;
};

export type ResourceListItemVariant = "standard" | "route" | "timeline";

export type ResourceListItemProps<T> = {
  item: T;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => ResourceListContent;
  accessibilityLabel: (item: T) => string;
  onNavigate?: (item: T) => void;
  variant?: ResourceListItemVariant;
  active?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  minHeight?: number;
  open?: boolean;
};
