'use client';

import React from 'react';
import { useCart } from '@/app/context/CartContext';
import { Product } from '@/data/products';
import { ShoppingBag } from 'lucide-react';

export function AddToCartButton({ product }: { product: Product }) {
    const { addToCart } = useCart();

    return (
        <button
            onClick={() => addToCart(product)}
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-east-light hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
            <ShoppingBag className="w-5 h-5" /> Add to Cart
        </button>
    );
}
