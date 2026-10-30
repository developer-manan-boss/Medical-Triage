import { Gate, EmergencyRoom, StaffMember, CctvScenario, KnownPatientRecord } from '../types';

export const INITIAL_GATES: Gate[] = [
  {
    id: 'gate-1',
    name: 'Gate 1 - Trauma Bay Entry',
    code: 'GATE-01',
    description: 'Direct wide-ramp access for trauma stretchers & rapid wheel-in',
    nearestBlock: 'Block A',
    cctvCameraId: 'CAM-01-TRAUMA-EXT',
    status: 'online'
  },
  {
    id: 'gate-2',
    name: 'Gate 2 - Ambulance Drop Zone',
    code: 'GATE-02',
    description: 'High-speed emergency vehicle unloading canopy with automatic pneumatic doors',
    nearestBlock: 'Block B',
    cctvCameraId: 'CAM-02-AMB-BAY',
    status: 'online'
  },
  {
    id: 'gate-3',
    name: 'Gate 3 - OPD & Walk-In Entrance',
    code: 'GATE-03',
    description: 'General triage entrance for self-presenting patients and family drop-offs',
    nearestBlock: 'Block C',
    cctvCameraId: 'CAM-03-OPD-ENTRY',
    status: 'online'
  },
  {
    id: 'gate-4',
    name: 'Gate 4 - Emergency North Wing',
    code: 'GATE-04',
    description: 'Pediatric & sub-acute observation intake bay with quiet reception access',
    nearestBlock: 'Block D',
    cctvCameraId: 'CAM-04-NORTH-BAY',
    status: 'online'
  }
];

