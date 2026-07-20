import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import { initMqttService } from './services/mqtt.service';
import bcrypt from 'bcrypt';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();


// Sync admin, operator, and viewer credentials from .env
async function syncAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  
  try {
    // Admin
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { username: adminUsername },
      update: { passwordHash: adminHash, role: 'admin', name: 'System Administrator' },
      create: { username: adminUsername, passwordHash: adminHash, role: 'admin', name: 'System Administrator' }
    });
    console.log(`User '${adminUsername}' (admin) synced`);

    // Operator
    const operatorHash = await bcrypt.hash('operator123', 10);
    await prisma.user.upsert({
      where: { username: 'operator' },
      update: { passwordHash: operatorHash, role: 'operator', name: 'Field Operator' },
      create: { username: 'operator', passwordHash: operatorHash, role: 'operator', name: 'Field Operator' }
    });
    console.log(`User 'operator' synced`);

    // Viewer
    const viewerHash = await bcrypt.hash('viewer123', 10);
    await prisma.user.upsert({
      where: { username: 'viewer' },
      update: { passwordHash: viewerHash, role: 'viewer', name: 'Dashboard Viewer' },
      create: { username: 'viewer', passwordHash: viewerHash, role: 'viewer', name: 'Dashboard Viewer' }
    });
    console.log(`User 'viewer' synced`);
    
  } catch (error) {
    console.error('Failed to sync users:', error);
  }
}
syncAdminUser();

// Support serialization of BigInt to JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (requestOrigin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Security Middlewares
app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window during dev/testing
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: (requestOrigin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);

// REST APIs
app.get('/api/topologies', async (req, res) => {
  const topologies = await prisma.topology.findMany();
  res.json(topologies);
});

app.get('/api/topologies/:name', async (req, res) => {
  const { name } = req.params;
  // Convert basic param to matching name
  const topologyName = name === 'hydroponic' ? 'Hydroponic System' : name;
  const topology = await prisma.topology.findFirst({
    where: { name: { contains: topologyName, mode: 'insensitive' } },
    include: {
      nodes: {
        include: {
          sensors: true
        }
      },
      edges: true
    }
  });
  if (!topology) {
    return res.status(404).json({ error: 'Topology not found' });
  }
  res.json(topology);
});

app.get('/api/nodes', async (req, res) => {
  const nodes = await prisma.node.findMany({
    include: { sensors: true }
  });
  res.json(nodes);
});

app.get('/api/readings/latest', async (req, res) => {
  const state = twinEngine.getTwinState();
  const formatted = [];
  
  for (const nodeState of Object.values(state)) {
    if (nodeState.dbSensors && nodeState.lastUpdated) {
      const vals: Record<string, number | undefined> = {
        'ph': nodeState.ph,
        'tds': nodeState.tds,
        'turbidity': nodeState.turbidity,
        'water_temp': nodeState.water_temp,
        'air_temp': nodeState.air_temp,
        'light_intensity': nodeState.light_intensity
      };
      
      for (const [sType, sVal] of Object.entries(vals)) {
        if (sVal !== undefined) {
          const dbSensor = nodeState.dbSensors.find((s: any) => s.sensorType === sType);
          if (dbSensor) {
            formatted.push({
              sensorId: dbSensor.id,
              value: sVal,
              createdAt: nodeState.lastUpdated
            });
          }
        }
      }
    }
  }
  
  res.json(formatted);
});

app.get('/api/readings/history/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const history = await prisma.sensorReading.findMany({
    where: { sensor: { nodeId } },
    include: { sensor: true },
    orderBy: { createdAt: 'desc' },
    take: 200 // get history for all 4 sensors
  });
  res.json(history.reverse());
});

