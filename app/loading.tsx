
export default function Loading() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/10 border-t-east-light rounded-full animate-spin" />
                <p className="font-montserrat font-black italic uppercase text-xs tracking-[0.2em] animate-pulse text-east-light">
                    Loading...
                </p>
            </div>
        </div>
    );
}
