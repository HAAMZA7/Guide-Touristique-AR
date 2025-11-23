import React, { useEffect, useRef, useState } from 'react';
import { AnalysisResult, GroundingChunk } from '../types';

interface ResultViewProps {
  imageSrc: string;
  result: AnalysisResult;
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ imageSrc, result, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const toggleAudio = async () => {
    if (!result.audioBuffer || !audioContextRef.current) return;

    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
    } else {
      // Resume context if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = result.audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      {/* Background Image (Captured) */}
      <img 
        src={imageSrc} 
        alt="Captured landmark" 
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />
      
      {/* Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20">
        <button 
          onClick={onReset}
          className="bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/60 transition"
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <span className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-bold uppercase backdrop-blur-md">
          <i className="fas fa-check-circle mr-1"></i> Identifié
        </span>
      </div>

      {/* AR Card Content */}
      <div className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-in-out z-20 ${showFullText ? 'h-[85vh]' : 'h-auto max-h-[60vh]'}`}>
        <div className="w-full h-full bg-white/10 backdrop-blur-xl border-t border-white/20 rounded-t-3xl p-6 flex flex-col shadow-2xl relative">
            
            {/* Handle bar for dragging visual cue */}
            <div 
                className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4 cursor-pointer"
                onClick={() => setShowFullText(!showFullText)}
            ></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-white leading-tight drop-shadow-md flex-1 pr-4">
                    {result.landmarkName}
                </h1>
                <button 
                    onClick={toggleAudio}
                    className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isPlaying 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-white hover:bg-gray-100 text-indigo-600'
                    }`}
                >
                    <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-volume-up'} text-xl`}></i>
                </button>
            </div>

            {/* Text Content */}
            <div className="flex-1 overflow-y-auto glass-scroll pr-2">
                <p className="text-gray-100 leading-relaxed text-lg font-light">
                    {result.description}
                </p>

                {/* Grounding Sources */}
                {result.groundingSource.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-white/10">
                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Sources Google</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.groundingSource.map((chunk, idx) => chunk.web?.uri ? (
                                <a 
                                    key={idx} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-3 py-2 bg-black/30 hover:bg-black/50 rounded-lg text-xs text-blue-200 border border-white/10 flex items-center gap-2 transition"
                                >
                                    <i className="fab fa-google text-white/70"></i>
                                    <span className="truncate max-w-[150px]">{chunk.web.title || "Source Web"}</span>
                                    <i className="fas fa-external-link-alt text-[10px] opacity-50"></i>
                                </a>
                            ) : null)}
                        </div>
                    </div>
                )}
            </div>
            
            {!showFullText && (
                <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/20 to-transparent pointer-events-none rounded-b-3xl" />
            )}
        </div>
      </div>
    </div>
  );
};
