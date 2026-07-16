import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding 7-day historical database...');

  // 1. Clear existing readings
  await prisma.sensorReading.deleteMany({});
  console.log('Cleared existing sensor readings.');

  // 2. Fetch all nodes
  const nodes = await prisma.node.findMany({});
  console.log(`Found ${nodes.length} nodes in database.`);

  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  const totalHours = 7 * 24; // 168 hours

  // Define sensors to configure for each node type
  const tankSensors = [
    { name: 'pH Sensor', type: 'ph', base: 6.35, variance: 0.3 },
    { name: 'TDS Sensor', type: 'tds', base: 920.0, variance: 80.0 },
    { name: 'Turbidity Sensor', type: 'turbidity', base: 15.0, variance: 4.0 },
    { name: 'Water Temperature Sensor', type: 'water_temp', base: 22.4, variance: 1.5 },
    { name: 'Air Temperature Sensor', type: 'air_temp', base: 28.7, variance: 2.0 },
    { name: 'Light Intensity Sensor', type: 'light_intensity', base: 350.0, variance: 50.0 },
  ];

  const pumpSensors = [
    { name: 'Energy Consumption Sensor', type: 'energy', base: 6.5, variance: 1.5 }, // hourly kWh (~150 kWh daily)
    { name: 'Pump Runtime Sensor', type: 'pump_runtime', base: 0.75, variance: 0.1 }, // fraction of hour run
    { name: 'Flow Rate Sensor', type: 'water_level', base: 14.6, variance: 1.0 },
  ];

  for (const node of nodes) {
    const isPump = node.nodeType === 'pump';
    const sensorsConfig = isPump ? pumpSensors : tankSensors;

    console.log(`Configuring sensors for ${node.nodeName} (${node.nodeType})...`);

    for (const config of sensorsConfig) {
      // Find or create sensor
      let sensor = await prisma.sensor.findFirst({
        where: {
          nodeId: node.id,
          sensorType: config.type,
        },
      });

      if (!sensor) {
        sensor = await prisma.sensor.create({
          data: {
            nodeId: node.id,
            sensorName: config.name,
            sensorType: config.type,
            status: 'Online',
          },
        });
      }

      // Generate 168 hours of readings
      const readingsData = [];
      for (let hour = totalHours; hour >= 0; hour--) {
        const time = new Date(now.getTime() - hour * oneHour);

        // Generate values using sine wave + random noise to make beautiful curves
        const cycle = (hour / 24) * 2 * Math.PI; // daily cycle
        const wave = Math.sin(cycle);
        const noise = (Math.random() - 0.5) * config.variance;
        let value = config.base + wave * (config.variance * 0.4) + noise;

        // Clip constraints
        if (config.type === 'ph') value = Math.max(1, Math.min(14, value));
        if (config.type === 'uptime' || config.type === 'health_score') value = Math.max(0, Math.min(100, value));
        if (config.type === 'turbidity' || config.type === 'tds' || config.type === 'water_usage') value = Math.max(0, value);

        readingsData.push({
          sensorId: sensor.id,
          value: Number(value.toFixed(2)),
          createdAt: time,
        });
      }

      // Bulk create readings
      await prisma.sensorReading.createMany({
        data: readingsData,
      });

      console.log(`  - Seeded ${readingsData.length} records for ${config.name}`);
    }
  }

  console.log('Seeding 7-day historical dataset successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
