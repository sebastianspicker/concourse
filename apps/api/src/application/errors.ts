export abstract class ApplicationError extends Error {
  abstract readonly kind: "no_config_sources" | "invalid_query_param";
}

export class NoConfiguredSourcesError extends ApplicationError {
  readonly kind = "no_config_sources" as const;

  constructor(message: string) {
    super(message);
    this.name = "NoConfiguredSourcesError";
  }
}

export class InvalidQueryParameterError extends ApplicationError {
  readonly kind = "invalid_query_param" as const;

  constructor(message: string) {
    super(message);
    this.name = "InvalidQueryParameterError";
  }
}
