//frontend/src/pages/alertPage.tsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import React from "react";
// near top of your AlertsPage.tsx (or a Chart component file)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  ArcElement,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartTitle, ChartTooltip, Legend);
import { io } from "socket.io-client";
import { useSocketLogger } from "../hooks/useSocketLogger";


export default function AlertsPage() {
  useSocketLogger();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertsWithGeo, setAlertsWithGeo] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [newFilterName, setNewFilterName] = useState("");
  const token = localStorage.getItem("token");
  const [threatIntel, setThreatIntel] = useState<any | null>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    high: true,
    medium: false,
    low: false,
    threshold: 100,
  });
  const [reportFrequency, setReportFrequency] = useState("weekly"); // default value




  const [filters, setFilters] = useState({
    minSeverity: 0,
    alertsOnly: false,
    protocols: new Set<string>(),
    port: undefined as number | undefined,
    ip: "",
    timeRange: { start: null as string | null, end: null as string | null }
});

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/alerts/upload-alerts",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error(err);
      alert("Failed to upload/parse file");
    } finally {
      setLoading(false);
    }
  };
  //filters fetch
  useEffect(() => {
  axios.get("http://localhost:5000/api/filters/", {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => setSavedFilters(res.data))
    .catch(err => console.error("Failed to load filters", err));
}, []);
  const saveCurrentFilter = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/filters/", {
        name: newFilterName || `Filter ${Date.now()}`,
        filters_json: {
          ...filters,
          protocols: Array.from(filters.protocols),
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedFilters([...savedFilters, res.data]);
      setNewFilterName("");
      alert("Filter saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save filter");
    }
  };
  const applySavedFilter = (f: any) => {
  setFilters({
    ...f.filters_json,
    protocols: new Set(f.filters_json.protocols || []), // convert back to Set
  });
};

    // --- Fetch GeoIP coordinates ---
  useEffect(() => {
    if (!alerts.length) {
      setAlertsWithGeo([]);
      return;
    }
    const fetchGeo = async () => {
      const ips = Array.from(
        new Set(
          alerts.flatMap(a => [a.src_ip, a.dest_ip]).filter(Boolean)
        )
      );

      if (!ips.length) {
        setAlertsWithGeo(alerts);
        return;
      }
      try {
        const res = await axios.post("http://localhost:5000/api/geo", { ips });
        const geoMap: Record<string, { lat: number; lon: number }> = {};
        res.data.forEach((loc: any) => {
          geoMap[loc.ip] = { lat: loc.lat, lon: loc.lon };
        });
        const geoAlerts = alerts.map(a => ({
          ...a,
          src_geo: a.src_ip ? geoMap[a.src_ip] : undefined,
          dest_geo: a.dest_ip ? geoMap[a.dest_ip] : undefined
        }));
        setAlertsWithGeo(geoAlerts);
      } catch (err) {
        setAlertsWithGeo(alerts);
      }
    };
    fetchGeo();
  }, [alerts]);
  // Load saved alert options for current user
  useEffect(() => {
    if (!token) return;
    const fetchAlertOptions = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/filters/alert-options", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const opts = res.data.alerts_options || {};
        setAlertSettings({
          high: opts.high ?? true,
          medium: opts.medium ?? false,
          low: opts.low ?? false,
          threshold: res.data.report_frequency ? Number(res.data.report_frequency) : 100,
        });
      } catch (err) {
        console.error("Failed to fetch alert options:", err);
      }
    };
    fetchAlertOptions();
  }, [token]);
  //live monitoring via websockets
    useEffect(() => {
    const socket = io("http://localhost:5000/api/alerts/stream", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => console.log("Connected to SocketIO server"));
    socket.on("disconnect", () => console.log("Disconnected from SocketIO server"));
    socket.on("connect_error", (error) => {
      console.error("[Socket] ❌ Connection error:", error.message);
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log(`[Socket] 🔄 Reconnect attempt #${attempt}`);
    });

    socket.on("reconnect", (attempt) => {
      console.log(`[Socket] 🔁 Successfully reconnected after ${attempt} tries`);
    });

    socket.on("new_alert", (newAlert: any) => {
    console.log("🚨 New alert received:", newAlert);

    if (!newAlert) return; // skip completely empty events, if you want

    const normalized = {
      timestamp: newAlert.timestamp ?? new Date().toISOString(), // fallback
      src_ip: newAlert.src_ip,
      src_port: newAlert.src_port,
      dest_ip: newAlert.dest_ip,
      dest_port: newAlert.dest_port,
      protocol: newAlert.protocol,
      signature: newAlert.signature,
      severity: newAlert.severity,
      type: newAlert.type,  // track original event type
      original: newAlert.original ?? newAlert,
    };

      setAlerts(prev => [normalized, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);


  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter((a) => {
    if (filters.alertsOnly && !a.signature) return false;
    if (filters.minSeverity && (!a.severity || a.severity > filters.minSeverity)) return false;
    if (filters.protocols.size && !filters.protocols.has(a.protocol)) return false;
    if (filters.port !== undefined && a.src_port !== filters.port && a.dest_port !== filters.port) return false;
    if (filters.ip && !(a.src_ip?.includes(filters.ip) || a.dest_ip?.includes(filters.ip))) return false;
    if (filters.timeRange.start || filters.timeRange.end) {
    const ts = a.timestamp ? new Date(a.timestamp) : null;
    if (ts) {
      if (filters.timeRange.start && ts < new Date(filters.timeRange.start)) return false;
      if (filters.timeRange.end && ts > new Date(filters.timeRange.end)) return false;
    }
  }
  return true;
});


  // Summary calculations
const summary = useMemo(() => {
  const alertEvents = filteredAlerts.filter(a => a.severity); // only severity events
  const total = alertEvents.length;

  const topTalkers: Record<string, number> = {};
  const topHosts: Record<string, number> = {};
  const topSignatures: Record<string, number> = {};

  alertEvents.forEach((a) => {
    if (a.dest_ip) topHosts[a.dest_ip] = (topHosts[a.dest_ip] || 0) + 1;
    if (a.signature) topSignatures[a.signature] = (topSignatures[a.signature] || 0) + 1;
  });
  filteredAlerts.forEach((a) => {
    if (a.src_ip) topTalkers[a.src_ip] = (topTalkers[a.src_ip] || 0) + 1;
  });
  const sortDesc = (obj: Record<string, number>) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return {
    total,
    topTalkers: sortDesc(topTalkers),
    topHosts: sortDesc(topHosts),
    topSignatures: sortDesc(topSignatures),
  };
}, [filteredAlerts]);
  //graphs
  // --- Bar chart: Alerts by severity ---
    // --- Severity Levels Data ---
    const severityData = {
      labels: [' '], // single category on x-axis
      datasets: [
        {
          label: 'Low',
          data: [filteredAlerts.filter(a => a.severity === 3).length],
          backgroundColor: '#10B981',
        },
        {
          label: 'Medium',
          data: [filteredAlerts.filter(a => a.severity === 2).length],
          backgroundColor: '#FBBF24',
        },
        {
          label: 'High',
          data: [filteredAlerts.filter(a => a.severity === 1).length],
          backgroundColor: '#f85e4aff',
        }
      ]
    };

  // --- Alerts by Protocol ---
  const protocolData = {
    labels: ['TCP', 'UDP', 'ICMP', 'Other'],
    datasets: [{
      data: [
        filteredAlerts.filter(a => a.protocol === 'TCP').length,
        filteredAlerts.filter(a => a.protocol === 'UDP').length,
        filteredAlerts.filter(a => a.protocol === 'ICMP').length,
        filteredAlerts.filter(a => !['TCP','UDP','ICMP'].includes(a.protocol)).length
      ],
      backgroundColor: ['#3B82F6','#F59E0B','#EF4444','#9CA3AF']
    }]
  };

  // --- Activity / Alerts per hour (detected threats vs non-threat activity) ---
const hours = Array.from({ length: 24 }, (_, i) => i);
const hourLabels = hours.map(h => `${h}:00`);

// helper to safely get hour number or null
const getHour = (a: any): number | null => {
  if (!a?.timestamp) return null;
  const d = new Date(a.timestamp);
  if (isNaN(d.getTime())) return null;
  return d.getHours(); // NOTE: local timezone. Use getUTCHours() if you want UTC.
};

// Detected threats = severity 1,2,3
const detectedPerHour = hours.map((h) =>
  filteredAlerts.reduce((acc, a) => {
    const hr = getHour(a);
    if (hr === h && (a.severity === 1 || a.severity === 2 || a.severity === 3)) return acc + 1;
    return acc;
  }, 0)
);

// Activity (non-threat) = items without severity 1|2|3
const activityPerHour = hours.map((h) =>
  filteredAlerts.reduce((acc, a) => {
    const hr = getHour(a);
    // treat as activity if no severity 1|2|3 present
    const isThreat = (a.severity === 1 || a.severity === 2 || a.severity === 3);
    if (hr === h && !isThreat) return acc + 1;
    return acc;
  }, 0)
);

const alertsPerHourData = {
  labels: hourLabels,
  datasets: [
    {
      label: "Detected Threats",
      data: detectedPerHour,
      borderColor: "#ef4444",
      backgroundColor: "rgba(239,68,68,0.15)",
      fill: false,
      tension: 0.3,
    },
    {
      label: "Activity (non-threat)",
      data: activityPerHour,
      borderColor: "#0b97f5",
      backgroundColor: "rgba(11,151,245,0.12)",
      fill: false,
      tension: 0.3,
    },
  ],
};

const alertsPerHourOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" as const },
    title: { display: false },
  },
  scales: {
    x: {
      ticks: { maxRotation: 0, autoSkip: true },
    },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 },
    },
  },
};

  // Toggle protocol in Set
  const toggleProtocol = (proto: string) => {
    const newSet = new Set(filters.protocols);
    if (newSet.has(proto)) newSet.delete(proto);
    else newSet.add(proto);
    setFilters({ ...filters, protocols: newSet });
  };
  // Inspect alert and fetch threat intel
  const handleInspect = async (alert: any) => {
    const srcIP = alert.src_ip;
    const destIP = alert.dest_ip;
    
    setSelectedAlert(alert.original || alert);
    setThreatIntel(null);
    setLoadingIntel(true);
    
    setLoadingIntel(true);
    try {
    const [srcRes, destRes] = await Promise.all([
      axios.post("http://localhost:5000/api/threatintel", { ip: srcIP }),
      axios.post("http://localhost:5000/api/threatintel", { ip: destIP }),
    ]);
    console.log("Source Threat Intel:", srcRes.data);
    console.log("Destination Threat Intel:", destRes.data);
    
      setThreatIntel({
        abuse: srcRes.data.abuse,
        vt: srcRes.data.vt,
        destAbuse: destRes.data.abuse,
        destVT: destRes.data.vt
      });
    } catch (err) {
      console.error("Threat intel fetch failed:", err);
    } finally {
      setLoadingIntel(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Suricata / Snort Alerts</h1>
        <div className="mt-4">
        <button
          onClick={() => setShowAlertSettings(!showAlertSettings)}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
        >
          ⚙️ Alert Preferences
        </button>
        {showAlertSettings && (
          <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg border p-4 w-80 z-10">
            <h3 className="text-lg font-semibold mb-2">Alert Notifications</h3>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={alertSettings.high}
                  onChange={(e) =>
                    setAlertSettings({ ...alertSettings, high: e.target.checked })
                  }
                />
                <span>Send email for <b>High alerts</b></span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={alertSettings.medium}
                  onChange={(e) =>
                    setAlertSettings({ ...alertSettings, medium: e.target.checked })
                  }
                />
                <span>Send email for <b>Medium alerts</b></span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={alertSettings.low}
                  onChange={(e) =>
                    setAlertSettings({ ...alertSettings, low: e.target.checked })
                  }
                />
                <span>Send email for <b>Low alerts</b></span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium">
                Above <b>X</b> logs per hour:
              </label>
              <input
                type="number"
                value={alertSettings.threshold}
                onChange={(e) =>
                  setAlertSettings({ ...alertSettings, threshold: Number(e.target.value) })
                }
                className="w-full border rounded px-2 py-1"
                min={1}
              />
            </div>
            {/* Report Frequency Dropdown */}
            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium">Report Frequency</label>
              <select
                value={reportFrequency} // separate state for this
                onChange={(e) => setReportFrequency(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="none">None</option>
              </select>
            </div>


            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowAlertSettings(false)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
              onClick={async () => {
                try {
                  await axios.put(
                  "http://localhost:5000/api/filters/alert-options",
                  {
                    alerts_options: alertSettings,
                    report_frequency: reportFrequency,
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                  alert("Alert options saved!");
                  setShowAlertSettings(false);
                } catch (err) {
                  console.error("Failed to save alert options:", err);
                  alert("Failed to save alert options");
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>

            </div>
          </div>
        )}

      </div>

        </div>

      {/* Upload Box */}
      <div className="mb-6">
        {/* Charts Section */}
        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Severity Levels */}
            <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center shadow h-64">
              <span className="text-lg font-semibold mb-2">Severity Levels</span>
              <Bar
                data={severityData}
                options={{responsive: true, maintainAspectRatio: false, 
                  plugins: {
                    legend: {
                    },
                  },}}
                height={200}
              />
            </div>

            {/* Alerts by Protocol */}
            <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center shadow h-64">
              <span className="text-lg font-semibold mb-2">Activity by Protocol</span>
              <Doughnut
                key={"protocol-" + filteredAlerts.length}
                data={protocolData}
                options={{ responsive: true, maintainAspectRatio: false }}
                height={200}
              />
            </div>

            {/* Alerts per Hour */}
            <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center shadow h-64">
              <span className="text-lg font-semibold mb-2">Activity over time</span>
              <Line
                key={filteredAlerts.length}
                data={alertsPerHourData}
                options={alertsPerHourOptions}
                height={200}
              />
            </div>
          </div>
        )}


        {/*  summary counters and GeoIP map */}
        {alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 mb-6 items-stretch">
            {/* Total Alerts */}
            <div className="bg-blue-600 text-white rounded-lg p-4 flex flex-col items-center justify-center shadow">
              <span className="text-4xl font-bold">{summary.total}</span>
              <span className="mt-2 font-medium">Total Alerts</span>
            </div>

            {/* Top Talkers */}
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2">Top Talkers</h3>
              <table className="w-full text-sm">
          <tbody>
            {summary.topTalkers.map(([ip, count]) => (
              <tr key={ip}>
                <td>{ip}</td>
                <td className="text-right font-semibold">{count}</td>
              </tr>
            ))}
          </tbody>
              </table>
            </div>

            {/* Top Attacked Hosts */}
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2">Top Attacked Hosts</h3>
              <table className="w-full text-sm">
          <tbody>
            {summary.topHosts.map(([ip, count]) => (
              <tr key={ip}>
                <td>{ip}</td>
                <td className="text-right font-semibold">{count}</td>
              </tr>
            ))}
          </tbody>
              </table>
            </div>

            {/* Top Signatures */}
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2">Top Signatures</h3>
              <table className="w-full text-sm">
          <tbody>
            {summary.topSignatures.map(([sig, count]) => (
              <tr key={sig}>
                <td>{sig}</td>
                <td className="text-right font-semibold">{count}</td>
              </tr>
            ))}
          </tbody>
              </table>
            </div>

            {/* GeoIP Map */}
            <div className="bg-white rounded-lg p-2 shadow flex items-center justify-center z-0">
              <div className="h-48 w-full">
          <MapContainer
            bounds={[[-90, -180], [90, 180]]}
            style={{ height: '100%', width: '100%' }}
            maxBoundsViscosity={1.0}
            center={[50, 0]}
            dragging={true}
            maxBounds={[[-90, -180], [90, 180]]}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              noWrap={true}
            />
            {alertsWithGeo.map((a, i) => (
            <React.Fragment key={i}>
              {a.src_geo?.lat != null && a.src_geo?.lon != null && (
                <CircleMarker
                  key={`src-${i}`}
                  center={[a.src_geo.lat, a.src_geo.lon]}
                  radius={3}
                  pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.7 }}
                >
                  <Tooltip direction="top" offset={[0, -2]} opacity={1} permanent={false}>
                    <span>
                      Source: {a.src_ip}
                      {a.signature ? <><br />Sig: {a.signature}</> : null}
                    </span>
                  </Tooltip>
                </CircleMarker>
              )}
              {a.dest_geo?.lat != null && a.dest_geo?.lon != null && (
                <CircleMarker
                  key={`dest-${i}`}
                  center={[a.dest_geo.lat, a.dest_geo.lon]}
                  radius={4}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.7 }}
                >
                  <Tooltip direction="top" offset={[0, -2]} opacity={1} permanent={false}>
                    <span>
                      Dest: {a.dest_ip}
                      {a.signature ? <><br />Sig: {a.signature}</> : null}
                    </span>
                  </Tooltip>
                </CircleMarker>
              )}
            </React.Fragment>
          ))}
          </MapContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      
      
      {/* Filters */}
      {alerts.length > 0 && (
        <>
          {/* Filter row */}
          <div className="mb-4 flex gap-4 flex-wrap">
          <label>
            Min Severity:
            <select
              value={filters.minSeverity}
              onChange={(e) => setFilters({ ...filters, minSeverity: Number(e.target.value) })}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value={0}>All</option>
              <option value={1}>1 - High</option>
              <option value={2}>2 - Medium</option>
              <option value={3}>3 - Low</option>
            </select>
          </label>

          <label className="ml-4">
            <input
              type="checkbox"
              checked={filters.alertsOnly}
              onChange={() => setFilters({ ...filters, alertsOnly: !filters.alertsOnly })}
              className="mr-1"
            />
            Alerts Only
          </label>

          {/* Protocol checkboxes */}
          {["TCP", "UDP", "ICMP"].map((proto) => (
            <label key={proto} className="ml-2">
              <input
                type="checkbox"
                checked={filters.protocols.has(proto)}
                onChange={() => toggleProtocol(proto)}
                className="mr-1"
              />
              {proto}
            </label>
          ))}
          <label className="ml-4">
            Port:
            <input
              type="number"
              min={0}
              max={65535}
              value={filters.port ?? ""}
              onChange={(e) => setFilters({ ...filters, port: e.target.value ? Number(e.target.value) : undefined })}
              className="ml-2 border rounded px-2 py-1 w-20"
              placeholder="Any"
            />
          </label>
          {/* ip and time */}
          <label className="ml-4">
            IP:
            <input
              type="text"
              value={filters.ip}
              onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
              className="ml-2 border rounded px-2 py-1 w-40"
              placeholder="Match src/dest IP"
            />
          </label>

          <label className="ml-4">
            Start Time:
            <input
              type="datetime-local"
              value={filters.timeRange.start ?? ""}
              onChange={(e) => setFilters({
                ...filters,
                timeRange: { ...filters.timeRange, start: e.target.value || null }
              })}
              className="ml-2 border rounded px-2 py-1"
            />
          </label>

          <label className="ml-4">
            End Time:
            <input
              type="datetime-local"
              value={filters.timeRange.end ?? ""}
              onChange={(e) => setFilters({
                ...filters,
                timeRange: { ...filters.timeRange, end: e.target.value || null }
              })}
              className="ml-2 border rounded px-2 py-1"
            />
          </label>


          <button
            onClick={() =>
              setFilters({ minSeverity: 0, alertsOnly: false, protocols: new Set(), port: undefined,ip: "", timeRange: { start: null, end: null } })
            }
            className="ml-4 px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            Show All
          </button>
          </div>

          {/* save load filters */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Filter name"
              className="border rounded px-2 py-1"
            />
            <button
              onClick={saveCurrentFilter}
              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Filter
            </button>
          </div>

          {/* Saved filters dropdown */}
          {savedFilters.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="mr-2">Load Saved:</label>
              <select
                onChange={(e) => {
                  const f = savedFilters.find(sf => sf.id === Number(e.target.value));
                  if (f) applySavedFilter(f);
                }}
                className="border rounded px-2 py-1"
              >
                <option value="">-- Select --</option>
                {savedFilters.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              </div>
            )}
          </div>
        </>
      )}

      {loading && <p className="text-blue-500 font-semibold">Processing file...</p>}

      {/* Alerts Table */}
      {filteredAlerts.length > 0 && (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700">Timestamp</th>
                <th className="p-3 text-left font-medium text-gray-700">Source IP</th>
                <th className="p-3 text-left font-medium text-gray-700">Source Port</th>
                <th className="p-3 text-left font-medium text-gray-700">Destination IP</th>
                <th className="p-3 text-left font-medium text-gray-700">Destination Port</th>
                <th className="p-3 text-left font-medium text-gray-700">Signature</th>
                <th className="p-3 text-left font-medium text-gray-700">Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((a, i) => (
                <tr
                  key={i}
                  className={`transition border-b border-gray-200 cursor-pointer hover:opacity-90 ${
                    a.severity === 1
                      ? "bg-red-100"
                      : a.severity === 2
                      ? "bg-yellow-100"
                      : a.severity === 3
                      ? "bg-green-100"
                      : ""
                  }`}
                  onDoubleClick={() => handleInspect(a)}
                >
                  <td className="p-3">{a.timestamp || "-"}</td>
                  <td className="p-3">{a.src_ip || "-"}</td>
                  <td className="p-3">{a.src_port ?? "-"}</td>
                  <td className="p-3">{a.dest_ip || "-"}</td>
                  <td className="p-3">{a.dest_port ?? "-"}</td>
                  <td className="p-3">{a.signature || "-"}</td>
                  <td className="p-3 font-semibold">{a.severity || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Alerts */}
      {!loading && alerts.length === 0 && (
        <p className="text-gray-600 mt-4">
          The dashboard isnt getting info, is:
          <ul className="list-disc list-inside">
            <li>Suricata or Snort running and generating alerts?</li>
            <li>The agent connected?</li>
            </ul>
        </p>
      )}

      {/* Inspect Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-3/4 max-w-6xl p-6 relative overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Inspect Alert</h2>
            <table className="table-auto w-full border border-gray-200 rounded-lg">
              <tbody>
                {Object.entries(selectedAlert).map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="p-2 font-medium text-gray-700 bg-gray-50 w-1/3">{key}</td>
                    <td className="p-2 text-gray-800">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : value?.toString() || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Threat Intelligence Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border-r">Data source</th>
                    <th className="p-2 border-r">Field</th>
                    <th className="p-2 border-r">Source ({selectedAlert.src_ip})</th>
                    <th className="p-2">Destination ({selectedAlert.dest_ip})</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Confidence",
                    "Total Reports",
                    "Country",
                    "Domain",
                    "ASN Owner",
                    "ASN",
                    "Reputation",
                  ].map((field) => {
                    const getAbuseValue = (abuseData: any) => {
                      if (!abuseData?.data) return "-";
                      switch (field) {
                        case "Confidence":
                          return abuseData.data.abuseConfidenceScore ?? "-";
                        case "Total Reports":
                          return abuseData.data.totalReports ?? "-";
                        case "Country":
                          return abuseData.data.countryCode ?? "-";
                        case "Domain":
                          return abuseData.data.domain ?? "-";
                        default:
                          return "-";
                      }
                    };

                    const getVTValue = (vtData: any) => {
                      if (!vtData?.data?.attributes) return "-";
                      switch (field) {
                        case "ASN Owner":
                          return vtData.data.attributes.as_owner ?? "-";
                        case "ASN":
                          return vtData.data.attributes.asn ?? "-";
                        case "Reputation":
                          return vtData.data.attributes.reputation ?? "-";
                        default:
                          return "-";
                      }
                    };

                    return (
                      <tr key={field} className="border-b border-gray-200">
                        {/* Data Source */}
                        <td className="p-2 font-medium bg-gray-50">
                          {["Confidence", "Total Reports", "Country", "Domain"].includes(field)
                            ? "AbuseIPDB"
                            : "VirusTotal"}
                        </td>

                        {/* Field Name */}
                        <td className="p-2 font-medium bg-gray-50">{field}</td>

                        {/* Source Value */}
                      <td
                        className={`p-2 border-r ${
                          !loadingIntel && field === "Reputation"
                            ? (() => {
                                const rep = threatIntel?.vt?.data?.attributes?.reputation ?? 0;
                                if (rep < 0) return "bg-red-200 text-red-800 font-bold";
                                if (rep === 0) return "bg-yellow-200 text-yellow-800 font-bold";
                                return "bg-green-200 text-green-800 font-bold";
                              })()
                            : ""
                        }`}
                      >
                        {loadingIntel
                          ? "Loading..."
                          : ["Confidence", "Total Reports", "Country", "Domain"].includes(field)
                          ? getAbuseValue(threatIntel?.abuse)
                          : getVTValue(threatIntel?.vt)}
                      </td>

                      {/* Destination Value */}
                      <td
                        className={`p-2 ${
                          !loadingIntel && field === "Reputation"
                            ? (() => {
                                const rep = threatIntel?.destVT?.data?.attributes?.reputation ?? 0;
                                if (rep < 0) return "bg-red-200 text-red-800 font-bold";
                                if (rep === 0) return "bg-yellow-200 text-yellow-800 font-bold";
                                return "bg-green-200 text-green-800 font-bold";
                              })()
                            : ""
                        }`}
                      >
                        {loadingIntel
                          ? "Loading..."
                          : ["Confidence", "Total Reports", "Country", "Domain"].includes(field)
                          ? getAbuseValue(threatIntel?.destAbuse)
                          : getVTValue(threatIntel?.destVT)}
                      </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <small>note* lower reputation = more likely to be malicious</small>
            </div>

            <button
              onClick={() => setSelectedAlert(null)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
