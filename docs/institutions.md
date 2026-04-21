# Institution Packs

Institution packs define public, non-sensitive configuration. They allow the public repo to be tailored to a specific university without exposing private systems.

```mermaid
flowchart LR
  subgraph BFF["BFF"]
    Env[INSTITUTION_ID]
    Load[loadInstitutionPack]
    Env --> Load
  end
  subgraph Packs["Institution packs"]
    H[hfmt]
    Other[other ids]
  end
  Load --> Packs
  Load --> Routes[Routes use pack]
```

## Public pack rules

- Only public campus data (locations, addresses, labels).
- Public event sources only (official website).
- No internal endpoints, admin routes, or secrets.

## File structure

Packs live in:

- `packages/institutions/src/packs/*.public.ts`

## Example

See `packages/institutions/src/packs/hfmt.public.ts`.

## Private extensions

Private repos may add additional configuration files containing internal endpoints (but still no secrets).
Secrets belong in a secret store.
