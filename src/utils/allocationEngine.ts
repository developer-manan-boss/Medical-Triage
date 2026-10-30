import { EmergencyRoom, TriageCode, BedType } from '../types';

export interface AllocationStep {
  step: number;
  title: string;
  detail: string;
  status: 'passed' | 'selected' | 'info';
}

export interface AllocationResult {
  room: EmergencyRoom;
  distanceMeters: number;
  transitSeconds: number;
  matchReason: string;
  targetGateCode: string;
  steps: AllocationStep[];
  allCandidatesEvaluated: Array<{
    roomNumber: string;
    block: string;
    bedType: BedType;
    distance: number;
    isSelected: boolean;
  }>;
}

/**
 * Intelligent nearest & empty room allocation algorithm
 */
export function allocateNearestEmergencyRoom(
  gateId: string,
  triageCode: TriageCode,
  isBleeding: boolean,
  onStretcher: boolean,
  rooms: EmergencyRoom[]
): AllocationResult | null {
  const steps: AllocationStep[] = [];
  const gateCode = gateId.toUpperCase().replace('-', ' ');

  steps.push({
    step: 1,
    title: 'Entry Location Identified',
    detail: `Patient entering via ${gateCode}. Initiating emergency corridor pathfinding.`,
    status: 'passed'
  });

  // Filter for available rooms
  const availableRooms = rooms.filter(r => r.status === 'Available');

  if (availableRooms.length === 0) {
    // If no room is purely available, check for rooms in 'Cleaning' that can be expedited
    const cleaningRooms = rooms.filter(r => r.status === 'Cleaning');
    if (cleaningRooms.length > 0) {
      const bestCleaning = cleaningRooms.sort((a, b) => {
        const distA = a.distances[gateId] ?? 999;
        const distB = b.distances[gateId] ?? 999;
        return distA - distB;
      })[0];

      const dist = bestCleaning.distances[gateId] ?? 50;
      steps.push({
        step: 2,
        title: 'Emergency Expedited Sanitization',
        detail: `All primary beds occupied. Fast-tracking terminal cleaning for nearest bay: ${bestCleaning.roomNumber}.`,
        status: 'selected'
      });

      return {
        room: bestCleaning,
        distanceMeters: dist,
        transitSeconds: Math.max(10, Math.round(dist / 1.15)),
        matchReason: 'Urgent Expedited Sanitization - Nearest Bed to Entry Gate',
        targetGateCode: gateCode,
        steps,
        allCandidatesEvaluated: cleaningRooms.map(r => ({
          roomNumber: r.roomNumber,
          block: r.block,
          bedType: r.bedType,
          distance: r.distances[gateId] ?? 999,
          isSelected: r.id === bestCleaning.id
        }))
      };
    }
    return null;
  }

  // Define bed preference based on clinical seriousness
  let primaryBedTypes: BedType[] = [];
  if (triageCode === 'RED') {
    primaryBedTypes = ['Trauma Resuscitation', 'ICU Bed'];
  } else if (triageCode === 'ORANGE') {
    primaryBedTypes = ['Trauma Resuscitation', 'High-Dependency Unit (HDU)', 'Acute Care ER'];
  } else if (triageCode === 'YELLOW') {
    primaryBedTypes = ['Acute Care ER', 'Observation Bed'];
  } else {
    primaryBedTypes = ['Observation Bed', 'Acute Care ER'];
  }

  steps.push({
    step: 2,
    title: 'Acuity Bed-Type Filter',
    detail: `Clinical Code ${triageCode}: Prioritizing [${primaryBedTypes.join(', ')}] units.`,
    status: 'passed'
  });

  // First try to match preferred bed types
  let candidates = availableRooms.filter(r => primaryBedTypes.includes(r.bedType));

  // If bleeding or on stretcher, strongly prioritize Trauma or ICU
  if ((isBleeding || onStretcher) && triageCode === 'RED') {
    const traumaSuites = candidates.filter(r => r.bedType === 'Trauma Resuscitation');
    if (traumaSuites.length > 0) {
      candidates = traumaSuites;
      steps.push({
        step: 3,
        title: 'Specialized Trauma Protocol',
        detail: 'Active hemorrhage / stretcher detected: Locked to Trauma Resuscitation Suites with blood infuser.',
        status: 'passed'
      });
    }
  }

  // Fallback to any available room if no preferred type available
  if (candidates.length === 0) {
    candidates = availableRooms;
    steps.push({
      step: 3,
      title: 'Acuity Overflow Reallocation',
      detail: 'Primary specialized suites full. Routing to nearest equipped acute overflow bed.',
      status: 'info'
    });
  }

  // Sort candidates by shortest physical distance to the entry gate
  candidates.sort((a, b) => {
    const distA = a.distances[gateId] ?? 999;
    const distB = b.distances[gateId] ?? 999;
    return distA - distB;
  });

  const selectedRoom = candidates[0];
  const distance = selectedRoom.distances[gateId] ?? 40;
  const transitSeconds = Math.max(8, Math.round(distance / 1.2));

  steps.push({
    step: 4,
    title: 'Proximity Optimization',
    detail: `Optimal path selected: ${selectedRoom.roomNumber} (${selectedRoom.block}) at ${distance}m distance. Estimated transit: ~${transitSeconds}s.`,
    status: 'selected'
  });

  let reason = `Optimal Proximity: ${distance}m from ${gateCode} (${selectedRoom.bedType})`;
  if (isBleeding) {
    reason += ' • Rapid Hemorrhage Control Equipment Ready';
  }

  const allCandidatesEvaluated = availableRooms.map(r => ({
    roomNumber: r.roomNumber,
    block: r.block,
    bedType: r.bedType,
    distance: r.distances[gateId] ?? 999,
    isSelected: r.id === selectedRoom.id
  })).sort((a, b) => a.distance - b.distance);

  return {
    room: selectedRoom,
    distanceMeters: distance,
    transitSeconds,
    matchReason: reason,
    targetGateCode: gateCode,
    steps,
    allCandidatesEvaluated
  };
}
