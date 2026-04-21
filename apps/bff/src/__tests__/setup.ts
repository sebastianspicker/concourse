// Test setup: provide required env vars before any module is evaluated.
// BFF_ENV is computed eagerly at import time, so these must be set here,
// not inside beforeAll/beforeEach.
process.env.INSTITUTION_ID ??= "mockuni";
process.env.PUBLIC_EVENTS_MODE ??= "mock";
