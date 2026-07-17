import random
import config
from datetime import datetime, timezone

tank_state = {}

def initialize_state():
    for node in config.NODES:
        if node["type"] in ["tank", "central_tank"]:
            tank_state[node["id"]] = {
                "ph": 6.2,
                "tds": 700.0,
                "turbidity": 12.0,
                "water_temp": 22.0,
                "air_temp": 24.0,
                "light_intensity": 250.0,
                "status": "healthy"
            }
        elif node["type"] == "pump":
            tank_state[node["id"]] = {
                "status": "healthy"
            }

def calculate_physics_tick():
    """Applies realistic drift to the hydroponic sensor values."""
    if not tank_state:
        initialize_state()

    for node_id, state in tank_state.items():
        if "ph" in state:
            # Drift for pH (Optimal: 6.0 - 6.5)
            state["ph"] += random.uniform(-0.02, 0.02)
            state["ph"] = max(6.0, min(6.5, state["ph"]))

            # Drift for TDS (Optimal for Lettuce: 560 - 840 ppm, centering at 700)
            state["tds"] += random.uniform(-5.0, 5.0)
            state["tds"] = max(650.0, min(750.0, state["tds"]))

            # Drift for Turbidity (Good: <50 NTU)
            state["turbidity"] += random.uniform(-0.5, 0.5)
            state["turbidity"] = max(5.0, min(20.0, state["turbidity"]))

            # Drift for Water Temp (Optimal: 20 - 24°C)
            state["water_temp"] += random.uniform(-0.1, 0.1)
            state["water_temp"] = max(21.0, min(23.0, state["water_temp"]))

            # Drift for Air Temp (Optimal: 22 - 28°C)
            state["air_temp"] += random.uniform(-0.15, 0.15)
            state["air_temp"] = max(22.0, min(26.0, state["air_temp"]))

            # Drift for Light Intensity (Optimal: 220 - 280)
            state["light_intensity"] += random.uniform(-5.0, 5.0)
            state["light_intensity"] = max(220.0, min(280.0, state["light_intensity"]))

            # Status is always healthy as the values are tightly controlled within normal bounds
            state["status"] = "healthy"

def get_payloads():
    """Generates the hydroponic flat JSON payload array."""
    payloads = []
    now_str = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    
    for node in config.NODES:
        node_id = node["id"]
        state = tank_state.get(node_id)
        if not state:
            continue
            
        if node["type"] == "pump":
            payloads.append({
                "nodeId": node_id,
                "timestamp": now_str,
                "status": state["status"]
            })
        else:
            payloads.append({
                "nodeId": node_id,
                "timestamp": now_str,
                "ph": round(state["ph"], 2),
                "tds": round(state["tds"], 1),
                "turbidity": round(state["turbidity"], 1),
                "water_temp": round(state["water_temp"], 1),
                "air_temp": round(state["air_temp"], 1),
                "light_intensity": round(state["light_intensity"], 1),
                "status": state["status"]
            })
    return payloads
