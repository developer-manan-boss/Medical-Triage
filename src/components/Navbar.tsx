import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Video, 
  ClipboardList, 
  Stethoscope, 
  Building2, 
  History, 
  Volume2, 
  VolumeX, 
  Radio
} from 'lucide-react';
import { getMuteState, setMuteState, getVoiceEnabledState, setVoiceEnabledState } from '../utils/audioAlerts';

interface NavbarProps {
  activeTab: 'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit';
  setActiveTab: (tab: 'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit') => void;
  pendingIntakeCount: number;
  activeCriticalCount: number;
  availableBedsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingIntakeCount,
  activeCriticalCount,
  availableBedsCount
}) => {
  const [muted, setMuted] = React.useState(getMuteState());
  const [voiceEnabled, setVoiceEnabled] = React.useState(getVoiceEnabledState());

  const toggleMute = () => {
    const next = !muted;
    setMuteState(next);
    setMuted(next);
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabledState(next);
    setVoiceEnabled(next);
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-950/50">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  LifePulse AI
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-950/80 border border-red-700/60 text-red-400 uppercase">
                  Triage 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hospital CCTV Live Triage & Automated Bed Allocation
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('cctv')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'cctv'
                  ? 'bg-red-600/90 text-white shadow-md shadow-red-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4 text-red-400" />
              <span>CCTV Live Feed</span>
              {activeCriticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-red-700 animate-pulse">
                  {activeCriticalCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('receptionist')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'receptionist'
                  ? 'bg-blue-600/90 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-blue-400" />
              <span>Reception Desk</span>
              {pendingIntakeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 animate-bounce">
                  {pendingIntakeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'doctor'
                  ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span>Doctor Station</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-purple-600/90 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Rooms & Admin</span>
              <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-emerald-400 border border-emerald-500/20">
                {availableBedsCount} Beds Open
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-slate-400" />
              <span className="hidden lg:inline">Audit Logs</span>
            </button>
          </nav>

          {/* Right Controls: Audio & Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              title={voiceEnabled ? 'Hospital PA Announcements Enabled' : 'PA Announcements Muted'}
              className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                voiceEnabled
                  ? 'bg-slate-800/80 border-slate-700 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span className="hidden xl:inline">{voiceEnabled ? 'Voice PA: ON' : 'Voice PA: OFF'}</span>
            </button>

            <button
              onClick={toggleMute}
              title={muted ? 'Unmute Emergency Sirens' : 'Mute Emergency Sirens'}
              className={`p-2 rounded-lg border transition-colors ${
                muted
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  : 'bg-red-950/60 border-red-800/60 text-red-400 hover:bg-red-900/50'
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
