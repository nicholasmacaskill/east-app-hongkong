export const MOCK_PLAYERS = [
    {
        id: 1,
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
    }
];

export const MOCK_GOALIES = [
    {
        id: 101,
        avatar: "https://images.unsplash.com/photo-1547347298-4074fc30823c?auto=format&fit=crop&q=80&w=400",
        name: "Marc Smith",
        team: "Rhinos",
        rank: 1,
        stats: { gp: 20, gaa: 2.15, sv: 0.925, w: 15, so: 3 }
    },
    {
        id: 102,
        avatar: "",
        name: "Jason Bourne",
        team: "Wolves",
        rank: 2,
        stats: { gp: 18, gaa: 2.45, sv: 0.910, w: 12, so: 2 }
    },
    {
        id: 103,
        avatar: "",
        name: "Kevin Chen",
        team: "Sharks",
        rank: 3,
        stats: { gp: 15, gaa: 3.10, sv: 0.895, w: 7, so: 1 }
    }
];

export const MOCK_HYROX = [
    {
        id: 201,
        avatar: "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=400",
        name: "Nicholas Macaskill",
        category: "Mens Full",
        rank: 1,
        stats: {
            ski_erg: "3:45",
            sled_push: "2:30",
            sled_pull: "3:15",
            burpee_jumps: "4:00",
            row: "3:50",
            farmers_carry: "1:45",
            sandbag_lunges: "3:20",
            wall_balls: "4:10"
        }
    }
];

export const MOCK_TEAMS = [
    { rank: 1, name: "RHINOS", gp: 12, w: 10, l: 2, pts: 20 },
    { rank: 2, name: "WOLVES", gp: 12, w: 8, l: 4, pts: 16 },
    { rank: 3, name: "SHARKS", gp: 12, w: 6, l: 6, pts: 12 },
    { rank: 4, name: "EAGLES", gp: 12, w: 4, l: 8, pts: 8 },
];
