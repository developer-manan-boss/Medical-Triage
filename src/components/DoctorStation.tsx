import React, { useState } from 'react';
import { 
  Stethoscope, 
  Bed, 
  Activity, 
  Droplet, 
  AlertTriangle, 
  CheckCircle2, 
  FileHeart, 
  Clock, 
  MapPin, 
  UserCheck, 
  HeartPulse, 
  Syringe, 
  ShieldAlert,
  Send
} from 'lucide-react';
import { PatientEmergencyCase, StaffMember, EmergencyRoom } from '../types';

interface DoctorStationProps {
  cases: PatientEmergencyCase[];
  staff: StaffMember[];
  rooms: EmergencyRoom[];
  onUpdateCaseStatus: (caseId: string, status: PatientEmergencyCase['status'], note: string) => void;
  onNavigateToTab: (tab: 'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit') => void;
}

export const DoctorStation: React.FC<DoctorStationProps> = ({
  cases,
  staff,
  rooms,
  onUpdateCaseStatus,
  onNavigateToTab
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [ordersState, setOrdersState] = useState<Record<string, Record<string, boolean>>>({});
  const [clinicalNote, setClinicalNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  const handleToggleOrder = (caseId: string, orderKey: string) => {
    setOrdersState(prev => {
      const caseOrders = prev[caseId] || {};
      return {
        ...prev,
        [caseId]: {
          ...caseOrders,
          [orderKey]: !caseOrders[orderKey]
        }
      };
    });
  };

  const handleStatusChange = (newStatus: PatientEmergencyCase['status']) => {
    if (!activeCase) return;
    onUpdateCaseStatus(
      activeCase.id, 
      newStatus, 
      clinicalNote || `Status updated to ${newStatus} by ${activeCase.assignedTeam.doctor.name}`
    );
    setClinicalNote('');
    setToastMessage(`Patient status progressed to: ${newStatus}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (cases.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center mx-auto text-emerald-400">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">
          Doctor & Trauma Clinical Station Active
        </h3>
        <p className="text-sm text-slate-400">
          No active emergency patients currently assigned. When the CCTV AI detects an arriving patient at any hospital gate, their room allocation and clinical dossier will appear here instantly.
        </p>
        <button
          onClick={() => onNavigateToTab('cctv')}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
        >
          <span>Trigger Live CCTV Emergency Test</span>
        </button>
      </div>
    );
  }

  const currentCaseOrders = activeCase ? (ordersState[activeCase.id] || {}) : {};

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-slideDown">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white">
              Doctor & Nurse Emergency Response Station
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300">
              TRAUMA ICU COMMAND
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time medical history review, bedside room readiness, and emergency orders for arriving patients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Doctors On-Duty: {staff.filter(s => s.role === 'DOCTOR' && s.status === 'ON_DUTY').length}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Emergency Patient List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Assigned Patients ({cases.length})
          </span>

          <div className="space-y-2.5">
            {cases.map(item => {
              const isSelected = item.id === selectedCaseId;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0 relative">
                      <img
                        src={item.faceSnapshotUrl}
                        alt="Patient Face"
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.2 ${
                        item.triageCode === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        CODE {item.triageCode}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {item.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.status === 'ACTIVE_DISPATCH' ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-white truncate mt-0.5">
                        {item.patientDetails.name}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="font-semibold text-emerald-400">
                          {item.allocatedRoom.roomNumber}
                        </span>
                        <span>•</span>
                        <span>Doc: {item.assignedTeam.doctor.name.split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Clinical Dossier, Medical History & Orders (8 Cols) */}
        {activeCase && (
          <div className="lg:col-span-8 space-y-5">
            {/* Top Patient Summary Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-slate-950">
                    <img
                      src={activeCase.faceSnapshotUrl}
                      alt="Face Snapshot"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white">
                        {activeCase.patientDetails.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-black ${
                        activeCase.triageCode === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        CODE {activeCase.triageCode} ({activeCase.seriousnessScore.toFixed(1)}/10)
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {activeCase.patientDetails.age ? `${activeCase.patientDetails.age} years • ` : ''}
                      {activeCase.patientDetails.gender} • Blood Group: <span className="text-red-400 font-bold">{activeCase.patientDetails.bloodGroup || 'O+'}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        {activeCase.allocatedRoom.roomNumber} ({activeCase.allocatedRoom.block})
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        ETA: ~{activeCase.allocatedRoom.transitSeconds}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Status Buttons */}
                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 font-bold uppercase text-center sm:text-right">
                    Update Bed Status:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange('ACTIVE_DISPATCH')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                        activeCase.status === 'ACTIVE_DISPATCH'
                          ? 'bg-red-600 text-white border-red-500'
                          : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      In Transit
                    </button>
                    <button
                      onClick={() => handleStatusChange('IN_TREATMENT')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                        activeCase.status === 'IN_TREATMENT'
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      In Room / Bay
                    </button>
                    <button
                      onClick={() => handleStatusChange('STABILIZED')}
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                        activeCase.status === 'STABILIZED'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      Stabilized
                    </button>
                  </div>
                </div>
              </div>

              {/* Clinical AI Triage Findings */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    AI Vision Findings & Immediate Threat:
                  </span>
                  {typeof activeCase.confidence === 'number' && (
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      Confidence: {Math.round(activeCase.confidence)}%
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-100">
                  {activeCase.primaryObservedSymptom}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    Mobility: <strong className="text-white">{activeCase.mobilityStatus || (activeCase.onStretcher ? 'Stretcher' : 'Walking')}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    Distress: <strong className="text-white">{activeCase.distressLevel || 'Acute'}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    Hemorrhage: <strong className="text-red-400">{activeCase.isBleeding ? activeCase.bleedingSeverity : 'None'}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-400 pt-1">
                  Recommended Protocol: <span className="text-slate-200 font-medium">{activeCase.recommendedAction}</span>
                </p>
              </div>

              {/* Medical History Section (Requested by user) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileHeart className="w-4 h-4 text-blue-400" />
                  Matched Medical History & Offline Hospital Records:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Known Allergies
                    </span>
                    <p className="font-bold text-red-400 mt-0.5">
                      {activeCase.patientDetails.knownAllergies || 'Penicillin, NSAIDs (Alert)'}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Prior Chronic History
                    </span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {activeCase.patientDetails.medicalHistorySummary || 'Hypertension, Coronary Stent, Type 2 Diabetes'}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Emergency Kin
                    </span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {activeCase.patientDetails.emergencyContactName || 'Accompanying Paramedic Squad'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rapid Clinical Orders Checklist */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  STAT Emergency Orders & Bedside Prep:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'mtp', label: 'Massive Transfusion Protocol (4 Units O-Neg)', icon: Droplet, color: 'text-red-400' },
                    { key: 'rsi', label: 'Rapid Sequence Intubation (RSI) Cart', icon: HeartPulse, color: 'text-amber-400' },
                    { key: 'iv', label: 'Large Bore Dual 16G IV Access', icon: Syringe, color: 'text-emerald-400' },
                    { key: 'ct', label: 'Emergency Trauma Pan-Scan CT (STAT)', icon: ShieldAlert, color: 'text-blue-400' },
                    { key: 'ecg', label: 'STAT 12-Lead ECG & High-Sensitivity Troponin', icon: Activity, color: 'text-purple-400' },
                    { key: 'xray', label: 'Portable Bedside Chest / Pelvis X-Ray', icon: Bed, color: 'text-cyan-400' }
                  ].map(order => {
                    const isChecked = !!currentCaseOrders[order.key];
                    const Icon = order.icon;
                    return (
                      <button
                        key={order.key}
                        onClick={() => handleToggleOrder(activeCase.id, order.key)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-emerald-400' : order.color}`} />
                          <span className="text-xs font-bold truncate">{order.label}</span>
                        </div>
                        <span className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 text-xs ${
                          isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isChecked ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
