import React from "react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import type { ErrorType } from "./ErrorState";
import { ResourceListItem } from "./ResourceListItem";
import { Section } from "./Section";
import { SkeletonList } from "./Skeleton";

function detectErrorType(error: string): ErrorType {
  const lower = error.toLowerCase();
  if (
    lower.includes("network") ||
    lower.includes("connection") ||
    lower.includes("offline") ||
    lower.includes("timeout") ||
    lower.includes("fetch") ||
    lower.includes("request failed")
  ) {
    return "network";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "notFound";
  }
  return "generic";
}

export type ResourceListSectionProps<T> = {
  title: string;
  loading: boolean;
  error: string | null;
  items: T[];
  emptyMessage: string;
  keyExtractor: (item: T) => string;
  href: (item: T) => { pathname: string; params: Record<string, string> };
  renderCard: (item: T) => { title: string; subtitle?: string };
  accessibilityLabel: (item: T) => string;
  onRetry?: () => void;
  emptyIcon?: string;
  emptyHint?: string;
};

export function ResourceListSection<T>({
  title,
  loading,
  error,
  items,
  emptyMessage,
  keyExtractor,
  href,
  renderCard,
  accessibilityLabel,
  onRetry,
  emptyIcon,
  emptyHint
}: ResourceListSectionProps<T>): JSX.Element {
  return (
    <Section title={title}>
      {loading ? <SkeletonList count={3} /> : null}
      {!loading && error ? (
        <ErrorState
          message={error}
          errorType={detectErrorType(error)}
          onRetry={onRetry}
        />
      ) : null}
      {!loading && !error
        ? items.map((item) => (
            <ResourceListItem
              key={keyExtractor(item)}
              item={item}
              href={href}
              renderCard={renderCard}
              accessibilityLabel={accessibilityLabel}
            />
          ))
        : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState message={emptyMessage} icon={emptyIcon} hint={emptyHint} />
      ) : null}
    </Section>
  );
}
