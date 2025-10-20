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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function showToast(message: string, duration = 3000) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#4caf50";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast!.style.display = "none";
  }, duration);
}
function showRToast(message: string, duration = 3000) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#af4c4cff";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast!.style.display = "none";
  }, duration);
}

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
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKeyType, setNewApiKeyType] = useState("suricata");
  const [loadingKeys, setLoadingKeys] = useState(false);
  const filteredAlertsByApiKey = useMemo(() => {
  if (!apiKeys.length) return [];

  const activeKeys = apiKeys.filter(k => !k.revoked);
  const userKeysSet = new Set(activeKeys.map(k => k.key));
  //console.log("Active API Keys:", Array.from(userKeysSet));

  const filtered = alerts.filter(a => {
    const match = a.api_key && userKeysSet.has(a.api_key) || a.api_key === "0";
    return match;
  });

  //console.log("Filtered alerts count:", filtered.length);
  return filtered;
}, [alerts, apiKeys]);
  const fetchApiKeys = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/apikeys", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setApiKeys(res.data);
  } catch (err) {
    console.error(err);
  }
};

const [page, setPage] = useState(1);
const [perPage] = useState(100);
const [totalAlerts, setTotalAlerts] = useState(0);
const [loadingAlerts, setLoadingAlerts] = useState(false);

const fetchAlertsPage = async (pageNumber = 1) => {
  if (!token) return;
  setLoadingAlerts(true);

  try {
    const res = await axios.get(
      `http://localhost:5000/api/alerts_api?page=${pageNumber}&per_page=${perPage}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    setAlerts((prev) => {
      // dedupe: skip alerts already present by timestamp, src/dest IP, ports, and api_key
      const existingKeys = new Set(
        prev.map((a: any) => `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.src_port}-${a.dest_port}-${a.api_key}`)
      );
      const newFiltered = res.data.alerts.filter((a: any) => {
        const key = `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.src_port}-${a.dest_port}-${a.api_key}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
      return [...prev, ...newFiltered];
    });

    setTotalAlerts(res.data.total);
    setPage(res.data.page);
  } catch (err) {
    console.error("Failed to fetch alerts:", err);
  } finally {
    setLoadingAlerts(false);
  }
};

// Fetch first page on mount
useEffect(() => {
  fetchAlertsPage(1);
}, [token]);


