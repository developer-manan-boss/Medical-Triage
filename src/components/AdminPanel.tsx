import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Bed, 
  Sliders, 
  MapPin, 
  RotateCcw, 
  Download, 
  Upload, 
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { EmergencyRoom, BedType, RoomStatus } from '../types';
import { INITIAL_ROOMS } from '../utils/initialData';

interface AdminPanelProps {
  rooms: EmergencyRoom[];
  onAddRoom: (newRoom: EmergencyRoom) => void;
  onDeleteRoom: (roomId: string) => void;
  onUpdateRoomStatus: (roomId: string, newStatus: RoomStatus) => void;
  onResetRooms: () => void;
  onImportRooms: (importedRooms: EmergencyRoom[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  rooms,
  onAddRoom,
  onDeleteRoom,
  onUpdateRoomStatus,
  onResetRooms,
  onImportRooms
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Room Form State
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [block, setBlock] = useState<string>('Block A');
  const [floor, setFloor] = useState<string>('Ground Floor');
  const [bedType, setBedType] = useState<BedType>('Trauma Resuscitation');
  const [status, setStatus] = useState<RoomStatus>('Available');
  const [equipmentInput, setEquipmentInput] = useState<string>('Ventilator, Defibrillator, Central O2');
  const [distGate1, setDistGate1] = useState<number>(20);
  const [distGate2, setDistGate2] = useState<number>(35);
  const [distGate3, setDistGate3] = useState<number>(75);
  const [distGate4, setDistGate4] = useState<number>(95);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      alert('Please enter a room or bay number.');
      return;
    }

    const newId = `room-${Date.now().toString().slice(-6)}`;
    const equipmentList = equipmentInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newRoom: EmergencyRoom = {
      id: newId,
      roomNumber: roomNumber.trim(),
      block,
      floor,
      bedType,
      status,
      equipment: equipmentList.length > 0 ? equipmentList : ['Vital Monitor', 'Central O2'],
      distances: {
        'gate-1': Number(distGate1) || 25,
        'gate-2': Number(distGate2) || 40,
        'gate-3': Number(distGate3) || 75,
        'gate-4': Number(distGate4) || 100
      }
    };

    onAddRoom(newRoom);
    setShowAddModal(false);
    // Reset form
    setRoomNumber('');
    setToastMessage(`Added "${newRoom.roomNumber}" to ${newRoom.block}!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = (roomId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This will remove it from auto-allocation.`)) {
      onDeleteRoom(roomId);
      setToastMessage(`Removed ${name}.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rooms, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hospital-rooms-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    const matchesBlock = selectedBlockFilter === 'ALL' || r.block === selectedBlockFilter;
    const matchesSearch = r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.bedType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.block.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBlock && matchesSearch;
  });

  // Calculate status counts
  const availableCount = rooms.filter(r => r.status === 'Available').length;
  const reservedCount = rooms.filter(r => r.status === 'Reserved').length;
  const occupiedCount = rooms.filter(r => r.status === 'Occupied').length;
  const cleaningCount = rooms.filter(r => r.status === 'Cleaning').length;

  const getStatusColor = (st: RoomStatus) => {
    switch (st) {
      case 'Available': return 'bg-emerald-950 text-emerald-300 border-emerald-700/80';
      case 'Reserved': return 'bg-amber-950 text-amber-300 border-amber-700/80';
      case 'Occupied': return 'bg-red-950 text-red-300 border-red-700/80';
      case 'Cleaning': return 'bg-purple-950 text-purple-300 border-purple-700/80';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-slideDown">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-extrabold text-white">
              Hospital Admin • Emergency Rooms, Beds & Gate Proximity
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 border border-purple-700 text-purple-300">
              ALLOCATION ENGINE CONFIG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Add or subtract emergency rooms, configure distance to Gates 1-4, and toggle room reservations for optimal nearest-bed dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Room / Bed</span>
          </button>

          <button
            onClick={onResetRooms}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Reset to default hospital layout"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Export layout to JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Hospital Occupancy Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Beds
          </span>
          <span className="text-2xl font-black text-white mt-1 block">
            {rooms.length}
          </span>
          <span className="text-[10px] text-slate-500">Configured in hospital</span>
        </div>

        <div className="bg-slate-900 border border-emerald-900/50 rounded-xl p-4">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Available Empty
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {availableCount}
          </span>
          <span className="text-[10px] text-slate-500">Ready for auto-allocation</span>
        </div>

        <div className="bg-slate-900 border border-amber-900/50 rounded-xl p-4">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Reserved / Transit
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">
            {reservedCount}
          </span>
          <span className="text-[10px] text-slate-500">Locked for incoming cases</span>
        </div>

        <div className="bg-slate-900 border border-red-900/50 rounded-xl p-4">
          <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
            Occupied
          </span>
          <span className="text-2xl font-black text-red-400 mt-1 block">
            {occupiedCount}
          </span>
          <span className="text-[10px] text-slate-500">Currently in active care</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by room #, bed type, block..."
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Block Filter Buttons */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="text-slate-400 mr-1 text-[11px]">Filter Block:</span>
          {['ALL', 'Block A', 'Block B', 'Block C', 'Block D'].map(b => (
            <button
              key={b}
              onClick={() => setSelectedBlockFilter(b)}
              className={`px-2.5 py-1 rounded-md border transition-all ${
                selectedBlockFilter === b
                  ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Table & Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Room / Bay</th>
                <th className="py-3 px-3">Block & Floor</th>
                <th className="py-3 px-3">Bed Classification</th>
                <th className="py-3 px-3">Status / Reservation</th>
                <th className="py-3 px-3">Gate Proximity (Meters & Transit)</th>
                <th className="py-3 px-3">Key Equipment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Room Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Bed className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>{room.roomNumber}</span>
                    </div>
                  </td>

                  {/* Block */}
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-950 border border-slate-700 text-slate-300">
                      {room.block}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {room.floor}
                    </span>
                  </td>

                  {/* Bed Type */}
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-200">
                      {room.bedType}
                    </span>
                  </td>

                  {/* Status Toggle (Reservation control) */}
                  <td className="py-3.5 px-3">
                    <select
                      value={room.status}
                      onChange={e => onUpdateRoomStatus(room.id, e.target.value as RoomStatus)}
                      className={`px-2 py-1 rounded text-xs font-bold border focus:outline-none cursor-pointer ${getStatusColor(room.status)}`}
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Cleaning">Cleaning</option>
                    </select>
                  </td>

                  {/* Gate Proximity */}
                  <td className="py-3.5 px-3">
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <span className="text-slate-300">G1: <strong className="text-white">{room.distances['gate-1']}m</strong> (~{Math.round(room.distances['gate-1']/1.2)}s)</span>
                      <span className="text-slate-300">G2: <strong className="text-white">{room.distances['gate-2']}m</strong> (~{Math.round(room.distances['gate-2']/1.2)}s)</span>
                      <span className="text-slate-300">G3: <strong className="text-white">{room.distances['gate-3']}m</strong> (~{Math.round(room.distances['gate-3']/1.2)}s)</span>
                      <span className="text-slate-300">G4: <strong className="text-white">{room.distances['gate-4']}m</strong> (~{Math.round(room.distances['gate-4']/1.2)}s)</span>
                    </div>
                  </td>

                  {/* Equipment */}
                  <td className="py-3.5 px-3 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {room.equipment.slice(0, 3).map((eq, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-950 text-slate-400 border border-slate-800">
                          {eq}
                        </span>
                      ))}
                      {room.equipment.length > 3 && (
                        <span className="text-[9px] text-slate-500 font-bold self-center">
                          +{room.equipment.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Delete / Subtract Room Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(room.id, room.roomNumber)}
                      className="p-1.5 rounded-lg border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900 hover:text-white transition-colors"
                      title="Delete / Subtract this room from hospital layout"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Add New Emergency Room / Bed
                </h3>
                <p className="text-xs text-slate-400">
                  Configure room proximity for automated fast triage allocation
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Room Number */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-bold block">
                    Room / Bay Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    placeholder="e.g. Trauma Bay 103 or Resuscitation Suite B"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>

                {/* Block */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">
                    Hospital Block
                  </label>
                  <select
                    value={block}
                    onChange={e => setBlock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Block A">Block A (Trauma Center)</option>
                    <option value="Block B">Block B (Ambulance Bay & Surgery)</option>
                    <option value="Block C">Block C (Acute ER)</option>
                    <option value="Block D">Block D (Pediatric & Sub-Acute)</option>
                  </select>
                </div>

                {/* Bed Type */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">
                    Bed Classification
                  </label>
                  <select
                    value={bedType}
                    onChange={e => setBedType(e.target.value as BedType)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Trauma Resuscitation">Trauma Resuscitation (Code RED)</option>
                    <option value="ICU Bed">ICU Bed (Code RED)</option>
                    <option value="High-Dependency Unit (HDU)">HDU Bed (Code ORANGE)</option>
                    <option value="Acute Care ER">Acute Care ER (Code YELLOW/ORANGE)</option>
                    <option value="Observation Bed">Observation Bed (Code GREEN)</option>
                  </select>
                </div>

                {/* Distances to Gates in Meters */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-bold block">
                    Proximity: Distance in Meters to Gates (Crucial for fast near-bed algorithm)
                  </label>
                  <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gate 1</span>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={distGate1}
                        onChange={e => setDistGate1(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gate 2</span>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={distGate2}
                        onChange={e => setDistGate2(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gate 3</span>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={distGate3}
                        onChange={e => setDistGate3(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gate 4</span>
                      <input
                        type="number"
                        min={5}
                        max={300}
                        value={distGate4}
                        onChange={e => setDistGate4(Number(e.target.value))}
                        className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-bold block">
                    Medical Equipment Installed (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={equipmentInput}
                    onChange={e => setEquipmentInput(e.target.value)}
                    placeholder="Ventilator, Defibrillator, Central O2, Suction..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md"
                >
                  Save & Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
