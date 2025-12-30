import { useState } from 'react';

/**
 * Custom hook to manage gallery lightbox state.
 * @param images Array of image URLs to display
 * @returns Object containing state and handlers for the lightbox
 */
export function useGallery(images: string[] = []) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const open = (index: number) => setSelectedIndex(index);
    const close = () => setSelectedIndex(null);

    const next = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length === 0) return;
        setSelectedIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
    };

    const prev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length === 0) return;
        setSelectedIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
    };

    const currentImage = selectedIndex !== null ? images[selectedIndex] : null;

    return {
        selectedIndex,
        isOpen: selectedIndex !== null,
        currentImage,
        open,
        close,
        next,
        prev
    };
}
