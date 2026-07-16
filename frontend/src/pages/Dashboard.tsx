import { useTheme } from '../components/ThemeProvider';

export default function Dashboard() {
  const { theme } = useTheme();
  const grafanaHost = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000';
  const GRAFANA_URL = `${grafanaHost}/d/adc2nlg/testing?orgId=1&kiosk&theme=${theme}`;

  return (
    <div className="w-full h-full bg-background">
      <iframe 
        src={GRAFANA_URL}
        className="w-full h-full border-0 rounded-2xl"
        title="Grafana Analytics"
        allow="fullscreen"
      ></iframe>
    </div>
  );
}
