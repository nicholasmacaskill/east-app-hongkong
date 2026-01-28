'use client';

import React from 'react';
import { useCart } from '@/app/context/CartContext';
import { X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/app/components/ui/GlassCard';

export function CartDrawer() {
    const { isOpen, toggleCart, items, removeFromCart, addToCart, cartTotal } = useCart();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={toggleCart}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md h-full bg-black/80 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="font-montserrat font-bold text-xl text-white tracking-wider">YOUR CART</h2>
                    <button
                        onClick={toggleCart}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Start Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <span className="text-2xl">🛒</span>
                            </div>
                            <p className="text-sm font-bold uppercase tracking-wider">Your cart is empty</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                {/* Image Placeholder */}
                                <div className="w-20 h-20 bg-white/5 rounded-lg border border-white/10 flex-shrink-0 relative overflow-hidden group">
                                    {item.images?.[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-white/20">IMG</div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-sm text-white">{item.name}</h3>
                                        <p className="font-mono text-sm text-east-light">${item.price}</p>
                                    </div>
                                    <p className="text-xs text-white/40 line-clamp-1">{item.description}</p>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border border-white/10 rounded-full bg-white/5">
                                            <button
                                                // Logic to decrease qty (if 1, remove?) - Simplified for now: just remove if 1 or create specific decrement logic
                                                onClick={() => removeFromCart(item.id)} // Ideally decrement
                                                className="p-1 hover:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                                            >
                                                {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                                            </button>
                                            <span className="text-xs font-mono w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="p-1 hover:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-white/10 bg-white/5 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60 uppercase tracking-wider">Subtotal</span>
                            <span className="font-mono font-bold text-lg text-white">${cartTotal.toLocaleString()}</span>
                        </div>
                        <button className="w-full bg-east-light text-black font-bold uppercase tracking-widest py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            Checkout <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-[10px] text-center text-white/30">
                            Tax included. Shipping calculated at checkout.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
