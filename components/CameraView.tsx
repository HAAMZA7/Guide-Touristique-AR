import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
  onFileUpload: (file: File) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onFileUpload }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Prefer back camera
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Impossible d'accéder à la caméra. Veuillez autoriser l'accès ou télécharger une photo.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get base64 string without the prefix for easier handling in service if needed, 
        // but typically we keep it for preview. Service splits it if needed.
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64Data = dataUrl.split(',')[1]; 
        onCapture(base64Data);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Video Stream */}
      {!error && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Hidden Canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

      {/* UI Controls */}
      <div className="absolute bottom-0 w-full flex flex-col items-center pb-8 z-10 px-6 bg-gradient-to-t from-black/90 to-transparent pt-12">
        {error && <p className="text-red-400 text-center bg-black/50 p-2 rounded mb-4">{error}</p>}
        
        <div className="flex items-center justify-center gap-8 w-full mb-6">
            {/* Upload Button */}
            <label className="flex flex-col items-center justify-center cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all">
                    <i className="fas fa-image text-white text-xl"></i>
                </div>
                <span className="text-xs text-white/80 mt-2 font-medium">Importer</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>

            {/* Capture Button */}
            <button 
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/20 transition-all active:scale-95"
            >
                <div className="w-16 h-16 rounded-full bg-white"></div>
            </button>
            
            {/* Spacer for symmetry */}
            <div className="w-12"></div>
        </div>
        
        <p className="text-white/80 text-sm font-light drop-shadow-md mb-2">
          Scannez un monument ou un lieu
        </p>
        
        <p className="text-white/30 text-[10px] font-light uppercase tracking-widest">
          Développé par Hamza DJOUDI
        </p>
      </div>

      <div className="absolute top-6 left-0 w-full flex justify-center z-10">
        <h1 className="text-xl font-bold tracking-widest text-white drop-shadow-lg uppercase">
           <i className="fas fa-camera-retro mr-2"></i>Guide AR
        </h1>
      </div>
    </div>
  );
};