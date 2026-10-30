import { GoogleGenAI, Type, Schema } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, gateId, gateName } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'No imageBase64 provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        source: 'rule-engine-fallback',
        message: 'No GEMINI_API_KEY configured, falling back to local clinical model'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are a Board-Certified Emergency Triage AI Vision Specialist evaluating incoming live CCTV / webcam footage at ${gateName || gateId || 'Hospital Emergency Entrance'}.

Your task is to conduct an accurate, objective, clinical Emergency Severity Index (ESI) & Manchester Triage assessment from the provided camera image:

1. PERSON PRESENCE & FACE LOCALIZATION:
   - Identify if a human is in frame. If visible, provide precise face bounding box coordinates [ymin, xmin, ymax, xmax] normalized from 0 to 1000.

2. VISUAL EMERGENCY INDICATORS:
   - Bleeding: Check for active hemorrhage, blood on skin/clothing, lacerations, or bandages.
   - Mobility & Posture: Is the person standing/walking independently, being supported, in a wheelchair, on a stretcher/gurney, or slumped/collapsed on the floor/chair?
   - Consciousness & Distress: Are they alert, grimacing in severe pain, clutching their chest/head/abdomen, slumped/unresponsive, or in respiratory distress?
   - Ambulance/EMT Presence: Are emergency vehicles, stretchers, or paramedics visible?

3. SERIOUSNESS SCORE & TRIAGE CODE (1.0 to 10.0 scale):
   - Score 8.5 - 10.0 (CODE RED / ESI Level 1): Life-threatening emergencies (Severe bleeding, cardiopulmonary arrest, unconsciousness, severe multi-trauma, gurney CPR).
   - Score 7.0 - 8.4 (CODE ORANGE / ESI Level 2): High acuity (Acute chest pain, severe dyspnea, altered mental status, severe acute pain, substantial hemorrhage).
   - Score 4.0 - 6.9 (CODE YELLOW / ESI Level 3): Moderate acuity (Moderate pain, stable limb fractures, supported walk-in, minor bleeding, abdominal pain).
   - Score 1.0 - 3.9 (CODE GREEN / ESI Level 4-5): Low acuity / Stable (Walking alert, no acute distress, looking into camera, minor sprain/bruise). Note: If the person in front of the camera is simply looking calm and normal, give a realistic stable score (1.5 - 2.8).

4. ACCURATE DIAGNOSTIC RATIONALE & BED ALLOCATION RECOMMENDATION:
   - Provide concise primary observed symptom, recommended clinical protocol, and specific equipment needed.`;

    const triageSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        seriousnessScore: { 
          type: Type.NUMBER, 
          description: 'Accurate clinical triage score from 1.0 to 10.0 based on visible acute distress' 
        },
        triageCode: { 
          type: Type.STRING, 
          enum: ['RED', 'ORANGE', 'YELLOW', 'GREEN'], 
          description: 'Hospital emergency acuity code' 
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Detection confidence percentage (e.g. 92.5)'
        },
        isBleeding: { 
          type: Type.BOOLEAN, 
          description: 'True if visible blood, active hemorrhage, or bandaged wound is detected' 
        },
        bleedingSeverity: { 
          type: Type.STRING, 
          enum: ['None', 'Minor', 'Moderate', 'Severe/Arterial'], 
          description: 'Severity level of hemorrhage' 
        },
        onStretcher: { 
          type: Type.BOOLEAN, 
          description: 'True if patient is on a stretcher, gurney, or wheelchair' 
        },
        isAmbulanceArrival: { 
          type: Type.BOOLEAN, 
          description: 'True if ambulance vehicle or EMT personnel are present' 
        },
        isUnconscious: { 
          type: Type.BOOLEAN, 
          description: 'True if patient appears unconscious, limp, or unresponsive' 
        },
        mobilityStatus: {
          type: Type.STRING,
          enum: ['Walking Independent', 'Supported by Kin', 'Wheelchair', 'Stretcher/Gurney', 'Lying Down/Collapsed', 'Seated'],
          description: 'Observed mobility posture'
        },
        distressLevel: {
          type: Type.STRING,
          enum: ['None/Calm', 'Mild Distress', 'Moderate Pain', 'Severe Acute Distress', 'Unresponsive/Critical'],
          description: 'Level of visible physical/facial distress'
        },
        primaryObservedSymptom: { 
          type: Type.STRING, 
          description: 'Primary clinical visual finding with anatomical specificity' 
        },
        recommendedAction: { 
          type: Type.STRING, 
          description: 'Immediate bedside emergency protocol' 
        },
        requiredEquipment: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Required medical devices'
        },
        faceBoundingBox: {
          type: Type.OBJECT,
          properties: {
            ymin: { type: Type.NUMBER },
            xmin: { type: Type.NUMBER },
            ymax: { type: Type.NUMBER },
            xmax: { type: Type.NUMBER }
          },
          description: 'Estimated face bounding box coordinates normalized from 0 to 1000'
        }
      },
      required: [
        'seriousnessScore', 
        'triageCode', 
        'confidence',
        'isBleeding', 
        'bleedingSeverity',
        'onStretcher', 
        'isAmbulanceArrival', 
        'isUnconscious', 
        'mobilityStatus',
        'distressLevel',
        'primaryObservedSymptom', 
        'recommendedAction'
      ]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: triageSchema,
        temperature: 0.1
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.status(200).json({
      source: 'gemini-3.8-flash',
      ...parsedData
    });
  } catch (error: any) {
    console.error('Error analyzing frame with Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze frame',
      fallback: true
    });
  }
}
