import React from "react";

export default function MaterialIcons({ name }: { name: string }): React.JSX.Element {
  return <span data-testid="material-icon">{name}</span>;
}
