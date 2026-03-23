export interface Property {
    id: number; owner_id: number; agent: string; price: string; address: string
    beds: number; baths: number; sqft: string
    status: "For Sale" | "For Rent"; tag: string | null
    saved: boolean; views: number; rating: number; reviews: number
    img: string; gallery: string[]; desc: string; features: string[]
    modele_3d?: string | null
}

export interface Comment {
    name: string; date: string; rating: number; text: string
}

export interface Room {
    id: string; label: string; floor: number
    x: number; z: number; color: string; area: string; desc: string
}

export const PROPERTIES: Property[] = [
    {
        id: 1, owner_id: 10, agent: "Brandon Levin", price: "$389,781",
        address: "6391 Elgin St, Celina, Delaware 10299",
        beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: "New",
        saved: false, views: 1240, rating: 4.8, reviews: 24,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "A beautifully crafted 4-bedroom modern home with open-plan living, white kitchen and resort-style pool. Stone facade with flat roof architecture.",
        features: ["Swimming Pool", "White Kitchen", "Open Plan", "Master Suite", "Flat Roof", "Double Garage"],
    },
    {
        id: 2, owner_id: 11, agent: "Gustavo Calzoni", price: "$160,581",
        address: "2715 Ash Dr, San Jose, South Dakota 83475",
        beds: 5, baths: 4, sqft: "2240", status: "For Sale", tag: null,
        saved: true, views: 876, rating: 4.5, reviews: 18,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Spacious 5-bedroom villa with pool, generous terrace and two floors. Renovated kitchen with island, hardwood floors and spa bathroom.",
        features: ["Pool Terrace", "Kitchen Island", "Spa Bathroom", "Hardwood Floors", "Two Stories", "Large Garden"],
    },
    {
        id: 3, owner_id: 12, agent: "Chance Dorwart", price: "$2,400 /mo",
        address: "8502 Preston Rd, Inglewood, Maine 98380",
        beds: 3, baths: 2, sqft: "1850", status: "For Rent", tag: "Featured",
        saved: false, views: 543, rating: 4.7, reviews: 11,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Modern 3-bedroom rental with pool and rooftop terrace. Bright living spaces, home office and premium finishes throughout.",
        features: ["Rooftop Terrace", "Pool", "Home Office", "Concierge", "Underground Parking", "Furnished"],
    },
    {
        id: 4, owner_id: 13, agent: "Craig Herwitz", price: "$778,100",
        address: "4140 Parker Rd, New Mexico 31134",
        beds: 4, baths: 2, sqft: "1090", status: "For Sale", tag: null,
        saved: true, views: 2100, rating: 4.9, reviews: 37,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Premium 4-bedroom estate with chef kitchen, home office and resort-style pool. Master suite with walk-in wardrobe and spa ensuite.",
        features: ["Swimming Pool", "Chef Kitchen", "Home Office", "Walk-in Wardrobe", "Spa Ensuite", "Stone Facade"],
    },
    {
        id: 5, owner_id: 14, agent: "Livia Rhiel", price: "$1,200 /mo",
        address: "1234 Sunset Blvd, Los Angeles, CA 90028",
        beds: 2, baths: 1, sqft: "850", status: "For Rent", tag: null,
        saved: false, views: 390, rating: 4.2, reviews: 8,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Charming 2-bedroom modern unit in West Hollywood. Pool access, private terrace and renovated interiors with premium appliances.",
        features: ["Pool Access", "Private Terrace", "Modern Bedroom", "New Appliances", "Parking", "Walk to Shops"],
    },
    {
        id: 6, owner_id: 15, agent: "Nolan Saris", price: "$245,000",
        address: "9876 Maple Ave, Chicago, IL 60601",
        beds: 3, baths: 2, sqft: "1400", status: "For Sale", tag: "Price Drop",
        saved: false, views: 720, rating: 4.4, reviews: 14,
        img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
        ],
        desc: "Modern home with flat roof design and private pool. Open plan living, white kitchen and spacious terrace perfect for entertaining.",
        features: ["Private Pool", "Flat Roof", "Open Plan", "White Kitchen", "Terrace", "Updated HVAC"],
    },
]

export const COMMENTS: Record<number, Comment[]> = {
    1: [
        { name: "Amina Touré", date: "2 days ago", rating: 5, text: "Visited this property last weekend — absolutely stunning. The pool and stone facade are even more impressive in person." },
        { name: "James W.",    date: "1 week ago", rating: 4, text: "Great location and the house is immaculate. The open-plan living space is very well designed." },
    ],
    2: [{ name: "Sofia Chen",    date: "3 days ago", rating: 5, text: "Great value! The stone architecture is excellent and the pool terrace is perfect for entertaining." }],
    3: [{ name: "Rania M.",      date: "5 days ago", rating: 5, text: "The rooftop terrace has an incredible view. Building management is responsive and the gym is well-equipped." }],
    4: [
        { name: "Lucas Bernard", date: "1 day ago",  rating: 5, text: "Dream property. The pool and chef kitchen are worth every cent. Very professional agent." },
        { name: "Nadia P.",      date: "4 days ago", rating: 5, text: "By far the most impressive listing. The spa ensuite and stone walls are a showstopper." },
    ],
    5: [{ name: "Marco F.", date: "1 week ago", rating: 4, text: "Perfect location. The pool access and private terrace are a real bonus." }],
    6: [{ name: "Ella D.",  date: "3 days ago", rating: 4, text: "Great modern home. The private pool and flat roof design are very stylish." }],
}

export const ROOMS: Room[] = [
    { id: "living",  label: "Living Room",   floor: 0, x: -1.2, z: -0.5, color: "#b8922a", area: "42 m²", desc: "Open-plan with floor-to-ceiling windows and premium finishes." },
    { id: "kitchen", label: "Kitchen",        floor: 0, x:  1.2, z: -0.5, color: "#2a7ab8", area: "28 m²", desc: "Modern kitchen with island, gas range, and premium appliances." },
    { id: "bedroom", label: "Master Bedroom", floor: 1, x: -1.0, z:  0.2, color: "#7a2ab8", area: "35 m²", desc: "En-suite with walk-in wardrobe and private terrace access." },
    { id: "office",  label: "Home Office",    floor: 1, x:  1.0, z:  0.2, color: "#2ab87a", area: "22 m²", desc: "Quiet corner office with built-in shelving and city views." },
    { id: "pool",    label: "Pool & Garden",  floor: 0, x:  0.0, z:  1.8, color: "#2ab8b8", area: "60 m²", desc: "Heated outdoor pool with sun deck and landscaped garden." },
]