import { StaffMember, Gate } from '../types';

export interface DispatchedTeam {
  doctor: StaffMember;
  nurse: StaffMember;
  receptionist: StaffMember;
  dispatchSummary: string;
}

export function dispatchResponseTeam(
  gate: Gate,
  staffList: StaffMember[]
): DispatchedTeam {
  const targetBlock = gate.nearestBlock;

  // 1. Find nearest Doctor (prefer on-duty in same block)
  const availableDoctors = staffList.filter(s => s.role === 'DOCTOR' && s.status === 'ON_DUTY');
  let selectedDoctor = availableDoctors.find(d => d.block === targetBlock);
  if (!selectedDoctor && availableDoctors.length > 0) {
    selectedDoctor = availableDoctors[0];
  }
  // Fallback if none on-duty
  if (!selectedDoctor) {
    selectedDoctor = staffList.find(s => s.role === 'DOCTOR')!;
  }

  // 2. Find nearest Nurse (prefer on-duty in same block)
  const availableNurses = staffList.filter(s => s.role === 'NURSE' && s.status === 'ON_DUTY');
  let selectedNurse = availableNurses.find(n => n.block === targetBlock);
  if (!selectedNurse && availableNurses.length > 0) {
    selectedNurse = availableNurses[0];
  }
  if (!selectedNurse) {
    selectedNurse = staffList.find(s => s.role === 'NURSE')!;
  }

  // 3. Find nearest Receptionist for this Gate Desk
  const availableReceptionists = staffList.filter(s => s.role === 'RECEPTIONIST');
  let selectedReceptionist = availableReceptionists.find(r => r.block === targetBlock);
  if (!selectedReceptionist && availableReceptionists.length > 0) {
    selectedReceptionist = availableReceptionists[0];
  }
  if (!selectedReceptionist) {
    selectedReceptionist = staffList.find(s => s.role === 'RECEPTIONIST')!;
  }

  const dispatchSummary = `Dispatched Tri-Response Team for ${gate.name} (${targetBlock}): ${selectedDoctor.name} (Doctor) + ${selectedNurse.name} (Nurse) + ${selectedReceptionist.name} (Receptionist)`;

  return {
    doctor: selectedDoctor,
    nurse: selectedNurse,
    receptionist: selectedReceptionist,
    dispatchSummary
  };
}
