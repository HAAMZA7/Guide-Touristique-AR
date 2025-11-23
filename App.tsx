import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { ResultView } from './components/ResultView';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AppState, AnalysisResult } from './types';
import { identifyLandmark, getLandmarkDetails, generateLandmarkAudio } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const processImage = async (base64Data: string) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg('');

    try {
      // 1. Identify
      const name = await identifyLandmark(base64Data);
      
      // Removed strict "Inconnu" check to allow descriptions to pass through to search

      setAppState(AppState.SEARCHING);
      
      // 2. Get Details & Search
      const { text, groundingChunks } = await getLandmarkDetails(name);

      setAppState(AppState.GENERATING_AUDIO);

      // 3. Generate Audio
      const audioBuffer = await generateLandmarkAudio(text);

      setResult({
        landmarkName: name,
        description: text,
        groundingSource: groundingChunks,
        audioBuffer: audioBuffer
      });

      setAppState(AppState.RESULT);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Une erreur est survenue lors du traitement.");
      setAppState(AppState.ERROR);
    }
  };

  const handleCapture = (base64Data: string) => {
    setCapturedImage(base64Data);
    setCapturedImagePreview(`data:image/jpeg;base64,${base64Data}`);
    processImage(base64Data);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setCapturedImagePreview(result);
      setCapturedImage(base64Data);
      processImage(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setCapturedImage(null);
    setCapturedImagePreview(null);
    setResult(null);
    setErrorMsg('');
  };

  return (
    <div className="w-full h-full min-h-screen bg-black">
      {appState === AppState.IDLE && (
        <CameraView onCapture={handleCapture} onFileUpload={handleFileUpload} />
      )}

      {(appState === AppState.ANALYZING || 
        appState === AppState.SEARCHING || 
        appState === AppState.GENERATING_AUDIO) && (
        <>
          {capturedImagePreview && (
             <img src={capturedImagePreview} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" alt="processing" />
          )}
          <LoadingOverlay state={appState} />
        </>
      )}

      {appState === AppState.RESULT && result && capturedImagePreview && (
        <ResultView 
          imageSrc={capturedImagePreview} 
          result={result} 
          onReset={handleReset} 
        />
      )}

      {appState === AppState.ERROR && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Oups !</h2>
            <p className="text-gray-300 mb-8">{errorMsg}</p>
            <button 
                onClick={handleReset}
                className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition"
            >
                Réessayer
            </button>
        </div>
      )}
    </div>
  );
};

export default App;