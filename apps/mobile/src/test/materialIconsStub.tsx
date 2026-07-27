/** Replaces Material icons with a predictable test-renderer component. */
import React from "react";

/** Replaces icon rendering with named text so tests can assert icon intent without native assets. */
export default function MaterialIcons({ name }: { name: string }): React.JSX.Element {
  return <span data-testid="material-icon">{name}</span>;
}
