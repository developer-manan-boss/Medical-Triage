import React, { useState } from 'react';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  Shield, 
  Printer, 
  Search, 
  AlertCircle, 
  Bed, 
  FileText, 
  Droplet,
  Send,
  Sparkles
} from 'lucide-react';
import { PatientEmergencyCase, KnownPatientRecord } from '../types';

interface ReceptionistDeskProps {
  cases: PatientEmergencyCase[];
  knownPatients: KnownPatientRecord[];
  onUpdateCaseDetails: (caseId: string, updatedDetails: any) => void;
  onNavigateToTab: (tab: 'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit') => void;
}

export const ReceptionistDesk: React.FC<ReceptionistDeskProps> = ({
  cases,
  knownPatients,
  onUpdateCaseDetails,
  onNavigateToTab
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [dbSearchQuery, setDbSearchQuery] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const activeCase = cases.find(c => c.id === selectedCaseId) || cases[0];

  // Local form state for documentation
  const [patientName, setPatientName] = useState<string>(activeCase?.patientDetails?.name || '');
  const [age, setAge] = useState<number | string>(activeCase?.patientDetails?.age || '');
  const [gender, setGender] = useState<string>(activeCase?.patientDetails?.gender || 'Unknown');
  const [contactPhone, setContactPhone] = useState<string>(activeCase?.patientDetails?.contactPhone || '');
  const [emergencyContactName, setEmergencyContactName] = useState<string>(activeCase?.patientDetails?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>(activeCase?.patientDetails?.emergencyContactPhone || '');
  const [bloodGroup, setBloodGroup] = useState<string>(activeCase?.patientDetails?.bloodGroup || 'O+');
  const [mlcPoliceCase, setMlcPoliceCase] = useState<boolean>(activeCase?.patientDetails?.mlcPoliceCase || false);
  const [insuranceDetails, setInsuranceDetails] = useState<string>(activeCase?.patientDetails?.insuranceDetails || '');
  const [intakeNotes, setIntakeNotes] = useState<string>(activeCase?.patientDetails?.intakeNotes || '');

  // Sync form when selected case changes
  React.useEffect(() => {
    if (activeCase) {
      setPatientName(activeCase.patientDetails?.name || `Patient (${activeCase.id})`);
      setAge(activeCase.patientDetails?.age || '');
      setGender(activeCase.patientDetails?.gender || 'Unknown');
      setContactPhone(activeCase.patientDetails?.contactPhone || '');
      setEmergencyContactName(activeCase.patientDetails?.emergencyContactName || '');
      setEmergencyContactPhone(activeCase.patientDetails?.emergencyContactPhone || '');
      setBloodGroup(activeCase.patientDetails?.bloodGroup || (activeCase.isBleeding ? 'O Negative (Emergency Universal)' : 'O+'));
      setMlcPoliceCase(activeCase.patientDetails?.mlcPoliceCase || (activeCase.isBleeding || activeCase.triageCode === 'RED'));
      setInsuranceDetails(activeCase.patientDetails?.insuranceDetails || 'Emergency Cashless / TPA Pending');
      setIntakeNotes(activeCase.patientDetails?.intakeNotes || `Auto-Intake: Patient entered via ${activeCase.gateName}. Allocated to ${activeCase.allocatedRoom.roomNumber}.`);
    }
  }, [selectedCaseId, activeCase]);

  // Autofill from existing offline database records
  const handleAutofillRecord = (record: KnownPatientRecord) => {
    setPatientName(record.name);
    setAge(record.age);
    setGender(record.gender);
    setContactPhone(record.contactPhone);
    setEmergencyContactName(record.emergencyContact.split('-')[0].trim());
    setEmergencyContactPhone(record.emergencyContact.split('-')[1]?.trim() || '');
    setBloodGroup(record.bloodGroup);
    setIntakeNotes(`Past History Matched: Allergies: ${record.allergies}. Conditions: ${record.conditions}. Last visit: ${record.lastVisit}`);
    setShowSuccessToast(`Auto-matched past medical record for "${record.name}"!`);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  // Quick fill unknown trauma profile
  const handleQuickFillUnknown = (genderChoice: 'Male' | 'Female') => {
    setPatientName(`Unidentified ${genderChoice} (Trauma Arrival)`);
    setGender(genderChoice);
    setAge(35);
    setContactPhone('+91 00000 00000 (Pending Attendant)');
    setEmergencyContactName('Awaiting Kin Identification');
    setEmergencyContactPhone('Police / Ambulance Liaison');
    setMlcPoliceCase(true);
    setIntakeNotes(`Unconscious / critical patient arriving via ${activeCase.gateName}. Face photographed via AI CCTV. Paper formalities initiated while clinical team stabilizes in ${activeCase.allocatedRoom.roomNumber}.`);
  };

  // Submit formalities
  const handleSaveFormalities = () => {
    if (!activeCase) return;

    const updatedDetails = {
      name: patientName || `Emergency Patient (${activeCase.id})`,
      age: Number(age) || undefined,
      gender,
      contactPhone,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      mlcPoliceCase,
      insuranceDetails,
      intakeNotes
    };

    onUpdateCaseDetails(activeCase.id, updatedDetails);
    setShowSuccessToast('Paper formalities completed! Dossier synced to Doctor Station.');
    setTimeout(() => setShowSuccessToast(null), 4000);
  };

  if (cases.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-950/60 border border-blue-700/50 flex items-center justify-center mx-auto text-blue-400">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">
          Receptionist Desk Ready • No Pending Emergency Intake
        </h3>
        <p className="text-sm text-slate-400">
          When the CCTV AI detects an incoming emergency patient at any gate, their auto-captured face snapshot and details will automatically stream here for rapid paper formalities.
        </p>
        <button
          onClick={() => onNavigateToTab('cctv')}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
        >
          <span>Go to CCTV Live Command & Trigger Test</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between text-sm font-semibold animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <span>{showSuccessToast}</span>
          </div>
          <button onClick={() => setShowSuccessToast(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-extrabold text-white">
              Receptionist Intake & Paper Formalities Desk
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 border border-blue-700 text-blue-300">
              DESK 01 • RAHUL DESHMUKH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Face photos auto-captured by AI CCTV. Complete rapid intake while patient is pre-admitted to emergency bay.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={!activeCase}
            className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Print Patient Wristband & Dossier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incoming Cases Queue (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Emergency Queue ({cases.length})
            </span>
            <span className="text-[11px] text-amber-400 font-semibold">
              {cases.filter(c => c.paperFormalitiesStatus === 'PENDING_INTAKE').length} Pending Intake
            </span>
          </div>

          <div className="space-y-2.5">
            {cases.map(item => {
              const isSelected = item.id === selectedCaseId;
              const isPending = item.paperFormalitiesStatus === 'PENDING_INTAKE';
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 shadow-lg shadow-blue-950/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Face Snapshot */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0 relative">
                      <img
                        src={item.faceSnapshotUrl}
                        alt="Face Snap"
                        className="w-full h-full object-cover"
                      />
                      <span className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.2 ${
                        item.triageCode === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {item.triageCode}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {item.id}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                          isPending ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}>
                          {isPending ? 'DOCS PENDING' : 'COMPLETED'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-white truncate mt-0.5">
                        {item.patientDetails.name || 'Unidentified Trauma'}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <Bed className="w-3 h-3" />
                          {item.allocatedRoom.roomNumber}
                        </span>
                        <span>•</span>
                        <span>{item.gateName.split('-')[0].trim()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Past Database Quick-Search Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                Match Offline Medical DB:
              </span>
              <span className="text-[10px] text-slate-500">Auto-match past records</span>
            </div>
            <div className="space-y-1.5">
              {knownPatients.map(kp => (
                <button
                  key={kp.id}
                  onClick={() => handleAutofillRecord(kp)}
                  className="w-full p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800/70 text-left transition-all text-xs flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-slate-200 group-hover:text-blue-400">
                      {kp.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {kp.age}y • {kp.bloodGroup} • {kp.allergies}
                    </div>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Patient Formalities Form (8 Cols) */}
        {activeCase && (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Top Case Identity Card with Face Photo */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-red-500 shadow-md shrink-0 bg-slate-900">
                <img
                  src={activeCase.faceSnapshotUrl}
                  alt="Captured Face"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-white font-mono text-center py-0.5">
                  AI SNAPSHOT
                </span>
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-base font-black text-white font-mono">
                    {activeCase.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    activeCase.triageCode === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950'
                  }`}>
                    CODE {activeCase.triageCode}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300">
                    Score: {activeCase.seriousnessScore.toFixed(1)}/10
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">
                  Entry Location: <span className="text-white font-bold">{activeCase.gateName}</span>
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <span className="px-2 py-1 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-bold flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5" />
                    Allocated: {activeCase.allocatedRoom.roomNumber} ({activeCase.allocatedRoom.block})
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px]">
                    Doctor: {activeCase.assignedTeam.doctor.name}
                  </span>
                </div>
              </div>

              {/* Quick Fill Button */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickFillUnknown('Male')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  + Unidentified Male
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFillUnknown('Female')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  + Unidentified Female
                </button>
              </div>
            </div>

            {/* Paper Formalities Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
                Patient Emergency Registration & Identification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {/* Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-semibold block">
                    Patient Full Name (or Identified Alias) *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="e.g. Anil Kumar Verma"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">
                    Age (Approx)
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Unknown">Unknown (Unconscious)</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-red-400" />
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (Universal Donor)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                    <option value="Crossmatch Required">Crossmatch In Progress</option>
                  </select>
                </div>

                {/* MLC Toggle */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">
                    Medico-Legal Case (MLC / Police)
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setMlcPoliceCase(!mlcPoliceCase)}
                      className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                        mlcPoliceCase
                          ? 'bg-red-950 border-red-600 text-red-300'
                          : 'bg-slate-950 border-slate-700 text-slate-400'
                      }`}
                    >
                      {mlcPoliceCase ? 'MLC REGISTERED (POLICE POST)' : 'NO MLC'}
                    </button>
                  </div>
                </div>

                {/* Kin Contact Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-semibold block">
                    Accompanying Kin / Contact Person
                  </label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={e => setEmergencyContactName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar (Brother) or EMT Officer"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Kin Contact Phone */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">
                    Kin Phone #
                  </label>
                  <input
                    type="text"
                    value={emergencyContactPhone}
                    onChange={e => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Insurance / Scheme */}
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-slate-400 font-semibold block">
                    Insurance / Scheme / Emergency Billing Category
                  </label>
                  <input
                    type="text"
                    value={insuranceDetails}
                    onChange={e => setInsuranceDetails(e.target.value)}
                    placeholder="e.g. Ayushman Bharat PM-JAY / Star Health Cashless / Hospital Emergency Reserve"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Intake Notes */}
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-slate-400 font-semibold block">
                    Reception Intake Notes & Paramedic Handover Details
                  </label>
                  <textarea
                    rows={3}
                    value={intakeNotes}
                    onChange={e => setIntakeNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="Clinical handover notes, belongings deposited, visible injury notes..."
                  />
                </div>
              </div>
            </div>

            {/* Submit & Dispatch Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Completing paperwork sends instant notification & clinical dossier to Doctor in {activeCase.allocatedRoom.roomNumber}.
              </span>
              <button
                type="button"
                onClick={handleSaveFormalities}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>SAVE FORMALITIES & DISPATCH TO DOCTOR</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable Emergency Wristband & Pass Modal */}
      {showPrintModal && activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hospital Emergency Patient Wristband & Intake Pass
                </h3>
                <p className="text-xs text-slate-500">
                  Ready for thermal printer output & bedside charting
                </p>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* The Wristband Layout */}
            <div className="border-2 border-dashed border-slate-400 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-400 bg-black">
                    <img
                      src={activeCase.faceSnapshotUrl}
                      alt="Face Print"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-red-600 uppercase">
                      CODE {activeCase.triageCode} EMERGENCY INTAKE
                    </span>
                    <h4 className="text-lg font-black text-slate-900">
                      {patientName}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {age ? `${age}y` : 'Age: Unconfirmed'} • {gender} • Blood: {bloodGroup}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-mono font-black text-slate-900 block">
                    {activeCase.allocatedRoom.roomNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {activeCase.allocatedRoom.block}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-[11px] text-slate-700 font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px]">ID #</span>
                  {activeCase.id}
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">GATE</span>
                  {activeCase.gateName.split('-')[0].trim()}
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">ATTENDING</span>
                  {activeCase.assignedTeam.doctor.name}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowPrintModal(false);
                }}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Wristband</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
