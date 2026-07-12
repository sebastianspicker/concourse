import { createServer } from "node:http";

const port = Number.parseInt(process.env.MOCK_BFF_PORT ?? "4400", 10);
const institutionId = process.env.INSTITUTION_ID ?? "example";
const webOrigin = "http://127.0.0.1:8081";

const events = [
  { id: "welcome-concert", title: "Welcome concert", date: "2026-09-14T17:30:00.000Z", sourceUrl: "https://example.org/events/welcome-concert" },
  { id: "library-tour", title: "Library introduction", date: "2026-09-15T09:00:00.000Z", sourceUrl: "https://example.org/events/library-tour" },
  { id: "student-services", title: "Student services open hour", date: "2026-09-16T12:00:00.000Z", sourceUrl: "https://example.org/events/student-services" },
];
const rooms = [
  { id: "auditorium", name: "Auditorium", campusId: "main" },
  { id: "library", name: "Library", campusId: "main" },
  { id: "seminar-204", name: "Seminar room 204", campusId: "main" },
];
const schedule = [
  { id: "orientation", title: "Campus orientation", startsAt: "2026-09-14T08:00:00.000Z", endsAt: "2026-09-14T09:30:00.000Z", location: "Auditorium", campusId: "main" },
  { id: "welcome-session", title: "Welcome session", startsAt: "2026-09-14T10:00:00.000Z", endsAt: "2026-09-14T11:00:00.000Z", location: "Seminar room 204", campusId: "main" },
];

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": webOrigin,
    "access-control-expose-headers": "x-institution-id, x-data-degraded",
    "x-institution-id": institutionId,
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function includesSearch(value, search) {
  return !search || value.toLocaleLowerCase().includes(search.toLocaleLowerCase());
}

const getHandlers = new Map([
  ["/health", (_url, response) => sendJson(response, 200, { status: "ok" })],
  ["/events", (url, response) => {
    const search = url.searchParams.get("search") ?? "";
    const filtered = events.filter((event) => includesSearch(event.title, search));
    sendJson(response, 200, { events: filtered, _total: filtered.length, _sourcesConfigured: true });
  }],
  ["/rooms", (url, response) => {
    const search = url.searchParams.get("search") ?? "";
    const filtered = rooms.filter((room) => includesSearch(room.name, search));
    sendJson(response, 200, { rooms: filtered, _total: filtered.length, _sourcesConfigured: true });
  }],
  ["/schedule", (_url, response) => sendJson(response, 200, { schedule, _total: schedule.length, _sourcesConfigured: true })],
  ["/today", (_url, response) => sendJson(response, 200, { events, rooms, _sourcesConfigured: true })],
]);

function handleGet(url, response) {
  const handler = getHandlers.get(url.pathname);
  if (handler) {
    handler(url, response);
    return;
  }
  sendJson(response, 404, { error: { code: "not_found", message: "Not found" } });
}

function handleRequest(request, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "access-control-allow-origin": webOrigin, "access-control-allow-methods": "GET, OPTIONS" });
    response.end();
    return;
  }
  if (request.method !== "GET") {
    sendJson(response, 405, { error: { code: "method_not_allowed", message: "Method not allowed" } });
    return;
  }
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  handleGet(url, response);
}

const server = createServer(handleRequest);

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Mock public BFF listening on http://127.0.0.1:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
