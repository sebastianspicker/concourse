# Private stubs

These modules are **stubs only**: they return empty arrays (or placeholder data) and do not call real backends. They exist so the BFF can compile and route handlers can be wired.

- **Distinguishing stub from "no data":** Responses are indistinguishable from "no data" (e.g. `[]`). For private implementations, consider returning a tagged shape (e.g. `{ stub: true, data: [] }`) or documenting clearly so callers know the connector is unimplemented.
- **Production:** Replace stubs with real connectors in your private fork.
