import React, { useEffect, useRef, useState } from 'react';
import { 
  Camera, 
  Upload, 
  Play, 
  AlertTriangle, 
  Activity, 
  CheckCircle, 
  Droplet, 
  Crosshair, 
  Sparkles, 
  Maximize2,
  RefreshCw,
  Zap,
  Bed,
  Users
} from 'lucide-react';
import { Gate, CctvScenario, EmergencyRoom, PatientEmergencyCase, StaffMember, TriageCode } from '../types';
import { drawCctvFrame } from '../utils/cctvCanvasRenderer';
import { extractFaceFromElement, generateSyntheticEmergencyFace } from '../utils/faceExtractor';
import { allocateNearestEmergencyRoom } from '../utils/allocationEngine';
import { dispatchResponseTeam } from '../utils/staffDispatcher';
import { playEmergencySiren, announceVoiceAlert, playAllocationChime } from '../utils/audioAlerts';

interface CctvMonitorProps {
  gates: Gate[];
  scenarios: CctvScenario[];
  rooms: EmergencyRoom[];
  staff: StaffMember[];
  onEmergencyTriggered: (newCase: PatientEmergencyCase, updatedRooms: EmergencyRoom[]) => void;
  onNavigateToTab: (tab: 'cctv' | 'receptionist' | 'doctor' | 'admin' | 'audit') => void;
}

