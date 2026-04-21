export const hfmtPublicPack = {
  id: "hfmt",
  name: "University for Music and Dance (HfMT Cologne)",
  type: "music-and-dance",
  campuses: [
    {
      id: "cologne",
      name: "Cologne",
      city: "Cologne",
      address: "Unter Krahnenbaumen 87, 50668 Cologne",
      labels: ["main", "performance", "administration"]
    },
    {
      id: "cologne-zzt",
      name: "Cologne ZZT",
      city: "Cologne",
      address: "Unter Krahnenbaumen 87, 50668 Cologne",
      labels: ["zzt", "dance"]
    },
    {
      id: "aachen",
      name: "Aachen",
      city: "Aachen",
      address: "Theaterplatz 16, 52062 Aachen",
      labels: ["campus"]
    },
    {
      id: "wuppertal",
      name: "Wuppertal",
      city: "Wuppertal",
      address: "Sedanstrasse 15, 42275 Wuppertal",
      labels: ["campus"]
    }
  ],
  publicSources: {
    events: [
      {
        label: "Official Events",
        url: "https://www.hfmt-koeln.de/veranstaltungen"
      }
    ],
    schedules: []
  },
  publicRooms: [
    {
      id: "cologne-101",
      name: "Room 101",
      campusId: "cologne"
    },
    {
      id: "cologne-auditorium",
      name: "Auditorium",
      campusId: "cologne"
    }
  ]
} as const;