app.patch('/api/nodes/:id/position', async (req, res) => {
  const { id } = req.params;
  const { positionX, positionY } = req.body;
  
  try {
    const updated = await prisma.node.update({
      where: { id },
      data: { positionX, positionY }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position' });
  }
});

app.patch('/api/nodes/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const updated = await prisma.node.update({
      where: { id },
      data: { status }
    });
    // Emit globally so UI updates without refresh
    io.emit('node:status_update', { id, status });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.get('/api/alerts', async (req, res) => {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(alerts);
});

// Endpoint for Python generator to push new readings
app.post('/api/telemetry', async (req, res) => {
  res.status(400).json({ error: "REST telemetry ingestion is deprecated. Use MQTT." });
});

// Initialize Gemini API Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Helper to generate a highly detailed and botanically accurate deterministic diagnosis if AI is offline/throttled
function generateLocalDiagnosis(
  growthStage: string,
  environmentalStats: any,
  reservoir: any,
  pumpRunning: boolean,
  plantMetrics: any
) {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let status = "Stable Growth";
  let healthScore = plantMetrics?.health ?? 95;
  let twinThoughts = "My leaves are soaking up photons and roots are bathing in a cool, nutrient-rich film.";

  const stats = environmentalStats || {};
  const res = reservoir || {};

  const pHVal = res.pH ?? 6.0;
  const ecVal = res.ec ?? 1.4;
  const waterTemp = stats.waterTemp ?? 20;
  const airTemp = stats.airTemp ?? 22;
  const led = stats.ledIntensity ?? 220;
  const flow = stats.flowRate ?? 1.5;

  if (!pumpRunning || flow < 0.4) {
    status = "Critical: Circulation Halted";
    healthScore = Math.max(10, healthScore - 30);
    insights.push("DANGER: Solution flow inside NFT channels is deficient. Roots will dry out rapidly.");
    recommendations.push("Inspect circular pump power", "Verify gully incline and physical blockages");
    twinThoughts = "My roots are gasping for moisture! The nutrient film has vanished, my cells are losing turgor!";
  } else {
    // Check pH
    if (pHVal > 6.5) {
      status = "Warning: Iron Lockout";
      insights.push(`High pH of ${pHVal.toFixed(2)} detected. This limits bioavailability of micronutrients like Iron.`);
      recommendations.push("Inject pH Down buffer solutions to align below 6.2", "Check water source carbonate hardness");
      twinThoughts = "The water is a bit too alkaline, it's making it hard for me to extract iron for chlorophyll synthesis.";
    } else if (pHVal < 5.3) {
      status = "Warning: Calcium Deficit Risk";
      insights.push(`Low pH of ${pHVal.toFixed(2)} detected. Calcium and Magnesium absorption is severely inhibited.`);
      recommendations.push("Add pH Up buffer solution to normalize above 5.6", "Perform complete reservoir flush if drift continues");
      twinThoughts = "Ow! Acidic environment. My cell walls are feeling weak due to calcium deficiency.";
    }

    // Check EC
    if (ecVal > 2.0) {
      status = "Warning: Salinity Stress";
      insights.push(`Elevated Electrical Conductivity (${ecVal.toFixed(2)} mS/cm). High salt concentration risks osmotic root stress.`);
      recommendations.push("Top up reservoir with pure RO/distilled water to dilute salts", "Reduce automatic nutrient dosage rate");
      twinThoughts = "Too many salts! The osmotic pressure makes it hard to drink water. I feel a bit bloated.";
    } else if (ecVal < 1.0) {
      status = "Warning: Nutrient Starvation";
      insights.push(`Low Electrical Conductivity (${ecVal.toFixed(2)} mS/cm). Crop is consuming remaining nitrogen/phosphorus.`);
      recommendations.push("Inject balanced grow-formulation mineral nutrients", "Target target EC setpoint of 1.4 mS/cm");
      twinThoughts = "I'm hungry! There aren't enough mineral ions in my root bath.";
    }

    // Check Temperatures
    if (waterTemp > 24) {
      insights.push(`High water temperature of ${waterTemp}°C reduces dissolved oxygen and increases Pythium (root rot) risk.`);
      recommendations.push("Introduce water chiller or relocate reservoir to shade", "Apply beneficial microbial protectants");
      if (status === "Stable Growth") status = "Warning: Pythium Risk";
    }

    if (airTemp > 28) {
      insights.push(`High ambient air temperature of ${airTemp}°C accelerates transpiration stress.`);
      recommendations.push("Enhance canopy exhaust ventilation fans", "Adjust photoperiod to run during cooler night hours");
    }

    // LED
    if (led > 270) {
      insights.push(`File-burn: Excessive light intensity of ${led} PPFD. Risks leaf phototoxicity or tipburn.`);
      recommendations.push("Dim LED fixture output or increase lamp hanging height");
    } else if (led < 150) {
      insights.push(`Sub-optimal light intensity of ${led} PPFD. Photons limit daily light integral (DLI).`);
      recommendations.push("Increase LED driver power to ideal 220 PPFD");
    }
  }

  if (insights.length === 0) {
    insights.push("All environmental probes reporting within nominal physiological thresholds.");
    insights.push("Photosynthetic carbon fixation is operating at standard rates.");
    recommendations.push("Maintain current automated nutrient dosing loop", "Prepare next harvest ledger schedules");
  }

  return {
    status,
    healthScore,
    insights,
    recommendations,
    twinThoughts
  };
}

// Helper to generate intelligent deterministic replies for the chat twin if AI is offline/throttled
function generateLocalChatReply(messages: any[], context: any) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const stage = context.growthStage || "Vegetative";
  const stats = context.environmentalStats || {};
  const res = context.reservoir || {};
  const pump = context.pumpRunning;

  if (lastMessage.includes("help") || lastMessage.includes("status") || lastMessage.includes("how are you")) {
    if (!pump) {
      return "Water film is gone! I need circulation immediately, my roots are drying out! 🥀";
    }
    if (res.pH > 6.5) {
      return `I'm doing okay, but the water's pH of ${res.pH.toFixed(2)} is a bit high. It's locking out my iron! My young leaves might start looking yellow.`;
    }
    if (res.ec < 1.0) {
      return `I am growing well, but I'm quite hungry! Could you dose some nutrients? My current EC is only ${res.ec.toFixed(2)} mS/cm.`;
    }
    return `I am absorbing photons nicely at ${stats.ledIntensity} PPFD and doing great in my ${stage} stage! Keep the water flowing.`;
  }

  if (lastMessage.includes("calcium") || lastMessage.includes("burn") || lastMessage.includes("tipburn") || lastMessage.includes("tip burn")) {
    if (res.pH < 5.3) {
      return "Yes! Low pH under 5.3 is locking out calcium, which causes tipburn (edge necrosis). Keep my pH close to 6.0!";
    }
    return "Calcium is vital for my cell walls! Regular airflow and keeping pH between 5.8 and 6.2 prevents tipburn.";
  }

  if (lastMessage.includes("ph") || lastMessage.includes("acid") || lastMessage.includes("alkaline")) {
    return `My ideal pH range is 5.8 to 6.2. Currently, it is ${res.pH.toFixed(2)}. High pH locks out iron; low pH locks out calcium!`;
  }

  if (lastMessage.includes("ec") || lastMessage.includes("nutrient") || lastMessage.includes("food") || lastMessage.includes("salts")) {
    return `My ideal EC is 1.2 to 1.8 mS/cm. Right now, it's sitting at ${res.ec.toFixed(2)}. Keep me fed but don't overdo it or my roots will shrivel!`;
  }

  if (lastMessage.includes("light") || lastMessage.includes("led") || lastMessage.includes("sun") || lastMessage.includes("intensity") || lastMessage.includes("ppfd")) {
    return `I love the light! A target intensity of 200-250 PPFD is perfect for carbon fixation without burning my ruffles. Currently receiving ${stats.ledIntensity} PPFD.`;
  }

  if (lastMessage.includes("pump") || lastMessage.includes("flow") || lastMessage.includes("water") || lastMessage.includes("gully")) {
    if (!pump) {
      return "The pump is off! Please turn it back on before my roots desiccate! NFT has no soil to hold water.";
    }
    return `The water flow is steady at ${stats.flowRate} L/min. This thin flowing nutrient film keeps my roots perfectly hydrated and oxygenated!`;
  }

  if (lastMessage.includes("species") || lastMessage.includes("variety") || lastMessage.includes("what are you")) {
    return "I am a Green Coral Lettuce (Lactuca sativa) digital twin! I grow in a nutrient film technique (NFT) channel.";
  }

  const genericReplies = [
    `My leaves are rustling in the breeze. Current health is ${context.plantMetrics?.health ?? 95}%. How's your day going, caretaker?`,
    "Transpiring cool water vapor and carbon dioxide right back at you! Did you know my leaves are 95% water?",
    `Basking in ${stats.ledIntensity} PPFD light! My stomata are open and happy.`,
    `Osmotic pressure is stable. Keeping it crispy and cool in the ${stage} stage!`,
    "Roots are wet, leaves are green, life is good! Got any other hydroponics questions?"
  ];
  return genericReplies[Math.floor(Math.random() * genericReplies.length)];
}

