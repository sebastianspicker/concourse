export function createTypecheckSummary() {
  return { scope: "typecheck", status: "ready" };
}

// current lane: typecheck
export function typecheckTask() {
  return { scope: "typecheck", status: "ready" };
}
