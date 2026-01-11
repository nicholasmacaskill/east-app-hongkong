
'use client';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-montserrat">
            <h1 className="text-6xl font-black italic text-east-light mb-4">404</h1>
            <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">Page Not Found</h2>
            <p className="text-gray-400 max-w-md mb-8">
                The play you are looking for has been whistled dead. Let's get you back to the bench.
            </p>
            <Link href="/" className="bg-white text-black font-black italic uppercase px-8 py-4 rounded-full hover:bg-east-light transition-colors">
                Return Home
            </Link>
        </div>
    );
}
