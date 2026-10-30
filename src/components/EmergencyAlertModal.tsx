import React from 'react';
import { 
  AlertTriangle, 
  Bed, 
  MapPin, 
  Clock, 
  UserCheck, 
  Phone, 
  ClipboardCheck, 
  Stethoscope, 
  X, 
  Droplet,
  ArrowRight
} from 'lucide-react';
import { PatientEmergencyCase } from '../types';

interface EmergencyAlertModalProps {
  currentCase: PatientEmergencyCase | null;
  onClose: () => void;
  onNavigateToTab: (tab: 'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit') => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  currentCase,
  onClose,
  onNavigateToTab
}) => {
  if (!currentCase) return null;

  const isCodeRed = currentCase.triageCode === 'RED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-3xl rounded-2xl border-2 bg-slate-900 shadow-2xl overflow-hidden ${
        isCodeRed ? 'border-red-600 shadow-red-950/80' : 'border-amber-500 shadow-amber-950/80'
      }`}>
        {/* Pulsing Emergency Header Banner */}
        <div className={`px-6 py-4 flex items-center justify-between ${
          isCodeRed ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider">
                  CODE {currentCase.triageCode} EMERGENCY ACTIVATED
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-black/40 text-white">
                  Score: {currentCase.seriousnessScore.toFixed(1)}/10
                </span>
              </div>
              <p className="text-xs text-white/90 font-medium">
                Detected at {currentCase.gateName} • Auto-Allocated Nearest Emergency Room
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Row: AI Face Snapshot & Auto-Allocated Room */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: AI Captured Face Snapshot */}
            <div className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center text-center">
              <div className="relative w-36 h-36 rounded-xl overflow-hidden border-2 border-red-500 shadow-lg shadow-red-950/60 mb-3 bg-slate-900">
                <img
                  src={currentCase.faceSnapshotUrl}
                  alt="Captured Patient Face"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-600 text-white">
                  AI CAPTURE
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                TEMP ID: {currentCase.id}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Forwarded to Receptionist for Documentation
              </p>
              {currentCase.isBleeding && (
                <span className="mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950 border border-red-700 text-red-400 flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-red-500 animate-pulse" />
                  Active Bleeding Alert
                </span>
              )}
            </div>

            {/* Right: Allocated Room & Transit ETA */}
            <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bed className="w-4 h-4 text-emerald-400" />
                  Auto-Allocated Emergency Bed
                </span>
                <div className="mt-2">
                  <h3 className="text-2xl font-black text-white">
                    {currentCase.allocatedRoom.roomNumber}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                    <span className="font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {currentCase.allocatedRoom.block}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>{currentCase.allocatedRoom.bedType}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Distance From Gate
                    </span>
                    <span className="text-base font-extrabold text-white flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      {currentCase.allocatedRoom.distanceMeters} Meters
                    </span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Estimated Transit
                    </span>
                    <span className="text-base font-extrabold text-amber-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      ~{currentCase.allocatedRoom.transitSeconds} Seconds
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Room marked RESERVED in Hospital Database. Bed prep initiated.</span>
              </div>
            </div>
          </div>

          {/* AI Clinical Findings & Equipment Readiness */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Clinical Triage Findings
              </span>
              {typeof currentCase.confidence === 'number' && (
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  AI Confidence: {Math.round(currentCase.confidence)}%
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-white">
              {currentCase.primaryObservedSymptom}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Mobility: <strong className="text-white">{currentCase.mobilityStatus || (currentCase.onStretcher ? 'Stretcher' : 'Walking')}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Distress: <strong className="text-white">{currentCase.distressLevel || 'Acute'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                Action: <strong className="text-slate-200">{currentCase.recommendedAction}</strong>
              </span>
            </div>

            {currentCase.requiredEquipment && currentCase.requiredEquipment.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                  Bedside Equipment Ready:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentCase.requiredEquipment.map((eq, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                      ✓ {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Row: Dispatched Tri-Response Team (Doctor, Nurse, Receptionist) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Nearest Responders Alerted ({currentCase.allocatedRoom.block}):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Doctor */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                <img
                  src={currentCase.assignedTeam.doctor.avatar}
                  alt={currentCase.assignedTeam.doctor.name}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-emerald-400 block uppercase">
                    Doctor on Duty
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {currentCase.assignedTeam.doctor.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentCase.assignedTeam.doctor.specialty}
                  </p>
                </div>
              </div>

              {/* Nurse */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                <img
                  src={currentCase.assignedTeam.nurse.avatar}
                  alt={currentCase.assignedTeam.nurse.name}
                  className="w-10 h-10 rounded-full object-cover border border-blue-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-blue-400 block uppercase">
                    Emergency Nurse
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {currentCase.assignedTeam.nurse.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentCase.assignedTeam.nurse.specialty}
                  </p>
                </div>
              </div>

              {/* Receptionist */}
              <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                <img
                  src={currentCase.assignedTeam.receptionist.avatar}
                  alt={currentCase.assignedTeam.receptionist.name}
                  className="w-10 h-10 rounded-full object-cover border border-purple-500 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-purple-400 block uppercase">
                    Intake Desk
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {currentCase.assignedTeam.receptionist.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Paper Formalities Assigned
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToTab('doctor');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <span>View Doctor Station</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNavigateToTab('receptionist');
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-900/50 flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Complete Paper Formalities (Receptionist Desk)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
