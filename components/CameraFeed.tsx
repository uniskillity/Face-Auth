
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraFeedProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
  isScanning?: boolean;
  instruction?: string;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, isProcessing, isScanning = false, instruction }) => {
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
      setError("CAMERA_INIT_FAILURE");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 bg-black group shadow-2xl">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center bg-red-900/10">
          <p className="mono text-xs font-bold text-red-500 tracking-widest">{error}</p>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-500 ${isProcessing ? 'opacity-30' : 'opacity-100'}`}
          />
          
          <div className="absolute inset-0 pointer-events-none">
             {/* Target Reticle */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[340px] border border-blue-500/30 rounded-[80px] flex items-center justify-center">
                <div className="absolute inset-0 border-[1px] border-dashed border-white/10 rounded-[80px]" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500 rounded-br-2xl" />
             </div>

             {isScanning && !isProcessing && (
               <div className="scanning-line absolute w-full z-10" />
             )}

             {instruction && !isProcessing && (
                <div className="absolute top-10 left-0 right-0 text-center animate-in slide-in-from-top-4 duration-500">
                   <span className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                      {instruction}
                   </span>
                </div>
             )}
          </div>

          <div className="absolute bottom-10 left-0 right-0 flex justify-center px-8">
            {!isProcessing ? (
              <button
                onClick={capture}
                className="group relative flex flex-col items-center focus:outline-none"
              >
                <div className="absolute -inset-4 bg-blue-600/20 rounded-full blur-2xl group-hover:bg-blue-600/40 transition-all" />
                <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-blue-500 transition-transform active:scale-90 shadow-xl">
                   <div className="w-12 h-12 bg-white rounded-full border border-black/5" />
                </div>
                <span className="mt-4 mono text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Capture Biometrics</span>
              </button>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                 <div className="flex space-x-1">
                    {[0, 1, 2].map(i => (
                       <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                 </div>
                 <p className="mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">Validating Integrity...</p>
              </div>
            )}
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraFeed;
