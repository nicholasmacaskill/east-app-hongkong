export interface Product {
    id: string;
    slug: string;
    name: string;
    price: number;
    description: string;
    category: 'hockey' | 'gym' | 'merch';
    images: string[];
}

export const PRODUCTS: Product[] = [
    {
        id: 'prod_private_ice',
        slug: 'east-private-booking',
        name: 'Private On-Ice Training',
        price: 1500,
        description: 'One-on-one elite coaching tailored to your specific needs. Focus on skating mechanics, puck control, and game situational awareness.',
        category: 'hockey',
        images: ['/products/on-ice-training.jpg']
    },
    {
        id: 'prod_off_ice',
        slug: 'east-off-ice-training',
        name: 'Off-Ice Conditioning',
        price: 1200,
        description: 'Dryland training to build explosive power, core stability, and hockey-specific endurance.',
        category: 'gym',
        images: ['/products/off-ice-training.jpg']
    },
    {
        id: 'prod_scouting',
        slug: 'east-scouting-report',
        name: 'Professional Scouting Report',
        price: 800,
        description: 'Detailed analysis of your game play by our expert coaches. Includes video review and actionable feedback.',
        category: 'hockey',
        images: ['/products/scouting-report.jpg']
    },
];
