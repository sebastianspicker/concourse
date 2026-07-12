import React from "react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { detectResourceErrorType } from "./resourceErrorType";
import { ResourceListItem } from "./ResourceListItem";
import { Section } from "./Section";
import { SkeletonList } from "./Skeleton";
import type { UiError } from "../api/uiError";

export type ResourceListSectionProps<T> = {
  title: string;
  loading: boolean;
  error: UiError | string | null;
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

export function ResourceListSection<T>(props: ResourceListSectionProps<T>): JSX.Element {
  const { title } = props;

  return (
    <Section title={title}>
      <ResourceListContent {...props} />
    </Section>
  );
}

function ResourceListContent<T>(props: ResourceListSectionProps<T>): JSX.Element {
  const { loading, error, items, emptyMessage, keyExtractor, href, renderCard, accessibilityLabel, onRetry, emptyIcon, emptyHint } = props;
  if (loading) {
    return <SkeletonList count={3} />;
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
      {items.map((item) => (
        <ResourceListItem
          key={keyExtractor(item)}
          item={item}
          href={href}
          renderCard={renderCard}
          accessibilityLabel={accessibilityLabel}
        />
      ))}
    </>
  );
}