export const INITIAL_ROOMS: EmergencyRoom[] = [
  {
    id: 'room-a101',
    roomNumber: 'Trauma Bay 101',
    block: 'Block A',
    floor: 'Ground Floor',
    bedType: 'Trauma Resuscitation',
    status: 'Available',
    equipment: ['Ventilator', 'Defibrillator', 'Trauma Cart', 'Central O2', 'Rapid Infuser'],
    distances: {
      'gate-1': 15,
      'gate-2': 38,
      'gate-3': 70,
      'gate-4': 95
    }
  },
  {
    id: 'room-a102',
    roomNumber: 'Resuscitation Suite 102',
    block: 'Block A',
    floor: 'Ground Floor',
    bedType: 'Trauma Resuscitation',
    status: 'Available',
    equipment: ['Ventilator', 'Defibrillator', 'Crash Cart', 'Suction Line', 'Arterial Line Monitor'],
    distances: {
      'gate-1': 22,
      'gate-2': 42,
      'gate-3': 75,
      'gate-4': 100
    }
  },
  {
    id: 'room-b101',
    roomNumber: 'Critical ICU Bed 201',
    block: 'Block B',
    floor: 'Ground Floor',
    bedType: 'ICU Bed',
    status: 'Available',
    equipment: ['Hamilton Ventilator', 'Multipara Cardiac Monitor', 'Infusion Pumps x4', 'Central Line Kit'],
    distances: {
      'gate-1': 45,
      'gate-2': 14,
      'gate-3': 85,
      'gate-4': 110
    }
  },
  {
    id: 'room-b102',
    roomNumber: 'Emergency Surgery Prep 202',
    block: 'Block B',
    floor: 'Ground Floor',
    bedType: 'High-Dependency Unit (HDU)',
    status: 'Available',
    equipment: ['Mobile Ultrasound', 'Defibrillator', 'Airway Kit', 'High-Flow O2'],
    distances: {
      'gate-1': 50,
      'gate-2': 22,
      'gate-3': 88,
      'gate-4': 115
    }
  },
  {
    id: 'room-c101',
    roomNumber: 'Acute ER Bay 301',
    block: 'Block C',
    floor: 'Ground Floor',
    bedType: 'Acute Care ER',
    status: 'Available',
    equipment: ['Vital Monitor', 'O2 Flowmeter', 'ECG 12-Lead', 'Nebulizer'],
    distances: {
      'gate-1': 72,
      'gate-2': 80,
      'gate-3': 12,
      'gate-4': 60
    }
  },
  {
    id: 'room-c102',
    roomNumber: 'Acute ER Bay 302',
    block: 'Block C',
    floor: 'Ground Floor',
    bedType: 'Acute Care ER',
    status: 'Available',
    equipment: ['Vital Monitor', 'Mobile Suction', 'IV Stand', 'O2 Cannula'],
    distances: {
      'gate-1': 78,
      'gate-2': 86,
      'gate-3': 18,
      'gate-4': 65
    }
  },
  {
    id: 'room-d101',
    roomNumber: 'Pediatric ER Suite 401',
    block: 'Block D',
    floor: 'Ground Floor',
    bedType: 'Acute Care ER',
    equipment: ['Pediatric Resuscitation Kit', 'Child O2 Mask', 'Pulse Oximeter', 'Vital Monitor'],
    status: 'Available',
    distances: {
      'gate-1': 92,
      'gate-2': 105,
      'gate-3': 58,
      'gate-4': 16
    }
  },
  {
    id: 'room-d102',
    roomNumber: 'Observation Suite 402',
    block: 'Block D',
    floor: 'Ground Floor',
    bedType: 'Observation Bed',
    equipment: ['Basic Vital Monitor', 'Oxygen Point', 'Nurse Call Button'],
    status: 'Available',
    distances: {
      'gate-1': 100,
      'gate-2': 112,
      'gate-3': 64,
      'gate-4': 24
    }
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  // Doctors
  {
    id: 'doc-1',
    name: 'Dr. Rajesh Verma',
    role: 'DOCTOR',
    specialty: 'Trauma Surgeon (Sr. Consultant)',
    block: 'Block A',
    phone: '+91 98110 44211',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-2',
    name: 'Dr. Sunita Kulkarni',
    role: 'DOCTOR',
    specialty: 'Emergency Medicine Specialist',
    block: 'Block B',
    phone: '+91 98223 55102',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1594824813637-293c5c99446f?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-3',
    name: 'Dr. Amit Patel',
    role: 'DOCTOR',
    specialty: 'Acute Medical Care Physician',
    block: 'Block C',
    phone: '+91 98450 66299',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'doc-4',
    name: 'Dr. Neha Saxena',
    role: 'DOCTOR',
    specialty: 'Pediatric Critical Care',
    block: 'Block D',
    phone: '+91 98711 77301',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  },

  // Nurses
  {
    id: 'nurse-1',
    name: 'Nurse Priya Nair',
    role: 'NURSE',
    specialty: 'Trauma & Resuscitation Charge RN',
    block: 'Block A',
    phone: '+91 97112 33410',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'nurse-2',
    name: 'Nurse Ananya Sharma',
    role: 'NURSE',
    specialty: 'ICU & Critical Care RN',
    block: 'Block B',
    phone: '+91 97224 44521',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'nurse-3',
    name: 'Nurse Vikram Rao',
    role: 'NURSE',
    specialty: 'Triage Specialist RN',
    block: 'Block C',
    phone: '+91 97335 55632',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'nurse-4',
    name: 'Nurse Suman Roy',
    role: 'NURSE',
    specialty: 'Pediatric & Sub-Acute Care RN',
    block: 'Block D',
    phone: '+91 97446 66743',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=150&auto=format&fit=crop&q=80'
  },

  // Receptionists
  {
    id: 'rec-1',
    name: 'Rahul Deshmukh (Desk 1)',
    role: 'RECEPTIONIST',
    specialty: 'Gate 1 & 2 Main Emergency Intake',
    block: 'Block A',
    phone: '+91 98100 11223',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'rec-2',
    name: 'Pooja Sen (Desk 2)',
    role: 'RECEPTIONIST',
    specialty: 'Gate 3 OPD Walk-in Intake',
    block: 'Block C',
    phone: '+91 98200 22334',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'rec-3',
    name: 'Manish Joshi (Desk 3)',
    role: 'RECEPTIONIST',
    specialty: 'Gate 4 North Intake & Records',
    block: 'Block D',
    phone: '+91 98300 33445',
    status: 'ON_DUTY',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

export const CCTV_SCENARIOS: CctvScenario[] = [
  {
    id: 'scenario-1',
    title: 'Severe Trauma Stretcher Rush',
    description: 'Patient on stretcher with active bleeding from head/limb, unconscious, rushed by EMTs',
    gateId: 'gate-1',
    seriousnessScore: 9.6,
    triageCode: 'RED',
    isBleeding: true,
    bleedingSeverity: 'Severe/Arterial',
    onStretcher: true,
    isAmbulanceArrival: true,
    isUnconscious: true,
    primaryObservedSymptom: 'Major Cranial & Femoral Hemorrhage, GCS < 8, Shallow Breathing',
    recommendedAction: 'Immediate Code RED Trauma activation, intubation prep & massive transfusion protocol',
    requiredEquipment: ['Trauma Cart', 'Ventilator', 'Defibrillator', 'Rapid Infuser', 'Blood Transfusion Set'],
    visualScene: 'stretcher_trauma'
  },
  {
    id: 'scenario-2',
    title: 'Ambulance Cardiac Arrest Pull-in',
    description: 'Ambulance backing into Gate 2 bay with active CPR ongoing on gurney',
    gateId: 'gate-2',
    seriousnessScore: 9.8,
    triageCode: 'RED',
    isBleeding: false,
    bleedingSeverity: 'None',
    onStretcher: true,
    isAmbulanceArrival: true,
    isUnconscious: true,
    primaryObservedSymptom: 'Cardiopulmonary Arrest, Paramedic Compressions In Progress, Ventricular Fibrillation',
    recommendedAction: 'Crash Cart immediate standby, defibrillation protocol, Epinephrine IV access',
    requiredEquipment: ['Defibrillator', 'Crash Cart', 'Multipara Cardiac Monitor', 'Airway Kit'],
    visualScene: 'ambulance_cpr'
  },
  {
    id: 'scenario-3',
    title: 'Acute Chest Pain / Collapse Walk-In',
    description: 'Patient walking into Gate 3 clutching chest, collapsing against triage barrier',
    gateId: 'gate-3',
    seriousnessScore: 7.8,
    triageCode: 'ORANGE',
    isBleeding: false,
    bleedingSeverity: 'None',
    onStretcher: false,
    isAmbulanceArrival: false,
    isUnconscious: false,
    primaryObservedSymptom: 'Acute Coronary Syndrome, severe retrosternal pain, diaphoresis, dyspnea',
    recommendedAction: 'Urgent Code Orange triage, immediate 12-lead ECG under 5 minutes, O2 & sublingual nitrates',
    requiredEquipment: ['ECG 12-Lead', 'Vital Monitor', 'Central O2', 'Cardiac Troponin Kit'],
    visualScene: 'chest_pain_collapse'
  },
  {
    id: 'scenario-4',
    title: 'Stable Walk-In with Arm Fracture',
    description: 'Patient walking into Gate 4 supported by kin, conscious, holding splinted arm',
    gateId: 'gate-4',
    seriousnessScore: 3.2,
    triageCode: 'GREEN',
    isBleeding: false,
    bleedingSeverity: 'None',
    onStretcher: false,
    isAmbulanceArrival: false,
    isUnconscious: false,
    primaryObservedSymptom: 'Isolated closed forearm deformity, hemodynamically stable, alert',
    recommendedAction: 'Standard triage queue, oral analgesia, emergency X-ray requisition',
    requiredEquipment: ['Basic Vital Monitor', 'X-Ray Requisition', 'Splint Support'],
    visualScene: 'walking_minor_fracture'
  }
];

export const KNOWN_PATIENT_RECORDS: KnownPatientRecord[] = [
  {
    id: 'MED-REC-01',
    name: 'Anil Kumar Verma',
    age: 48,
    gender: 'Male',
    contactPhone: '+91 98201 33412',
    emergencyContact: 'Sunita Verma (Wife) - +91 98201 33413',
    bloodGroup: 'O Positive (O+)',
    allergies: 'Penicillin, Aspirin',
    conditions: 'Hypertension, Coronary Stent (2022), on Clopidogrel',
    lastVisit: '15-Aug-2025 (Cardiology follow-up)'
  },
  {
    id: 'MED-REC-02',
    name: 'Pooja Mehra',
    age: 34,
    gender: 'Female',
    contactPhone: '+91 98311 44521',
    emergencyContact: 'Rohan Mehra (Brother) - +91 98311 44522',
    bloodGroup: 'B Positive (B+)',
    allergies: 'Sulfa Drugs',
    conditions: 'Type 1 Diabetes, Moderate Asthma',
    lastVisit: '04-Jan-2026 (Endocrinology)'
  },
  {
    id: 'MED-REC-03',
    name: 'Vikram Singh Chauhan',
    age: 62,
    gender: 'Male',
    contactPhone: '+91 98450 77810',
    emergencyContact: 'Aarav Chauhan (Son) - +91 98450 77811',
    bloodGroup: 'AB Negative (AB-)',
    allergies: 'No Known Drug Allergies (NKDA)',
    conditions: 'Chronic Kidney Disease (Stage 2), Mild COPD',
    lastVisit: '12-Feb-2026 (Nephrology)'
  }
];
