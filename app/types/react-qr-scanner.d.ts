declare module 'react-qr-scanner' {
    import React from 'react';

    export interface Result {
        text: string;
    }

    export interface QrScannerProps {
        delay?: number | boolean;
        onError: (error: any) => void;
        onScan: (data: Result | null) => void;
        style?: React.CSSProperties;
        facingMode?: 'rear' | 'front';
        constraints?: MediaStreamConstraints;
        className?: string;
    }

    const QrScanner: React.FC<QrScannerProps>;
    export default QrScanner;
}