useEffect(() => {
  if (showApiKeySettings) fetchApiKeys();
}, [showApiKeySettings]);

  const [filters, setFilters] = useState({
    minSeverity: 0,
    alertsOnly: false,
    protocols: new Set<string>(),
    port: undefined as number | undefined,
    ip: "",
    timeRange: { start: null as string | null, end: null as string | null },
    agent: ""
  });

  // Sorting state
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default newest → oldest

  // Manage selected saved filter dropdown
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState<string>("");

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

    const newAlerts = res.data.alerts || [];
    const newAlertsWithKey = newAlerts.map((a: any) => ({ ...a, api_key: "0" }));

    // Deduplicate: only add alerts that don't already exist
    setAlerts((prev) => {
      const existingSet = new Set(prev.map(a => `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.signature}`));
      const filteredNew = newAlertsWithKey.filter((a: any) =>
        !existingSet.has(`${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.signature}`)
      );
      return [...filteredNew, ...prev];
    });

    showToast(`${newAlerts.length} alerts uploaded (duplicates skipped)`);
  } catch (err) {
    console.error(err);
    showRToast("Failed to upload/parse file");
  } finally {
    setLoading(false);
    // reset input so same file can be re-uploaded if needed
    e.target.value = '';
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
      showToast("Filter saved!");
    } catch (err) {
      console.error(err);
      showRToast("Failed to save filter");
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
  // Only process alerts the user is allowed to see
  const alertsToProcess = filteredAlertsByApiKey;
  if (!alertsToProcess.length) {
    setAlertsWithGeo([]);
    return;
  }

  const fetchGeo = async () => {
    const ips = Array.from(
      new Set(
        alertsToProcess.flatMap(a => [a.src_ip, a.dest_ip]).filter(Boolean)
      )
    );

    if (!ips.length) {
      setAlertsWithGeo(alertsToProcess);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/geo", { ips });
      const geoMap: Record<string, { lat: number; lon: number }> = {};
      res.data.forEach((loc: any) => {
        geoMap[loc.ip] = { lat: loc.lat, lon: loc.lon };
      });

      const geoAlerts = alertsToProcess.map(a => ({
        ...a,
        src_geo: a.src_ip ? geoMap[a.src_ip] : undefined,
        dest_geo: a.dest_ip ? geoMap[a.dest_ip] : undefined
      }));

      setAlertsWithGeo(geoAlerts);
    } catch (err) {
      setAlertsWithGeo(alertsToProcess);
    }
  };

  fetchGeo();
}, [filteredAlertsByApiKey]);

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
          threshold: opts.threshold ? Number(opts.threshold) : 100,
        });
      } catch (err) {
        console.error("Failed to fetch alert options:", err);
      }
    };
    fetchAlertOptions();
  }, [token]);
  //live monitoring via websockets
    useEffect(() => {
  // Connect to backend Socket.IO endpoint for real-time updates only
  const socket = io("http://localhost:5000/api/alerts/stream", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.IO stream");
    });
    socket.on("bulk_alerts", (payload) => {
      if (!payload || !Array.isArray(payload.alerts)) {
        console.warn("⚠️ Malformed payload received:", payload);
        return;
      }

      const alerts = payload.alerts.map((a: any, i: number) => {
        console.log(`🔹 [${i + 1}/${payload.alerts.length}]`, a);
        return {
          api_key: a.api_key || "unknown",
          id: crypto.randomUUID(),
          timestamp: a.timestamp || new Date().toISOString(),
          src_ip: a.src_ip || "unknown",
          src_port: a.src_port ?? null,
          dest_ip: a.dest_ip || "unknown",
          dest_port: a.dest_port ?? null,
          protocol: a.protocol || "N/A",
          signature: a.signature || "Unlabeled Alert",
          severity: a.severity ?? 0,
        };
      });

      console.log(`📦 Processed ${alerts.length} alerts`);

      // ✅ Add new alerts to the top of the list with deduplication
      setAlerts((prev: any[]) => {
        const existingKeys = new Set(
          prev.map((a: any) => `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.src_port}-${a.dest_port}-${a.api_key}`)
        );
        const newFiltered = alerts.filter((a: any) => {
          const key = `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.src_port}-${a.dest_port}-${a.api_key}`;
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        });
        return [...newFiltered, ...prev];
      });
    });

    return () => {
      console.log("🧹 Cleaning up socket connection");
      socket.disconnect();
    };
  }, [token]);
  //api keys fetch
  useEffect(() => {
  if (!token) return;

  const fetchApiKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await axios.get("http://localhost:5000/api/apikeys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Keys JSON:", res.data); // <-- Log the key objects for testing
      setApiKeys(res.data || []);
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoadingKeys(false);
    }
  };

  fetchApiKeys();
}, [token]);




  // Filter alerts based on selected filters
  let filteredAlerts = filteredAlertsByApiKey.filter((a) => {
  if (filters.alertsOnly && (a.severity == "0" || a.severity == null)) return false;
  if (filters.minSeverity && (!a.severity || a.severity > filters.minSeverity)) return false;
  if (filters.protocols.size && !filters.protocols.has(a.protocol)) return false;
  if (filters.port !== undefined && a.src_port !== filters.port && a.dest_port !== filters.port) return false;
  if (filters.ip && !(a.src_ip?.includes(filters.ip) || a.dest_ip?.includes(filters.ip))) return false;
  if (filters.agent && a.api_key !== filters.agent) return false;
  if (filters.timeRange.start || filters.timeRange.end) {
    const ts = a.timestamp ? new Date(a.timestamp) : null;
    if (ts) {
      if (filters.timeRange.start && ts < new Date(filters.timeRange.start)) return false;
      if (filters.timeRange.end && ts > new Date(filters.timeRange.end)) return false;
    }
  }
  return true;
});

// Sorting logic
  filteredAlerts = [...filteredAlerts].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    // Special handling for agent (api_key)
    if (sortField === "agent") {
      aVal = a.api_key;
      bVal = b.api_key;
    }
    // Convert to string for comparison
    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
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
const alertsPerHourOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true, // always start at 0
      ticks: {
        precision: 0, // no decimals
      },
    },
  },
  plugins: {
    legend: { position: 'top' as const },
  },
};
// --- Time Range View (Today / Week / Month / Year) ---
const [timeRangeView, setTimeRangeView] = useState<"today" | "week" | "month" | "year">("today");