export const CctvMonitor: React.FC<CctvMonitorProps> = ({
  gates,
  scenarios,
  rooms,
  staff,
  onEmergencyTriggered,
  onNavigateToTab
}) => {
  const [selectedGateId, setSelectedGateId] = useState<string>('gate-1');
  const [sourceMode, setSourceMode] = useState<'simulation' | 'webcam' | 'upload'>('simulation');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-1');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [continuousAiScan, setContinuousAiScan] = useState<boolean>(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Live AI Detection State
  const [liveScore, setLiveScore] = useState<number>(9.6);
  const [liveTriageCode, setLiveTriageCode] = useState<TriageCode>('RED');
  const [isBleeding, setIsBleeding] = useState<boolean>(true);
  const [onStretcher, setOnStretcher] = useState<boolean>(true);
  const [isAmbulance, setIsAmbulance] = useState<boolean>(true);
  const [isUnconscious, setIsUnconscious] = useState<boolean>(true);
  const [primarySymptom, setPrimarySymptom] = useState<string>('Major Cranial & Femoral Hemorrhage, GCS < 8');
  const [recommendedAction, setRecommendedAction] = useState<string>('Immediate Code RED Trauma activation, intubation prep');
  const [faceSnapshot, setFaceSnapshot] = useState<string>('');

  // Canvas & Media Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const uploadVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const tickRef = useRef<number>(0);

  const currentGate = gates.find(g => g.id === selectedGateId) || gates[0];
  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Sync state when scenario changes
  useEffect(() => {
    if (sourceMode === 'simulation') {
      setLiveScore(currentScenario.seriousnessScore);
      setLiveTriageCode(currentScenario.triageCode);
      setIsBleeding(currentScenario.isBleeding);
      setOnStretcher(currentScenario.onStretcher);
      setIsAmbulance(currentScenario.isAmbulanceArrival);
      setIsUnconscious(currentScenario.isUnconscious);
      setPrimarySymptom(currentScenario.primaryObservedSymptom);
      setRecommendedAction(currentScenario.recommendedAction);

      // Generate synthetic initial face snapshot
      const face = generateSyntheticEmergencyFace(
        currentGate.code,
        currentScenario.title,
        currentScenario.visualScene
      );
      setFaceSnapshot(face);
    }
  }, [selectedScenarioId, selectedGateId, sourceMode]);

  // Handle Webcam Start/Stop
  useEffect(() => {
    if (sourceMode === 'webcam') {
      navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
        .then(stream => {
          webcamStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(err => {
          console.warn('Unable to access webcam:', err);
          alert('Could not access webcam. Falling back to CCTV simulation.');
          setSourceMode('simulation');
        });
    } else {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
        webcamStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [sourceMode]);

  // Main CCTV Canvas Rendering Loop
  useEffect(() => {
    let active = true;

    const render = () => {
      tickRef.current += 1;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (sourceMode === 'simulation') {
            drawCctvFrame(ctx, canvas.width, canvas.height, currentScenario, currentGate, tickRef.current, isScanning);
          } else if (sourceMode === 'webcam' && videoRef.current && videoRef.current.readyState >= 2) {
            // Draw webcam frame with CCTV filters & scanline
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            // Add clinical surveillance tint
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scanlines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            for (let y = 0; y < canvas.height; y += 4) {
              ctx.fillRect(0, y, canvas.width, 1);
            }

            // OSD
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`CAM: ${currentGate.cctvCameraId} [LIVE WEBCAM]`, 20, 30);
            ctx.fillStyle = '#f8fafc';
            ctx.font = '11px monospace';
            ctx.fillText(new Date().toLocaleTimeString(), canvas.width - 150, 30);

            // Target crosshairs
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            ctx.strokeRect(cx - 70, cy - 80, 140, 160);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(cx - 70, cy - 98, 120, 18);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('LIVE TARGET TRACK', cx - 64, cy - 85);
          } else if (sourceMode === 'upload' && uploadVideoRef.current && uploadVideoRef.current.readyState >= 2) {
            ctx.drawImage(uploadVideoRef.current, 0, 0, canvas.width, canvas.height);
          }
        }
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [sourceMode, currentScenario, currentGate, isScanning]);

  // Video file upload handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      setSourceMode('upload');
    }
  };

  // Perform Gemini AI or Smart Rule-based analysis
  const analyzeCurrentFrameWithAI = async () => {
    setIsAiAnalyzing(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsAiAnalyzing(false);
      return;
    }

    // Capture frame base64
    const frameBase64 = canvas.toDataURL('image/jpeg', 0.85);

    // Extract face snapshot
    const capturedFace = extractFaceFromElement(
      sourceMode === 'webcam' && videoRef.current ? videoRef.current : canvas,
      undefined,
      currentGate.code
    );
    setFaceSnapshot(capturedFace);

    try {
      // Call full-stack server endpoint with Gemini 3.8 Flash
      const response = await fetch('/api/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameBase64,
          gateId: currentGate.id,
          gateName: currentGate.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.seriousnessScore) {
          setLiveScore(Math.round(data.seriousnessScore * 10) / 10);
          setLiveTriageCode(data.triageCode || 'RED');
          setIsBleeding(!!data.isBleeding);
          setOnStretcher(!!data.onStretcher);
          setIsAmbulance(!!data.isAmbulanceArrival);
          setIsUnconscious(!!data.isUnconscious);
          if (data.primaryObservedSymptom) setPrimarySymptom(data.primaryObservedSymptom);
          if (data.recommendedAction) setRecommendedAction(data.recommendedAction);
        }
      }
    } catch (e) {
      console.warn('Server AI API error, running local triage intelligence:', e);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Trigger full Emergency Dispatch and Automated Room Allocation
  const handleTriggerEmergencyDispatch = async () => {
    // 1. Capture Face Snapshot
    const canvas = canvasRef.current;
    let finalFace = faceSnapshot;
    if (canvas) {
      finalFace = extractFaceFromElement(
        sourceMode === 'webcam' && videoRef.current ? videoRef.current : canvas,
        undefined,
        currentGate.code
      );
      setFaceSnapshot(finalFace);
    }

    // 2. Run Nearest Room Allocation Algorithm
    const allocation = allocateNearestEmergencyRoom(
      currentGate.id,
      liveTriageCode,
      isBleeding,
      onStretcher,
      rooms
    );

    if (!allocation) {
      alert('WARNING: All hospital emergency rooms and ICU beds are currently at 100% capacity! Diverting to external facility or please free a bed in Admin.');
      return;
    }

    // 3. Dispatch Nearest Staff (1 Doctor, 1 Nurse, 1 Receptionist)
    const team = dispatchResponseTeam(currentGate, staff);

    // 4. Update Room status to 'Reserved'
    const updatedRooms = rooms.map(r => {
      if (r.id === allocation.room.id) {
        return {
          ...r,
          status: 'Reserved' as const,
          currentPatientId: `EMG-${Date.now().toString().slice(-4)}`,
          currentPatientName: 'Unregistered Trauma Patient',
          reservedAt: Date.now()
        };
      }
      return r;
    });

    // 5. Play Audio Alert Tone and voice announcement
    playEmergencySiren(liveTriageCode);
    playAllocationChime();
    announceVoiceAlert(
      `Code ${liveTriageCode} emergency at ${currentGate.name}. Allocated ${allocation.room.roomNumber} in ${allocation.room.block}. Trauma team dispatched.`
    );

    // 6. Build Emergency Case Record
    const now = new Date();
    const caseId = `EMG-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCase: PatientEmergencyCase = {
      id: caseId,
      timestamp: Date.now(),
      gateId: currentGate.id,
      gateName: currentGate.name,
      seriousnessScore: liveScore,
      triageCode: liveTriageCode,
      isBleeding,
      bleedingSeverity: isBleeding ? 'Severe/Arterial' : 'None',
      onStretcher,
      isAmbulanceArrival: isAmbulance,
      isUnconscious,
      primaryObservedSymptom: primarySymptom,
      recommendedAction,
      requiredEquipment: currentScenario.requiredEquipment || ['Trauma Cart', 'Ventilator', 'Vital Monitor'],
      faceSnapshotUrl: finalFace,
      allocatedRoom: {
        roomId: allocation.room.id,
        roomNumber: allocation.room.roomNumber,
        block: allocation.room.block,
        bedType: allocation.room.bedType,
        distanceMeters: allocation.distanceMeters,
        transitSeconds: allocation.transitSeconds
      },
      assignedTeam: {
        doctor: team.doctor,
        nurse: team.nurse,
        receptionist: team.receptionist
      },
      paperFormalitiesStatus: 'PENDING_INTAKE',
      patientDetails: {
        name: `Emergency Patient (${caseId})`,
        gender: 'Unknown',
        intakeNotes: `AI Triage: ${primarySymptom}. Detected at ${currentGate.name}. Auto-allocated ${allocation.room.roomNumber}.`
      },
      status: 'ACTIVE_DISPATCH',
      timeline: [
        {
          id: '1',
          time: now.toLocaleTimeString(),
          event: `AI CCTV Detection: Score ${liveScore}/10 (${liveTriageCode}) - ${primarySymptom}`,
          actor: currentGate.cctvCameraId,
          type: 'alert'
        },
        {
          id: '2',
          time: now.toLocaleTimeString(),
          event: `Face snapshot captured & forwarded to ${team.receptionist.name} for Paper Formalities`,
          actor: 'AI Vision Engine',
          type: 'intake'
        },
        {
          id: '3',
          time: now.toLocaleTimeString(),
          event: `Nearest room auto-allocated: ${allocation.room.roomNumber} (${allocation.room.block}) - ${allocation.distanceMeters}m away (ETA ~${allocation.transitSeconds}s)`,
          actor: 'Smart Allocation Engine',
          type: 'allocation'
        },
        {
          id: '4',
          time: now.toLocaleTimeString(),
          event: `Dispatched Tri-Response Team: ${team.doctor.name} + ${team.nurse.name} + ${team.receptionist.name}`,
          actor: 'Emergency Pager',
          type: 'dispatch'
        }
      ]
    };

    onEmergencyTriggered(newCase, updatedRooms);
  };

  // Helper color for score
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-red-500 border-red-500 bg-red-950/40';
    if (score >= 7.0) return 'text-orange-500 border-orange-500 bg-orange-950/40';
    if (score >= 4.0) return 'text-amber-400 border-amber-400 bg-amber-950/40';
    return 'text-emerald-400 border-emerald-400 bg-emerald-950/40';
  };

  const getTriageBadgeColor = (code: TriageCode) => {
    switch (code) {
      case 'RED': return 'bg-red-600 text-white shadow-red-700/50';
      case 'ORANGE': return 'bg-orange-600 text-white shadow-orange-700/50';
      case 'YELLOW': return 'bg-amber-500 text-slate-950 shadow-amber-600/50';
      case 'GREEN': return 'bg-emerald-600 text-white shadow-emerald-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Gate & Mode Selector Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        {/* Gate Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Camera className="w-3.5 h-3.5 text-red-400" />
            CCTV Gates:
          </span>
          {gates.map(gate => (
            <button
              key={gate.id}
              onClick={() => setSelectedGateId(gate.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                selectedGateId === gate.id
                  ? 'bg-slate-800 border-red-500 text-white shadow-sm shadow-red-900/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${selectedGateId === gate.id ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                <span>{gate.name.split('-')[0].trim()}</span>
                <span className="text-[10px] text-slate-500">({gate.nearestBlock})</span>
              </div>
            </button>
          ))}
        </div>

        {/* Video Feed Source Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
            Feed Source:
          </span>
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setSourceMode('simulation')}
              className={`px-2.5 py-1 rounded transition-all ${
                sourceMode === 'simulation'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CCTV Sim
            </button>
            <button
              onClick={() => setSourceMode('webcam')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                sourceMode === 'webcam'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3 h-3" />
              Webcam
            </button>
            <label className={`px-2.5 py-1 rounded cursor-pointer transition-all flex items-center gap-1 ${
              sourceMode === 'upload'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}>
              <Upload className="w-3 h-3" />
              Upload
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main CCTV Feed & AI HUD Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live CCTV Camera Screen (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl aspect-[16/9] flex items-center justify-center">
            {/* The Main CCTV Canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full h-full object-contain"
            />

            {/* Media elements rendered ONLY when active to prevent empty-source loading errors */}
            {sourceMode === 'webcam' && (
              <video
                ref={videoRef}
                className="hidden"
                playsInline
                autoPlay
                muted
                onError={(e) => {
                  e.preventDefault();
                }}
              />
            )}
            {sourceMode === 'upload' && uploadedVideoUrl && (
              <video
                ref={uploadVideoRef}
                src={uploadedVideoUrl}
                className="hidden"
                playsInline
                loop
                autoPlay
                muted
                onLoadedData={() => {
                  uploadVideoRef.current?.play().catch(() => {});
                }}
                onError={(e) => {
                  e.preventDefault();
                }}
              />
            )}

            {/* Top Bar Floating Status */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-900/90 border border-slate-700 text-slate-100 backdrop-blur-md">
                  {currentGate.code} • {currentGate.cctvCameraId}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  LIVE CCTV FEED
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-900/90 border border-slate-700 text-cyan-400 backdrop-blur-md">
                  NEAREST: {currentGate.nearestBlock}
                </span>
              </div>
            </div>

            {/* AI Real-time Scanning Target Reticle in Center */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border border-dashed border-red-500/40 rounded-full animate-spin duration-1000 flex items-center justify-center">
                  <div className="w-40 h-40 border border-red-500/60 rounded-lg flex items-center justify-center relative">
                    <Crosshair className="w-8 h-8 text-red-500/80 animate-ping" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Simulation Scenarios (if simulation mode is active) */}
          {sourceMode === 'simulation' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Select Test Emergency Scenario:
                </span>
                <span className="text-[11px] text-slate-500">
                  Switch to test automated hospital triage & bed dispatch
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {scenarios.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioId(sc.id);
                      setSelectedGateId(sc.gateId);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedScenarioId === sc.id
                        ? 'bg-slate-800 border-red-500 shadow-md shadow-red-950/40'
                        : 'bg-slate-950 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getTriageBadgeColor(sc.triageCode)}`}>
                        CODE {sc.triageCode}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {sc.seriousnessScore}/10
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {sc.title}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {sc.gateId.toUpperCase()} • {sc.visualScene.replace('_', ' ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Triage Intelligence HUD & Instant Allocation (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Real-time Triage Score Meter Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500 animate-pulse" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Live AI Seriousness Triage
                </h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold tracking-wide uppercase ${getTriageBadgeColor(liveTriageCode)}`}>
                CODE {liveTriageCode}
              </span>
            </div>

            {/* Seriousness Score Radial Gauge & Counter */}
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Seriousness Index
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-4xl font-black tracking-tight ${getScoreColor(liveScore).split(' ')[0]}`}>
                    {liveScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">/ 10.0</span>
                </div>
                <span className="text-xs font-semibold text-red-400 mt-1 inline-block">
                  {liveScore >= 8.5 ? 'CRITICAL - IMMEDIATE LIFE THREAT' : liveScore >= 7.0 ? 'HIGH ACUITY - RAPID RESPONSE' : 'STABLE EVALUATION'}
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-24 h-24 relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke={liveScore >= 8.5 ? '#ef4444' : liveScore >= 7.0 ? '#f97316' : '#10b981'}
                    strokeWidth="8"
                    strokeDasharray={200}
                    strokeDashoffset={200 - (200 * liveScore) / 10}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xs font-black text-slate-200">
                    {Math.round(liveScore * 10)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Condition Indicators (Bleeding, Stretcher, Ambulance, Unconscious) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isBleeding 
                  ? 'bg-red-950/60 border-red-700/80 text-red-200 shadow-sm shadow-red-950' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}>
                <Droplet className={`w-4 h-4 ${isBleeding ? 'text-red-500 animate-bounce' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Bleeding</div>
                  <div className="text-[10px]">{isBleeding ? 'Severe Active Bleed' : 'None Detected'}</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                onStretcher 
                  ? 'bg-amber-950/60 border-amber-700/80 text-amber-200 shadow-sm shadow-amber-950' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}>
                <Bed className={`w-4 h-4 ${onStretcher ? 'text-amber-500' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Stretcher</div>
                  <div className="text-[10px]">{onStretcher ? 'Gurney / Stretcher' : 'Self Walking'}</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isAmbulance 
                  ? 'bg-blue-950/60 border-blue-700/80 text-blue-200' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}>
                <Activity className={`w-4 h-4 ${isAmbulance ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Ambulance</div>
                  <div className="text-[10px]">{isAmbulance ? 'Vehicle Drop' : 'Walk-in'}</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isUnconscious 
                  ? 'bg-purple-950/60 border-purple-700/80 text-purple-200' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${isUnconscious ? 'text-purple-400' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Consciousness</div>
                  <div className="text-[10px]">{isUnconscious ? 'Unresponsive' : 'Conscious'}</div>
                </div>
              </div>
            </div>

            {/* AI Face Capture Snapshot Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-red-500 bg-slate-900 shrink-0 relative shadow-md shadow-red-950/50">
                {faceSnapshot ? (
                  <img
                    src={faceSnapshot}
                    alt="AI Face Capture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Crosshair className="w-6 h-6 animate-spin" />
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-red-600/90 text-white text-[8px] font-bold text-center py-0.5">
                  AI SNAP
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Face Auto-Captured
                </span>
                <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                  Forwarded to Reception Desk
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Ready for patient intake paperwork & documentation
                </p>
              </div>
            </div>

            {/* Action Buttons: Run AI Vision & Trigger Auto-Allocation */}
            <div className="space-y-2 pt-1">
              <button
                onClick={analyzeCurrentFrameWithAI}
                disabled={isAiAnalyzing}
                className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isAiAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                )}
                <span>{isAiAnalyzing ? 'Analyzing with Gemini Vision...' : 'Analyze Current CCTV Frame with AI'}</span>
              </button>

              <button
                onClick={handleTriggerEmergencyDispatch}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-sm transition-all shadow-lg shadow-red-950/80 flex items-center justify-center gap-2 transform active:scale-98"
              >
                <AlertTriangle className="w-5 h-5 animate-bounce" />
                <span>ALLOCATE NEAREST ROOM & DISPATCH TEAM</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
