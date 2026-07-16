import { Outlet } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown, Bell, LogOut,
  Activity, LayoutDashboard, BarChart2,
  Moon, Sun, Droplets, Zap, Sliders
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../ThemeProvider';
import { io } from 'socket.io-client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

const BACKEND_URL = 'http://localhost:3001';

/* ════════════════════════════════════════════════════════════════
   SIDEBAR
   bg: #17181c  |  active: lime  |  inactive: white-26
   ════════════════════════════════════════════════════════════════ */
function Sidebar() {
  const { pathname } = useLocation();

  const nav = [
    { label: 'Live',       to: '/hydroponic-system', Icon: Activity      },
    { label: 'Dashboard',  to: '/dashboard',     Icon: LayoutDashboard },
    { label: 'Simulation', to: '/analytics',     Icon: BarChart2     },
  ];

  const logout = async () => {
    try { await axios.post('http://localhost:3001/api/auth/logout'); } catch (_) {}
    window.location.href = '/login';
  };

  return (
    <aside
      id="sidebar"
      style={{
        width: 64, flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        height: '100%', paddingTop: 20, paddingBottom: 20,
        background: '#17181c',
        borderRadius: 18,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Nav */}
      <nav style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 4, flex: 1, width: '100%', padding: '0 10px',
      }}>
        {nav.map(({ label, to, Icon }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={label} to={to} title={label}
              style={{
                width: '100%', height: 42,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, textDecoration: 'none',
                position: 'relative',
                color:      active ? '#c8f135'                   : 'rgba(255,255,255,0.28)',
                background: active ? 'rgba(200,241,53,0.12)'     : 'transparent',
                border:     active ? '1px solid rgba(200,241,53,0.18)' : '1px solid transparent',
                transition: 'all 0.16s ease',
              }}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              {active && (
                <span style={{
                  position: 'absolute', left: -11, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, borderRadius: 99,
                  background: '#c8f135',
                  boxShadow: '0 0 8px rgba(200,241,53,0.5)',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        id="logout-btn" onClick={logout} title="Logout"
        style={{
          width: 40, height: 40, borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.28)',
          background: 'transparent', cursor: 'pointer', flexShrink: 0,
          transition: 'all 0.16s ease',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = 'rgba(239,68,68,0.35)';
          b.style.color = '#f87171';
          b.style.background = 'rgba(239,68,68,0.10)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = 'rgba(255,255,255,0.08)';
          b.style.color = 'rgba(255,255,255,0.28)';
          b.style.background = 'transparent';
        }}
      >
        <LogOut size={16} strokeWidth={2} />
      </button>
    </aside>
  );
}

/* ════════════════════════════════════════════════════════════════
   TOP BAR  — 70px
   bg: #ffffff (card)  |  border-bottom: rgba(0,0,0,0.07)
   ════════════════════════════════════════════════════════════════ */
function TopBar() {
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';

  const iconBtn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 10,
    border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
    background: dark ? '#2a2b34' : '#e8e8e8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    color: dark ? '#9ca3af' : '#5a5f6b',
    transition: 'background 0.15s',
  };

  return (
    <header
      id="topbar"
      style={{
        height: 70, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        background: dark ? '#1c1d22' : '#ffffff',
        borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        gap: 0,
      }}
    >
      {/* ══ LEFT — Logo badge + wordmark ══════════════════════════════ */}
      <div id="logo" style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
        {/* Icon badge */}
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: '#17181c',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(23,24,28,0.18)',
        }}>
          <Droplets size={18} color="#c8f135" strokeWidth={2.3} />
        </div>
        {/* Brand text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{
            fontSize: 17, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.1,
            color: dark ? '#f0f0f2' : '#17181c',
            fontFamily: 'var(--font)',
          }}>
            BrandName
          </span>
          <span style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
            textTransform: 'uppercase', lineHeight: 1,
            color: dark ? '#374151' : '#c8f135',
            fontFamily: 'var(--font)',
            background: dark ? 'transparent' : '#17181c',
            padding: dark ? '0' : '1px 5px',
            borderRadius: 4,
          }}>
            Digital Twin
          </span>
        </div>
      </div>

      {/* ══ CENTRE divider ════════════════════════════════════════════ */}
      <div style={{
        width: 1, height: 32, flexShrink: 0,
        background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
        margin: '0 22px',
      }} />

      {/* ══ CENTRE — Title block ══════════════════════════════════════ */}
      <div id="title-block" style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 18, fontWeight: 800, letterSpacing: '-0.55px', lineHeight: 1.15,
          color: dark ? '#f0f0f2' : '#17181c',
          fontFamily: 'var(--font)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          Smart Hydroponic Digital Twin
        </span>
      </div>

      {/* ══ RIGHT — Topology selector + actions ═══════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Topology pill */}
        <div
          id="topology-selector"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 16px', borderRadius: 12, cursor: 'pointer',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
            background: dark ? '#2a2b34' : '#e8e8e8',
            transition: 'background 0.15s',
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: '#c8f135',
            boxShadow: '0 0 7px rgba(200,241,53,0.6)',
          }} />
          <span style={{
            fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.2px',
            color: dark ? '#f0f0f2' : '#17181c',
            fontFamily: 'var(--font)',
          }}>
            Hydroponic System
          </span>
          <ChevronDown size={13} strokeWidth={2.8} color="#6b7280" />
        </div>

        {/* Divider */}
        <div style={{
          width: 1, height: 28,
          background: dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
        }} />

        {/* Theme toggle */}
        <button
          id="theme-toggle" style={iconBtn}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {dark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>

        {/* Bell */}
        <button id="alert-bell" style={{ ...iconBtn, position: 'relative' }} title="Alerts">
          <Bell size={16} strokeWidth={2} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 7, height: 7, borderRadius: '50%',
            background: '#ef4444',
            border: '2px solid ' + (dark ? '#1c1d22' : '#ffffff'),
            boxShadow: '0 1px 4px rgba(239,68,68,0.5)',
          }} />
        </button>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════
   TELEMETRY PANEL (Left panel)
   ════════════════════════════════════════════════════════════════ */
interface TelemetryPanelProps {
  selectedNode: any;
  history: Record<string, any[]>;
  useGrafana: boolean;
  dark: boolean;
  nodes: any[];
}

function TelemetryPanel({ selectedNode, history, useGrafana, dark, nodes }: TelemetryPanelProps) {
  const [valveOpen, setValveOpen] = useState(true);
  const [muted, setMuted] = useState(false);

  const activeNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    return nodes.find(n => n.nodeType === 'central_tank') || nodes[0] || null;
  }, [selectedNode, nodes]);

  const slug = useMemo(() => {
    if (!activeNode) return 'CENTRAL';
    let s = activeNode.nodeName.toUpperCase();
    if (s.includes('PUMP')) return 'PUMP';
    if (s.includes('CENTRAL')) return 'CENTRAL';
    return s;
  }, [activeNode]);

  const ph = activeNode?.ph ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
  const tds = activeNode?.tds ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 920;
  const turbidity = activeNode?.turbidity ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'turbidity')?.value ?? 12.0;
  const water_temp = activeNode?.water_temp ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
  const air_temp = activeNode?.air_temp ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'air_temp')?.value ?? 28.7;
  const light_intensity = activeNode?.light_intensity ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'light_intensity')?.value ?? 350;

  const chartData = history[slug] || [];

  const renderSparkline = (id: string, label: string, value: string | number, dataKey: string, color: string) => {
    return (
      <div
        key={id}
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: dark ? '#22232a' : '#f9f9f9',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minHeight: 70
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b' }}>{label}</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: dark ? '#ffffff' : '#17181c' }}>{value}</span>
        </div>
        <div style={{ height: 38, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={1.5}
                fillOpacity={1}
                fill={`url(#gradient-${id})`}
                isAnimationActive={false}
              />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const getGrafanaIframe = (panelId: number, title: string) => {
    const grafanaHost = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000';
    const iframeSrc = `${grafanaHost}/d-solo/adc2nlg/testing?orgId=1&panelId=${panelId}&theme=${dark ? 'dark' : 'light'}`;
    return (
      <div
        key={panelId}
        style={{
          height: 82,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          background: dark ? '#22232a' : '#f9f9f9',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 9, fontWeight: 700, color: '#9ca3af', zIndex: 1 }}>{title}</div>
        <iframe
          src={iframeSrc}
          style={{ width: '100%', height: '100%', border: 0 }}
          title={title}
          allow="fullscreen"
        />
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%', height: '100%',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 12px',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
        <span style={{
          fontSize: 12, fontWeight: 850, letterSpacing: '-0.3px', color: dark ? '#f0f0f2' : '#17181c',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
        }} title={activeNode ? activeNode.nodeName : 'Hydroponic System'}>
          {activeNode ? activeNode.nodeName : 'Hydroponic System'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {useGrafana ? (
          [
            getGrafanaIframe(1, 'pH Level'),
            getGrafanaIframe(2, 'TDS Level'),
            getGrafanaIframe(3, 'Turbidity'),
            getGrafanaIframe(4, 'Water Temp'),
            getGrafanaIframe(5, 'Air Temp'),
            getGrafanaIframe(6, 'Light Intensity')
          ]
        ) : (
          [
            renderSparkline('ph', 'pH Level', Number(ph).toFixed(2), 'ph', '#00e5a0'),
            renderSparkline('tds', 'TDS Level', `${Number(tds).toFixed(0)} ppm`, 'tds', '#00aaff'),
            renderSparkline('turbidity', 'Turbidity', `${Number(turbidity).toFixed(1)} NTU`, 'turbidity', '#00d4c8'),
            renderSparkline('water_temp', 'Water Temp', `${Number(water_temp).toFixed(1)} °C`, 'water_temp', '#ffb347'),
            renderSparkline('air_temp', 'Air Temp', `${Number(air_temp).toFixed(1)} °C`, 'air_temp', '#c08aff'),
            renderSparkline('light_intensity', 'Light Intensity', `${Number(light_intensity).toFixed(0)} lux`, 'light_intensity', '#ffe066')
          ]
        )}
      </div>

      {/* Bottom Node Diagnostics Card */}
      {!useGrafana && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 12,
            background: dark ? '#22232a' : '#f9f9f9',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Node Diagnostics</span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: dark ? '#9ca3af' : '#5a5f6b' }}>Type</span>
              <span style={{ fontWeight: 750, color: dark ? '#ffffff' : '#17181c', textTransform: 'capitalize' }}>{activeNode?.nodeType === 'pump' ? 'System Pump' : (activeNode?.nodeType === 'central_tank' ? 'Central Reservoir' : 'Sub-Tank')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: dark ? '#9ca3af' : '#5a5f6b' }}>Position</span>
              <span style={{ fontWeight: 750, color: dark ? '#ffffff' : '#17181c' }}>X: {activeNode?.positionX ?? 0}, Y: {activeNode?.positionY ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: dark ? '#9ca3af' : '#5a5f6b' }}>Link Status</span>
              <span style={{ fontWeight: 750, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 5px #22c55e' }} />
                Active
              </span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingTop: 6, marginTop: 2 }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Actuators</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setValveOpen(!valveOpen)}
                style={{
                  flex: 1, fontSize: 8.5, fontWeight: 800, padding: '4px 0', borderRadius: 5, cursor: 'pointer',
                  border: 'none', background: valveOpen ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: valveOpen ? '#22c55e' : '#ef4444', transition: 'all 0.12s'
                }}
              >
                Valve: {valveOpen ? 'OPEN' : 'CLOSE'}
              </button>
              <button
                onClick={() => setMuted(!muted)}
                style={{
                  flex: 1, fontSize: 8.5, fontWeight: 800, padding: '4px 0', borderRadius: 5, cursor: 'pointer',
                  border: 'none', background: muted ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)',
                  color: muted ? '#f59e0b' : (dark ? '#9ca3af' : '#5a5f6b'), transition: 'all 0.12s'
                }}
              >
                Alerts: {muted ? 'MUTED' : 'LIVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   KPI DASHBOARD PANEL (Right panel)
   ════════════════════════════════════════════════════════════════ */
interface KPIDashboardPanelProps {
  selectedNode: any;
  nodes: any[];
  useGrafana: boolean;
  dark: boolean;
  liveLogs: string[];
}

function KPIDashboardPanel({ selectedNode, nodes, useGrafana, dark, liveLogs }: KPIDashboardPanelProps) {
  const activeNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    return nodes.find(n => n.nodeType === 'central_tank') || nodes[0] || null;
  }, [selectedNode, nodes]);

  const pumpNode = useMemo(() => {
    return nodes.find(n => n.nodeType === 'pump') || null;
  }, [nodes]);

  const pumpStatus = pumpNode?.status || 'Healthy';

  const ph = activeNode?.ph ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
  const temp = activeNode?.water_temp ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
  const tds = activeNode?.tds ?? activeNode?.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 920;

  const avgMetrics = useMemo(() => {
    const tankNodes = nodes.filter(n => n.nodeType === 'tank' || n.nodeType === 'central_tank');
    if (tankNodes.length === 0) return { ph: 6.35, tds: 920, temp: 22.4 };
    
    let sumPh = 0, sumTds = 0, sumTemp = 0, count = 0;
    tankNodes.forEach(n => {
      const phVal = n.ph ?? n.sensors?.find((s: any) => s.sensorType === 'ph')?.value;
      const tdsVal = n.tds ?? n.sensors?.find((s: any) => s.sensorType === 'tds')?.value;
      const tempVal = n.water_temp ?? n.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value;
      
      if (phVal !== undefined) { sumPh += Number(phVal); count++; }
      if (tdsVal !== undefined) sumTds += Number(tdsVal);
      if (tempVal !== undefined) sumTemp += Number(tempVal);
    });

    return {
      ph: count > 0 ? (sumPh / count) : 6.35,
      tds: count > 0 ? (sumTds / count) : 920,
      temp: count > 0 ? (sumTemp / count) : 22.4
    };
  }, [nodes]);

  const waterQualityScore = useMemo(() => {
    if (!activeNode || activeNode.nodeType === 'pump') return 95;
    const phDiff = Math.abs(ph - 6.35);
    const phPenalty = phDiff * 30;

    const tdsDiff = Math.max(0, Math.abs(tds - 920) - 100);
    const tdsPenalty = tdsDiff * 0.1;

    const tempDiff = Math.max(0, Math.abs(temp - 22.4) - 2);
    const tempPenalty = tempDiff * 3;

    return Math.max(45, Math.round(100 - phPenalty - tdsPenalty - tempPenalty));
  }, [activeNode, ph, tds, temp]);

  const wqColor = waterQualityScore > 85 ? '#22c55e' : (waterQualityScore > 70 ? '#f59e0b' : '#ef4444');
  const wqText = waterQualityScore > 85 ? 'Excellent' : (waterQualityScore > 70 ? 'Warning' : 'Critical');

  const flowRate = useMemo(() => {
    if (pumpStatus.toLowerCase() === 'healthy' || pumpStatus.toLowerCase() === 'online') {
      return Number((14.6 + (Math.random() - 0.5) * 0.2).toFixed(1));
    } else if (pumpStatus.toLowerCase() === 'warning') {
      return Number((8.4 + (Math.random() - 0.5) * 0.3).toFixed(1));
    } else {
      return 0.0;
    }
  }, [pumpStatus]);

  const pressure = flowRate > 0 ? Number((1.8 * (flowRate / 14.6)).toFixed(1)) : 0.0;
  const efficiency = flowRate > 0 ? Math.round((flowRate / 14.6) * 83) : 0;
  const flowStatus = flowRate > 12 ? 'Normal' : (flowRate > 0 ? 'Low' : 'Zero');
  const flowColor = flowRate > 12 ? '#22c55e' : (flowRate > 0 ? '#f59e0b' : '#ef4444');

  const nutrientIndex = useMemo(() => {
    if (!activeNode || activeNode.nodeType === 'pump') return 92;
    const variance = Math.max(0, Math.min(15, Math.round(Math.abs(tds - 920) / 15)));
    return 95 - variance;
  }, [activeNode, tds]);

  const nutColor = nutrientIndex > 85 ? '#22c55e' : (nutrientIndex > 70 ? '#f59e0b' : '#ef4444');
  const nutText = nutrientIndex > 85 ? 'Excellent' : (nutrientIndex > 70 ? 'Warning' : 'Critical');

  const systemHealthMetrics = useMemo(() => {
    const total = nodes.length || 6;
    const healthy = nodes.filter(n => n.status?.toLowerCase() === 'healthy' || n.status?.toLowerCase() === 'online').length;
    const warning = nodes.filter(n => n.status?.toLowerCase() === 'warning').length;
    const critical = nodes.filter(n => n.status?.toLowerCase() === 'critical').length;
    const offline = nodes.filter(n => n.status?.toLowerCase() === 'offline' || n.status?.toLowerCase() === 'error').length;
    const score = Math.round((healthy / total) * 100);

    return { total, healthy, warning, critical, offline, score };
  }, [nodes]);

  const renderGauge = (title: string, score: number, color: string, statusText: string, items: Array<{ name: string; val: string | number }>) => {
    const radius = 18;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (score / 100) * circ;

    return (
      <div
        key={title}
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: dark ? '#22232a' : '#f9f9f9',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          minHeight: 80
        }}
      >
        <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, marginTop: 2 }}>
          {/* SVG Gauge */}
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r={radius} fill="transparent" stroke={dark ? '#1c1d22' : '#e6e6e6'} strokeWidth="4" />
              <circle cx="22" cy="22" r={radius} fill="transparent" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 22 22)" style={{ transition: 'stroke-dashoffset 0.3s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.05 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: dark ? '#ffffff' : '#17181c' }}>{score}%</span>
              <span style={{ fontSize: 5.5, fontWeight: 600, textTransform: 'uppercase', color }}>{statusText}</span>
            </div>
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            {items.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5 }}>
                <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', whiteSpace: 'nowrap' }}>{item.name}</span>
                <span style={{ fontWeight: 750, color: dark ? '#f0f0f2' : '#17181c' }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getGrafanaIframe = (panelId: number, title: string) => {
    const grafanaHost = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3000';
    const iframeSrc = `${grafanaHost}/d-solo/adc2nlg/testing?orgId=1&panelId=${panelId}&theme=${dark ? 'dark' : 'light'}`;
    return (
      <div
        key={panelId}
        style={{
          height: 82,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          background: dark ? '#22232a' : '#f9f9f9',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 9, fontWeight: 700, color: '#9ca3af', zIndex: 1 }}>{title}</div>
        <iframe
          src={iframeSrc}
          style={{ width: '100%', height: '100%', border: 0 }}
          title={title}
          allow="fullscreen"
        />
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%', height: '100%',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '14px 12px',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 850, letterSpacing: '-0.3px', color: dark ? '#f0f0f2' : '#17181c' }}>KPI Dashboards</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {useGrafana ? (
          [
            getGrafanaIframe(5, 'Water Quality Score'),
            getGrafanaIframe(6, 'Flow Analysis'),
            getGrafanaIframe(7, 'Nutrient Quality Index'),
            getGrafanaIframe(8, 'System Health')
          ]
        ) : (
          [
            renderGauge('Water Quality Score', waterQualityScore, wqColor, wqText, [
              { name: 'pH Balance', val: `${Math.round(100 - Math.abs(ph - 6.35) * 30)}%` },
              { name: 'TDS Balance', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(tds - 920) - 100) * 0.15))}%` },
              { name: 'Temp Balance', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(temp - 22.4) - 2) * 2.5))}%` }
            ]),

            <div
              key="flow"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: dark ? '#22232a' : '#f9f9f9',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
                minHeight: 80
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Flow Analysis</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: flowColor }}>{flowRate} L/min</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 9.5, flex: 1, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', background: dark ? '#1c1d22' : '#ffffff', padding: '4px 6px', borderRadius: 6, alignItems: 'center' }}>
                  <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', fontSize: 7.5 }}>Status</span>
                  <span style={{ fontWeight: 800, color: flowColor, marginTop: 1 }}>{flowStatus}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', background: dark ? '#1c1d22' : '#ffffff', padding: '4px 6px', borderRadius: 6, alignItems: 'center' }}>
                  <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', fontSize: 7.5 }}>Pressure</span>
                  <span style={{ fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', marginTop: 1 }}>{pressure} bar</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', background: dark ? '#1c1d22' : '#ffffff', padding: '4px 6px', borderRadius: 6, alignItems: 'center' }}>
                  <span style={{ color: dark ? '#9ca3af' : '#5a5f6b', fontSize: 7.5 }}>Efficiency</span>
                  <span style={{ fontWeight: 800, color: dark ? '#f0f0f2' : '#17181c', marginTop: 1 }}>{efficiency}%</span>
                </div>
              </div>
            </div>,

            renderGauge('Nutrient Quality Index', nutrientIndex, nutColor, nutText, [
              { name: 'pH Stability', val: `${Math.round(100 - Math.abs(ph - 6.35) * 15)}%` },
              { name: 'TDS Level', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(tds - 920) - 100) * 0.15))}%` },
              { name: 'Water Temp', val: `${Math.round(Math.max(50, 100 - Math.max(0, Math.abs(temp - 22.4) - 2) * 2.5))}%` }
            ]),

            renderGauge('System Health', systemHealthMetrics.score, systemHealthMetrics.score > 80 ? '#22c55e' : (systemHealthMetrics.score > 50 ? '#f59e0b' : '#ef4444'), systemHealthMetrics.score > 80 ? 'Healthy' : 'Warning', [
              { name: 'Healthy Nodes', val: `${systemHealthMetrics.healthy}/${systemHealthMetrics.total}` },
              { name: 'Warnings', val: systemHealthMetrics.warning },
              { name: 'Critical/Offline', val: systemHealthMetrics.critical + systemHealthMetrics.offline }
            ])
          ]
        )}
      </div>

      {/* Bottom Live Logs Card */}
      {!useGrafana && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 12,
            background: dark ? '#22232a' : '#f9f9f9',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flexShrink: 0,
            minHeight: 120
          }}
        >
          <span style={{ fontSize: 9.5, fontWeight: 700, color: dark ? '#9ca3af' : '#5a5f6b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Terminal Logs</span>
          <div
            style={{
              flex: 1,
              background: dark ? '#111215' : '#1e1e1e',
              borderRadius: 8,
              padding: '6px 8px',
              fontFamily: 'monospace',
              fontSize: 8.5,
              color: '#4ade80',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              lineHeight: 1.2,
              textAlign: 'left'
            }}
          >
            {liveLogs.length > 0 ? (
              liveLogs.map((log, idx) => (
                <div key={idx} style={{ wordBreak: 'break-all', opacity: Math.max(0.25, 1 - idx * 0.15) }}>
                  {log}
                </div>
              ))
            ) : (
              <div style={{ color: '#888' }}>Waiting for MQTT logs...</div>
            )}
          </div>
          <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Avg pH: <strong>{Number(avgMetrics.ph).toFixed(2)}</strong></span>
            <span>Avg TDS: <strong>{Math.round(avgMetrics.tds)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ANALYTICS STRIP  — 200px · 3 columns
   ════════════════════════════════════════════════════════════════ */
interface AnalyticsStripProps {
  dark: boolean;
  history: Record<string, any[]>;
  selectedNode: any;
  nodeMap: Record<string, string>;
}

function AnalyticsStrip({
  dark,
  history,
  selectedNode,
  nodeMap
}: AnalyticsStripProps) {
  // 1. Get current active node slug
  const activeSlug = selectedNode ? nodeMap[selectedNode.id] || 'CENTRAL' : 'CENTRAL';
  const dataList = history[activeSlug] || [];
  
  // 2. Get the latest telemetry values
  const latest = dataList.length > 0 ? dataList[dataList.length - 1] : { ph: 6.35, tds: 920, water_temp: 22.4, light_intensity: 350, flow_rate: 14.5, pump_status: 'normal' };
  
  // 3. Compute values dynamically
  const waterConsumed = (latest.flow_rate || 14.5) * 1.1 + 2.5; // Simulated L
  const nutrientDosed = (latest.tds || 920) * 0.045 + 5.2; // Simulated mL
  const powerUsed = (latest.light_intensity || 350) * 0.8 + 80; // Simulated W

  return (
    <div
      id="analytics-strip"
      style={{
        height: 180, flexShrink: 0,
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr',
        background: dark ? '#1c1d22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* ── Col 1: Water Resource Monitor ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(59,130,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Droplets size={13} color="#3b82f6" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#5a5f6b',
            fontFamily: 'var(--font)',
          }}>
            Water Resource Monitor
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Est. Daily Consumption</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {waterConsumed.toFixed(1)} L
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Telemetry Flow Rate</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {(latest.flow_rate || 14.5).toFixed(1)} L/m
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Supply Line Status</span>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
              Optimal
            </span>
          </div>
        </div>

        <div style={{ height: 24, width: '100%', marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataList.slice(-10)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="water_temp" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#grad-water)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divider */}
      <div style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

      {/* ── Col 2: Auto-Dosing Telemetry ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sliders size={13} color="#10b981" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#5a5f6b',
            fontFamily: 'var(--font)',
          }}>
            Auto-Dosing Telemetry
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Nutrients Fed Today</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {nutrientDosed.toFixed(1)} g
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>pH Regulator Dosed</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {(Math.abs(latest.ph - 6.35) * 8 + 2.1).toFixed(1)} mL
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Dosing Pumps Status</span>
            <span style={{ color: latest.ph < 6.0 || latest.ph > 6.8 ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: latest.ph < 6.0 || latest.ph > 6.8 ? '#f59e0b' : '#10b981' }} />
              {latest.ph < 6.0 || latest.ph > 6.8 ? 'Adjusting pH' : 'Optimal pH'}
            </span>
          </div>
        </div>

        <div style={{ height: 24, width: '100%', marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataList.slice(-10)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-nutrient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="tds" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#grad-nutrient)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Divider */}
      <div style={{ background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', margin: '14px 0' }} />

      {/* ── Col 3: Energy & lighting utilities ── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(245,158,11,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={13} color="#f59e0b" strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: dark ? '#9ca3af' : '#5a5f6b',
            fontFamily: 'var(--font)',
          }}>
            Utility & Energy Grid
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, fontWeight: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Lighting Draw</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {powerUsed.toFixed(0)} W
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Pump Consumption</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {latest.pump_status !== 'off' ? '45 W' : '0 W'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: dark ? '#9ca3af' : '#5a5f6b' }}>
            <span>Daily Power Usage</span>
            <span style={{ color: dark ? '#ffffff' : '#17181c', fontFamily: 'monospace' }}>
              {((powerUsed + (latest.pump_status !== 'off' ? 45 : 0)) * 0.024).toFixed(2)} kWh
            </span>
          </div>
        </div>

        <div style={{ height: 24, width: '100%', marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataList.slice(-10)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-power" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="light_intensity" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#grad-power)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT LAYOUT
   ════════════════════════════════════════════════════════════════ */
export default function MainLayout() {
  const { pathname } = useLocation();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [nodeMap, setNodeMap] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Record<string, any[]>>({
    T1: [], T2: [], T3: [], T4: [], CENTRAL: [], PUMP: []
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [useGrafana] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const activeTopicsCount = 6;
  const [backendHealthy, setBackendHealthy] = useState(true);
  const [dbHealthy, setDbHealthy] = useState(true);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  
  const msgCount = useRef(0);
  const [msgRate, setMsgRate] = useState(0);
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // Satisfy compiler for unused telemetry states
  useEffect(() => {
    console.debug({ alerts, socketConnected, activeTopicsCount, backendHealthy, dbHealthy, msgRate });
  }, [alerts, socketConnected, activeTopicsCount, backendHealthy, dbHealthy, msgRate]);

  // Seed history generator helper
  const generateSeedData = (baseVal: { ph: number; tds: number; turbidity: number; water_temp: number; air_temp: number; light_intensity: number }) => {
    const data = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 2000);
      data.push({
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ph: Number((baseVal.ph + (Math.random() - 0.5) * 0.05).toFixed(2)),
        tds: Number((baseVal.tds + (Math.random() - 0.5) * 10).toFixed(0)),
        turbidity: Number((baseVal.turbidity + (Math.random() - 0.5) * 1.0).toFixed(1)),
        water_temp: Number((baseVal.water_temp + (Math.random() - 0.5) * 0.15).toFixed(1)),
        air_temp: Number((baseVal.air_temp + (Math.random() - 0.5) * 0.2).toFixed(1)),
        light_intensity: Number((baseVal.light_intensity + (Math.random() - 0.5) * 15).toFixed(0))
      });
    }
    return data;
  };

  // Fetch initial nodes and alerts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const nodesRes = await axios.get(`${BACKEND_URL}/api/nodes`);
        setNodes(nodesRes.data);
        setBackendHealthy(true);
        setDbHealthy(true);

        const mapping: Record<string, string> = {};
        const seededHistory: Record<string, any[]> = {};

        nodesRes.data.forEach((node: any) => {
          let slug = node.nodeName.toUpperCase();
          if (slug.includes('PUMP')) slug = 'PUMP';
          else if (slug.includes('CENTRAL')) slug = 'CENTRAL';
          mapping[node.id] = slug;

          // Generate seed data
          const ph = node.sensors?.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
          const tds = node.sensors?.find((s: any) => s.sensorType === 'tds')?.value ?? 920;
          const turbidity = node.sensors?.find((s: any) => s.sensorType === 'turbidity')?.value ?? 12.0;
          const water_temp = node.sensors?.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
          const air_temp = node.sensors?.find((s: any) => s.sensorType === 'air_temp')?.value ?? 28.7;
          const light_intensity = node.sensors?.find((s: any) => s.sensorType === 'light_intensity')?.value ?? 350;

          seededHistory[slug] = generateSeedData({ ph, tds, turbidity, water_temp, air_temp, light_intensity });
        });

        setNodeMap(mapping);
        setHistory(seededHistory);
      } catch (err) {
        console.error('MainLayout initialization error:', err);
        setBackendHealthy(false);
        setDbHealthy(false);
      }

      try {
        const alertsRes = await axios.get(`${BACKEND_URL}/api/alerts`);
        setAlerts(alertsRes.data.slice(0, 4));
      } catch (_) {}
    };

    fetchInitialData();
  }, []);

  // Web socket connection
  useEffect(() => {
    const socket = io(BACKEND_URL);

    socket.on('connect', () => {
      setSocketConnected(true);
      setBackendHealthy(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('sensor_update', (data) => {
      msgCount.current += 1;
      
      // Update nodes state
      setNodes(prev => prev.map(node => {
        if (node.id === data.nodeId) {
          return { ...node, status: data.status, sensors: data.sensors };
        }
        return node;
      }));

      // Update history buffer
      setHistory(prev => {
        const slug = nodeMap[data.nodeId] || data.nodeId;
        const prevList = prev[slug] || [];

        const ph = data.sensors.find((s: any) => s.sensorType === 'ph')?.value ?? 6.35;
        const tds = data.sensors.find((s: any) => s.sensorType === 'tds')?.value ?? 920;
        const turbidity = data.sensors.find((s: any) => s.sensorType === 'turbidity')?.value ?? 12.0;
        const water_temp = data.sensors.find((s: any) => s.sensorType === 'water_temp')?.value ?? 22.4;
        const air_temp = data.sensors.find((s: any) => s.sensorType === 'air_temp')?.value ?? 28.7;
        const light_intensity = data.sensors.find((s: any) => s.sensorType === 'light_intensity')?.value ?? 350;

        const nextList = [...prevList, {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          ph, tds, turbidity, water_temp, air_temp, light_intensity
        }].slice(-15);

        return { ...prev, [slug]: nextList };
      });

      // Append to live logs
      setLiveLogs(prevLogs => {
        const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const slug = nodeMap[data.nodeId] || data.nodeId;
        
        const ph = data.sensors.find((s: any) => s.sensorType === 'ph')?.value;
        const tds = data.sensors.find((s: any) => s.sensorType === 'tds')?.value;
        
        let msg = `[${timeStr}] ${slug}:`;
        if (ph !== undefined) msg += ` pH=${Number(ph).toFixed(2)}`;
        if (tds !== undefined) msg += ` TDS=${Number(tds).toFixed(0)}ppm`;
        
        if (ph === undefined && tds === undefined) {
          msg += ` status=${data.status}`;
        }
        
        return [msg, ...prevLogs].slice(0, 5);
      });
    });

    socket.on('node:status_update', (data) => {
      setNodes(prev => prev.map(node => {
        if (node.id === data.id) {
          return { ...node, status: data.status };
        }
        return node;
      }));
    });

    socket.on('alert:new', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev].slice(0, 4));
    });

    return () => {
      socket.disconnect();
    };
  }, [nodeMap]);

  // Compute message rate window
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgRate(msgCount.current);
      msgCount.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="app-root"
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100vh', width: '100vw', overflow: 'hidden',
        background: dark ? '#111215' : '#f3f3f3',
        fontFamily: 'var(--font)',
        color: dark ? '#f0f0f2' : '#17181c',
      }}
    >
      <TopBar />

      <div
        id="body"
        style={{
          display: 'flex', flex: 1, overflow: 'hidden',
          padding: '12px 14px 14px', gap: 12, minHeight: 0,
        }}
      >
        <Sidebar />

        {/* Left Telemetry panel */}
        {pathname === '/hydroponic-system' && (
          <div style={{ width: 200, flexShrink: 0, display: 'flex' }}>
            <TelemetryPanel
              selectedNode={selectedNode}
              history={history}
              useGrafana={useGrafana}
              dark={dark}
              nodes={nodes}
            />
          </div>
        )}

        {/* Center column */}
        <div
          id="center-col"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, minHeight: 0 }}
        >
          {/* Main visualization */}
          <div
            id="visualization-panel"
            style={{
              flex: 1, minHeight: 0,
              display: 'flex', flexDirection: 'column',
              background: dark ? '#1c1d22' : '#ffffff',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
              borderRadius: 18, overflow: 'hidden', position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <Outlet context={{ selectedNode, setSelectedNode }} />
          </div>

          {/* Analytics strip */}
          {pathname === '/hydroponic-system' && (
            <AnalyticsStrip
              dark={dark}
              history={history}
              selectedNode={selectedNode}
              nodeMap={nodeMap}
            />
          )}
        </div>

        {/* Right KPI dashboard panel */}
        {pathname === '/hydroponic-system' && (
          <div style={{ width: 200, flexShrink: 0, display: 'flex' }}>
            <KPIDashboardPanel
              selectedNode={selectedNode}
              nodes={nodes}
              useGrafana={useGrafana}
              dark={dark}
              liveLogs={liveLogs}
            />
          </div>
        )}
      </div>
    </div>
  );
}