// Compute the start time for filtering
const now = new Date();
let startTime = new Date();

if (timeRangeView === "today") {
  startTime.setHours(0, 0, 0, 0);
} else if (timeRangeView === "week") {
  const day = now.getDay();
  startTime = new Date(now);
  startTime.setDate(now.getDate() - day);
  startTime.setHours(0, 0, 0, 0);
} else if (timeRangeView === "month") {
  startTime = new Date(now.getFullYear(), now.getMonth(), 1);
} else if (timeRangeView === "year") {
  startTime = new Date(now.getFullYear(), 0, 1);
}

// 🧠 Filter alerts to the selected time range
const filteredByTime = filteredAlerts.filter((a) => {
  const d = new Date(a.timestamp);
  return d >= startTime && d <= now;
});

// console.log(`Range: ${timeRangeView}`);
// console.log(`From ${startTime.toISOString()} to ${now.toISOString()}`);
// console.log(`Total alerts: ${filteredAlerts.length}, In range: ${filteredByTime.length}`);

// --- Group alerts by hour/day/week/month dynamically ---
const groupAlerts = (unit: string, source: any[]) => {
  const map = new Map<string, { threats: number; activity: number }>();
  source.forEach((a) => {
    const d = new Date(a.timestamp);
    if (isNaN(d.getTime())) return;

    let key = "";
    if (unit === "hour") key = `${d.getHours()}:00`;
    else if (unit === "day") key = d.toLocaleDateString();
    else if (unit === "week") {
      const firstDay = new Date(d);
      firstDay.setDate(d.getDate() - d.getDay());
      key = `Week of ${firstDay.toLocaleDateString()}`;
    } else if (unit === "month") {
      key = d.toLocaleString("default", { month: "short", year: "numeric" });
    }

    const isThreat = [1, 2, 3].includes(a.severity);
    const entry = map.get(key) || { threats: 0, activity: 0 };
    if (isThreat) entry.threats++;
    else entry.activity++;
    map.set(key, entry);
  });
  return map;
};

// Pick grouping unit based on view
const unit =
  timeRangeView === "today"
    ? "hour"
    : timeRangeView === "week"
    ? "day"
    : timeRangeView === "month"
    ? "day"
    : "month";

const groupedData = groupAlerts(unit, filteredByTime);

//console.log("Grouped data:", Array.from(groupedData.entries()));

// --- Generate full labels dynamically ---
let fullLabels: string[] = [];

if (timeRangeView === "today") {
  fullLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
} else if (timeRangeView === "week") {
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  fullLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d.toLocaleDateString();
  });
} else if (timeRangeView === "month") {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  fullLabels = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    return d.toLocaleDateString();
  });
} else if (timeRangeView === "year") {
  fullLabels = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(i);
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  });
}

// --- Map groupedData onto fullLabels, fill 0 if missing ---
const detected = fullLabels.map((label) => groupedData.get(label)?.threats || 0);
const activity = fullLabels.map((label) => groupedData.get(label)?.activity || 0);

