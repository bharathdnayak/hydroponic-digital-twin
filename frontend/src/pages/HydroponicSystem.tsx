import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useOutletContext } from 'react-router-dom';
import ModelViewer from '../components/ModelViewer';

const BACKEND_URL = 'http://localhost:3001';

export default function HydroponicSystem() {
  const { setSelectedNode } = useOutletContext<any>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = io(BACKEND_URL);

    const fetchTopology = async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/topologies/hydroponic`);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching topology:', error);
        setLoading(false);
      }
    };

    fetchTopology();

    // Socket listeners
    socket.on('sensor_update', (data) => {
      const ph = data.sensors.find((s: any) => s.sensorType === 'ph')?.value;
      const tds = data.sensors.find((s: any) => s.sensorType === 'tds')?.value;
      const turbidity = data.sensors.find((s: any) => s.sensorType === 'turbidity')?.value;
      const water_temp = data.sensors.find((s: any) => s.sensorType === 'water_temp')?.value;
      const air_temp = data.sensors.find((s: any) => s.sensorType === 'air_temp')?.value;
      const light_intensity = data.sensors.find((s: any) => s.sensorType === 'light_intensity')?.value;

      setSelectedNode((prevSelected: any) => {
        if (prevSelected && prevSelected.id === data.nodeId) {
          return {
            ...prevSelected,
            ph,
            tds,
            turbidity,
            water_temp,
            air_temp,
            light_intensity,
            status: data.status,
            sensors: data.sensors
          };
        }
        return prevSelected;
      });
    });

    socket.on('node:status_update', (data) => {
      setSelectedNode((prevSelected: any) => {
        if (prevSelected && prevSelected.id === data.id) {
          return { ...prevSelected, status: data.status };
        }
        return prevSelected;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [setSelectedNode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent rounded-[24px]">
      <ModelViewer />
    </div>
  );
}
