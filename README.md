# Smart Hydroponic Digital Twin (GreenTwin)

Welcome to **GreenTwin**, an interactive, high-fidelity Digital Twin and simulation control center designed for optimizing lettuce (*Lactuca sativa*) growth in an automated NFT (Nutrient Film Technique) hydroponic system.

GreenTwin bridges real-time telemetry, interactive 3D scene visualizations, physical simulation models, and AI-driven agricultural diagnostics into a single dashboard.

---

## 🚀 Key Features

### 1. 3D Digital Twin View
- **Interactive 3D Scene**: Custom-rendered, zoomable, and rotatable 3D model of a multi-tier vertical NFT hydroponic rig using Three.js and **React Three Fiber**.
- **Live Fluid Dynamics**: Animated piping and water flows styled with custom shaders that reflect pump statuses, fluid speeds, and circulation states.

### 2. Physical & Biological Simulation Engine
- **Crop Lifespan Tracking**: Simulation of the lettuce lifecycle from seedling to maturity, with realistic aging kinetics (fully calibrated for a 70–110 day total lifespan).
- **Time Warp Controls**: Controls to pause, resume, speed up (up to 12x warp), or jump time (24-hour leaps).
- **Real-Time Homeostasis & Drifts**: Realistic hourly simulations modeling water uptake, transpirational loss, pH drifts, and TDS depletion.

### 3. Detailed 25-Parameter Water Chemistry
- **Macronutrients (PPM)**: Nitrogen (N), Phosphorus (P), Potassium (K), Calcium (Ca), Magnesium (Mg), and Sulfur (S).
- **Micronutrients (PPM)**: Iron (Fe), Manganese (Mn), Zinc (Zn), Boron (B), Copper (Cu), Molybdenum (Mo), and Chlorine (Cl).
- **Salt Fertilizers (g/100L)**: Calcium Nitrate, Potassium Nitrate, Monoammonium Phosphate (MAP), Epsom Salts, Iron Chelate, and Trace blend.
- **Liquid Additives (mL/100L)**: Phosphoric Acid (pH Down), Nitric Acid, Potassium Hydroxide (pH Up), *Bacillus amyloliquefaciens* (biological rot protection), and Hypochlorous Acid.
- **Smart Auto-Dosing Loop**: Auto-refills reservoir water when it falls below thresholds, adjusts pH, and injects nutrients to match targets.

### 4. Custom Water Tank Setup
- Dynamic tank capacity selection (from 10 L to 500 L).
- Scales dry-salt recipes (grams) and liquid additives (mL) automatically to the exact capacity of your physical tank while preserving targets.

### 5. AI Diagnostics & Logs
- Powered by **Google Gemini API** (`@google/genai`).
- Generates live diagnostics, agricultural insights, and action-oriented warnings (e.g. Algae Bloom, Tipburn Risks, Pump Failures).

---

## 🛠️ Architecture & Tech Stack

The platform is designed as a decoupled, real-time event-driven system divided into three main folders:

```
┌────────────────────────────────────────────────────────┐
│                        FRONTEND                        │
│             React / Vite / Tailwind CSS / TS            │
│            Three.js / React Three Fiber / Recharts     │
└───────────▲────────────────────────────────▲───────────┘
            │ WebSockets                     │ HTTP / REST
            │ (Socket.io)                    │
┌───────────▼────────────────────────────────▼───────────┐
│                        BACKEND                         │
│               Node.js / Express / TypeScript           │
│     Aedes Embedded MQTT Broker / Prisma / PostgreSQL   │
└───────────▲────────────────────────────────────────────┘
            │ MQTT
            │ (Broker port 1883)
┌───────────┴────────────────────────────────────────────┐
│                 PYTHON GENERATER HYDRO                 │
│         Telemetry Simulator / Physics Drifts           │
└────────────────────────────────────────────────────────┘
```

*   **Frontend**: React (v19), Vite, TypeScript, Tailwind CSS, Three.js, `@react-three/fiber`, `@react-three/drei`, `Recharts` for charting, `lucide-react` for premium icons.
*   **Backend**: Node.js, Express, Socket.io, Prisma ORM (mapped to PostgreSQL), and an embedded **Aedes MQTT Broker** serving telemetry streams.
*   **Simulator (`python-generater-hydro`)**: Python script publishing real-time telemetry inputs over MQTT.

---

## 📂 Directory Structure

```
├── backend/                   # Node.js/Express API + Aedes MQTT Broker
│   ├── prisma/                # Database schema and seed scripts
│   └── src/                   # Express routes, socket controllers, and broker services
├── frontend/                  # React dashboard client
│   ├── src/
│   │   ├── components/        # ControlsPanel, ModelViewer, NutrientsPanel
│   │   ├── lib/               # Lettuce growth and biology model formulas
│   │   ├── pages/             # Dashboard, Analytics, System pages
│   │   └── types.ts           # Unified TypeScript definitions
├── python-generater-hydro/    # Python script simulating real-time drifts and sensor feeds
│   ├── main.py                # Main script connecting to MQTT
│   ├── sensors.py             # Physical sensor simulation math
│   └── config.py              # Simulated sensor node IDs & defaults
├── docker-compose.grafana.yml # Setup configurations for monitoring
└── package.json               # Root scripts to orchestrate local development
```

---

## ⚙️ Installation & Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.8+)
- **PostgreSQL Database**

### 1. Database Setup
1. Create a PostgreSQL database (e.g., named `hydroponics`).
2. Create a `.env` file in the `backend/` folder and add your database URL:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/hydroponics?schema=public"
   JWT_SECRET="your_secret_key"
   GEMINI_API_KEY="your_google_gemini_api_key"
   ```
3. Run migrations and seed data:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```

### 2. Install Project Dependencies
Run this in the project root to install the orchestrator packages:
```bash
npm install
```

Install Frontend dependencies:
```bash
cd frontend
npm install
```

Install Python Generator dependencies:
```bash
cd ../python-generater-hydro
pip install paho-mqtt
```

---

## 🏃 Running the Application

In the root directory of the project, run:
```bash
npm run dev
```

This starts all three services concurrently:
1.  **Frontend Dev Server**: [http://localhost:5173](http://localhost:5173) (or next available port)
2.  **Backend API Server**: [http://localhost:3001](http://localhost:3001)
3.  **Aedes MQTT Broker**: Running on `mqtt://127.0.0.1:1883`
4.  **Telemetry Generator**: Python script actively publishing simulated hardware data to the MQTT broker.

---

## 🧪 Simulation Scenarios

You can trigger specific anomalies to test system alerts and AI actions:
-   **Normal Growth**: Ideal homeostatic environment.
-   **Tipburn Risk**: High air temperatures and transpirational arrest that inhibit calcium delivery to leaves.
-   **Algae Bloom**: Spontaneous nutrient and light elevation leading to high turbidity and oxygen depletion.
-   **Pump Failure**: Shuts off water circulation, causing rapid root drying and crop dehydration.