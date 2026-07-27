/** Safe generic pack used for documentation, previews, and downstream customization. */
export const examplePublicPack = {
  id: "example",
  name: "Example University",
  app: {
    displayName: "Example University",
    defaultLocale: "en",
    designPreset: "wayfinding",
    accent: "#4067D0"
  },
  type: "music-and-dance",
  campuses: [
    {
      id: "main",
      name: "Main Campus",
      city: "Cologne",
      address: "Example Street 1",
      labels: ["main", "public"]
    }
  ],
  publicSources: {
    events: [
      {
        label: "Website Events",
        url: "https://example.org/events"
      }
    ],
    schedules: [
      {
        label: "Public Calendar",
        url: "https://example.org/schedule.ics"
      }
    ]
  },
  publicRooms: [
    {
      id: "main-auditorium",
      name: "Auditorium",
      campusId: "main"
    }
  ],
  timezone: "Europe/Berlin"
} as const;