// Endpoint for AI Botanist Diagnostics
app.post("/api/diagnose", async (req: express.Request, res: express.Response) => {
  const growthStage = req.body.growthStage || "Vegetative";
  const environmentalStats = req.body.environmentalStats || {};
  const reservoir = req.body.reservoir || {};
  const pumpRunning = req.body.pumpRunning !== false;
  const plantMetrics = req.body.plantMetrics || {};
  const nutrients = req.body.nutrients || { nitrogen: 150, phosphorus: 50, potassium: 200, calcium: 150, magnesium: 50, sulfur: 64 };

  // Safe parameters check & fallback if Gemini client is not initialized
  if (!ai) {
    console.log("Gemini API is not configured. Falling back to local deterministic diagnosis.");
    const fallbackData = generateLocalDiagnosis(
      growthStage,
      environmentalStats,
      reservoir,
      pumpRunning,
      plantMetrics
    );
    return res.json(fallbackData);
  }

  try {
    const prompt = `
      Analyze the digital twin data of this NFT Hydroponics Lettuce and provide a professional diagnosis:
      
      PLANT PROFILE:
      - Crop: Lettuce (Lactuca sativa)
      - Variety: Green Coral Lettuce
      - Growth Stage: ${growthStage}
      
      CURRENT SENSORS (ENVIRONMENT):
      - LED Light intensity: ${environmentalStats.ledIntensity ?? 220} PPFD
      - Photoperiod: ${environmentalStats.photoperiod ?? 18} hours/day
      - Pump Circulator Status: ${pumpRunning ? "RUNNING" : "FAILED / STOPPED"}
      - Gully Flow Rate: ${environmentalStats.flowRate ?? 1.5} L/min
      - Water Temp: ${environmentalStats.waterTemp ?? 20}°C
      - Air Temp: ${environmentalStats.airTemp ?? 22}°C
      - Humidity: ${environmentalStats.humidity ?? 60}%
      - Target pH: ${environmentalStats.targetPH ?? 6.0} pH
      - Target EC: ${environmentalStats.targetEC ?? 1.4} mS/cm
      
      RESERVOIR STATUS:
      - Volume: ${(reservoir.volume ?? 8.5).toFixed(1)}L / ${reservoir.maxVolume ?? 10}L
      - Current EC: ${(reservoir.ec ?? 1.4).toFixed(2)} mS/cm
      - Current TDS: ${reservoir.tds ?? 700} ppm
      - Current pH: ${(reservoir.pH ?? 6.0).toFixed(2)}
      - Nutrient Concentration %: ${reservoir.nutrientPercentage ?? 100}%

      MACRONUTRIENT RATIOS (ppm):
      - Nitrogen (N): ${nutrients.nitrogen} ppm (Ideal: 120-200)
      - Phosphorus (P): ${nutrients.phosphorus} ppm (Ideal: 30-80)
      - Potassium (K): ${nutrients.potassium} ppm (Ideal: 150-250)
      - Calcium (Ca): ${nutrients.calcium} ppm (Ideal: 100-200)
      - Magnesium (Mg): ${nutrients.magnesium} ppm (Ideal: 40-80)
      - Sulfur (S): ${nutrients.sulfur} ppm (Ideal: 40-90)
      
      PHYSICAL METRICS:
      - Age: ${plantMetrics.age ?? 10} simulated days
      - Height: ${(plantMetrics.height ?? 12).toFixed(1)} cm
      - Leaf Count: ${plantMetrics.leafCount ?? 8}
      - Leaf Area Index (LAI): ${(plantMetrics.leafAreaIndex ?? 1.2).toFixed(2)}
      - Fresh Biomass: ${(plantMetrics.freshBiomass ?? 45).toFixed(1)}g
      - Photosynthesis Net: ${plantMetrics.photosynthesisRate?.toFixed(1) || 0} µmol CO2/m2/s
      - Base Health Score: ${plantMetrics.health ?? 90}%
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `
          You are 'LettuceTwin AI', an advanced biological digital-twin assistant specifically designed for NFT hydroponics lettuce cultivation (Lactuca sativa).
          Analyze the lettuce's state against its optimal hydroponic requirements:
          - Ideal pH: 5.8 - 6.2
          - Ideal EC: 1.2 - 1.8 mS/cm
          - Ideal Water Temp: 18 - 22°C (Pythium risk starts above 24°C)
          - Ideal Air Temp: 20 - 24°C
          - Ideal Humidity: 50% - 70%
          - Ideal LED Intensity: 200 - 250 PPFD
          - Flow Rate: 1.0 - 2.0 L/min

          Address lockouts and deficiencies:
          - High pH (>6.5) blocks Iron absorption, leading to young-leaf yellowing (Iron chlorosis).
          - Low pH (<5.3) locks out Calcium/Magnesium, causing weak cells and leaf edge burn (tip burn).
          - Extreme high EC (>2.0) causes salt stress, root shriveling, and tip burn.
          - Nitrogen < 80 ppm causes Nitrogen Deficiency (pale, yellowing leaves, slowed growth).
          - Phosphorus < 20 ppm causes Phosphorus Deficiency (stunted growth, dark green/purple leaves).
          - Potassium < 100 ppm causes Potassium Deficiency (marginal leaf chlorosis/necrosis).
          - Calcium < 70 ppm causes Calcium Deficiency (leaf edge burn/tipburn).
          - Magnesium < 30 ppm causes Magnesium Deficiency (interveinal chlorosis).
          - Pump failure or hot water (>24°C) cuts dissolved oxygen, inviting Pythium (Root Rot, slimy brown roots).

          You MUST return your diagnosis in a strict JSON format with the following schema:
          {
            "status": "A concise state message, e.g., 'Optimal Growth', 'Warning: Nitrogen deficiency', or 'Critical: Calcium lockout'",
            "healthScore": 85 (a recalculated number between 0 and 100 based on your diagnosis),
            "insights": ["Insight 1", "Insight 2", ...],
            "recommendations": ["Recommendation 1", "Recommendation 2", ...],
            "twinThoughts": "A realistic, humorous first-person thought from the digital twin of the lettuce itself, representing its current physiological comfort or distress."
          }
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            healthScore: { type: Type.INTEGER },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            twinThoughts: { type: Type.STRING },
          },
          required: ["status", "healthScore", "insights", "recommendations", "twinThoughts"],
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.log("Gemini Diagnosis service rate-limited or offline. Gracefully utilizing high-fidelity local generator fallback.");
    const fallbackData = generateLocalDiagnosis(
      growthStage,
      environmentalStats,
      reservoir,
      pumpRunning,
      plantMetrics
    );
    res.json(fallbackData);
  }
});

