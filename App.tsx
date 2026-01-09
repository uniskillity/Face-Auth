
import React, { useState, useEffect } from 'react';
import { AuthState, UserProfile, RecognitionResult } from './types';
import { analyzeFace, verifyIdentity } from './services/geminiService';
import CameraFeed from './components/CameraFeed';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.IDLE);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'success'>('idle');

  // Persistence check for the demo
  useEffect(() => {
    const savedUser = localStorage.getItem('demo_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    setLastResult(null);

    if (authState === AuthState.ENROLLING) {
      // Step 1: Analyze if the face is good for enrollment
      const result = await analyzeFace(imageData);
      if (result.analysis?.liveness && result.match) {
        const newUser: UserProfile = {
          id: Date.now().toString(),
          email: 'demo@visionauth.io',
          enrolledFaceData: imageData,
        };
        setUser(newUser);
        localStorage.setItem('demo_user', JSON.stringify(newUser));
        setAuthState(AuthState.AUTHENTICATED);
        setLastResult({ ...result, message: "Enrolled successfully! Identity secured." });
      } else {
        setLastResult({ ...result, message: result.message || "Quality check failed. Ensure good lighting." });
      }
    } else if (authState === AuthState.VERIFYING) {
      // Step 2: Compare against stored face
      if (user?.enrolledFaceData) {
        const result = await verifyIdentity(user.enrolledFaceData, imageData);
        if (result.match && result.confidence > 0.8) {
          setAuthState(AuthState.AUTHENTICATED);
        } else {
          setAuthState(AuthState.FAILED);
        }
        setLastResult(result);
      }
    }
    setIsProcessing(false);
  };

  const resetAuth = () => {
    setAuthState(AuthState.IDLE);
    setLastResult(null);
  };

  const clearProfile = () => {
    localStorage.removeItem('demo_user');
    setUser(null);
    setAuthState(AuthState.IDLE);
    setLastResult(null);
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput) {
      setWaitlistStatus('success');
      setEmailInput('');
      setTimeout(() => setWaitlistStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="font-bold text-xs">VA</span>
            </div>
            <span className="text-xl font-bold tracking-tight">VisionAuth</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </div>
          <button className="text-sm px-4 py-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors">
            Contact Sales
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Demo Area */}
          <div className="space-y-8">
            <div className="glass-panel rounded-3xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Identity Portal</h2>
                  <p className="text-gray-400 text-sm">Biometric Authentication Node</p>
                </div>
                {user && (
                  <button 
                    onClick={clearProfile}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Reset Profile
                  </button>
                )}
              </div>

              {(authState === AuthState.IDLE || authState === AuthState.AUTHENTICATED || authState === AuthState.FAILED) ? (
                <div className="space-y-6">
                  {authState === AuthState.AUTHENTICATED ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                      <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-green-400">Identity Verified</h3>
                      <p className="text-gray-400 max-w-xs">Access granted to the secure environment. Your biometric token is active.</p>
                      <button 
                        onClick={resetAuth}
                        className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm transition-all"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : authState === AuthState.FAILED ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-red-400">Access Denied</h3>
                      <p className="text-gray-400 max-w-xs">Face profile did not match our records. Please ensure you are the registered user.</p>
                      <button 
                        onClick={() => setAuthState(AuthState.VERIFYING)}
                        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm transition-all font-semibold"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-400 text-sm">Select an operation to begin the demonstration.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {!user ? (
                          <button 
                            onClick={() => setAuthState(AuthState.ENROLLING)}
                            className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl text-left hover:scale-[1.02] transition-transform shadow-xl"
                          >
                            <h4 className="font-bold text-lg mb-1">Enroll Face</h4>
                            <p className="text-blue-100 text-sm">Register your biometric identity in our secure vault.</p>
                          </button>
                        ) : (
                          <button 
                            onClick={() => setAuthState(AuthState.VERIFYING)}
                            className="p-6 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl text-left hover:scale-[1.02] transition-transform shadow-xl"
                          >
                            <h4 className="font-bold text-lg mb-1">Verify Identity</h4>
                            <p className="text-green-100 text-sm">Authenticate using your registered face profile.</p>
                          </button>
                        )}
                        <div className="p-6 glass-panel rounded-2xl border-white/5">
                          <h4 className="font-bold text-lg mb-1 text-gray-300">Quick Docs</h4>
                          <p className="text-gray-500 text-sm">Open-source SDKs for React, iOS, and Android.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                      {authState === AuthState.ENROLLING ? 'Biometric Enrollment' : 'Identity Verification'}
                    </span>
                    <button onClick={resetAuth} className="text-gray-500 hover:text-white">
                      Cancel
                    </button>
                  </div>
                  <CameraFeed 
                    onCapture={handleCapture} 
                    isProcessing={isProcessing} 
                    isScanning={true}
                  />
                  {lastResult && !lastResult.match && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {lastResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Panel */}
            <div className="glass-panel rounded-2xl p-6 border-blue-500/20 bg-blue-500/[0.02]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Security Analytics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400">Latentency</span>
                  <p className="text-sm font-mono text-blue-300">142ms</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400">Engine</span>
                  <p className="text-sm font-mono text-blue-300">Gemini-V2</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400">Protocol</span>
                  <p className="text-sm font-mono text-blue-300">FIDO2 Ready</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Copy/Marketing */}
          <div className="space-y-12">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                The future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Secure Identity</span>.
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed">
                VisionAuth provides a lightweight, open-source facial recognition framework for modern web applications. 
                Built for privacy-first authentication without the complexity of traditional biometric silos.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="mt-1 w-6 h-6 rounded bg-blue-600/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-white">Liveness Detection</h4>
                  <p className="text-gray-400 text-sm">Advanced anti-spoofing engine prevents unauthorized access via photos or masks.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="mt-1 w-6 h-6 rounded bg-purple-600/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-white">Zero-Knowledge Storage</h4>
                  <p className="text-gray-400 text-sm">Biometric hashes are computed locally and never stored as raw images in the cloud.</p>
                </div>
              </div>
            </div>

            {/* Email Capture */}
            <div className="pt-8 border-t border-white/10">
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="font-bold mb-2">Get Early Access</h3>
                <p className="text-sm text-gray-400 mb-6">Join our developer waitlist for API keys and documentation updates.</p>
                
                {waitlistStatus === 'success' ? (
                  <div className="p-3 bg-green-500/10 text-green-400 rounded-lg text-sm text-center font-medium">
                    Successfully joined! Check your inbox soon.
                  </div>
                ) : (
                  <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email" 
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="font-bold text-white">VisionAuth</span>
            <span>&copy; 2024 Biometric Security Group</span>
          </div>
          <div className="flex space-x-8">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">GitHub</a>
            <a href="#" className="hover:text-white">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
