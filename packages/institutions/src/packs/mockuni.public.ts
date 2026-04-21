export const mockuniPublicPack = {
  id: "mockuni",
  name: "Technische Universität Musterstadt",
  type: "university",
  campuses: [
    {
      id: "hauptcampus",
      name: "Hauptcampus",
      city: "Musterstadt",
      address: "Musterstraße 1, 12345 Musterstadt",
      labels: ["main", "public"]
    },
    {
      id: "suedcampus",
      name: "Südcampus",
      city: "Musterstadt",
      address: "Südallee 42, 12345 Musterstadt",
      labels: ["public"]
    }
  ],
  publicSources: {
    events: [
      {
        label: "Hochschulveranstaltungen",
        url: "https://mock.local/events"
      }
    ],
    schedules: [
      {
        label: "Vorlesungsplan",
        url: "https://mock.local/schedule.ics"
      }
    ]
  },
  publicRooms: [
    {
      id: "auditorium-maximum",
      name: "Auditorium Maximum",
      campusId: "hauptcampus"
    },
    {
      id: "hoersaal-1",
      name: "Hörsaal 1",
      campusId: "hauptcampus"
    },
    {
      id: "hoersaal-2",
      name: "Hörsaal 2",
      campusId: "hauptcampus"
    },
    {
      id: "hoersaal-3",
      name: "Hörsaal 3",
      campusId: "hauptcampus"
    },
    {
      id: "seminarraum-a",
      name: "Seminarraum A",
      campusId: "hauptcampus"
    },
    {
      id: "seminarraum-b",
      name: "Seminarraum B",
      campusId: "hauptcampus"
    },
    {
      id: "pc-pool-1",
      name: "PC-Pool 1",
      campusId: "hauptcampus"
    },
    {
      id: "pc-pool-2",
      name: "PC-Pool 2",
      campusId: "suedcampus"
    },
    {
      id: "labor-physik",
      name: "Labor Physik",
      campusId: "hauptcampus"
    },
    {
      id: "labor-chemie",
      name: "Labor Chemie",
      campusId: "suedcampus"
    },
    {
      id: "bibliothek",
      name: "Bibliothek",
      campusId: "hauptcampus"
    },
    {
      id: "mensa",
      name: "Mensa",
      campusId: "suedcampus"
    }
  ]
} as const;
