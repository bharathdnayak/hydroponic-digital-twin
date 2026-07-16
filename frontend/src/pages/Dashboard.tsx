import { useTheme } from '../components/ThemeProvider';

export default function Dashboard() {
  const { theme } = useTheme();
  const GRAFANA_URL = `http://127.0.0.1:3000/d/adc2nlg/testing?orgId=1&kiosk&theme=${theme}`;

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
