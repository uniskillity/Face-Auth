
import React, { useState, useEffect, useCallback } from 'react';
import { AuthState, UserProfile, RecognitionResult, AuthLog } from './types';
import { analyzeFace, verifyIdentity } from './services/geminiService';
import CameraFeed from './components/CameraFeed';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.IDLE);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('visionauth_pro_user');
    const savedLogs = localStorage.getItem('visionauth_pro_logs');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedLogs) setAuthLogs(JSON.parse(savedLogs));
  }, []);

  const addLog = useCallback((type: 'enrollment' | 'verification', success: boolean, confidence: number) => {
    const newLog: AuthLog = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      timestamp: Date.now(),
      type,
      success,
      confidence
    };
    const updatedLogs = [newLog, ...authLogs].slice(0, 5);
    setAuthLogs(updatedLogs);
    localStorage.setItem('visionauth_pro_logs', JSON.stringify(updatedLogs));
  }, [authLogs]);

  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    setLastResult(null);

    try {
      if (authState === AuthState.ENROLLING) {
        const result = await analyzeFace(imageData);
        if (result.analysis?.liveness && result.match) {
          const newUser: UserProfile = {
            id: 'VA_NODE_' + Math.random().toString(36).toUpperCase().substr(2, 6),
            email: 'dev@visionauth.io',
            enrolledFaceData: imageData,
            enrolledAt: Date.now(),
          };
          setUser(newUser);
          localStorage.setItem('visionauth_pro_user', JSON.stringify(newUser));
          setAuthState(AuthState.AUTHENTICATED);
          addLog('enrollment', true, result.confidence);
          setLastResult({ ...result, message: "REGISTRATION_SUCCESS: NODE_CONNECTED" });
        } else {
          setLastResult({ ...result, message: result.message || "SCAN_FAILURE: QUALITY_METRICS_LOW" });
          addLog('enrollment', false, result.confidence);
        }
      } else if (authState === AuthState.VERIFYING && user?.enrolledFaceData) {
        const result = await verifyIdentity(user.enrolledFaceData, imageData);
        if (result.match && result.confidence > 0.85) {
          setAuthState(AuthState.AUTHENTICATED);
          addLog('verification', true, result.confidence);
          setLastResult({ ...result, message: "IDENTITY_VERIFIED: ACCESS_GRANTED" });
        } else {
          setAuthState(AuthState.FAILED);
          addLog('verification', false, result.confidence);
          setLastResult({ ...result, message: "MISMATCH: IDENTITY_NOT_RECOGNIZED" });
        }
      }
    } catch (err) {
      console.error(err);
      setLastResult({ match: false, confidence: 0, message: "SYSTEM_ERROR: BIOMETRIC_PIPELINE_STALLED" });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSession = () => {
    if (confirm("Permanently wipe local biometric profile?")) {
      localStorage.removeItem('visionauth_pro_user');
      setUser(null);
      setAuthState(AuthState.IDLE);
      setLastResult(null);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center">
      {/* Dynamic Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-8 flex justify-center">
        <div className="max-w-7xl w-full flex items-center justify-between glass-panel rounded-3xl px-8 h-16 border-white/10">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setAuthState(AuthState.IDLE)}>
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 0a10.003 10.003 0 018.143 4.194M12 3v1m0 16v1m9-9h-1M3 12H2" /></svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Vision<span className="text-blue-500">Auth</span></span>
          </div>

          <div className="hidden md:flex space-x-10 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
            <a href="#" className="hover:text-blue-400 transition-colors">Protocol</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Security</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Devs</a>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
               <button 
                  onClick={() => setAuthState(AuthState.VERIFYING)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
               >
                 Sign In
               </button>
            ) : (
               <button 
                  onClick={() => setAuthState(AuthState.ENROLLING)}
                  className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
               >
                 Register
               </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Experience */}
      <main className="w-full max-w-7xl px-6 pt-40 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left: Portal / Interface */}
          <div className="lg:col-span-7 flex flex-col space-y-8 fade-in-up">
            <div className="glass-panel rounded-[2.5rem] p-1.5 border-white/5 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
              {authState === AuthState.IDLE ? (
                <div className="flex-1 flex flex-col justify-center items-center p-12 text-center space-y-10 animate-in fade-in duration-700">
                  <div className="w-24 h-24 bg-blue-600/10 border-2 border-blue-500/20 rounded-[2rem] flex items-center justify-center text-blue-500 animate-pulse">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold tracking-tight">Biometric Gateway</h2>
                    <p className="text-white/40 max-w-sm mx-auto">Initialize your hardware-backed biometric session. No data leaves this device.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    {user ? (
                      <button 
                        onClick={() => setAuthState(AuthState.VERIFYING)}
                        className="flex-1 px-8 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20"
                      >
                        Launch Authenticator
                      </button>
                    ) : (
                      <button 
                        onClick={() => setAuthState(AuthState.ENROLLING)}
                        className="flex-1 px-8 py-5 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold transition-all shadow-xl"
                      >
                        Enroll New Identity
                      </button>
                    )}
                  </div>
                </div>
              ) : authState === AuthState.AUTHENTICATED ? (
                <div className="flex-1 flex flex-col justify-center items-center p-12 text-center space-y-8 animate-in zoom-in fade-in duration-500">
                   <div className="status-pulse w-32 h-32 bg-green-500/10 border-4 border-green-500/30 rounded-full flex items-center justify-center text-green-500">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-5xl font-extrabold tracking-tighter">VERIFIED</h3>
                     <p className="text-green-400 font-mono text-[11px] uppercase tracking-[0.3em]">Access_Level: Alpha_Clearance</p>
                   </div>
                   <button 
                      onClick={() => setAuthState(AuthState.IDLE)}
                      className="px-10 py-4 glass-panel hover:bg-white/5 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-white/10"
                   >
                      Lock Environment
                   </button>
                </div>
              ) : authState === AuthState.FAILED ? (
                <div className="flex-1 flex flex-col justify-center items-center p-12 text-center space-y-8 animate-in zoom-in fade-in duration-300">
                   <div className="w-32 h-32 bg-red-500/10 border-4 border-red-500/30 rounded-full flex items-center justify-center text-red-500">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-4xl font-extrabold tracking-tighter">AUTH_FAILURE</h3>
                     <p className="text-red-400/60 font-medium px-4 py-2 bg-red-500/5 rounded-xl border border-red-500/10">
                       {lastResult?.message || "BIOMETRIC_MISMATCH"}
                     </p>
                   </div>
                   <div className="flex gap-4">
                      <button 
                        onClick={() => setAuthState(AuthState.VERIFYING)}
                        className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-600/20 uppercase tracking-widest text-[10px]"
                      >
                        Re-Scan Face
                      </button>
                      <button 
                        onClick={() => setAuthState(AuthState.IDLE)}
                        className="px-8 py-4 glass-panel rounded-2xl font-bold uppercase tracking-widest text-[10px]"
                      >
                        Abort
                      </button>
                   </div>
                </div>
              ) : (
                <div className="p-8 flex-1 flex flex-col space-y-6">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-blue-400">
                           {authState === AuthState.ENROLLING ? 'Registering_New_Node' : 'Identity_Verification'}
                        </span>
                     </div>
                     <button onClick={() => setAuthState(AuthState.IDLE)} className="text-white/20 hover:text-white text-xs font-bold uppercase tracking-widest">Terminate</button>
                   </div>
                   <CameraFeed 
                      onCapture={handleCapture} 
                      isProcessing={isProcessing} 
                      isScanning={true}
                      instruction={authState === AuthState.ENROLLING ? "Center your face in the frame" : "Hold still for biometric mapping"}
                   />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Latency', value: '24ms', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                 { label: 'Confidence', value: '99.4%', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                 { label: 'Network', value: 'P2P', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
                 { label: 'Security', value: 'AES-256', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
               ].map((stat, i) => (
                 <div key={i} className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col items-center text-center space-y-1">
                    <svg className="w-4 h-4 text-blue-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{stat.label}</span>
                    <span className="text-xs font-bold mono">{stat.value}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Right: Pitch & Logs */}
          <div className="lg:col-span-5 space-y-12 fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-6">
               <h1 className="text-7xl font-extrabold tracking-tighter leading-[0.9] text-white">
                 Zero Trust. <br/>
                 <span className="shimmer-text">Face First.</span>
               </h1>
               <p className="text-white/40 text-lg leading-relaxed font-medium">
                 VisionAuth is the standard for modern biometric pipelines. Built for speed, pinned to privacy.
               </p>
            </div>

            {/* Profile & History */}
            <div className="glass-panel rounded-[2rem] p-8 space-y-8 border-white/10">
               <div className="flex justify-between items-center">
                 <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Local Infrastructure</h3>
                 {user && <button onClick={clearSession} className="text-[10px] font-bold text-red-500/50 hover:text-red-500 transition-colors uppercase">Wipe Node</button>}
               </div>
               
               {user ? (
                 <div className="space-y-6">
                   <div className="flex items-center space-x-5">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                         {user.enrolledFaceData ? (
                            <img src={user.enrolledFaceData} className="w-full h-full object-cover grayscale opacity-60" alt="Node Thumb" />
                         ) : (
                            <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                         )}
                      </div>
                      <div>
                         <p className="text-xl font-bold text-white tracking-tight">{user.id}</p>
                         <p className="text-[9px] mono font-bold text-white/20 uppercase tracking-widest mt-1">Status: Active_Node</p>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Audit Log</p>
                      {authLogs.length === 0 ? (
                        <p className="text-[9px] mono text-white/10 italic uppercase">No events recorded...</p>
                      ) : (
                        authLogs.map(log => (
                          <div key={log.id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] mono">
                             <div className="flex items-center space-x-3">
                               <div className={`w-1.5 h-1.5 rounded-full ${log.success ? 'bg-green-500 shadow-[0_0_5px_green]' : 'bg-red-500 shadow-[0_0_5px_red]'}`} />
                               <span className="uppercase text-white/50">{log.type}</span>
                             </div>
                             <span className="text-white/20">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                   </div>
                 </div>
               ) : (
                 <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <p className="text-[10px] mono font-bold text-white/20 uppercase tracking-[0.3em]">Hardware ID Not Linked</p>
                 </div>
               )}
            </div>

            {/* Newsletter Access */}
            <div className="p-8 glass-panel rounded-[2rem] border-blue-500/20 bg-blue-500/[0.02] space-y-6">
               <h3 className="text-xl font-bold">Request Developer API</h3>
               <p className="text-sm text-white/40 leading-relaxed">Join 12k developers building the next wave of secure biometric apps.</p>
               <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); alert("Access token sent to your terminal."); }}>
                  <input 
                    type="email" 
                    required
                    placeholder="dev@studio.io" 
                    className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500 transition-all text-xs mono"
                  />
                  <button type="submit" className="px-6 py-4 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all">Join</button>
               </form>
            </div>
          </div>

        </div>
      </main>

      <footer className="w-full border-t border-white/5 py-16 mt-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] mono font-bold uppercase tracking-[0.3em] text-white/20">
          <div className="flex items-center space-x-8">
            <span className="text-white/40">© 2024 VisionAuth Lab</span>
            <span>Stable_Core: v2.4.0</span>
          </div>
          <div className="flex space-x-12">
            <a href="#" className="hover:text-blue-500 transition-colors">Manifesto</a>
            <a href="#" className="hover:text-blue-500 transition-colors">System_Logs</a>
            <a href="#" className="hover:text-blue-500 transition-colors">X_Social</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