// --- Chart data ---
const alertsOverTimeData = {
  labels: fullLabels,
  datasets: [
    {
      label: "Detected Threats",
      data: detected,
      borderColor: "#ef4444",
      backgroundColor: "rgba(239,68,68,0.15)",
      tension: 0.3,
    },
    {
      label: "Activity (non-threat)",
      data: activity,
      borderColor: "#0b97f5",
      backgroundColor: "rgba(11,151,245,0.12)",
      tension: 0.3,
    },
  ],
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
    // console.log("Source Threat Intel:", srcRes.data);
    // console.log("Destination Threat Intel:", destRes.data);
    
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
  //hidden charts for report generation
  type TimeRange = "today" | "week" | "month" | "year";

const generateAlertsOverTimeData = (timeRangeView: TimeRange, alerts: any[]) => {
  const now = new Date();
  let startTime = new Date();

  // Compute start time based on range
  if (timeRangeView === "today") startTime.setHours(0, 0, 0, 0);
  else if (timeRangeView === "week") {
    startTime.setDate(now.getDate() - now.getDay());
    startTime.setHours(0, 0, 0, 0);
  } else if (timeRangeView === "month") {
    startTime = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (timeRangeView === "year") {
    startTime = new Date(now.getFullYear(), 0, 1);
  }

  // Filter alerts to range
  const filtered = alerts.filter(a => {
    const d = new Date(a.timestamp);
    return d >= startTime && d <= now;
  });

  // Grouping unit
  const unit = timeRangeView === "today" ? "hour" : timeRangeView === "week" || timeRangeView === "month" ? "day" : "month";

  // Group alerts
  const grouped = new Map<string, { threats: number; activity: number }>();
  filtered.forEach(a => {
    const d = new Date(a.timestamp);
    if (isNaN(d.getTime())) return;

    let key = "";
    if (unit === "hour") key = `${d.getHours()}:00`;
    else if (unit === "day") key = d.toLocaleDateString();
    else if (unit === "month") key = d.toLocaleString("default", { month: "short", year: "numeric" });

    const isThreat = [1, 2, 3].includes(a.severity);
    const entry = grouped.get(key) || { threats: 0, activity: 0 };
    if (isThreat) entry.threats++;
    else entry.activity++;
    grouped.set(key, entry);
  });

  // Generate full labels
  let labels: string[] = [];
  if (timeRangeView === "today") labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  else if (timeRangeView === "week") {
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay());
    labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d.toLocaleDateString();
    });
  } else if (timeRangeView === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    labels = Array.from({ length: daysInMonth }, (_, i) => new Date(now.getFullYear(), now.getMonth(), i + 1).toLocaleDateString());
  } else if (timeRangeView === "year") {
    labels = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(i);
      return d.toLocaleString("default", { month: "short", year: "numeric" });
    });
  }

  // Map grouped data to labels, fill missing with 0
  const detected = labels.map(label => grouped.get(label)?.threats || 0);
  const activity = labels.map(label => grouped.get(label)?.activity || 0);

  return {
    labels,
    datasets: [
      {
        label: "Detected Threats",
        data: detected,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.15)",
        tension: 0.3,
      },
      {
        label: "Activity (non-threat)",
        data: activity,
        borderColor: "#0b97f5",
        backgroundColor: "rgba(11,151,245,0.12)",
        tension: 0.3,
      },
    ],
  };
};

  const alertsOverTimeDataToday = generateAlertsOverTimeData("today", filteredAlerts);
const alertsOverTimeDataWeek = generateAlertsOverTimeData("week", filteredAlerts);
const alertsOverTimeDataMonth = generateAlertsOverTimeData("month", filteredAlerts);



