import React from 'react';
import { AppState } from '../types';

interface LoadingOverlayProps {
  state: AppState;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ state }) => {
  let message = "Traitement...";
  let icon = "fa-cog";

  switch (state) {
    case AppState.ANALYZING:
      message = "Analyse de l'image...";
      icon = "fa-eye";
      break;
    case AppState.SEARCHING:
      message = "Recherche historique...";
      icon = "fa-search";
      break;
    case AppState.GENERATING_AUDIO:
      message = "Création de la narration...";
      icon = "fa-microphone-alt";
      break;
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
             <i className={`fas ${icon} text-white text-xl animate-pulse`}></i>
        </div>
      </div>
      <h2 className="mt-6 text-xl font-medium text-white tracking-wide">{message}</h2>
      <p className="text-white/50 text-sm mt-2">Propulsé par Gemini</p>
    </div>
  );
};