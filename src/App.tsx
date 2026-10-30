/**
 * LifePulse AI - Hospital Emergency CCTV Live Triage & Automated Bed Allocation System
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CctvMonitor } from './components/CctvMonitor';
import { ReceptionistDesk } from './components/ReceptionistDesk';
import { DoctorStation } from './components/DoctorStation';
import { AdminPanel } from './components/AdminPanel';
import { AuditLog } from './components/AuditLog';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { 
  INITIAL_GATES, 
  INITIAL_ROOMS, 
  INITIAL_STAFF, 
  CCTV_SCENARIOS, 
  KNOWN_PATIENT_RECORDS 
} from './utils/initialData';
import { 
  Gate, 
  EmergencyRoom, 
  StaffMember, 
  PatientEmergencyCase, 
  RoomStatus 
} from './types';
import { generateSyntheticEmergencyFace } from './utils/faceExtractor';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit'>('cctv');
  const [gates] = useState<Gate[]>(INITIAL_GATES);
  const [staff] = useState<StaffMember[]>(INITIAL_STAFF);

  // Persistent Rooms in LocalStorage
  const [rooms, setRooms] = useState<EmergencyRoom[]>(() => {
    try {
      const saved = localStorage.getItem('lifepulse_rooms');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_ROOMS;
  });

  // Persistent Emergency Cases in LocalStorage
  const [cases, setCases] = useState<PatientEmergencyCase[]>(() => {
    try {
      const saved = localStorage.getItem('lifepulse_cases');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }

    // Seed 1 initial active emergency arrival to show Receptionist and Doctor features immediately
    const initialFace = generateSyntheticEmergencyFace('GATE-01', 'Arriving Trauma Patient', 'stretcher_trauma');
    const seedCase: PatientEmergencyCase = {
      id: 'EMG-2026-9041',
      timestamp: Date.now() - 65000,
      gateId: 'gate-1',
      gateName: 'Gate 1 - Trauma Bay Entry',
      seriousnessScore: 9.6,
      triageCode: 'RED',
      isBleeding: true,
      bleedingSeverity: 'Severe/Arterial',
      onStretcher: true,
      isAmbulanceArrival: true,
      isUnconscious: true,
      primaryObservedSymptom: 'Massive Cranial Trauma, Arterial Bleed, Unresponsive (GCS 7)',
      recommendedAction: 'Immediate Code RED Trauma activation, intubation & massive transfusion',
      requiredEquipment: ['Trauma Cart', 'Ventilator', 'Defibrillator', 'Rapid Infuser'],
      faceSnapshotUrl: initialFace,
      allocatedRoom: {
        roomId: 'room-a101',
        roomNumber: 'Trauma Bay 101',
        block: 'Block A',
        bedType: 'Trauma Resuscitation',
        distanceMeters: 15,
        transitSeconds: 12
      },
      assignedTeam: {
        doctor: INITIAL_STAFF[0], // Dr. Rajesh Verma
        nurse: INITIAL_STAFF[4], // Nurse Priya Nair
        receptionist: INITIAL_STAFF[8] // Rahul Deshmukh
      },
      paperFormalitiesStatus: 'PENDING_INTAKE',
      patientDetails: {
        name: 'Unidentified Male (Trauma Arrival)',
        gender: 'Male',
        age: 38,
        contactPhone: '+91 98201 33412 (EMT Contact)',
        emergencyContactName: 'Paramedic Ambulance Unit 04',
        bloodGroup: 'O Negative (Universal Donor)',
        mlcPoliceCase: true,
        insuranceDetails: 'Emergency Trauma Reserve (TPA Pending)',
        intakeNotes: 'AI CCTV detected patient on stretcher at Gate 1 with active bleeding. Auto-allocated Trauma Bay 101. Face captured by AI for registration formalities.'
      },
      status: 'ACTIVE_DISPATCH',
      timeline: [
        {
          id: '1',
          time: new Date(Date.now() - 65000).toLocaleTimeString(),
          event: 'AI CCTV Detection: Score 9.6/10 (CODE RED) - Severe cranial bleeding on stretcher',
          actor: 'CAM-01-TRAUMA-EXT',
          type: 'alert'
        },
        {
          id: '2',
          time: new Date(Date.now() - 64000).toLocaleTimeString(),
          event: 'Face snapshot automatically captured and forwarded to Reception Desk 01',
          actor: 'AI Vision Engine',
          type: 'intake'
        },
        {
          id: '3',
          time: new Date(Date.now() - 63000).toLocaleTimeString(),
          event: 'Nearest empty emergency room allocated: Trauma Bay 101 (Block A - 15m away, ETA 12s)',
          actor: 'Smart Allocation Engine',
          type: 'allocation'
        },
        {
          id: '4',
          time: new Date(Date.now() - 62000).toLocaleTimeString(),
          event: 'Tri-Response Alert Dispatched: Dr. Rajesh Verma + Nurse Priya Nair + Rahul Deshmukh',
          actor: 'Emergency Pager System',
          type: 'dispatch'
        }
      ]
    };

    return [seedCase];
  });

  // Modal alert popup state
  const [activeAlertCase, setActiveAlertCase] = useState<PatientEmergencyCase | null>(null);

  // Sync rooms to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('lifepulse_rooms', JSON.stringify(rooms));
    } catch (e) {
      // ignore
    }
  }, [rooms]);

  // Sync cases to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('lifepulse_cases', JSON.stringify(cases));
    } catch (e) {
      // ignore
    }
  }, [cases]);

  // Handle new emergency triggered from CCTV
  const handleEmergencyTriggered = (newCase: PatientEmergencyCase, updatedRooms: EmergencyRoom[]) => {
    setRooms(updatedRooms);
    setCases(prev => [newCase, ...prev]);
    setActiveAlertCase(newCase);
  };

  // Receptionist updates patient formalities
  const handleUpdateCaseDetails = (caseId: string, updatedDetails: any) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const now = new Date();
        return {
          ...c,
          patientDetails: {
            ...c.patientDetails,
            ...updatedDetails
          },
          paperFormalitiesStatus: 'COMPLETED' as const,
          timeline: [
            ...c.timeline,
            {
              id: Date.now().toString(),
              time: now.toLocaleTimeString(),
              event: `Receptionist ${c.assignedTeam.receptionist.name} completed paper formalities for ${updatedDetails.name}`,
              actor: 'Reception Desk 01',
              type: 'intake' as const
            }
          ]
        };
      }
      return c;
    }));
  };

  // Doctor updates status
  const handleUpdateCaseStatus = (caseId: string, status: PatientEmergencyCase['status'], note: string) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const now = new Date();
        return {
          ...c,
          status,
          timeline: [
            ...c.timeline,
            {
              id: Date.now().toString(),
              time: now.toLocaleTimeString(),
              event: note,
              actor: c.assignedTeam.doctor.name,
              type: 'clinical' as const
            }
          ]
        };
      }
      return c;
    }));
  };

  // Admin Room Management Handlers
  const handleAddRoom = (newRoom: EmergencyRoom) => {
    setRooms(prev => [...prev, newRoom]);
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const handleUpdateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
  };

  const handleResetRooms = () => {
    if (window.confirm('Reset hospital layout back to default 8 emergency rooms?')) {
      setRooms(INITIAL_ROOMS);
      localStorage.removeItem('lifepulse_rooms');
    }
  };

  const handleImportRooms = (imported: EmergencyRoom[]) => {
    setRooms(imported);
  };

  // Stats calculation
  const pendingIntakeCount = cases.filter(c => c.paperFormalitiesStatus === 'PENDING_INTAKE').length;
  const activeCriticalCount = cases.filter(c => c.triageCode === 'RED' && c.status === 'ACTIVE_DISPATCH').length;
  const availableBedsCount = rooms.filter(r => r.status === 'Available').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Global Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingIntakeCount={pendingIntakeCount}
        activeCriticalCount={activeCriticalCount}
        availableBedsCount={availableBedsCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'cctv' && (
          <CctvMonitor
            gates={gates}
            scenarios={CCTV_SCENARIOS}
            rooms={rooms}
            staff={staff}
            onEmergencyTriggered={handleEmergencyTriggered}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'receptionist' && (
          <ReceptionistDesk
            cases={cases}
            knownPatients={KNOWN_PATIENT_RECORDS}
            onUpdateCaseDetails={handleUpdateCaseDetails}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'doctor' && (
          <DoctorStation
            cases={cases}
            staff={staff}
            rooms={rooms}
            onUpdateCaseStatus={handleUpdateCaseStatus}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            rooms={rooms}
            onAddRoom={handleAddRoom}
            onDeleteRoom={handleDeleteRoom}
            onUpdateRoomStatus={handleUpdateRoomStatus}
            onResetRooms={handleResetRooms}
            onImportRooms={handleImportRooms}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLog
            cases={cases}
            onNavigateToTab={setActiveTab}
          />
        )}
      </main>

      {/* Emergency Alert Modal Triggered on Detections */}
      <EmergencyAlertModal
        currentCase={activeAlertCase}
        onClose={() => setActiveAlertCase(null)}
        onNavigateToTab={setActiveTab}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LifePulse AI • Emergency Triage & Automated Dispatch System</span>
          <span className="font-mono text-[11px] text-slate-400">
            Powered by Computer Vision & Gemini 3.8 Flash • Real-Time CCTV Frame Telemetry
          </span>
        </div>
      </footer>
    </div>
  );
}
