import React from 'react';
import { History, Shield, Clock, AlertTriangle, Bed, UserCheck, ClipboardCheck } from 'lucide-react';
import { PatientEmergencyCase } from '../types';

interface AuditLogProps {
  cases: PatientEmergencyCase[];
  onNavigateToTab: (tab: 'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit') => void;
}

export const AuditLog: React.FC<AuditLogProps> = ({ cases, onNavigateToTab }) => {
  // Aggregate all events across cases
  const allEvents = cases.flatMap(c => 
    c.timeline.map(t => ({
      ...t,
      caseId: c.id,
      patientName: c.patientDetails.name,
      triageCode: c.triageCode,
      score: c.seriousnessScore,
      roomNumber: c.allocatedRoom.roomNumber
    }))
  ).reverse();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'allocation': return <Bed className="w-4 h-4 text-emerald-400" />;
      case 'dispatch': return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'intake': return <ClipboardCheck className="w-4 h-4 text-purple-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-300" />
            <h2 className="text-lg font-extrabold text-white">
              Emergency Triage & Dispatch Audit Log
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 border border-slate-700 text-slate-300">
              AUDIT COMPLIANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident chronological audit trail of all AI CCTV detections, automated room allocations, and team dispatches.
          </p>
        </div>
      </div>

      {allEvents.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">
            No Emergency Events Recorded Yet
          </h3>
          <p className="text-xs text-slate-400">
            Once CCTV live monitoring triggers an emergency triage, detailed timestamps and responder actions will be chronologically logged here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="space-y-3">
            {allEvents.map((evt, idx) => (
              <div
                key={`${evt.caseId}-${idx}`}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-3.5 hover:border-slate-700 transition-all text-xs"
              >
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {getEventIcon(evt.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">
                        {evt.caseId}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                        evt.triageCode === 'RED' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        CODE {evt.triageCode}
                      </span>
                      <span className="text-slate-400 font-semibold truncate hidden sm:inline">
                        • {evt.patientName}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {evt.time}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mt-1">
                    {evt.event}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                    <span>ACTOR: {evt.actor}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{evt.roomNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
