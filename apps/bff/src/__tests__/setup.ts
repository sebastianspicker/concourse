/** Initializes the environment required before BFF test modules are evaluated. */
// BFF_ENV is computed eagerly at import time, so these must be set here,
// not inside beforeAll/beforeEach.
process.env.INSTITUTION_ID ??= "mockuni";
process.env.PUBLIC_EVENTS_MODE ??= "mock";
