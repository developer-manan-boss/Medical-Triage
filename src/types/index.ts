export type TriageCode = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';

export type RoomStatus = 'Available' | 'Reserved' | 'Occupied' | 'Cleaning';

export type BedType = 
  | 'Trauma Resuscitation'
  | 'ICU Bed'
  | 'High-Dependency Unit (HDU)'
  | 'Acute Care ER'
  | 'Observation Bed';

export interface Gate {
  id: string; // 'gate-1', 'gate-2', etc.
  name: string;
  code: string;
  description: string;
  nearestBlock: string;
  cctvCameraId: string;
  status: 'online' | 'analyzing' | 'alert';
}

export interface EmergencyRoom {
  id: string;
  roomNumber: string;
  block: string;
  floor: string;
  bedType: BedType;
  status: RoomStatus;
  equipment: string[];
  distances: Record<string, number>; // gateId -> distance in meters
  currentPatientId?: string;
  currentPatientName?: string;
  reservedAt?: number;
}

export type StaffRole = 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  specialty?: string;
  block: string;
  phone: string;
  status: 'ON_DUTY' | 'ENGAGED' | 'OFF_DUTY';
  avatar: string;
}

export interface PatientDetails {
  name: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Unknown';
  contactPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  knownAllergies?: string;
  medicalHistorySummary?: string;
  mlcPoliceCase?: boolean; // Medico-Legal Case
  insuranceDetails?: string;
  intakeNotes?: string;
}

export interface PatientEmergencyCase {
  id: string; // e.g. EMG-2026-9104
  timestamp: number;
  gateId: string;
  gateName: string;
  seriousnessScore: number; // 1.0 to 10.0
  triageCode: TriageCode;
  isBleeding: boolean;
  bleedingSeverity: 'None' | 'Minor' | 'Moderate' | 'Severe/Arterial';
  onStretcher: boolean;
  isAmbulanceArrival: boolean;
  isUnconscious: boolean;
  primaryObservedSymptom: string;
  recommendedAction: string;
  requiredEquipment: string[];
  faceSnapshotUrl: string; // Captured face photo
  fullCctvSnapshotUrl?: string;
  allocatedRoom: {
    roomId: string;
    roomNumber: string;
    block: string;
    bedType: BedType;
    distanceMeters: number;
    transitSeconds: number;
  };
  assignedTeam: {
    doctor: StaffMember;
    nurse: StaffMember;
    receptionist: StaffMember;
  };
  paperFormalitiesStatus: 'PENDING_INTAKE' | 'INTAKE_IN_PROGRESS' | 'COMPLETED';
  patientDetails: PatientDetails;
  status: 'ACTIVE_DISPATCH' | 'IN_TREATMENT' | 'STABILIZED' | 'DISCHARGED';
  timeline: Array<{
    id: string;
    time: string;
    event: string;
    actor: string;
    type: 'alert' | 'dispatch' | 'allocation' | 'intake' | 'clinical';
  }>;
}

export interface CctvScenario {
  id: string;
  title: string;
  description: string;
  gateId: string;
  seriousnessScore: number;
  triageCode: TriageCode;
  isBleeding: boolean;
  bleedingSeverity: 'None' | 'Minor' | 'Moderate' | 'Severe/Arterial';
  onStretcher: boolean;
  isAmbulanceArrival: boolean;
  isUnconscious: boolean;
  primaryObservedSymptom: string;
  recommendedAction: string;
  requiredEquipment: string[];
  visualScene: 'stretcher_trauma' | 'ambulance_cpr' | 'chest_pain_collapse' | 'walking_minor_fracture';
}

export interface KnownPatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contactPhone: string;
  emergencyContact: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  lastVisit: string;
}