const generateReport = async () => {
  const doc = new jsPDF("p", "mm", "a4");
  let yPos = 10;

  // --- Title ---
  doc.setFontSize(18);
  doc.text("Alerts Management Report", 105, yPos, { align: "center" });
  yPos += 10;

  // --- Date / Time ---
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 10, yPos);
  yPos += 10;

  // --- Summary Section ---
  doc.setFontSize(12);
  doc.text("Summary", 10, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.text(`Total Alerts: ${summary.total}`, 10, yPos);
  yPos += 5;

  // Function to write top items line by line
  const top = (label: string, arr: [string, number][]) => {
    doc.setFontSize(10);
    doc.text(`${label}:`, 10, yPos);
    yPos += 5;
    arr.forEach(([key, val]) => {
      doc.text(`  ${key}: ${val}`, 15, yPos);
      yPos += 5;
    });
    yPos += 2;
  };

  top("Top Talkers", summary.topTalkers);
  top("Top Hosts", summary.topHosts);
  top("Top Signatures", summary.topSignatures);

  yPos += 4;

  // --- Chart Section ---
  const addChart = async (canvasId: string, title: string) => {
    const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvasEl) return;

    // Chart title
    doc.setFontSize(12);
    doc.text(title, 10, yPos);
    yPos += 6;

    const imgData = canvasEl.toDataURL("image/png");
    const imgProps = (doc as any).getImageProperties(imgData);
    const pdfWidth = 180; // mm
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    if (yPos + pdfHeight > 280) {
      doc.addPage();
      yPos = 10;
    }

    doc.addImage(imgData, "PNG", 15, yPos, pdfWidth, pdfHeight);
    yPos += pdfHeight + 10;
  };

  // Single charts
  await addChart("severity-chart", "Severity Levels");
  await addChart("protocol-chart", "Activity by Protocol");
  await addChart("alerts-over-time-chart", "Alerts Over Time");

  // --- Save PDF ---
  doc.save("alerts_management_report.pdf");
};


  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Alerts</h1>
        <div className="flex flex-wrap gap-4 items-center relative">
          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md cursor-pointer hover:bg-blue-700 transition">
            <span>Upload Alert File</span>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <div className="relative">
            <button
              onClick={() => setShowApiKeySettings(!showApiKeySettings)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              🔑 API Key Management
            </button>
            {showApiKeySettings && (
              <div className="absolute left-0 mt-2 bg-white shadow-lg rounded-lg border p-4 w-96 z-20">
                <h3 className="text-lg font-semibold mb-2">API Key Management</h3>
                {/* Create new API key */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    placeholder="API key name"
                    className="border rounded px-2 py-1 w-full mb-2"
                  />
                  <select
                    value={newApiKeyType}
                    onChange={(e) => setNewApiKeyType(e.target.value)}
                    className="border rounded px-2 py-1 w-full mb-2"
                  >
                    <option value="suricata">Suricata</option>
                    <option value="zeek">Zeek</option>
                    <option value="snort">Snort</option>
                  </select>
                  <button
                    onClick={async () => {
                      if (!newApiKeyName) return alert("Enter a key name");
                      const expires_days = 30; // or let user choose
                      try {
                        await axios.post(
                          "http://localhost:5000/api/apikeys",
                          { name: newApiKeyName, type: newApiKeyType, expires_days },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        showToast(`API key created!`);
                        setNewApiKeyName(""); // clear input
                        fetchApiKeys(); // refresh list
                      } catch (err) {
                        console.error(err);
                        showRToast("Failed to create API key");
                      }
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 w-full"
                  >
                    Create API Key
                  </button>
                </div>
                {/* List existing API keys */}
                <div className="max-h-60 overflow-y-auto">
                  {loadingKeys ? (
                    <p>Loading keys...</p>
                  ) : apiKeys.length === 0 ? (
                    <p>No API keys yet</p>
                  ) : (
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Key</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys
                          .filter((key) => !key.revoked)
                          .map((key) => (
                            <tr key={key.id} className="border-b">
                              <td className="p-2">{key.name}</td>
                              <td className="p-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(key.key ?? "");
                                    showToast("API key copied to clipboard");
                                  }}
                                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Copy key to clipboard
                                </button>
                              </td>
                              <td className="p-2 flex gap-2 items-center">
                                <select
                                  value={key.type}
                                  onChange={(e) => {
                                    const newType = e.target.value;
                                    setApiKeys(apiKeys.map(k =>
                                      k.id === key.id ? { ...k, type: newType, dirty: true } : k
                                    ));
                                  }}
                                  className="border rounded px-2 py-1"
                                >
                                  <option value="suricata">Suricata</option>
                                  <option value="zeek">Zeek</option>
                                  <option value="snort">Snort</option>
                                </select>
                                {key.dirty && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await axios.put(
                                          `http://localhost:5000/api/apikeys/${key.id}`,
                                          { type: key.type },
                                          { headers: { Authorization: `Bearer ${token}` } }
                                        );
                                        setApiKeys(apiKeys.map(k =>
                                          k.id === key.id ? { ...k, dirty: false } : k
                                        ));
                                        showToast("API key type updated");
                                      } catch (err) {
                                        console.error(err);
                                        showRToast("Failed to update key type");
                                      }
                                    }}
                                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    if (!confirm("Delete this API key?")) return;
                                    try {
                                      await axios.delete(`http://localhost:5000/api/apikeys/${key.id}`, {
                                        headers: { Authorization: `Bearer ${token}` },
                                      });
                                      setApiKeys(apiKeys.filter((k) => k.id !== key.id));
                                    } catch (err) {
                                      console.error(err);
                                      showRToast("Failed to delete key");
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowApiKeySettings(false)}
                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowAlertSettings(!showAlertSettings)}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              ⚙️ Alert Preferences
            </button>
            <button
              onClick={generateReport}
              className="ml-4 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate Management Report
            </button>
            {showAlertSettings && (
              <div className="absolute left-0 mt-2 bg-white shadow-lg rounded-lg border p-4 w-80 z-10">
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
                {/* Report Frequency Dropdown
                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium">Report Frequency</label>
                  <select
                    value={reportFrequency}
                    onChange={(e) => setReportFrequency(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="none">None</option>
                  </select>
                </div> */}
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
                        showToast("Alert options saved!");
                        setShowAlertSettings(false);
                      } catch (err) {
                        console.error("Failed to save alert options:", err);
                        showRToast("Failed to save alert options");
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
                id="severity-chart"
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
                id="protocol-chart"
                key={"protocol-" + filteredAlerts.length}
                data={protocolData}
                options={{ responsive: true, maintainAspectRatio: false }}
                height={200}
              />
            </div>

            {/* Activity over time (dynamic range) */}
            <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center shadow h-64 w-full">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-lg font-semibold">Activity over time</span>
                <div className="flex gap-2">
                  {["today", "week", "month", "year"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setTimeRangeView(r as any)}
                      className={`px-2 py-1 text-sm rounded ${
                        timeRangeView === r ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <Line
              id="alerts-over-time-chart"
                key={`${timeRangeView}-${filteredAlerts.length}`}
                data={alertsOverTimeData}
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
          {/* Agent filter dropdown */}
          {apiKeys.filter(k => !k.revoked).length > 0 && (
            <label className="ml-4">
              Agent:
              <select
                value={filters.agent}
                onChange={e => setFilters({ ...filters, agent: e.target.value })}
                className="ml-2 border rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="0">Uploaded manually</option>
                {apiKeys.map(k => (
                  <option key={k.key} value={k.key}>{k.name} ({k.type})</option>
                ))}
              </select>
            </label>
          )}
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
            onClick={() => {
              setFilters({agent: "", minSeverity: 0, alertsOnly: false, protocols: new Set(), port: undefined, ip: "", timeRange: { start: null, end: null } });
              setSelectedSavedFilterId(""); // reset saved filter dropdown
            }}
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
                value={selectedSavedFilterId}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedSavedFilterId(value);
                  const f = savedFilters.find(sf => sf.id === Number(value));
                  if (f) applySavedFilter(f);
                }}
                className="border rounded px-2 py-1"
              >
                <option value="">-- Select --</option>
                {savedFilters.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
               <button
                 className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                 disabled={!selectedSavedFilterId}
                 onClick={async () => {
                   try {
                     await axios.delete(
                       `http://localhost:5000/api/filters/${selectedSavedFilterId}`,
                       { headers: { Authorization: `Bearer ${token}` } }
                     );
                     setSavedFilters(prev => prev.filter(f => f.id !== Number(selectedSavedFilterId)));
                     setSelectedSavedFilterId("");
                     showToast("Filter deleted");
                   } catch (err) {
                     console.error(err);
                     showRToast("Failed to delete filter");
                   }
                 }}
               >
                 Delete Filter
               </button>
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
                {[
                  { label: "Timestamp", field: "timestamp" },
                  { label: "Source IP", field: "src_ip" },
                  { label: "Source Port", field: "src_port" },
                  { label: "Destination IP", field: "dest_ip" },
                  { label: "Destination Port", field: "dest_port" },
                  { label: "Signature", field: "signature" },
                  { label: "Severity", field: "severity" },
                  { label: "Agent", field: "agent" },
                ].map(col => (
                  <th
                    key={col.field}
                    className="p-3 text-left font-medium text-gray-700 cursor-pointer select-none"
                    onClick={() => {
                      if (sortField === col.field) setSortAsc(!sortAsc);
                      else {
                        setSortField(col.field);
                        setSortAsc(true);
                      }
                    }}
                  >
                    {col.label}
                    {sortField === col.field && (
                      <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((a, i) => {
                // Find the matching key by api_key
                const key = apiKeys.find((k) => k.key === a.api_key);
                return (
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
                    <td className="p-3">
                      {a.api_key === "0"
                        ? "Uploaded manually"
                        : key
                          ? `${key.name} (${key.type})`
                          : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
                <div className="mt-4 flex items-center space-x-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loadingAlerts || alerts.length >= totalAlerts}
          onClick={() => fetchAlertsPage(page + 1)}
        >
          Load More
        </button>
        <span className="text-gray-700">
          Showing {alerts.length} unique alerts
        </span>
      </div>

        </div>
      )}

      {/* No Alerts */}
      {!loading && alerts.length === 0 && (
        <div className="text-gray-600 mt-4">
          <p>The dashboard isnt getting info, is:</p>
          <ul className="list-disc list-inside">
            <li>Suricata or Snort running and generating alerts?</li>
            <li>The agent connected?</li>
          </ul>
        </div>
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
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}