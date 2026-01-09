
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraFeedProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
  isScanning?: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, isProcessing, isScanning = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-400 bg-red-900/10">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover grayscale brightness-75 contrast-125"
          />
          
          {/* Scanning Animation */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="scanning-line absolute w-full z-10" />
              <div className="absolute inset-0 border-[40px] border-black/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500/50 rounded-full animate-pulse" />
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={capture}
              disabled={isProcessing}
              className={`px-8 py-3 rounded-full font-semibold transition-all shadow-lg ${
                isProcessing 
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                  : 'bg-white text-black hover:bg-blue-50 hover:scale-105 active:scale-95'
              }`}
            >
              {isProcessing ? 'Analyzing...' : 'Secure Capture'}
            </button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraFeed;
