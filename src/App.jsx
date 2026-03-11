import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, Star, Sparkles, RefreshCcw, Settings, Lock, X, Plus, Trash2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAkLIlQs8y2YPwBoSbw822Uy_oP2lemyCI",
  authDomain: "award-55adc.firebaseapp.com",
  projectId: "award-55adc",
  storageBucket: "award-55adc.firebasestorage.app",
  messagingSenderId: "160993579356",
  appId: "1:160993579356:web:72438c6ec5feb583953199"
};

// Initialize Firebase
let db = null;
try {
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (error) {
  console.warn("Firebase not initialized yet. Add your config.");
}

// --- Configuration ---
const IMAGES = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg"
];

const INITIAL_PARTICIPANTS = [
  { name: "Production", odds: 1 },
  { name: "Warehouse", odds: 1 },
  { name: "Quality", odds: 1 },
  { name: "Lab", odds: 1 },
  { name: "IT", odds: 1 }
];

export default function App() {
  const [phase, setPhase] = useState('countdown'); // 'countdown', 'wheel', 'winner'
  const [winner, setWinner] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  
  // Admin States
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Configurable States
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 15000)); 
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);

  // Slide Show State
  const [currentImage, setCurrentImage] = useState(0);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState(0);

  // --- FIREBASE SYNC LOGIC ---
  useEffect(() => {
    if (!db) return;

    // Listen to real-time changes from the database
    const unsubscribe = onSnapshot(doc(db, "events", "copan-drawing"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.targetDate) {
          const newTarget = new Date(data.targetDate);
          setTargetDate(prev => (prev.getTime() !== newTarget.getTime()) ? newTarget : prev);
        }
        if (data.participants && Array.isArray(data.participants)) {
          setParticipants(prev => JSON.stringify(prev) !== JSON.stringify(data.participants) ? data.participants : prev);
        }
      }
    }, (error) => {
       console.error("Error listening to database:", error);
    });

    return () => unsubscribe();
  }, []);

  // Save settings to the database
  const saveSettingsToDB = async () => {
    setIsSaving(true);
    if (db) {
      try {
        await setDoc(doc(db, "events", "copan-drawing"), {
          targetDate: targetDate.toISOString(),
          participants: participants
        });
      } catch (err) {
        console.error("Failed to save to database:", err);
        alert("Failed to save to database. Check console for details.");
      }
    } else {
      alert("Firebase is not configured! Check your config object.");
    }
    setIsSaving(false);
    setIsAdminOpen(false);
  };

  // Keyboard listener for secret admin panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input field
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'p' || e.key === 'P') {
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Handle Automatic Slideshow
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 4000); // Rotate every 4 seconds
    return () => clearInterval(slideInterval);
  }, []);

  // 2. Handle Countdown Timer
  useEffect(() => {
    if (phase === 'countdown') {
      setShowWinnerModal(false); // Reset modal state if timer changes
      
      const calculateTimeLeft = () => Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000));
      
      const initialLeft = calculateTimeLeft();
      setTimeLeft(initialLeft);
      
      // If a user arrives late, skip the interval and go straight to the wheel spin
      if (initialLeft <= 0) {
        setPhase('wheel');
        return;
      }
      
      const timer = setInterval(() => {
        const currentLeft = calculateTimeLeft();
        setTimeLeft(currentLeft);
        
        if (currentLeft <= 0) {
          clearInterval(timer);
          setTimeout(() => setPhase('wheel'), 1000);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, targetDate]);

  // Format time for display
  const formatTime = (totalSeconds) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  };

  const { days, hours, minutes, seconds } = formatTime(timeLeft);

  // 3. Wheel Spin Logic Callback
  const handleWheelComplete = (winningName) => {
    setWinner(winningName);
    setTimeout(() => {
      setPhase('winner');
      setShowWinnerModal(true);
    }, 1000); // brief pause after wheel stops before popping the modal
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden font-sans border-4 border-amber-500/50">
      
      {/* LEFT PANEL - Slideshow */}
      <div className="w-full md:flex-1 h-[45vh] sm:h-[50vh] md:h-screen flex flex-col relative shadow-2xl z-10 bg-black border-b-2 md:border-b-0 md:border-r-2 border-amber-500/30">
        
        {/* Slideshow Image Area */}
        <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
          {IMAGES.map((img, index) => (
            <img
              key={img}
              src={img}
              alt={`Copan Award View ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-contain p-4 md:p-8 transition-opacity duration-1000 ease-in-out ${
                index === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))}
          {/* Subtle overlay gradient to blend with the dark theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-slate-950 pointer-events-none" />
        </div>
        
        {/* Permanent Titles on the slideshow side */}
        <div className="w-full p-4 sm:p-6 md:absolute md:bottom-8 md:left-8 md:p-0 z-20 pointer-events-none bg-gradient-to-t from-slate-950 to-transparent md:bg-none shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <Trophy className="text-amber-400 w-7 h-7 sm:w-8 sm:h-8 md:w-12 md:h-12 shrink-0" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-tight drop-shadow-sm pb-1 md:pb-2 leading-tight">
              Building Together Award
            </h1>
          </div>
          <p className="text-slate-300 text-sm sm:text-base md:text-xl font-medium tracking-wide ml-9 sm:ml-11 md:ml-15 mt-1 md:mt-2">
            Brought to you by <a href="https://techlacaze.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 hover:underline pointer-events-auto transition-colors">techlacaze.com</a>
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Content Area */}
      <div className="w-full md:flex-1 flex-1 min-h-[55vh] md:min-h-0 md:h-screen flex flex-col items-center justify-center relative p-4 sm:p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
        
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* --- PHASE 1: COUNTDOWN --- */}
        <div 
          className={`transition-all duration-1000 w-full flex flex-col items-center justify-center ${
            phase === 'countdown' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-20 absolute pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-10 text-amber-400">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            <h2 className="text-lg sm:text-2xl font-semibold tracking-widest uppercase text-center">Drawing Commences In</h2>
          </div>

          <div className="flex gap-2 sm:gap-4 md:gap-8 justify-center w-full">
            <TimeUnit value={days} label="Days" />
            <span className="text-3xl sm:text-4xl md:text-6xl font-light text-slate-600 mt-3 md:mt-2">:</span>
            <TimeUnit value={hours} label="Hours" />
            <span className="text-3xl sm:text-4xl md:text-6xl font-light text-slate-600 mt-3 md:mt-2">:</span>
            <TimeUnit value={minutes} label="Minutes" />
            <span className="text-3xl sm:text-4xl md:text-6xl font-light text-amber-500/50 mt-3 md:mt-2">:</span>
            <TimeUnit value={seconds} label="Seconds" highlight />
          </div>

          {/* --- NEW: CONTESTANTS LIST --- */}
          <div className="mt-12 sm:mt-16 w-full max-w-2xl flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Star className="w-4 h-4 text-amber-500/70" />
              <h3 className="text-xs sm:text-sm text-amber-500/70 uppercase tracking-widest font-semibold">
                Contestants
              </h3>
              <Star className="w-4 h-4 text-amber-500/70" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-2 sm:px-4 max-h-[25vh] overflow-y-auto w-full pb-4">
              {participants.map((p, i) => (
                <div 
                  key={i} 
                  className="bg-slate-800/80 border border-slate-700 text-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-sm font-medium shadow-lg backdrop-blur-sm"
                >
                  {p.name}
                </div>
              ))}
              
              {participants.length === 0 && (
                 <span className="text-slate-500 italic text-sm">No contestants found.</span>
              )}
            </div>
          </div>
        </div>

        {/* --- PHASE 2 & 3: WHEEL SPIN --- */}
        <div 
          className={`transition-all duration-1000 w-full flex flex-col items-center justify-center absolute ${
            phase === 'wheel' || phase === 'winner' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
          }`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-400 mb-6 sm:mb-10 drop-shadow-md">Selecting Winner...</h2>
          {(phase === 'wheel' || phase === 'winner') && (
            <PrizeWheel participants={participants} targetDate={targetDate} onComplete={handleWheelComplete} />
          )}
        </div>

        {/* Banner to re-open modal if closed */}
        {phase === 'winner' && !showWinnerModal && (
           <button 
             onClick={() => setShowWinnerModal(true)}
             className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700 shadow-xl"
           >
             <Trophy className="w-4 h-4" /> View Winner
           </button>
        )}
      </div>

      {/* --- PHASE 3: WINNER MODAL --- */}
      {phase === 'winner' && showWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 md:p-16 max-w-2xl w-full text-center shadow-[0_0_100px_rgba(245,158,11,0.2)] animate-in fade-in zoom-in duration-500 relative overflow-hidden">
            
            {/* Modal decorative flares */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/30 blur-[50px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-300/20 blur-[50px] rounded-full" />

            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400 mx-auto mb-4 sm:mb-6 animate-bounce" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-medium text-slate-300 mb-2 uppercase tracking-widest">
              Congratulations
            </h2>
            <div className="py-4 sm:py-8">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 drop-shadow-lg scale-in-center break-words">
                {winner}
              </h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-lg max-w-md mx-auto mt-2 sm:mt-4">
              Your Department won the Copan "Building Together" Award!
            </p>

            <button 
              onClick={() => setShowWinnerModal(false)}
              className="mt-8 sm:mt-10 flex items-center justify-center gap-2 mx-auto bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-bold py-3 px-6 sm:px-8 rounded-full transition-all"
            >
              <X className="w-5 h-5" /> Close to View Images
            </button>
          </div>
        </div>
      )}

      {/* --- SECRET ADMIN PANEL --- */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => { setIsAdminOpen(false); setPassword(''); setIsAuthenticated(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Lock className="w-12 h-12 text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold mb-6 text-white">Admin Access Required</h2>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password === 'copanit') {
                      setIsAuthenticated(true);
                    }
                  }}
                  placeholder="Enter Password"
                  className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-amber-500 w-full max-w-[250px] text-center"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    if (password === 'copanit') setIsAuthenticated(true);
                    else alert('Incorrect password');
                  }}
                  className="bg-amber-500 text-slate-950 font-bold py-2 px-8 rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Login
                </button>
              </div>
            ) : (
              <div className="text-left text-slate-200 flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-4 mb-6 shrink-0">
                  <Settings className="w-6 h-6 text-amber-500" />
                  <h2 className="text-2xl font-bold">Event Settings</h2>
                  {!db && <span className="text-red-400 text-xs ml-auto">Firebase Config Missing!</span>}
                </div>

                <div className="mb-6 shrink-0">
                  <h3 className="text-lg font-semibold mb-2 text-amber-400">Target Date & Time</h3>
                  <input 
                    type="datetime-local" 
                    value={new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    onChange={(e) => {
                      if(e.target.value) {
                         setTargetDate(new Date(e.target.value));
                         setPhase('countdown');
                      }
                    }}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 w-full md:w-auto"
                  />
                  <p className="text-xs text-slate-400 mt-2">Setting this will calculate the time until the drawing automatically.</p>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <h3 className="text-lg font-semibold mb-1 text-amber-400 shrink-0">Participants & Odds</h3>
                  <p className="text-xs text-slate-400 mb-4 shrink-0">Higher odds numbers increase the chance of winning relative to others.</p>
                  
                  <div className="space-y-3 overflow-y-auto pr-2 pb-4 flex-1">
                    {participants.map((p, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          value={p.name}
                          onChange={(e) => {
                            const newP = [...participants];
                            newP[index].name = e.target.value;
                            setParticipants(newP);
                          }}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white flex-1"
                          placeholder="Participant Name"
                        />
                        <div className="flex items-center gap-2">
                           <span className="text-sm text-slate-400">Odds:</span>
                           <input 
                             type="number" 
                             min="0"
                             step="0.1"
                             value={p.odds}
                             onChange={(e) => {
                               const newP = [...participants];
                               newP[index].odds = parseFloat(e.target.value) || 0;
                               setParticipants(newP);
                             }}
                             className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-16 sm:w-20 text-center"
                           />
                        </div>
                        <button 
                          onClick={() => setParticipants(participants.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 p-2 bg-slate-800 rounded-lg border border-slate-600 shrink-0"
                          title="Remove"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setParticipants([...participants, { name: "New Participant", odds: 1 }])}
                    className="mt-2 shrink-0 flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm font-semibold py-2"
                  >
                    <Plus className="w-4 h-4" /> Add Participant
                  </button>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-700 mt-4 shrink-0">
                  <button 
                    onClick={saveSettingsToDB}
                    disabled={isSaving}
                    className="bg-amber-500 text-slate-950 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save & Done'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Countdown Time Unit Box Component
function TimeUnit({ value, label, highlight = false }) {
  const formattedValue = value.toString().padStart(2, '0');
  
  return (
    <div className="flex flex-col items-center">
      <div className={`
        relative overflow-hidden w-16 h-20 sm:w-20 sm:h-24 md:w-28 md:h-32 flex items-center justify-center rounded-2xl 
        ${highlight 
          ? 'bg-gradient-to-b from-amber-500/20 to-amber-900/20 border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' 
          : 'bg-slate-900/80 border border-slate-800 shadow-xl'
        }
      `}>
        {/* Glossy overlay */}
        <div className="absolute inset-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <span className={`text-4xl sm:text-5xl md:text-7xl font-bold font-mono ${highlight ? 'text-amber-400' : 'text-slate-100'}`}>
          {formattedValue}
        </span>
      </div>
      <span className="mt-2 sm:mt-4 text-[10px] sm:text-xs md:text-sm font-semibold tracking-widest text-slate-400 uppercase">
        {label}
      </span>
    </div>
  );
}

// PrizeWheel Component
function PrizeWheel({ participants, targetDate, onComplete }) {
  const numSegments = Math.max(1, participants.length); // Prevent NaN/Infinity if array is empty
  const segmentAngle = 360 / numSegments;
  
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const wheelRef = useRef(null);

  useEffect(() => {
    // Automatically start spinning slightly after mount
    const timer = setTimeout(() => {
      spinWheel();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const spinWheel = () => {
    if (isSpinning || participants.length === 0) return;
    setIsSpinning(true);

    // --- DETERMINISTIC SELECTION ---
    const seedString = targetDate.toISOString() + participants.map(p => p.name).join('');
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
       hash = Math.imul(31, hash) + seedString.charCodeAt(i) | 0;
    }
    let pseudoRandom = Math.abs(Math.sin(hash) * 10000);
    pseudoRandom = pseudoRandom - Math.floor(pseudoRandom);

    // Weighted Random Selection
    const totalOdds = participants.reduce((sum, p) => sum + (Number(p.odds) || 0), 0);
    let randomValue = pseudoRandom * totalOdds;
    let winningIndex = 0;
    
    // Find the winner based on accumulated odds
    for (let i = 0; i < participants.length; i++) {
      randomValue -= (Number(participants[i].odds) || 0);
      if (randomValue <= 0) {
        winningIndex = i;
        break;
      }
    }
    
    const currentAngleOffset = winningIndex * segmentAngle + (segmentAngle / 2);
    const extraSpins = 360 * 7; 
    const targetRotation = extraSpins + (360 - currentAngleOffset);

    setRotation(targetRotation);

    // Wait for the CSS transition to finish (8 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      onComplete(participants[winningIndex].name); 
    }, 8500); 
  };

  const colors = ['#1e293b', '#0f172a']; 
  const gradientStops = participants.map((_, i) => {
    const start = i * segmentAngle;
    const end = start + segmentAngle;
    const color = colors[i % colors.length];
    return `${color} ${start}deg ${end}deg`;
  }).join(', ');

  return (
    <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] lg:w-[450px] lg:h-[450px] flex items-center justify-center">
      
      {/* Outer Golden Rim */}
      <div className="absolute inset-[-8px] sm:inset-[-10px] rounded-full bg-gradient-to-br from-amber-300 via-amber-600 to-amber-900 shadow-[0_0_50px_rgba(245,158,11,0.3)] z-0" />
      <div className="absolute inset-[-4px] rounded-full bg-slate-950 z-0" />

      {/* The Wheel */}
      <div 
        ref={wheelRef}
        className="w-full h-full rounded-full relative overflow-hidden border-4 border-slate-900 z-10"
        style={{
          background: `conic-gradient(${gradientStops})`,
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 8s cubic-bezier(0.15, 0.0, 0.0, 1)' 
        }}
      >
        {participants.map((_, i) => (
          <div 
            key={`line-${i}`}
            className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-amber-500/30 origin-bottom"
            style={{ transform: `translateX(-50%) rotate(${i * segmentAngle}deg)` }}
          />
        ))}

        {participants.map((participant, i) => {
          const angle = i * segmentAngle + (segmentAngle / 2);
          return (
            <div 
              key={`${participant.name}-${i}`}
              className="absolute top-0 left-1/2 h-1/2 w-8 origin-bottom flex items-start justify-center pt-4 sm:pt-6 md:pt-10"
              style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
            >
              <span 
                className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-300 tracking-wider whitespace-nowrap"
                style={{
                  writingMode: 'vertical-rl',
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)' 
                }}
              >
                {participant.name}
              </span>
            </div>
          );
        })}
        
        {/* Inner Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-gradient-to-br from-amber-300 to-amber-600 rounded-full border-4 border-slate-900 shadow-inner flex items-center justify-center">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 text-slate-900 fill-current" />
        </div>
      </div>

      {/* Top Pointer */}
      <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 z-30 drop-shadow-xl">
        <div className="w-0 h-0 
          border-l-[10px] sm:border-l-[15px] border-l-transparent
          border-r-[10px] sm:border-r-[15px] border-r-transparent
          border-t-[20px] sm:border-t-[30px] border-t-amber-400" 
        />
        <div className="absolute -top-[18px] sm:-top-[28px] left-1/2 -translate-x-1/2 w-0 h-0 
          border-l-[6px] sm:border-l-[10px] border-l-transparent
          border-r-[6px] sm:border-r-[10px] border-r-transparent
          border-t-[12px] sm:border-t-[20px] border-t-amber-200" 
        />
      </div>

    </div>
  );
}