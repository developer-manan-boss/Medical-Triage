import { EmergencyRoom, TriageCode, BedType } from '../types';

export interface AllocationResult {
  room: EmergencyRoom;
  distanceMeters: number;
  transitSeconds: number;
  matchReason: string;
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
      return {
        room: bestCleaning,
        distanceMeters: dist,
        transitSeconds: Math.max(10, Math.round(dist / 1.15)),
        matchReason: 'Urgent Expedited Sanitization - Nearest Bed to Entry Gate'
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

  // First try to match preferred bed types
  let candidates = availableRooms.filter(r => primaryBedTypes.includes(r.bedType));

  // If bleeding or on stretcher, strongly prioritize Trauma or ICU
  if ((isBleeding || onStretcher) && triageCode === 'RED') {
    const traumaSuites = candidates.filter(r => r.bedType === 'Trauma Resuscitation');
    if (traumaSuites.length > 0) {
      candidates = traumaSuites;
    }
  }

  // Fallback to any available room if no preferred type available
  if (candidates.length === 0) {
    candidates = availableRooms;
  }

  // Sort candidates by shortest physical distance to the entry gate
  candidates.sort((a, b) => {
    const distA = a.distances[gateId] ?? 999;
    const distB = b.distances[gateId] ?? 999;
    return distA - distB;
  });

  const selectedRoom = candidates[0];
  const distance = selectedRoom.distances[gateId] ?? 40;
  // Average emergency stretcher transport speed = ~1.15 to 1.3 meters/sec
  const transitSeconds = Math.max(8, Math.round(distance / 1.2));

  let reason = `Optimal Proximity: ${distance}m from ${gateId.toUpperCase()} (${selectedRoom.bedType})`;
  if (isBleeding) {
    reason += ' • Rapid Hemorrhage Control Equipment Ready';
  }

  return {
    room: selectedRoom,
    distanceMeters: distance,
    transitSeconds,
    matchReason: reason
  };
}
