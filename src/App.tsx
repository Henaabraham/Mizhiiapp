import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Eye, IndianRupee, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeScene } from './services/gemini';

type Mode = 'home' | 'street' | 'money';

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAlert, setLastAlert] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisInterval = useRef<NodeJS.Timeout | null>(null);
  const lastAlertTime = useRef<number>(0);

  // --- Voice & Haptics ---
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // --- Camera Logic ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Camera access denied. Please enable permissions.");
      speak("Camera access denied. Please enable permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // --- Analysis Loop ---
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    const now = Date.now();
    // Minimum 3-second gap between alerts as per requirements
    if (now - lastAlertTime.current < 3000) return;

    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Check if video is ready
    if (video.videoWidth === 0) {
      setIsAnalyzing(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.6);
      
      const result = await analyzeScene(base64Image, mode === 'street' ? 'street' : 'money');
      
      // For Money mode, we allow repeating the same value if it's detected again 
      // after a short delay, to help users confirm they are holding the same or a new note.
      const isNewAlert = result !== lastAlert;
      const isMoneyMode = mode === 'money';
      const timeSinceLastAlert = now - lastAlertTime.current;

      if (result && (isNewAlert || (isMoneyMode && timeSinceLastAlert > 5000))) {
        setLastAlert(result);
        speak(result);
        lastAlertTime.current = Date.now();

        // Vibrate if "Stop" or "Very close" is detected
        if (result.toLowerCase().includes('stop') || result.toLowerCase().includes('very close')) {
          vibrate([200, 100, 200]);
        }
      }
    }
    setIsAnalyzing(false);
  }, [mode, isAnalyzing, lastAlert]);

  useEffect(() => {
    if (mode !== 'home') {
      startCamera();
      // Run analysis every 4 seconds to avoid overwhelming the API
      analysisInterval.current = setInterval(captureAndAnalyze, 4000);
      speak(`${mode === 'street' ? 'Street Smart' : 'Money Sense'} mode activated.`);
    } else {
      stopCamera();
      if (analysisInterval.current) clearInterval(analysisInterval.current);
    }

    return () => {
      stopCamera();
      if (analysisInterval.current) clearInterval(analysisInterval.current);
    };
  }, [mode, captureAndAnalyze]);

  // --- UI Components ---
  const HomeView = () => (
    <div className="flex flex-col h-full p-6 gap-6 bg-zinc-950">
      <header className="py-8 text-center">
        <h1 className="text-6xl font-black text-white tracking-tighter mb-2">MIZHI</h1>
        <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest">AI Vision Assistant</p>
      </header>

      <button
        id="street-mode-btn"
        onClick={() => setMode('street')}
        className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all rounded-3xl flex flex-col items-center justify-center gap-4 text-zinc-950 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
      >
        <Eye size={80} strokeWidth={2.5} />
        <span className="text-3xl font-bold uppercase tracking-tight">Street Smart</span>
      </button>

      <button
        id="money-mode-btn"
        onClick={() => setMode('money')}
        className="flex-1 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all rounded-3xl flex flex-col items-center justify-center gap-4 text-zinc-950 shadow-[0_0_40px_rgba(251,191,36,0.2)]"
      >
        <IndianRupee size={80} strokeWidth={2.5} />
        <span className="text-3xl font-bold uppercase tracking-tight">Money Sense</span>
      </button>
    </div>
  );

  const ActiveView = () => (
    <div className="relative h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <button
            onClick={() => setMode('home')}
            className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20"
          >
            <ArrowLeft size={32} />
          </button>
          
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
            {isAnalyzing ? (
              <Loader2 className="animate-spin text-emerald-400" size={20} />
            ) : (
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
            <span className="text-white font-mono text-xs uppercase tracking-widest">
              {isAnalyzing ? 'Analyzing' : 'Live'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {lastAlert && (
              <motion.div
                key={lastAlert}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 bg-white rounded-3xl shadow-2xl"
              >
                <p className="text-3xl font-bold text-zinc-900 leading-tight">
                  {lastAlert}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 text-center">
            <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest">
              {mode === 'street' ? 'Detecting Obstacles & Traffic' : 'Detecting Indian Currency'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-8 text-center">
          <div className="space-y-4">
            <AlertCircle size={64} className="mx-auto text-red-500" />
            <p className="text-xl text-white font-bold">{error}</p>
            <button 
              onClick={() => setMode('home')}
              className="px-8 py-3 bg-white text-black rounded-full font-bold"
            >
              Go Back
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full bg-zinc-950 text-white font-sans selection:bg-emerald-500/30">
      {mode === 'home' ? <HomeView /> : <ActiveView />}
    </div>
  );
}
