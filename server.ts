import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Schema } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable large JSON payload for camera frame base64 transfers
app.use(express.json({ limit: '25mb' }));

// Health and AI status check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Gemini-powered frame analysis endpoint
app.post('/api/analyze-frame', async (req, res) => {
  try {
    const { imageBase64, gateId, gateName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No imageBase64 provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return structured response indicating offline mode so client uses rule-based engine
      return res.json({
        source: 'rule-engine-fallback',
        message: 'No GEMINI_API_KEY in environment, relying on client-side smart vision model'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Extract raw base64 data
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are an expert Hospital Emergency AI Triage Vision System monitoring CCTV gate feed at ${gateName || gateId || 'Emergency Entry'}.
Analyze this CCTV / camera frame of an incoming patient or entering person:
1. Is there bleeding or visible hemorrhage / blood loss?
2. Is the person on a stretcher, gurney, wheelchair, or supported by paramedics?
3. Is an ambulance or emergency vehicle arriving?
4. Is the patient unconscious, collapsed, in respiratory distress, clutching chest, or limp?
5. Determine a Seriousness Score from 1.0 to 10.0 (where 9.0-10.0 is Life-Threatening/Code RED, 7.0-8.9 is High-Acuity/Code ORANGE, 4.0-6.9 is Moderate/Code YELLOW, 1.0-3.9 is Stable/Code GREEN).
6. Provide a concise triage assessment, primary observed symptom, recommended equipment (e.g., Trauma resuscitation, ventilator, defibrillator, O-negative blood).
7. If a human face or upper body is visible, estimate the bounding box [ymin, xmin, ymax, xmax] normalized between 0 and 1000.`;

    const triageSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        seriousnessScore: { type: Type.NUMBER, description: 'Triage seriousness score from 1.0 to 10.0' },
        triageCode: { type: Type.STRING, enum: ['RED', 'ORANGE', 'YELLOW', 'GREEN'], description: 'Hospital emergency code' },
        isBleeding: { type: Type.BOOLEAN, description: 'True if visible blood, active bleeding, or hemorrhage wounds are detected' },
        bleedingSeverity: { type: Type.STRING, enum: ['None', 'Minor', 'Moderate', 'Severe/Arterial'], description: 'Severity of bleeding' },
        onStretcher: { type: Type.BOOLEAN, description: 'True if patient is on a stretcher, gurney, or wheelchair' },
        isAmbulanceArrival: { type: Type.BOOLEAN, description: 'True if ambulance vehicle or EMT personnel are present' },
        isUnconscious: { type: Type.BOOLEAN, description: 'True if patient appears unconscious, limp, unresponsive or in severe distress' },
        primaryObservedSymptom: { type: Type.STRING, description: 'Primary visual medical finding' },
        recommendedAction: { type: Type.STRING, description: 'Immediate emergency protocol recommended' },
        requiredEquipment: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Needed medical equipment: e.g. Ventilator, Defibrillator, Trauma Cart, Central O2'
        },
        faceBoundingBox: {
          type: Type.OBJECT,
          properties: {
            ymin: { type: Type.NUMBER },
            xmin: { type: Type.NUMBER },
            ymax: { type: Type.NUMBER },
            xmax: { type: Type.NUMBER }
          },
          description: 'Estimated face or upper body box normalized 0 to 1000'
        }
      },
      required: ['seriousnessScore', 'triageCode', 'isBleeding', 'onStretcher', 'isAmbulanceArrival', 'isUnconscious', 'primaryObservedSymptom', 'recommendedAction']
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
    return res.json({
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
});

// Start Vite middleware in dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LifePulse Server] Emergency Triage System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
