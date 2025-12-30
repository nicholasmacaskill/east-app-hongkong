export const MOCK_PLAYERS = [
    {
        id: 1,
        // Using the same avatar as the profile mock for consistency or generic ones
        avatar: "https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg",
        name: "Coach Whit",
        team: "Rhinos",
        rank: 1,
        stats: { gp: 45, goals: 5, assists: 8, points: 13 }
    },
    {
        id: 2,
        avatar: "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=400",
        name: "James Lee",
        team: "Wolves",
        rank: 2,
        stats: { gp: 44, goals: 3, assists: 9, points: 12 }
    },
    {
        id: 3,
        avatar: "https://images.unsplash.com/photo-1593034509785-5b17ba49f683?auto=format&fit=crop&q=80&w=400",
        name: "Sarah Chen",
        team: "Sharks",
        rank: 3,
        stats: { gp: 45, goals: 4, assists: 7, points: 11 }
    },
    {
        id: 4,
        avatar: "", // No avatar
        name: "Mike Ross",
        team: "Rhinos",
        rank: 4,
        stats: { gp: 42, goals: 2, assists: 8, points: 10 }
    },
    {
        id: 5,
        avatar: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400",
        name: "David Kim",
        team: "Eagles",
        rank: 5,
        stats: { gp: 40, goals: 6, assists: 3, points: 9 }
    },
    {
        id: 6,
        avatar: "",
        name: "Tom Ford",
        team: "Wolves",
        rank: 6,
        stats: { gp: 45, goals: 1, assists: 7, points: 8 }
    },
    {
        id: 7,
        avatar: "",
        name: "Alex Wong",
        team: "Sharks",
        rank: 7,
        stats: { gp: 38, goals: 3, assists: 4, points: 7 }
    },
    {
        id: 8,
        avatar: "",
        name: "Chris Paul",
        team: "Eagles",
        rank: 8,
        stats: { gp: 41, goals: 0, assists: 6, points: 6 }
    }
];

export const MOCK_TEAMS = [
    { rank: 1, name: "RHINOS", gp: 12, w: 10, l: 2, pts: 20 },
    { rank: 2, name: "WOLVES", gp: 12, w: 8, l: 4, pts: 16 },
    { rank: 3, name: "SHARKS", gp: 12, w: 6, l: 6, pts: 12 },
    { rank: 4, name: "EAGLES", gp: 12, w: 4, l: 8, pts: 8 },
];
