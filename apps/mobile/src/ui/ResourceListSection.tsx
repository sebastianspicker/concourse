/** Wraps a resource list in section-level loading, empty, and error semantics. */
import React from "react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { detectResourceErrorType } from "./resourceErrorType";
import { ResourceListItem, type ResourceListContent, type ResourceListItemVariant } from "./ResourceListItem";
import { Section } from "./Section";
import { SkeletonList, SkeletonSchedule } from "./Skeleton";
import type { UiError } from "../api/uiError";

export type ResourceListSectionProps<T> = {
  title: string;
  loading: boolean;
  error: UiError | string | null;
  items: T[];
  emptyMessage: string;
  keyExtractor: (item: T) => string;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => ResourceListContent;
  accessibilityLabel: (item: T) => string;
  onNavigate?: (item: T) => void;
  variant?: ResourceListItemVariant;
  activeItemId?: string;
  action?: React.ReactNode;
  onRetry?: () => void;
  emptyIcon?: string;
  emptyHint?: string;
  rowMinHeight?: number;
  openRows?: boolean;
  prominentTitle?: boolean;
};

/** Wraps a resource collection in a labeled section with optional header action. */
export function ResourceListSection<T>(props: ResourceListSectionProps<T>): JSX.Element {
  const { title, action, prominentTitle = false } = props;

  return (
    <Section title={title} action={action} prominent={prominentTitle}>
      <ResourceListContent {...props} />
    </Section>
  );
}

/** Selects loading, failure, empty, or populated resource-list content from request state. */
function ResourceListContent<T>(props: ResourceListSectionProps<T>): JSX.Element {
  const { loading, error, items, emptyMessage, keyExtractor, href, renderCard, accessibilityLabel, onNavigate, onRetry, emptyIcon, emptyHint, variant = "standard", activeItemId, rowMinHeight, openRows = false } = props;
  if (loading) {
    return variant === "timeline" ? <SkeletonSchedule count={3} /> : <SkeletonList count={3} />;
  }

  if (error) {
    return (
      <ErrorState
        {...(typeof error === "string" ? { message: error } : { error })}
        errorType={detectResourceErrorType(error)}
        onRetry={onRetry}
      />
    );
  }

  if (items.length === 0) {
    return <EmptyState message={emptyMessage} icon={emptyIcon} hint={emptyHint} />;
  }

  return (
    <>
      {items.map((item, index) => {
        const id = keyExtractor(item);
        return (
        <ResourceListItem
          key={id}
          item={item}
          href={href}
          renderCard={renderCard}
          accessibilityLabel={accessibilityLabel}
          onNavigate={onNavigate}
          variant={variant}
          active={id === activeItemId}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          minHeight={rowMinHeight}
          open={openRows}
        />
        );
      })}
    </>
  );
}
