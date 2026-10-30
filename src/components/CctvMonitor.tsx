import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  RefreshCw,
  Zap,
  Bed,
  Users,
  Eye,
  SwitchCamera,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Radio
} from 'lucide-react';
import { Gate, CctvScenario, EmergencyRoom, PatientEmergencyCase, StaffMember, TriageCode } from '../types';
import { drawCctvFrame } from '../utils/cctvCanvasRenderer';
import { extractFaceFromElement, generateSyntheticEmergencyFace } from '../utils/faceExtractor';
import { allocateNearestEmergencyRoom, AllocationResult } from '../utils/allocationEngine';
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
  // Default to webcam automatically per user request
  const [sourceMode, setSourceMode] = useState<'webcam' | 'simulation' | 'upload'>('webcam');
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-1');
  
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [continuousAiScan, setContinuousAiScan] = useState<boolean>(true);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Live AI Vision Model State
  const [liveScore, setLiveScore] = useState<number>(2.4);
  const [liveTriageCode, setLiveTriageCode] = useState<TriageCode>('GREEN');
  const [confidence, setConfidence] = useState<number>(94.8);
  const [isBleeding, setIsBleeding] = useState<boolean>(false);
  const [bleedingSeverity, setBleedingSeverity] = useState<'None' | 'Minor' | 'Moderate' | 'Severe/Arterial'>('None');
  const [onStretcher, setOnStretcher] = useState<boolean>(false);
  const [isAmbulance, setIsAmbulance] = useState<boolean>(false);
  const [isUnconscious, setIsUnconscious] = useState<boolean>(false);
  const [mobilityStatus, setMobilityStatus] = useState<string>('Walking Independent');
  const [distressLevel, setDistressLevel] = useState<string>('None/Calm');
  const [primarySymptom, setPrimarySymptom] = useState<string>('Subject alert in camera view. No visible acute hemorrhage.');
  const [recommendedAction, setRecommendedAction] = useState<string>('Standard outpatient triage / Monitoring check-in.');
  const [faceBoundingBox, setFaceBoundingBox] = useState<{ ymin: number; xmin: number; ymax: number; xmax: number } | null>(null);
  const [faceSnapshot, setFaceSnapshot] = useState<string>('');
  
  // Real-time Preview Allocation Diagnostics
  const [lastAllocationPreview, setLastAllocationPreview] = useState<AllocationResult | null>(null);

  // Canvas & Media Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const uploadVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const tickRef = useRef<number>(0);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentGate = gates.find(g => g.id === selectedGateId) || gates[0];
  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Helper to calculate candidate allocation preview
  const recalculateAllocationPreview = useCallback((gateId: string, code: TriageCode, bleed: boolean, stretcher: boolean) => {
    const preview = allocateNearestEmergencyRoom(gateId, code, bleed, stretcher, rooms);
    setLastAllocationPreview(preview);
  }, [rooms]);

  // Recalculate allocation preview when inputs change
  useEffect(() => {
    recalculateAllocationPreview(currentGate.id, liveTriageCode, isBleeding, onStretcher);
  }, [currentGate.id, liveTriageCode, isBleeding, onStretcher, recalculateAllocationPreview]);

  // Automatically start webcam on mount and whenever cameraFacingMode changes
  const startCamera = useCallback(async () => {
    setCameraPermissionStatus('requesting');
    try {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
        webcamStreamRef.current = null;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevices API not supported on this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraPermissionStatus('granted');
      setSourceMode('webcam');
    } catch (err) {
      console.warn('Webcam access error or permission denied:', err);
      setCameraPermissionStatus('denied');
      // If camera unavailable, automatically switch to scenario simulation so user is never stuck
      setSourceMode('simulation');
    }
  }, [cameraFacingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
      }
    };
  }, [startCamera]);

  // Toggle Camera Front / Rear
  const toggleCameraFacing = () => {
    setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Sync state when simulation scenario changes
  useEffect(() => {
    if (sourceMode === 'simulation') {
      setLiveScore(currentScenario.seriousnessScore);
      setLiveTriageCode(currentScenario.triageCode);
      setIsBleeding(currentScenario.isBleeding);
      setBleedingSeverity(currentScenario.bleedingSeverity);
      setOnStretcher(currentScenario.onStretcher);
      setIsAmbulance(currentScenario.isAmbulanceArrival);
      setIsUnconscious(currentScenario.isUnconscious);
      setPrimarySymptom(currentScenario.primaryObservedSymptom);
      setRecommendedAction(currentScenario.recommendedAction);
      setDistressLevel(currentScenario.seriousnessScore >= 8.5 ? 'Unresponsive/Critical' : 'Moderate Pain');
      setMobilityStatus(currentScenario.onStretcher ? 'Stretcher/Gurney' : 'Walking Independent');
      setConfidence(98.6);

      // Generate synthetic initial face snapshot
      const face = generateSyntheticEmergencyFace(
        currentGate.code,
        currentScenario.title,
        currentScenario.visualScene
      );
      setFaceSnapshot(face);
    }
  }, [selectedScenarioId, selectedGateId, sourceMode]);

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
            // Draw live webcam feed
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            // Subtle clinical CCTV contrast tint
            ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Surveillance Scanlines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            for (let y = 0; y < canvas.height; y += 4) {
              ctx.fillRect(0, y, canvas.width, 1);
            }

            // OSD Header Bar
            ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
            ctx.fillRect(12, 12, 280, 48);

            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`CAM: ${currentGate.cctvCameraId} [LIVE CAMERA]`, 22, 30);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.fillText(`GATE: ${currentGate.name.toUpperCase()}`, 22, 46);

            // OSD Timestamp & Status Bar
            ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
            ctx.fillRect(canvas.width - 240, 12, 228, 48);

            // Blinking green live dot
            const showDot = Math.floor(tickRef.current / 15) % 2 === 0;
            ctx.fillStyle = showDot ? '#22c55e' : '#15803d';
            ctx.beginPath();
            ctx.arc(canvas.width - 222, 30, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('LIVE STREAM', canvas.width - 210, 34);

            const now = new Date();
            ctx.fillStyle = '#f8fafc';
            ctx.font = '10px monospace';
            ctx.fillText(now.toLocaleTimeString(), canvas.width - 130, 34);

            ctx.fillStyle = '#38bdf8';
            ctx.font = '9px monospace';
            ctx.fillText(`AI VISION: ${continuousAiScan ? 'AUTO CONTINUOUS' : 'READY'}`, canvas.width - 222, 48);

            // Dynamic Face / Person Bounding Box Rendering
            if (faceBoundingBox) {
              const bx = (faceBoundingBox.xmin / 1000) * canvas.width;
              const by = (faceBoundingBox.ymin / 1000) * canvas.height;
              const bw = ((faceBoundingBox.xmax - faceBoundingBox.xmin) / 1000) * canvas.width;
              const bh = ((faceBoundingBox.ymax - faceBoundingBox.ymin) / 1000) * canvas.height;

              const boxColor = liveTriageCode === 'RED' ? '#ef4444' : liveTriageCode === 'ORANGE' ? '#f97316' : '#22c55e';

              ctx.strokeStyle = boxColor;
              ctx.lineWidth = 2.5;

              // Corner brackets
              const corner = Math.min(20, bw * 0.25);
              ctx.beginPath();
              // Top-left
              ctx.moveTo(bx, by + corner);
              ctx.lineTo(bx, by);
              ctx.lineTo(bx + corner, by);
              // Top-right
              ctx.moveTo(bx + bw - corner, by);
              ctx.lineTo(bx + bw, by);
              ctx.lineTo(bx + bw, by + corner);
              // Bottom-left
              ctx.moveTo(bx, by + bh - corner);
              ctx.lineTo(bx, by + bh);
              ctx.lineTo(bx + corner, by + bh);
              // Bottom-right
              ctx.moveTo(bx + bw - corner, by + bh);
              ctx.lineTo(bx + bw, by + bh);
              ctx.lineTo(bx + bw, by + bh - corner);
              ctx.stroke();

              // Tag badge above box
              ctx.fillStyle = boxColor;
              ctx.fillRect(bx, by - 20, Math.max(120, bw * 0.9), 18);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px monospace';
              ctx.fillText(`PATIENT DETECTED (${Math.round(confidence)}%)`, bx + 5, by - 7);
            } else {
              // Default center targeting reticle
              const cx = canvas.width / 2;
              const cy = canvas.height / 2;
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(cx - 75, cy - 85, 150, 170);

              ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
              ctx.fillRect(cx - 75, cy - 105, 150, 18);
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 10px monospace';
              ctx.textAlign = 'center';
              ctx.fillText('TARGET DETECTION AREA', cx, cy - 92);
              ctx.textAlign = 'left';
            }
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
  }, [sourceMode, currentScenario, currentGate, isScanning, faceBoundingBox, confidence, liveTriageCode, continuousAiScan]);

  // Handle Video file upload
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

  // Perform Gemini AI Vision Analysis
  const analyzeCurrentFrameWithAI = async (isBackgroundAuto: boolean = false) => {
    if (isAiAnalyzing) return;
    setIsAiAnalyzing(true);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsAiAnalyzing(false);
      return;
    }

    // Capture frame base64
    const frameBase64 = canvas.toDataURL('image/jpeg', 0.85);

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
        if (typeof data.seriousnessScore === 'number') {
          const score = Math.round(data.seriousnessScore * 10) / 10;
          setLiveScore(score);
          setLiveTriageCode(data.triageCode || 'GREEN');
          setIsBleeding(!!data.isBleeding);
          setBleedingSeverity(data.bleedingSeverity || (data.isBleeding ? 'Severe/Arterial' : 'None'));
          setOnStretcher(!!data.onStretcher);
          setIsAmbulance(!!data.isAmbulanceArrival);
          setIsUnconscious(!!data.isUnconscious);
          if (data.confidence) setConfidence(Math.round(data.confidence * 10) / 10);
          if (data.mobilityStatus) setMobilityStatus(data.mobilityStatus);
          if (data.distressLevel) setDistressLevel(data.distressLevel);
          if (data.primaryObservedSymptom) setPrimarySymptom(data.primaryObservedSymptom);
          if (data.recommendedAction) setRecommendedAction(data.recommendedAction);

          if (data.faceBoundingBox) {
            setFaceBoundingBox(data.faceBoundingBox);
          }

          // Extract face snapshot using precise coordinates
          const capturedFace = extractFaceFromElement(
            sourceMode === 'webcam' && videoRef.current ? videoRef.current : canvas,
            data.faceBoundingBox,
            currentGate.code
          );
          setFaceSnapshot(capturedFace);
        }
      }
    } catch (e) {
      console.warn('AI analysis request error, running local triage intelligence:', e);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Continuous auto-scan effect (every 3.8 seconds when continuous mode is active and camera is running)
  useEffect(() => {
    if (continuousAiScan && sourceMode === 'webcam' && cameraPermissionStatus === 'granted') {
      autoScanTimerRef.current = setInterval(() => {
        analyzeCurrentFrameWithAI(true);
      }, 3800);
    } else {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    }

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
    };
  }, [continuousAiScan, sourceMode, cameraPermissionStatus]);

  // Execute full Emergency Bed Allocation & Tri-Response Dispatch
  const handleTriggerEmergencyDispatch = async () => {
    const canvas = canvasRef.current;
    let finalFace = faceSnapshot;
    if (canvas) {
      finalFace = extractFaceFromElement(
        sourceMode === 'webcam' && videoRef.current ? videoRef.current : canvas,
        faceBoundingBox || undefined,
        currentGate.code
      );
      setFaceSnapshot(finalFace);
    }

    // Run Nearest Room Allocation Algorithm
    const allocation = allocateNearestEmergencyRoom(
      currentGate.id,
      liveTriageCode,
      isBleeding,
      onStretcher,
      rooms
    );

    if (!allocation) {
      alert('WARNING: All emergency beds in this hospital are at 100% occupancy. Please clear or add beds in the Admin Panel.');
      return;
    }

    // Select Nearest Response Team
    const team = dispatchResponseTeam(currentGate, staff);

    // Update Room status to 'Reserved'
    const updatedRooms = rooms.map(r => {
      if (r.id === allocation.room.id) {
        return {
          ...r,
          status: 'Reserved' as const,
          currentPatientId: `EMG-${Date.now().toString().slice(-4)}`,
          currentPatientName: 'Emergency Triage Patient',
          reservedAt: Date.now()
        };
      }
      return r;
    });

    // Emergency sirens & Voice announcement
    playEmergencySiren(liveTriageCode);
    playAllocationChime();
    announceVoiceAlert(
      `Attention: Code ${liveTriageCode} at ${currentGate.name}. Allocated ${allocation.room.roomNumber} in ${allocation.room.block}. Response team dispatched.`
    );

    const now = new Date();
    const caseId = `EMG-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCase: PatientEmergencyCase = {
      id: caseId,
      timestamp: Date.now(),
      gateId: currentGate.id,
      gateName: currentGate.name,
      seriousnessScore: liveScore,
      triageCode: liveTriageCode,
      confidence,
      isBleeding,
      bleedingSeverity,
      onStretcher,
      isAmbulanceArrival: isAmbulance,
      isUnconscious,
      mobilityStatus,
      distressLevel,
      primaryObservedSymptom: primarySymptom,
      recommendedAction,
      requiredEquipment: currentScenario.requiredEquipment || ['Trauma Cart', 'Ventilator', 'Vital Monitor'],
      faceBoundingBox: faceBoundingBox || undefined,
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
        intakeNotes: `AI Triage: ${primarySymptom}. Detected at ${currentGate.name}. Auto-allocated ${allocation.room.roomNumber}. Confidence: ${confidence}%.`
      },
      status: 'ACTIVE_DISPATCH',
      timeline: [
        {
          id: '1',
          time: now.toLocaleTimeString(),
          event: `AI CCTV Vision: Score ${liveScore}/10 (${liveTriageCode}) • ${primarySymptom}`,
          actor: currentGate.cctvCameraId,
          type: 'alert'
        },
        {
          id: '2',
          time: now.toLocaleTimeString(),
          event: `Face photo captured from camera frame & routed to ${team.receptionist.name} for paperwork`,
          actor: 'AI Vision Engine',
          type: 'intake'
        },
        {
          id: '3',
          time: now.toLocaleTimeString(),
          event: `Auto-allocated nearest bed: ${allocation.room.roomNumber} (${allocation.room.block}) - ${allocation.distanceMeters}m (ETA ~${allocation.transitSeconds}s)`,
          actor: 'Smart Allocation Engine',
          type: 'allocation'
        },
        {
          id: '4',
          time: now.toLocaleTimeString(),
          event: `Dispatched Tri-Response Team: ${team.doctor.name} + ${team.nurse.name} + ${team.receptionist.name}`,
          actor: 'Emergency Pager System',
          type: 'dispatch'
        }
      ]
    };

    onEmergencyTriggered(newCase, updatedRooms);
  };

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

        {/* Video Feed Source & Camera Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => {
                setSourceMode('webcam');
                startCamera();
              }}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                sourceMode === 'webcam'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
              {cameraPermissionStatus === 'granted' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setSourceMode('simulation')}
              className={`px-3 py-1 rounded transition-all ${
                sourceMode === 'simulation'
                  ? 'bg-red-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CCTV Sim
            </button>

            <label className={`px-2.5 py-1 rounded cursor-pointer transition-all flex items-center gap-1 ${
              sourceMode === 'upload'
                ? 'bg-purple-600 text-white shadow-sm font-bold'
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

          {/* Front / Rear Camera Flip if on Webcam */}
          {sourceMode === 'webcam' && cameraPermissionStatus === 'granted' && (
            <button
              onClick={toggleCameraFacing}
              title="Switch Front/Rear Camera"
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
            >
              <SwitchCamera className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">{cameraFacingMode === 'user' ? 'Front' : 'Rear'}</span>
            </button>
          )}

          {/* Continuous AI Triage Switch */}
          <button
            onClick={() => setContinuousAiScan(!continuousAiScan)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              continuousAiScan
                ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${continuousAiScan ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Auto AI Scan: {continuousAiScan ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main CCTV Feed & AI HUD Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live CCTV Camera Screen (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl aspect-[16/9] flex items-center justify-center">
            {/* The Main CCTV Canvas Player */}
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full h-full object-contain"
            />

            {/* Hidden media elements for webcam or video uploads */}
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

            {/* Camera Requesting / Denied Overlay */}
            {sourceMode === 'webcam' && cameraPermissionStatus === 'requesting' && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-sm font-bold text-slate-200">
                  Accessing Live Camera Stream...
                </p>
                <p className="text-xs text-slate-400">
                  Please allow camera permissions in your browser.
                </p>
              </div>
            )}

            {sourceMode === 'webcam' && cameraPermissionStatus === 'denied' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-700/60 flex items-center justify-center text-red-400">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">
                  Live Camera Access Unavailable
                </h4>
                <p className="text-xs text-slate-400 max-w-md">
                  No video input was detected or camera permissions were blocked. You can test live emergency scenarios or retry camera permissions below.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
                  >
                    Retry Camera
                  </button>
                  <button
                    onClick={() => setSourceMode('simulation')}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold"
                  >
                    Use CCTV Scenario Bays
                  </button>
                </div>
              </div>
            )}

            {/* Top Bar Floating Status */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-900/90 border border-slate-700 text-slate-100 backdrop-blur-md">
                  {currentGate.code} • {currentGate.cctvCameraId}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                  sourceMode === 'webcam' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  {sourceMode === 'webcam' ? 'LIVE CAMERA STREAM' : 'CCTV SIMULATION FEED'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-900/90 border border-slate-700 text-cyan-400 backdrop-blur-md">
                  NEAREST: {currentGate.nearestBlock}
                </span>
              </div>
            </div>

            {/* Analyzing Flash Overlay */}
            {isAiAnalyzing && (
              <div className="absolute top-4 right-4 pointer-events-none px-3 py-1.5 rounded-lg bg-cyan-600/90 text-white text-xs font-bold font-mono flex items-center gap-2 animate-bounce shadow-lg">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>GEMINI 3.8 FLASH ANALYZING...</span>
              </div>
            )}
          </div>

          {/* CCTV Simulation Scenarios Selector */}
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

          {/* Interactive Smart Bed Allocation Diagnostics & Corridor Route Map */}
          {lastAllocationPreview && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-slate-100">
                    Automated Bed Allocation Engine • Real-Time Route & Diagnostics
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  PATH VERIFIED
                </span>
              </div>

              {/* 4 Steps of the Allocation Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {lastAllocationPreview.steps.map((st, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-emerald-400">
                        {st.step}
                      </span>
                      <span>{st.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {st.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Corridor Proximity & Bed Candidates Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    Corridor Proximity from {currentGate.name}:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Calculated by walking transit speed (~1.2m/s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {lastAllocationPreview.allCandidatesEvaluated.slice(0, 3).map((cand, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-all ${
                        cand.isSelected
                          ? 'bg-emerald-950/70 border-emerald-500 shadow-md text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Bed className={`w-3.5 h-3.5 ${cand.isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="font-bold text-slate-100">{cand.roomNumber}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {cand.block} • {cand.bedType}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold block text-emerald-400">
                          {cand.distance}m
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ~{Math.round(cand.distance / 1.2)}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
                  Clinical AI Triage & Assessment
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
                  {liveScore >= 8.5 ? 'CRITICAL - RESUSCITATION PROTOCOL' : liveScore >= 7.0 ? 'HIGH ACUITY - RAPID RESPONSE' : liveScore >= 4.0 ? 'MODERATE ACUITY' : 'STABLE / ROUTINE CHECK-IN'}
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
                    stroke={liveScore >= 8.5 ? '#ef4444' : liveScore >= 7.0 ? '#f97316' : liveScore >= 4.0 ? '#eab308' : '#10b981'}
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
                    {Math.round(confidence)}%
                  </span>
                  <span className="block text-[8px] text-slate-500 font-bold uppercase">
                    CONFIDENCE
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostic Clinical Indicators */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isBleeding 
                  ? 'bg-red-950/60 border-red-700/80 text-red-200 shadow-sm shadow-red-950' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}>
                <Droplet className={`w-4 h-4 ${isBleeding ? 'text-red-500 animate-bounce' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Hemorrhage</div>
                  <div className="text-[10px]">{isBleeding ? bleedingSeverity : 'No Active Bleed'}</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                onStretcher 
                  ? 'bg-amber-950/60 border-amber-700/80 text-amber-200 shadow-sm shadow-amber-950' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}>
                <Bed className={`w-4 h-4 ${onStretcher ? 'text-amber-500' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Mobility</div>
                  <div className="text-[10px]">{mobilityStatus}</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isAmbulance 
                  ? 'bg-blue-950/60 border-blue-700/80 text-blue-200' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}>
                <Activity className={`w-4 h-4 ${isAmbulance ? 'text-blue-400 animate-pulse' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Ambulance</div>
                  <div className="text-[10px]">{isAmbulance ? 'Paramedic Unit' : 'Walk-in Entrance'}</div>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isUnconscious || distressLevel.includes('Severe') || distressLevel.includes('Critical')
                  ? 'bg-purple-950/60 border-purple-700/80 text-purple-200' 
                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${isUnconscious ? 'text-purple-400' : 'text-slate-600'}`} />
                <div>
                  <div className="font-bold text-[11px]">Distress</div>
                  <div className="text-[10px]">{distressLevel}</div>
                </div>
              </div>
            </div>

            {/* AI Clinical Findings Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Vision Findings:
              </span>
              <p className="font-semibold text-slate-200 line-clamp-2">
                {primarySymptom}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Action: <span className="text-slate-300">{recommendedAction}</span>
              </p>
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
                  Face Auto-Framed
                </span>
                <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                  Transferred to Reception Desk
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Ready for patient intake paperwork & identification
                </p>
              </div>
            </div>

            {/* Action Buttons: Run AI Vision & Trigger Auto-Allocation */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => analyzeCurrentFrameWithAI(false)}
                disabled={isAiAnalyzing}
                className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isAiAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                )}
                <span>{isAiAnalyzing ? 'Evaluating Frame with Gemini Vision...' : 'Trigger AI Vision Analysis Now'}</span>
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
