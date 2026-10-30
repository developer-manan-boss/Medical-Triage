import { CctvScenario, Gate } from '../types';

export function drawCctvFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scenario: CctvScenario,
  gate: Gate,
  tick: number,
  isScanning: boolean
) {
  // Clear background (Dark clinical CCTV atmosphere)
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, width, height);

  // Hospital entrance perspective floor & walls
  const horizon = height * 0.42;

  // Ceiling lights / perspective
  const ceilingGrad = ctx.createLinearGradient(0, 0, 0, horizon);
  ceilingGrad.addColorStop(0, '#0f172a');
  ceilingGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = ceilingGrad;
  ctx.fillRect(0, 0, width, horizon);

  // Floor
  const floorGrad = ctx.createLinearGradient(0, horizon, 0, height);
  floorGrad.addColorStop(0, '#1e293b');
  floorGrad.addColorStop(1, '#090e17');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizon, width, height - horizon);

  // Perspective floor tiles
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
  ctx.lineWidth = 1;
  for (let i = -width; i < width * 2; i += 90) {
    ctx.beginPath();
    ctx.moveTo(width / 2, horizon);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let y = horizon + 20; y < height; y += (y - horizon) * 0.5 + 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Hospital Automatic Glass Doors & Gate Signs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(width * 0.22, horizon - 90, width * 0.56, 120);

  // Gate Title Sign
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(width * 0.25, horizon - 80, width * 0.5, 24);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`EMERGENCY INTAKE • ${gate.name.toUpperCase()}`, width / 2, horizon - 64);

  // Door glass panels
  ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
  ctx.fillRect(width * 0.28, horizon - 50, width * 0.21, 90);
  ctx.fillRect(width * 0.51, horizon - 50, width * 0.21, 90);
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
  ctx.strokeRect(width * 0.28, horizon - 50, width * 0.21, 90);
  ctx.strokeRect(width * 0.51, horizon - 50, width * 0.21, 90);

  // Scene-specific animated actors
  if (scenario.visualScene === 'stretcher_trauma') {
    drawStretcherTraumaScene(ctx, width, height, tick, scenario.isBleeding);
  } else if (scenario.visualScene === 'ambulance_cpr') {
    drawAmbulanceCprScene(ctx, width, height, tick);
  } else if (scenario.visualScene === 'chest_pain_collapse') {
    drawChestPainScene(ctx, width, height, tick);
  } else {
    drawWalkingFractureScene(ctx, width, height, tick);
  }

  // CCTV Scanning Laser Line
  if (isScanning) {
    const scanY = (tick * 4) % height;
    const laserGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    laserGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
    laserGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.35)');
    laserGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = laserGrad;
    ctx.fillRect(0, scanY - 20, width, 40);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(width, scanY);
    ctx.stroke();
  }

  // CCTV Screen Artifacts & Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }

  // Camera OSD (On-Screen Display)
  drawCctvOsd(ctx, width, height, gate, tick);
}

function drawStretcherTraumaScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number,
  isBleeding: boolean
) {
  // Stretcher moving slightly with bounce
  const bounce = Math.sin(tick * 0.1) * 3;
  const centerX = width * 0.5;
  const centerY = height * 0.58 + bounce;

  // Stretcher Gurney Frame
  ctx.fillStyle = '#64748b';
  ctx.fillRect(centerX - 130, centerY + 30, 260, 14);

  // Wheels
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(centerX - 90, centerY + 55, 12, 0, Math.PI * 2);
  ctx.arc(centerX + 90, centerY + 55, 12, 0, Math.PI * 2);
  ctx.fill();

  // White clinical mattress
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(centerX - 120, centerY + 10, 240, 20);

  // Patient lying down
  // Body blanket / torso
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + 12, 85, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Patient head
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(centerX - 75, centerY - 2, 22, 0, Math.PI * 2);
  ctx.fill();

  // Sterile bandage & trauma blood marking
  if (isBleeding) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 85, centerY - 15, 22, 10);
    // Active arterial/trauma bleed patch
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(centerX - 78, centerY - 12, 10, 6);

    // Splatter on mattress
    ctx.beginPath();
    ctx.arc(centerX - 50, centerY + 18, 9, 0, Math.PI * 2);
    ctx.arc(centerX - 35, centerY + 22, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paramedic 1 (Pushing gurney head)
  ctx.fillStyle = '#f97316'; // High-visibility emergency orange
  ctx.fillRect(centerX - 155, centerY - 45, 30, 65);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(centerX - 140, centerY - 60, 16, 0, Math.PI * 2);
  ctx.fill();

  // Paramedic 2 (Running alongside with IV drip bag)
  ctx.fillStyle = '#f97316';
  ctx.fillRect(centerX + 125, centerY - 40, 30, 65);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(centerX + 140, centerY - 55, 16, 0, Math.PI * 2);
  ctx.fill();

  // IV pole and blood transfusion bag
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 40, centerY + 20);
  ctx.lineTo(centerX - 40, centerY - 70);
  ctx.stroke();

  ctx.fillStyle = '#ef4444'; // Red blood unit
  ctx.fillRect(centerX - 48, centerY - 95, 16, 25);

  // AI Detection Bounding Boxes
  drawAiBoundingBox(ctx, centerX - 100, centerY - 28, 55, 55, 'PATIENT FACE [HEAD TRAUMA]', '#ef4444');
  drawAiBoundingBox(ctx, centerX - 140, centerY - 10, 280, 75, 'STRETCHER / CRITICAL TRAUMA', '#f97316');
  if (isBleeding) {
    drawAiBoundingBox(ctx, centerX - 85, centerY - 18, 30, 20, 'ACTIVE BLEEDING DETECTED', '#dc2626');
  }
}

function drawAmbulanceCprScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number
) {
  const centerX = width * 0.45;
  const centerY = height * 0.55;

  // Ambulance rear doors open
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(centerX - 220, centerY - 90, 170, 170);

  // Red & Blue flashing emergency strobe
  const isRed = Math.floor(tick / 5) % 2 === 0;
  ctx.fillStyle = isRed ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)';
  ctx.beginPath();
  ctx.arc(centerX - 200, centerY - 100, 25, 0, Math.PI * 2);
  ctx.arc(centerX - 70, centerY - 100, 25, 0, Math.PI * 2);
  ctx.fill();

  // Gurney unloaded from ambulance
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(centerX - 10, centerY + 20, 200, 16);

  // Patient lying down
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(centerX + 30, centerY - 5, 20, 0, Math.PI * 2);
  ctx.fill();

  // Oxygen bag-valve-mask
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(centerX + 24, centerY - 10, 12, 16);

  // EMT performing active CPR compressions (animating up and down)
  const cprY = Math.sin(tick * 0.4) * 8;
  ctx.fillStyle = '#eab308';
  ctx.fillRect(centerX + 65, centerY - 45 + cprY, 32, 50);
  ctx.beginPath();
  ctx.arc(centerX + 81, centerY - 60 + cprY, 15, 0, Math.PI * 2);
  ctx.fill();

  // AI Overlays
  drawAiBoundingBox(ctx, centerX + 10, centerY - 25, 45, 45, 'UNCONSCIOUS PATIENT', '#ef4444');
  drawAiBoundingBox(ctx, centerX - 230, centerY - 110, 190, 200, 'AMBULANCE VEHICLE [CODE RED]', '#3b82f6');
  drawAiBoundingBox(ctx, centerX + 50, centerY - 70 + cprY, 65, 80, 'PARAMEDIC CPR IN PROGRESS', '#eab308');
}

function drawChestPainScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number
) {
  const centerX = width * 0.5;
  const centerY = height * 0.58;

  // Patient walking bent over, clutching chest
  const wobble = Math.sin(tick * 0.15) * 4;

  // Legs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(centerX - 14, centerY + 30, 12, 50);
  ctx.fillRect(centerX + 4, centerY + 30, 12, 50);

  // Torso bent forward
  ctx.fillStyle = '#475569';
  ctx.fillRect(centerX - 25 + wobble, centerY - 30, 50, 65);

  // Head sweating / distressed
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(centerX + wobble, centerY - 52, 22, 0, Math.PI * 2);
  ctx.fill();

  // Hand clutching left chest
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(centerX - 8 + wobble, centerY - 10, 12, 0, Math.PI * 2);
  ctx.fill();

  // Stress indicator radiating from heart
  const pulseR = (tick * 2) % 25;
  ctx.strokeStyle = `rgba(239, 68, 68, ${1 - pulseR / 25})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX - 8 + wobble, centerY - 10, pulseR + 10, 0, Math.PI * 2);
  ctx.stroke();

  // Attendant/family supporting arm
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(centerX + 35, centerY - 20, 28, 80);
  ctx.beginPath();
  ctx.arc(centerX + 49, centerY - 38, 16, 0, Math.PI * 2);
  ctx.fill();

  // AI Overlays
  drawAiBoundingBox(ctx, centerX - 25 + wobble, centerY - 75, 52, 50, 'DISTRESSED FACIAL GRIMACE', '#f97316');
  drawAiBoundingBox(ctx, centerX - 25 + wobble, centerY - 25, 40, 40, 'CHEST CLUTCHING (ANGINA/ACS)', '#ef4444');
}

function drawWalkingFractureScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tick: number
) {
  const centerX = width * 0.5;
  const centerY = height * 0.58;

  // Walking patient
  ctx.fillStyle = '#334155';
  ctx.fillRect(centerX - 10, centerY + 30, 10, 50);
  ctx.fillRect(centerX + 6, centerY + 30, 10, 50);

  ctx.fillStyle = '#10b981'; // Green shirt (stable)
  ctx.fillRect(centerX - 20, centerY - 30, 42, 60);

  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(centerX + 1, centerY - 50, 20, 0, Math.PI * 2);
  ctx.fill();

  // Arm in splint/sling
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(centerX - 18, centerY - 5, 38, 16);

  drawAiBoundingBox(ctx, centerX - 20, centerY - 70, 45, 45, 'ALERT & CONSCIOUS', '#10b981');
  drawAiBoundingBox(ctx, centerX - 22, centerY - 10, 45, 25, 'FOREARM SPLINT (STABLE)', '#10b981');
}

function drawAiBoundingBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Corner brackets
  const len = 10;
  ctx.beginPath();
  // TL
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  // TR
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  // BL
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  // BR
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - len);
  ctx.stroke();

  // Tag badge
  ctx.fillStyle = color;
  ctx.fillRect(x, y - 18, Math.max(90, label.length * 6.5), 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 4, y - 6);
}

function drawCctvOsd(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gate: Gate,
  tick: number
) {
  // Top left: CCTV Camera ID & Gate
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(14, 14, 250, 48);

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`CAM: ${gate.cctvCameraId}`, 24, 32);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px monospace';
  ctx.fillText(`LOC: ${gate.name}`, 24, 48);

  // Top right: Recording status & timestamp
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(width - 250, 14, 236, 48);

  // Flashing red REC indicator
  const showRec = Math.floor(tick / 15) % 2 === 0;
  if (showRec) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(width - 230, 32, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('REC', width - 216, 36);
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('LIVE', width - 216, 36);
  }

  const now = new Date();
  ctx.fillStyle = '#f8fafc';
  ctx.font = '11px monospace';
  ctx.fillText(now.toISOString().replace('T', ' ').slice(0, 19), width - 170, 36);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '10px monospace';
  ctx.fillText('AI LIVE EDGE TRIAGE ACTIVE', width - 216, 50);

  // Bottom Center: Target crosshairs
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  const cx = width / 2;
  const cy = height / 2;
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy);
  ctx.lineTo(cx + 20, cy);
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx, cy + 20);
  ctx.stroke();
}
