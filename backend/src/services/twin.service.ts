import { Server } from 'socket.io';
import { prisma } from '../lib/prisma';
import { alertEngine } from './alert.service';

export interface TwinState {
  [nodeId: string]: {
    ph?: number;
    tds?: number;
    turbidity?: number;
    water_temp?: number;
    air_temp?: number;
    light_intensity?: number;
    status?: string;
    lastUpdated?: Date;
    dbNodeId?: string;
    dbSensors?: any[];
  }
}

class DigitalTwinEngine {
  private state: TwinState = {
    T1: {},
    T2: {},
    T3: {},
    T4: {},
    CENTRAL: {},
    PUMP: {}
  };

  private io: Server | null = null;
  private dbMappingInitialized = false;

  public setSocketServer(io: Server) {
    this.io = io;
  }

  // Initialize DB mapping once so we don't query DB constantly
  public async initDbMapping() {
    if (this.dbMappingInitialized) return;
    
    const nodes = await prisma.node.findMany({ include: { sensors: true } });
    
    const nodeNameMap: Record<string, string> = {
      'CENTRAL': 'Central Reservoir',
      'T1': 'Tier 1',
      'T2': 'Tier 2',
      'T3': 'Tier 3',
      'T4': 'Tier 4',
      'PUMP': 'Pump P1'
    };

    for (const [slug, mappedName] of Object.entries(nodeNameMap)) {
      const dbNode = nodes.find(n => n.nodeName.toLowerCase() === mappedName.toLowerCase());
      if (dbNode) {
        this.state[slug].dbNodeId = dbNode.id;
        this.state[slug].status = dbNode.status;
        this.state[slug].dbSensors = dbNode.sensors;
      }
    }
    
    this.dbMappingInitialized = true;
    console.log('Digital Twin Engine: DB mapping initialized');
  }

  public getTwinState() {
    return this.state;
  }

  public updateTwin(nodeSlug: string, payload: any) {
    const slug = nodeSlug.toUpperCase();
    if (!this.state[slug]) {
      this.state[slug] = {};
    }

    const nodeState = this.state[slug];

    if (slug === 'T1' || slug === 'T2') {
      console.log(`[DEBUG] updateTwin ${slug}: dbNodeId=${nodeState.dbNodeId}, hasDbSensors=${!!nodeState.dbSensors}, payload.ph=${payload.ph}`);
    }

    // Evaluate health rules based on payload
    let worstStatus = 'Healthy';
    let pHS = 'Online', tdsS = 'Online', turbS = 'Online', wtempS = 'Online', atempS = 'Online', lightS = 'Online';

    if (payload.ph !== undefined) {
      nodeState.ph = payload.ph;
      nodeState.tds = payload.tds;
      nodeState.turbidity = payload.turbidity;
      nodeState.water_temp = payload.water_temp;
      nodeState.air_temp = payload.air_temp;
      nodeState.light_intensity = payload.light_intensity;

      pHS = alertEngine.evaluateSensor('ph', payload.ph);
      tdsS = alertEngine.evaluateSensor('tds', payload.tds);
      turbS = alertEngine.evaluateSensor('turbidity', payload.turbidity);
      wtempS = alertEngine.evaluateSensor('water_temp', payload.water_temp);
      atempS = alertEngine.evaluateSensor('air_temp', payload.air_temp);
      lightS = alertEngine.evaluateSensor('light_intensity', payload.light_intensity);

      const statuses = [pHS, tdsS, turbS, wtempS, atempS, lightS];
      if (statuses.includes('Critical')) worstStatus = 'Critical';
      else if (statuses.includes('Warning')) worstStatus = 'Warning';
      else if (statuses.includes('Offline')) worstStatus = 'Offline';
    } else if (payload.status) {
      // Pump or status-only device
      worstStatus = payload.status === 'healthy' ? 'Healthy' : (payload.status === 'offline' ? 'Offline' : 'Warning');
    }

    nodeState.lastUpdated = new Date();

    // Fire off async database insertion for EVERY MQTT packet
    this.savePacketToDatabase(slug, nodeState, payload, worstStatus);

    // Broadcast instantly via WebSocket for zero latency UI
    if (this.io && nodeState.dbNodeId) {
      if (payload.ph !== undefined && nodeState.dbSensors) {
        // Mock the savedReadings format for UI
        const sensors = [
          { name: 'ph', value: payload.ph, status: pHS },
          { name: 'tds', value: payload.tds, status: tdsS },
          { name: 'turbidity', value: payload.turbidity, status: turbS },
          { name: 'water_temp', value: payload.water_temp, status: wtempS },
          { name: 'air_temp', value: payload.air_temp, status: atempS },
          { name: 'light_intensity', value: payload.light_intensity, status: lightS }
        ];

        const formattedSensors = sensors.map(s => {
          const dbS = nodeState.dbSensors?.find(x => x.sensorType === s.name);
          return {
            sensorType: s.name,
            value: s.value,
            status: s.status,
            sensorId: dbS?.id,
            lastSeen: nodeState.lastUpdated
          };
        });

        this.io.emit('sensor_update', {
          nodeId: nodeState.dbNodeId,
          status: worstStatus,
          sensors: formattedSensors
        });
      } else if (payload.status) {
        this.io.emit('node:status_update', { id: nodeState.dbNodeId, status: worstStatus });
      }
    }
  }

  // Save every MQTT packet asynchronously
  private async savePacketToDatabase(slug: string, state: any, payload: any, currentStatus: string) {
    if (!this.dbMappingInitialized || !state.dbNodeId) return;

    try {
      const isStatusChanged = state.status !== currentStatus || !state.status;
      state.status = currentStatus;

      // Update node status if it changed
      if (isStatusChanged) {
        await prisma.node.update({
          where: { id: state.dbNodeId },
          data: { status: currentStatus }
        });

        // Insert Alert only when needed (status transition)
        alertEngine.triggerAlert(state.dbNodeId, slug, currentStatus, `Node ${slug} transitioned to ${currentStatus} due to sensor anomalies.`);
      }

      // Insert sensor readings for every packet
      if (payload.ph !== undefined && state.dbSensors) {
        const sensorValues = {
          'ph': payload.ph,
          'tds': payload.tds,
          'turbidity': payload.turbidity,
          'water_temp': payload.water_temp,
          'air_temp': payload.air_temp,
          'light_intensity': payload.light_intensity
        };

        const readingsToInsert = [];
        for (const [sType, sValue] of Object.entries(sensorValues)) {
          const dbSensor = state.dbSensors.find((s: any) => s.sensorType === sType);
          if (dbSensor && sValue !== undefined) {
            
            // Evaluate status using alertEngine
            const sStatus = alertEngine.evaluateSensor(sType, sValue);

            // Update sensor lastSeen and status
            await prisma.sensor.update({
              where: { id: dbSensor.id },
              data: { status: sStatus, lastSeen: state.lastUpdated }
            });

            readingsToInsert.push({
              sensorId: dbSensor.id,
              value: sValue,
              createdAt: state.lastUpdated
            });
          }
        }

        if (readingsToInsert.length > 0) {
          await prisma.sensorReading.createMany({
            data: readingsToInsert
          });
        }
      }
    } catch (err) {
      console.error(`TwinEngine: Failed to save packet to DB for ${slug}:`, err);
    }
  }
}

export const twinEngine = new DigitalTwinEngine();
