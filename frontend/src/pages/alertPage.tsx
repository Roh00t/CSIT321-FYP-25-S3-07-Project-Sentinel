// src/pages/AlertsPage.tsx
import { useState, useEffect, useMemo } from "react";
import apiClient from "../components/apiClient";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import React from "react";
// Chart.js
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
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line, Bar, Doughnut } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartTitle, ChartTooltip, Legend, ChartDataLabels);
// Socket.IO
import { io, Socket } from "socket.io-client";
import { useSocketLogger } from "../hooks/useSocketLogger";
// PDF
import jsPDF from "jspdf";
// React Grid Layout (non-editable)
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
const ResponsiveGridLayout = WidthProvider(Responsive);
// Toast helpers
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
  const [graphRefreshTick, setGraphRefreshTick] = useState(0);
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
    threshold: 10000,
  });
  const [reportFrequency] = useState("weekly");
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKeyType, setNewApiKeyType] = useState("suricata");
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [alertPackets, setAlertPackets] = useState<any[]>([]);
  const filteredAlertsByApiKey = useMemo(() => {
    if (!apiKeys.length) return alerts;
    const activeKeys = apiKeys.filter(k => !k.revoked);
    const userKeysSet = new Set(activeKeys.map(k => k.key));
    return alerts.filter(a => 
      (a.api_key && userKeysSet.has(a.api_key)) || 
      a.api_key === "0" || 
      a.api_key === null || 
      a.api_key === undefined
    );
  }, [alerts, apiKeys]);
  const fetchApiKeys = async () => {
    try {
      const res = await apiClient.get("/api/apikeys");
      setApiKeys(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) return;
      console.error(err);
    }
  };
  const [page, setPage] = useState(1);
  const [perPage] = useState(100);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [serverSummary, setServerSummary] = useState<any>(null);
  const [filters, setFilters] = useState({
    minSeverity: 0,
    alertsOnly: false,
    protocols: new Set<string>(),
    port: undefined as number | undefined,
    ip: "",
    timeRange: { start: null as string | null, end: null as string | null },
    agent: "",
    matchedPcapsOnly: false,
  });
  const fetchAlertsPage = async (pageNumber = 1, timeRange?: string) => {
    if (!token) return;
    setLoadingAlerts(true);
    try {
      const timeRangeParam = timeRange || "today";
      const params = new URLSearchParams({
        page: pageNumber.toString(),
        per_page: perPage.toString(),
        time_range: timeRangeParam,
      });
      // Capture current filter values
      const currentFilters = filters;
      if (currentFilters.minSeverity > 0) {
        params.append("min_severity", currentFilters.minSeverity.toString());
      }
      if (currentFilters.alertsOnly) {
        params.append("alerts_only", "true");
      }
      if (currentFilters.matchedPcapsOnly) {
        params.append("matched_pcaps_only", "true");
      }
      if (currentFilters.protocols.size > 0) {
        params.append("protocols", Array.from(currentFilters.protocols).join(","));
      }
      if (currentFilters.port !== undefined) {
        params.append("port", currentFilters.port.toString());
      }
      if (currentFilters.ip) {
        params.append("ip", currentFilters.ip);
      }
      if (currentFilters.agent) {
        params.append("agent", currentFilters.agent);
      }
      if (currentFilters.timeRange.start) {
        params.append("start_time", currentFilters.timeRange.start);
      }
      if (currentFilters.timeRange.end) {
        params.append("end_time", currentFilters.timeRange.end);
      }
      const res = await apiClient.get(`/api/alerts_api?${params.toString()}`);
      if (pageNumber === 1) {
        setAlerts(res.data.alerts);
      } else {
        setAlerts((prev) => {
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
      }
      setTotalAlerts(res.data.total);
      setPage(res.data.page);
      setServerSummary(res.data.summary);
    } catch (err: any) {
      if (err.response?.status === 401) return;
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };
  useEffect(() => {
    if (token) {
      setPage(1);
      // Use setTimeout to ensure state updates have completed
      const timer = setTimeout(() => {
        fetchAlertsPage(1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [
    filters.minSeverity,
    filters.alertsOnly,
    filters.protocols,
    filters.port,
    filters.ip,
    filters.agent,
    filters.timeRange.start,
    filters.timeRange.end,
    filters.matchedPcapsOnly,
    token
  ]);
  useEffect(() => {
    if (showApiKeySettings) fetchApiKeys();
  }, [showApiKeySettings]);

  // Auto-refresh graphs every 1 minute (counters update with every alert via filteredAlerts)
  useEffect(() => {
    const interval = setInterval(() => {
      setGraphRefreshTick(tick => tick + 1);
    }, 60 * 1000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedSavedFilterId, setSelectedSavedFilterId] = useState<string>("");
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    const planType = localStorage.getItem("plan_type");
    if (planType) {
      formData.append("plan_type", planType);
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/api/alerts/upload-alerts", formData);
      const newAlerts = res.data.alerts || [];
      const newAlertsWithKey = newAlerts.map((a: any) => ({ ...a, api_key: "0" }));
      setAlerts((prev) => {
        const existingSet = new Set(prev.map(a => `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.signature}`));
        const filteredNew = newAlertsWithKey.filter((a: any) =>
          !existingSet.has(`${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.signature}`)
        );
        return [...filteredNew, ...prev];
      });
      showToast(`${newAlerts.length} alerts uploaded (duplicates skipped)`);
    } catch (err: any) {
      if (err.response?.status === 401) return;
      console.error(err);
      showRToast("Failed to upload/parse file");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };
  const handlePcapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("time_window", "5");
    setLoading(true);
    try {
      const res = await apiClient.post("/api/pcaps/upload", formData);
      showToast(`PCAP uploaded! ${res.data.matches_found} matches found`);
    } catch (err: any) {
      if (err.response?.status === 401) return;
      console.error(err);
      const errorMsg = err.response?.data?.error || "Failed to upload PCAP";
      showRToast(errorMsg);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };
  useEffect(() => {
    apiClient.get("/api/filters/")
      .then(res => setSavedFilters(res.data))
      .catch(err => {
        if (err.response?.status !== 401) console.error("Failed to load filters", err);
      });
  }, []);
  const saveCurrentFilter = async () => {
    try {
      const res = await apiClient.post("/api/filters/", {
        name: newFilterName || `Filter ${Date.now()}`,
        filters_json: {
          ...filters,
          protocols: Array.from(filters.protocols),
        }
      });
      setSavedFilters([...savedFilters, res.data]);
      setNewFilterName("");
      showToast("Filter saved!");
    } catch (err: any) {
      if (err.response?.status === 401) return;
      console.error(err);
      showRToast("Failed to save filter");
    }
  };
  const applySavedFilter = (f: any) => {
    setFilters({
      ...f.filters_json,
      protocols: new Set(f.filters_json.protocols || []),
    });
  };
  useEffect(() => {
    const alertsToProcess = filteredAlertsByApiKey;
    if (!alertsToProcess.length) {
      setAlertsWithGeo([]);
      return;
    }
    const fetchGeo = async () => {
      const ips = Array.from(
        new Set(alertsToProcess.flatMap(a => [a.src_ip, a.dest_ip]).filter(Boolean))
      );
      if (!ips.length) {
        setAlertsWithGeo(alertsToProcess);
        return;
      }
      try {
        const res = await apiClient.post("/api/geo", { ips });
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
  useEffect(() => {
    if (!token) return;
    const fetchAlertOptions = async () => {
      try {
        const res = await apiClient.get("/api/filters/alert-options");
        const opts = res.data.alerts_options || {};
        setAlertSettings({
          high: opts.high ?? true,
          medium: opts.medium ?? false,
          low: opts.low ?? false,
          threshold: opts.threshold ? Number(opts.threshold) : 10000,
        });
      } catch (err: any) {
        if (err.response?.status !== 401) console.error("Failed to fetch alert options:", err);
      }
    };
    fetchAlertOptions();
  }, [token]);
  useEffect(() => {
  if (!token) return;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const socket: Socket = io(`${baseUrl}/api/alerts/stream`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      query: { token },
    });
    socket.on("disconnect", () => {});
    socket.on("bulk_alerts", (payload) => {
      if (!payload || !Array.isArray(payload.alerts)) {
        console.log("bulk_alerts payload missing or not array", payload);
        return;
      }
      const alerts = payload.alerts.map((a: any) => ({
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
      }));
      console.log("Received bulk_alerts", alerts);
      setAlerts((prev: any[]) => {
        const existingKeys = new Set(
          prev.map((a: any) => `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.src_port}-${a.dest_port}-${a.api_key}`)
        );
        const newFiltered = alerts.filter((a: any) => {
          const key = `${a.timestamp}-${a.src_ip}-${a.dest_ip}-${a.src_port}-${a.dest_port ?? ""}-${a.api_key}`;
          if (existingKeys.has(key)) return false;
          existingKeys.add(key);
          return true;
        });
        const updatedAlerts = [...newFiltered, ...prev];
        console.log("Updated alerts state", updatedAlerts);
        return updatedAlerts;
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);
  useEffect(() => {
    if (!token) return;
    const fetchApiKeys = async () => {
      setLoadingKeys(true);
      try {
        const res = await apiClient.get("/api/apikeys");
        setApiKeys(res.data || []);
      } catch (err: any) {
        if (err.response?.status !== 401) console.error("Failed to load API keys:", err);
      } finally {
        setLoadingKeys(false);
      }
    };
    fetchApiKeys();
  }, [token]);
  let filteredAlerts = [...filteredAlertsByApiKey].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === "agent") {
      aVal = a.api_key;
      bVal = b.api_key;
    }
    if (aVal == null) aVal = "";
    if (bVal == null) bVal = "";
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });
  const summary = useMemo(() => {
    // Use serverSummary from backend for live numbers
    if (!serverSummary) {
      return {
        total: 0,
        topTalkers: [],
        topHosts: [],
        topSignatures: [],
      };
    }
    return {
      total: serverSummary.total_alerts ?? 0,
      topTalkers: (serverSummary.top_talkers ?? []).slice(0, 5),
      topHosts: (serverSummary.top_hosts ?? []).slice(0, 5),
      topSignatures: (serverSummary.top_signatures ?? []).slice(0, 5),
    };
  }, [serverSummary]);
  const severityData = useMemo(() => ({
    labels: [' '],
    datasets: [
      {
        label: 'Low',
        data: [serverSummary?.severity?.low || filteredAlerts.filter(a => a.severity === 3).length],
        backgroundColor: '#10B981',
      },
      {
        label: 'Medium',
        data: [serverSummary?.severity?.medium || filteredAlerts.filter(a => a.severity === 2).length],
        backgroundColor: '#FBBF24',
      },
      {
        label: 'High',
        data: [serverSummary?.severity?.high || filteredAlerts.filter(a => a.severity === 1).length],
        backgroundColor: '#f85e4aff',
      }
    ]
  }), [serverSummary, filteredAlerts, graphRefreshTick]);
  const protocolData = useMemo(() => ({
    labels: ['TCP', 'UDP', 'ICMP', 'Other'],
    datasets: [{
      data: [
        serverSummary?.protocols?.TCP || filteredAlerts.filter(a => a.protocol === 'TCP').length,
        serverSummary?.protocols?.UDP || filteredAlerts.filter(a => a.protocol === 'UDP').length,
        serverSummary?.protocols?.ICMP || filteredAlerts.filter(a => a.protocol === 'ICMP').length,
        serverSummary ? 
          Object.entries(serverSummary.protocols || {})
            .filter(([proto]) => !['TCP', 'UDP', 'ICMP'].includes(proto))
            .reduce((sum, [, count]) => sum + (count as number), 0)
          : filteredAlerts.filter(a => !['TCP','UDP','ICMP'].includes(a.protocol)).length
      ],
      backgroundColor: ['#3B82F6','#F59E0B','#EF4444','#9CA3AF']
    }]
  }), [serverSummary, filteredAlerts, graphRefreshTick]);
  const alertsPerHourOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      legend: { position: 'top' as const },
    },
  };
  const [timeRangeView, setTimeRangeView] = useState<"today" | "week" | "month" | "year">("today");
  const generateLabels = (timeRange: string) => {
    const now = new Date();
    let fullLabels: string[] = [];
    if (timeRange === "today") {
      fullLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else if (timeRange === "week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      fullLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d.toLocaleDateString();
      });
    } else if (timeRange === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      fullLabels = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
        return d.toLocaleDateString();
      });
    } else if (timeRange === "year") {
      fullLabels = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), i, 1);
        return d.toLocaleString("default", { month: "short", year: "numeric" });
      });
    }
    return fullLabels;
  };
  const alertsOverTimeData = useMemo(() => {
    if (serverSummary?.activity_over_time) {
      const { threats, activity } = serverSummary.activity_over_time;
      const fullLabels = generateLabels(timeRangeView);
      const formatServerKey = (key: string) => {
        const d = new Date(key);
        if (timeRangeView === "today") {
          return `${d.getHours()}:00`;
        } else if (timeRangeView === "week" || timeRangeView === "month") {
          return d.toLocaleDateString();
        } else if (timeRangeView === "year") {
          return d.toLocaleString("default", { month: "short", year: "numeric" });
        }
        return key;
      };
      const detected = fullLabels.map((label) => {
        const matchingKey = Object.keys(threats).find(k => formatServerKey(k) === label);
        return matchingKey ? threats[matchingKey] : 0;
      });
      const activityData = fullLabels.map((label) => {
        const matchingKey = Object.keys(activity).find(k => formatServerKey(k) === label);
        return matchingKey ? activity[matchingKey] : 0;
      });
      return {
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
            data: activityData,
            borderColor: "#0b97f5",
            backgroundColor: "rgba(11,151,245,0.12)",
            tension: 0.3,
          },
        ],
      };
    }
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
    const filteredByTime = filteredAlerts.filter((a) => {
      const d = new Date(a.timestamp);
      return d >= startTime && d <= now;
    });
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
    const unit =
      timeRangeView === "today"
        ? "hour"
        : timeRangeView === "week"
        ? "day"
        : timeRangeView === "month"
        ? "day"
        : "month";
    const groupedData = groupAlerts(unit, filteredByTime);
    const fullLabels = generateLabels(timeRangeView);
    const detected = fullLabels.map((label) => groupedData.get(label)?.threats || 0);
    const activityData = fullLabels.map((label) => groupedData.get(label)?.activity || 0);
    return {
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
          data: activityData,
          borderColor: "#0b97f5",
          backgroundColor: "rgba(11,151,245,0.12)",
          tension: 0.3,
        },
      ],
    };
  }, [serverSummary, timeRangeView, filteredAlerts, graphRefreshTick]);
  const toggleProtocol = (proto: string) => {
    const newSet = new Set(filters.protocols);
    if (newSet.has(proto)) newSet.delete(proto);
    else newSet.add(proto);
    setFilters({ ...filters, protocols: newSet });
  };
  const handleInspect = async (alert: any) => {
    const srcIP = alert.src_ip;
    const destIP = alert.dest_ip;
    setSelectedAlert(alert.original || alert);
    setThreatIntel(null);
    setLoadingIntel(true);
    setAlertPackets([]);
    apiClient.get(`/api/alerts/${alert.id}/packets`)
      .then((pcapRes) => {
        const packets = pcapRes.data || [];
        // Deduplicate packets based on pcap_filename + packet_number
        const seen = new Set();
        const dedupedPackets = packets.filter((pkt: any) => {
          const key = `${pkt.pcap_filename}-${pkt.packet_number}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setAlertPackets(dedupedPackets);
        
        // Update the alert's pcap_match_count with deduplicated count
        setAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, pcap_match_count: dedupedPackets.length } : a
        ));
      })
      .catch(() => setAlertPackets([]));
    try {
      const [srcRes, destRes] = await Promise.all([
        apiClient.post("/api/threatintel", { ip: srcIP }),
        apiClient.post("/api/threatintel", { ip: destIP })
      ]);
      setThreatIntel({
        src: srcRes.data,
        dest: destRes.data,
      });
    } catch (err: any) {
      if (err.response?.status !== 401) console.error("Threat intel fetch failed:", err);
    } finally {
      setLoadingIntel(false);
    }
  };
  const generateReport = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    let yPos = 10;
    doc.setFontSize(18);
    doc.text(" Sentinel Alerts Management Report", 105, yPos, { align: "center" });
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text("Summary", 10, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.text(`Total Alerts: ${summary.total}`, 10, yPos);
    yPos += 5;
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
    top("Top Attacked Hosts", summary.topHosts);
    top("Top Detected Signatures", summary.topSignatures);
    yPos += 4;
    const addChart = async (canvasId: string, title: string) => {
      const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvasEl) return;
      doc.setFontSize(12);
      doc.text(title, 10, yPos);
      yPos += 6;
      const imgData = canvasEl.toDataURL("image/png");
      const imgProps = (doc as any).getImageProperties(imgData);
      const pdfWidth = 180;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      if (yPos + pdfHeight > 280) {
        doc.addPage();
        yPos = 10;
      }
      doc.addImage(imgData, "PNG", 15, yPos, pdfWidth, pdfHeight);
      yPos += pdfHeight + 10;
    };
    await addChart("severity-chart", "Severity Levels");
    await addChart("protocol-chart", "Activity by Protocol");
    await addChart("alerts-over-time-chart", "Alerts Over Time");
  const dateStr = new Date().toISOString().slice(0,10);
  doc.save(`alerts_management_report_${dateStr}.pdf`);
  };
  // Layout loading
  const [layout, setLayout] = useState<Layout[]>([]);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await apiClient.get("/api/user-layout");
        setLayout(res.data.layout);
      } catch (err) {
        // Fallback to default
        setLayout([
          { i: "upload-controls", x: 0, y: 0, w: 12, h: 2 },
          { i: "chart-severity", x: 0, y: 2, w: 4, h: 6 },
          { i: "chart-protocol", x: 4, y: 2, w: 4, h: 6 },
          { i: "chart-time", x: 8, y: 2, w: 4, h: 6 },
          { i: "summary-metrics", x: 0, y: 8, w: 12, h: 4 },
          { i: "filters", x: 0, y: 12, w: 12, h: 3 },
          { i: "alerts-table", x: 0, y: 15, w: 12, h: 10 },
        ]);
      } finally {
        setLayoutLoaded(true);
      }
    };
    fetchLayout();
  }, []);
  // Check if widget is in layout
  const isWidgetVisible = (id: string) => {
    return layout.some(item => item.i === id);
  };
  if (!layoutLoaded) {
    return <div className="p-8">Loading dashboard...</div>;
  }
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Alerts Dashboard</h1>
        <button
          onClick={() => window.location.href = '/app/dashboard-layout'}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Customize Layout
        </button>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={false}
        isResizable={false}
      >
        {/* Upload Controls */}
        {isWidgetVisible("upload-controls") && (
          <div key="upload-controls" className="relative z-10">
            <div className="p-4 bg-gray-50 rounded-lg shadow">
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
                <label className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md cursor-pointer hover:bg-purple-700 transition">
                  <span>📦 Upload PCAP</span>
                  <input
                    type="file"
                    accept=".pcap,.pcapng,.cap"
                    onChange={handlePcapUpload}
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
                            const expires_days = 30;
                            try {
                              await apiClient.post("/api/apikeys", { name: newApiKeyName, type: newApiKeyType, expires_days });
                              showToast(`API key created!`);
                              setNewApiKeyName("");
                              fetchApiKeys();
                            } catch (err: any) {
                              if (err.response?.status === 401) return;
                              console.error(err);
                              showRToast("Failed to create API key");
                            }
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 w-full"
                        >
                          Create API Key
                        </button>
                      </div>
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
                                              await apiClient.put(`/api/apikeys/${key.id}`, { type: key.type });
                                              setApiKeys(apiKeys.map(k =>
                                                k.id === key.id ? { ...k, dirty: false } : k
                                              ));
                                              showToast("API key type updated");
                                            } catch (err: any) {
                                              if (err.response?.status === 401) return;
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
                                            await apiClient.delete(`/api/apikeys/${key.id}`);
                                            setApiKeys(apiKeys.filter((k) => k.id !== key.id));
                                          } catch (err: any) {
                                            if (err.response?.status === 401) return;
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
                              await apiClient.put("/api/filters/alert-options", {
                                alerts_options: alertSettings,
                                report_frequency: reportFrequency,
                              });
                              showToast("Alert options saved!");
                              setShowAlertSettings(false);
                            } catch (err: any) {
                              if (err.response?.status === 401) return;
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
          </div>
        )}

        {/* Severity Chart */}
        {isWidgetVisible("chart-severity") && (
          <div key="chart-severity">
            <div className="p-4 bg-white rounded-lg shadow h-full">
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-lg font-semibold mb-2">Severity Levels</span>
                <Bar
                  id="severity-chart"
                  data={severityData}
                  options={{
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: {
                      legend: {},
                      datalabels: {
                        display: true,
                        color: '#fff',
                        font: {
                          weight: 'bold' as const,
                          size: 14
                        },
                        formatter: (value: number) => value > 0 ? value : ''
                      }
                    },
                  }}
                  height={200}
                />
              </div>
            </div>
          </div>
        )}

        {/* Protocol Chart */}
        {isWidgetVisible("chart-protocol") && (
          <div key="chart-protocol">
            <div className="p-4 bg-white rounded-lg shadow h-full">
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-lg font-semibold mb-2">Activity by Protocol</span>
                <Doughnut
                  id="protocol-chart"
                  key={"protocol-" + filteredAlerts.length}
                  data={protocolData}
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      datalabels: {
                        display: true,
                        color: '#fff',
                        font: {
                          weight: 'bold' as const,
                          size: 14
                        },
                        formatter: (value: number) => value > 0 ? value : ''
                      }
                    }
                  }}
                  height={200}
                />
              </div>
            </div>
          </div>
        )}

        {/* Time Chart */}
        {isWidgetVisible("chart-time") && (
          <div key="chart-time">
            <div className="p-4 bg-white rounded-lg shadow h-full">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-lg font-semibold">Activity over time</span>
                  <div className="flex gap-2">
                    {["today", "week", "month", "year"].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setTimeRangeView(r as any);
                          fetchAlertsPage(1, r);
                        }}
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
          </div>
        )}

        {/* Summary Metrics + Map */}
        {isWidgetVisible("summary-metrics") && (
          <div key="summary-metrics">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
                <div className="bg-blue-600 text-white rounded-lg p-4 flex flex-col items-center justify-center shadow">
                  <span className="text-4xl font-bold">{summary.total}</span>
                  <span className="mt-2 font-medium">Total Alerts</span>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <h3 className="font-semibold mb-2">Top Talkers</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {summary.topTalkers.map(([ip, count]: [string, number]) => {
                        // Truncate IPv6 to first 6 segments, IPv4 to 20 chars
                        let displayIp = ip;
                        if (ip.includes(':')) {
                          // IPv6: show first 6 segments
                          const segments = ip.split(':');
                          if (segments.length > 6) {
                            displayIp = segments.slice(0, 6).join(':') + ':...';
                          }
                        } else if (ip.length > 20) {
                          displayIp = ip.substring(0, 20) + '...';
                        }
                        return (
                          <tr key={ip}>
                            <td title={ip}>{displayIp}</td>
                            <td className="text-right font-semibold">{count}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <h3 className="font-semibold mb-2">Top Hosts (with signatures)</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {summary.topHosts.map(([ip, count]: [string, number]) => {
                        // Truncate IPv6 to first 6 segments, IPv4 to 20 chars
                        let displayIp = ip;
                        if (ip.includes(':')) {
                          // IPv6: show first 6 segments
                          const segments = ip.split(':');
                          if (segments.length > 6) {
                            displayIp = segments.slice(0, 6).join(':') + ':...';
                          }
                        } else if (ip.length > 20) {
                          displayIp = ip.substring(0, 20) + '...';
                        }
                        return (
                          <tr key={ip}>
                            <td title={ip}>{displayIp}</td>
                            <td className="text-right font-semibold">{count}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="bg-white rounded-lg p-4 shadow">
                  <h3 className="font-semibold mb-2">Top Signatures</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {summary.topSignatures.map(([sig, count]: [string, number]) => (
                        <tr key={sig}>
                          <td title={sig}>{sig.length > 30 ? sig.substring(0, 30) + '...' : sig}</td>
                          <td className="text-right font-semibold">{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            </div>
          </div>
        )}

        {/* Filters */}
        {isWidgetVisible("filters") && (
          <div key="filters">
            <div className="p-4 bg-white rounded-lg shadow">
              <div className="mb-4 flex gap-4 flex-wrap">
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
                <label className="ml-4">
                  <input
                    type="checkbox"
                    checked={filters.matchedPcapsOnly || false}
                    onChange={() => setFilters({ ...filters, matchedPcapsOnly: !filters.matchedPcapsOnly })}
                    className="mr-1"
                  />
                  Has Matched PCAPs
                </label>
                <button
                  onClick={() => {
                    setFilters({agent: "", minSeverity: 0, alertsOnly: false, protocols: new Set(), port: undefined, ip: "", timeRange: { start: null, end: null }, matchedPcapsOnly: false });
                    setSelectedSavedFilterId("");
                  }}
                  className="ml-4 px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Show All
                </button>
              </div>
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
                          await apiClient.delete(`/api/filters/${selectedSavedFilterId}`);
                          setSavedFilters(prev => prev.filter(f => f.id !== Number(selectedSavedFilterId)));
                          setSelectedSavedFilterId("");
                          showToast("Filter deleted");
                        } catch (err: any) {
                          if (err.response?.status === 401) return;
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
            </div>
          </div>
        )}

        {/* Alerts Table */}
        {isWidgetVisible("alerts-table") && (
          <div key="alerts-table">
            <div className="p-4 bg-white rounded-lg shadow">
              {(loadingAlerts || loading) && (
                <div className="w-full flex items-center justify-center mb-4">
                  <svg className="animate-spin h-6 w-6 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-blue-600 font-bold text-lg">Loading...</span>
                </div>
              )}
              {loading && <p className="text-blue-500 font-semibold">Processing file...</p>}
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
                            <td className="p-3 flex items-center gap-2">
                              {a.signature || "-"}
                              {a.pcap_match_count > 0 && (
                                <span 
                                  className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs font-bold" 
                                  title={`${a.pcap_match_count} PCAP packet${a.pcap_match_count > 1 ? 's' : ''} matched`}
                                >
                                  📦
                                </span>
                              )}
                            </td>
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
                </div>
              )}
              {filteredAlerts.length === 0 && alerts.length > 0 && (
                <div className="text-gray-600 mt-4 bg-gray-100 p-4 rounded-lg">
                  <p className="font-semibold">No alerts match your current filters.</p>
                  <p className="text-sm">Try adjusting or clearing the filters above, or load more alerts.</p>
                </div>
              )}
              <div className="mt-4 flex items-center space-x-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  onClick={() => fetchAlertsPage(page + 1)}
                >
                  Load More
                </button>
                <span className="text-gray-700">
                  Showing {alerts.length} unique alerts
                </span>
              </div>
              {!loading && alerts.length === 0 && (
                <div className="text-gray-600 mt-4 bg-gray-100 p-6 rounded-lg">
                  <p className="font-semibold mb-2">No alerts found</p>
                  {(filters.minSeverity > 0 || filters.alertsOnly || filters.protocols.size > 0 || filters.port || filters.ip || filters.agent || filters.timeRange.start || filters.timeRange.end) ? (
                    <p>No alerts match your current filters. Try adjusting or clearing the filters above.</p>
                  ) : (
                    <>
                      <p>The dashboard isn't receiving data. Check if:</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>Suricata or Snort is running and generating alerts</li>
                        <li>The agent is connected</li>
                        <li>You have uploaded any alert files</li>
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </ResponsiveGridLayout>

      {/* Alert Inspect Modal */}
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
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">
                📦 Matched PCAP Packets {alertPackets.length > 0 ? `(${alertPackets.length})` : ''}
              </h3>
              <div className="overflow-x-auto">
                {alertPackets.length > 0 ? (
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2">PCAP File</th>
                        <th className="p-2">Packet #</th>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">Src → Dst</th>
                        <th className="p-2">Protocol</th>
                        <th className="p-2">Length</th>
                        <th className="p-2">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertPackets.map((pkt, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2 text-sm">{pkt.pcap_filename}</td>
                          <td className="p-2 text-sm text-center">{pkt.packet_number}</td>
                          <td className="p-2 text-sm">{new Date(pkt.timestamp).toLocaleString()}</td>
                          <td className="p-2 text-sm">
                            {pkt.src_ip}:{pkt.src_port || "N/A"} → {pkt.dst_ip}:{pkt.dst_port || "N/A"}
                          </td>
                          <td className="p-2 text-sm text-center">{pkt.protocol}</td>
                          <td className="p-2 text-sm text-center">{pkt.packet_length} B</td>
                          <td className="p-2 text-sm text-center">
                            <span className={`px-2 py-1 rounded ${
                              pkt.match_confidence > 0.9 ? "bg-green-200" : 
                              pkt.match_confidence > 0.7 ? "bg-yellow-200" : "bg-gray-200"
                            }`}>
                              {(pkt.match_confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-gray-500 p-4">No matched PCAP packets.</div>
                )}
              </div>
            </div>
            <div className="my-6" />
            <div className="overflow-x-auto">
              {loadingIntel ? (
                <div className="text-gray-500 p-4">Loading threat intelligence...</div>
              ) : (
                <>
                  {(selectedAlert.src_ip?.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      Note: Private IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x) have limited threat intelligence data.
                    </div>
                  )}
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
                      const isAbuseIPDB = ["Confidence", "Total Reports", "Country", "Domain"].includes(field);
                      
                      const getAbuseValue = (ipData: any) => {
                        if (!ipData?.abuse?.data) return "-";
                        switch (field) {
                          case "Confidence":
                            return ipData.abuse.data.abuseConfidenceScore ?? "-";
                          case "Total Reports":
                            return ipData.abuse.data.totalReports ?? "-";
                          case "Country":
                            return ipData.abuse.data.countryCode ?? "-";
                          case "Domain":
                            return ipData.abuse.data.domain ?? "-";
                          default:
                            return "-";
                        }
                      };
                      const getVTValue = (ipData: any) => {
                        if (!ipData?.vt?.data?.attributes) return "-";
                        switch (field) {
                          case "ASN Owner":
                            return ipData.vt.data.attributes.as_owner ?? "-";
                          case "ASN":
                            return ipData.vt.data.attributes.asn ?? "-";
                          case "Reputation":
                            return ipData.vt.data.attributes.reputation ?? "-";
                          default:
                            return "-";
                        }
                      };
                      
                      const getReputationColor = (value: any) => {
                        if (value === "-" || value === null || value === undefined) return "";
                        const rep = typeof value === 'number' ? value : parseInt(value);
                        if (isNaN(rep)) return "";
                        if (rep >= 0) return "bg-green-100 text-green-800";
                        if (rep >= -10) return "bg-yellow-100 text-yellow-800";
                        if (rep >= -50) return "bg-orange-100 text-orange-800";
                        return "bg-red-100 text-red-800";
                      };
                      
                      const srcValue = isAbuseIPDB ? getAbuseValue(threatIntel?.src) : getVTValue(threatIntel?.src);
                      const destValue = isAbuseIPDB ? getAbuseValue(threatIntel?.dest) : getVTValue(threatIntel?.dest);
                      
                      return (
                        <tr key={field} className="border-b border-gray-200">
                          <td className="p-2 font-medium bg-gray-50">
                            {isAbuseIPDB ? "AbuseIPDB" : "VirusTotal"}
                          </td>
                          <td className="p-2">{field}</td>
                          <td className={`p-2 ${field === "Reputation" ? getReputationColor(srcValue) : ""}`}>
                            {srcValue}
                          </td>
                          <td className={`p-2 ${field === "Reputation" ? getReputationColor(destValue) : ""}`}>
                            {destValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </>
              )}
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