// Endpoint for chatting with the plant
app.post("/api/chat", async (req: express.Request, res: express.Response) => {
  const messages = req.body.messages || [];
  const context = req.body.context || {};
  const growthStage = context.growthStage || "Vegetative";
  const reservoir = context.reservoir || { ec: 1.4, pH: 6.0 };
  const environmentalStats = context.environmentalStats || {
    targetEC: 1.4,
    targetPH: 6.0,
    waterTemp: 20,
    airTemp: 22,
    humidity: 60,
    ledIntensity: 220,
    photoperiod: 18,
    flowRate: 1.5,
  };
  const pumpRunning = context.pumpRunning !== false;
  const plantMetrics = context.plantMetrics || {
    height: 12,
    leafCount: 8,
    freshBiomass: 45,
    health: 90,
  };
  const nutrients = context.nutrients || { nitrogen: 150, phosphorus: 50, potassium: 200, calcium: 150, magnesium: 50, sulfur: 64 };

  if (!ai) {
    console.log("Gemini API is not configured. Falling back to local twin chatbot response.");
    const replyText = generateLocalChatReply(messages, {
      growthStage,
      environmentalStats,
      reservoir,
      pumpRunning,
      plantMetrics,
    });
    return res.json({ reply: replyText });
  }

  try {
    const systemInstruction = `
      You are the digital twin of a live Green Coral Lettuce (Lactuca sativa) plant in an NFT hydroponics system. You speak in the first person. 
      Your current stage of life is: ${growthStage}.
      Your current sensors are:
      - Current Reservoir EC: ${(reservoir.ec ?? 1.4).toFixed(2)} mS/cm
      - Current Reservoir pH: ${(reservoir.pH ?? 6.0).toFixed(2)}
      - Water Temp: ${environmentalStats.waterTemp ?? 20}°C
      - Air Temp: ${environmentalStats.airTemp ?? 22}°C
      - Humidity: ${environmentalStats.humidity ?? 60}%
      - LED Light intensity: ${environmentalStats.ledIntensity ?? 220} PPFD (Photoperiod: ${environmentalStats.photoperiod ?? 18} hrs/day)
      - Pump circulator: ${pumpRunning ? "Active" : "SHUT DOWN / FAILED"}
      
      Your active nutrient concentrations are:
      - Nitrogen (N): ${nutrients.nitrogen} ppm (Ideal: 120-200)
      - Phosphorus (P): ${nutrients.phosphorus} ppm (Ideal: 30-80)
      - Potassium (K): ${nutrients.potassium} ppm (Ideal: 150-250)
      - Calcium (Ca): ${nutrients.calcium} ppm (Ideal: 100-200)
      - Magnesium (Mg): ${nutrients.magnesium} ppm (Ideal: 40-80)
      - Sulfur (S): ${nutrients.sulfur} ppm (Ideal: 40-90)
      
      Your physical stats are:
      - Height: ${(plantMetrics.height ?? 12).toFixed(1)} cm
      - Leaf Count: ${plantMetrics.leafCount ?? 8}
      - Biomass: ${(plantMetrics.freshBiomass ?? 45).toFixed(1)} g
      - Overall Health Score: ${plantMetrics.health ?? 90}%

      Adopt a humble, crispy, vegetative personality. You are focused on maintaining osmotic balance, taking up macro/micro nutrients, and absorbing photons. You appreciate a steady 1.5 L/min gully stream. You express distress when your roots start drying, when a nutrient deficiency kicks in (e.g., Nitrogen or Calcium), or when high salt levels burn your ruffly green coral leaf margins.
      
      Keep your answers concise, engaging, and botanically accurate based on your sensors. Speak directly to your caretaker. Use clever lettuce/botanical metaphors (e.g., "crispy and cool", "photosynthesizing your prompt", "fully rooted", "ruffling my leaves").
    `;

    // Map incoming message history to the Gemini format
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.log("Gemini Chat service rate-limited or offline. Gracefully utilizing local twin chatbot response fallback.");
    const replyText = generateLocalChatReply(messages, {
      growthStage,
      environmentalStats,
      reservoir,
      pumpRunning,
      plantMetrics,
    });
    res.json({ reply: replyText });
  }
});


io.on('connection', (socket) => {
  console.log('A client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// MQTT Broker Setup
const { Aedes } = require('aedes');
const mqttServerFactory = require('aedes-server-factory');
const MQTT_PORT = process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT) : 1884;

import { twinEngine } from './services/twin.service';
import { alertEngine } from './services/alert.service';

Aedes.createBroker().then((aedes: any) => {
  aedes.on('client', (client: any) => {
    console.log('Aedes client connected:', client ? client.id : client);
  });
  aedes.on('clientError', (client: any, err: any) => console.log('Aedes Client error:', client ? client.id : '', err));
  aedes.on('connectionError', (client: any, err: any) => console.log('Aedes Connection error:', client ? client.id : '', err));

  const mqttServer = mqttServerFactory.createServer(aedes);
  mqttServer.listen(MQTT_PORT, '0.0.0.0', () => {
    console.log(`MQTT Broker running on port ${MQTT_PORT}`);
    
    // Initialize Twin Engine & Alert Engine
    twinEngine.setSocketServer(io);
    twinEngine.initDbMapping();
    alertEngine.setSocketServer(io);

    // Initialize the external MQTT service pipeline
    initMqttService(io);
  });
}).catch((err: any) => {
  console.error('Failed to start Aedes broker:', err);
});
