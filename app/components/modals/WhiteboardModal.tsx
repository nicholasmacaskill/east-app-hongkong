'use client';
import React, { useState, useRef, useEffect } from 'react';
import { X, Eraser, Trash2, Download, PenTool } from 'lucide-react';

interface WhiteboardModalProps {
    onClose: () => void;
}

export default function WhiteboardModal({ onClose }: WhiteboardModalProps) {
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawColor, setDrawColor] = useState('#28D160');
    const [isEraser, setIsEraser] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- Drawing Logic ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Scale display coordinates to canvas coordinates
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        // Prevent mobile page scrolling while drawing
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Scale display coordinates to canvas coordinates
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        ctx.lineTo(x, y);
        ctx.strokeStyle = isEraser ? '#111' : drawColor;
        ctx.lineWidth = isEraser ? 30 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create a temporary canvas to composite the background and the drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        // Draw solid dark background
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw rink lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(50, 20, 700, 360, 100);
        ctx.stroke();

        ctx.strokeStyle = '#ff3b30';
        ctx.beginPath();
        ctx.moveTo(400, 20);
        ctx.lineTo(400, 380);
        ctx.stroke();

        ctx.strokeStyle = '#007aff';
        ctx.beginPath();
        ctx.moveTo(250, 20);
        ctx.lineTo(250, 380);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(550, 20);
        ctx.lineTo(550, 380);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(400, 200, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Draw user's strokes on top
        ctx.drawImage(canvas, 0, 0);

        // Download
        const link = document.createElement('a');
        link.download = `drill-sketch-${new Date().toISOString().split('T')[0]}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    };

    // Prevent body scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-xl animate-fadeIn font-montserrat">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 shrink-0 bg-[#0a0a0a]">
                <div>
                    <p className="text-[9px] font-black text-east-light uppercase tracking-[0.3em] italic">Tactical Board</p>
                    <h2 className="text-white font-black italic text-xl uppercase tracking-tight leading-none mt-0.5 flex items-center gap-2">
                        <PenTool size={18} className="text-east-light" />
                        Rink Whiteboard
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors text-[10px] font-black uppercase tracking-widest text-white">
                        <Download size={14} /> Save
                    </button>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative w-full h-full flex flex-col items-center justify-center p-4">
                
                {/* Toolbar */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 border border-white/10 shadow-2xl">
                    {['#28D160', '#ff3b30', '#007aff', '#ffffff', '#ffd60a'].map(c => (
                        <button 
                            key={c} 
                            onClick={() => {setDrawColor(c); setIsEraser(false);}} 
                            className={`w-6 h-6 rounded-full border-2 transition-all ${drawColor === c && !isEraser ? 'border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent opacity-50 hover:opacity-100'}`} 
                            style={{ backgroundColor: c }} 
                        />
                    ))}
                    <div className="w-px h-6 bg-white/20 mx-2" />
                    <button 
                        onClick={() => setIsEraser(!isEraser)} 
                        className={`p-2 rounded-full transition-all ${isEraser ? 'bg-white/20 text-white scale-110' : 'text-gray-500 hover:text-white'}`}
                        title="Eraser"
                    >
                        <Eraser size={18} />
                    </button>
                    <button 
                        onClick={clearCanvas} 
                        className="p-2 text-red-500/60 hover:text-red-500 transition-colors ml-2"
                        title="Clear Board"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Drawing Board Container */}
                <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/10 bg-[#111] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex-shrink-0">
                    
                    {/* SVG Rink Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                        <svg viewBox="0 0 800 400" className="w-[90%] h-auto">
                            <rect x="50" y="20" width="700" height="360" rx="100" fill="none" stroke="white" strokeWidth="4"/>
                            <line x1="400" y1="20" x2="400" y2="380" stroke="#ff3b30" strokeWidth="4"/>
                            <line x1="250" y1="20" x2="250" y2="380" stroke="#007aff" strokeWidth="4"/>
                            <line x1="550" y1="20" x2="550" y2="380" stroke="#007aff" strokeWidth="4"/>
                            <circle cx="400" cy="200" r="60" fill="none" stroke="#007aff" strokeWidth="4"/>
                        </svg>
                    </div>

                    <canvas 
                        ref={canvasRef}
                        width={1000}
                        height={562}
                        className="w-full h-full relative z-20 cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
            </div>
        </div>
    );
}
