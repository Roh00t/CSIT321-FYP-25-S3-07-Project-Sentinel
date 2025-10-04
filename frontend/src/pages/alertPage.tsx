import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import React from "react";



export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertsWithGeo, setAlertsWithGeo] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [newFilterName, setNewFilterName] = useState("");
  const token = localStorage.getItem("token");


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


  const toggleProtocol = (proto: string) => {
    const newSet = new Set(filters.protocols);
    if (newSet.has(proto)) newSet.delete(proto);
    else newSet.add(proto);
    setFilters({ ...filters, protocols: newSet });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Suricata / Snort Alerts</h1>

      {/* Upload Box */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          Upload eve.json / alert file:
        </label>
        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md cursor-pointer hover:bg-blue-700 transition">
          Choose File
          <input type="file" onChange={handleUpload} className="hidden" />
        </label>

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
            <div className="bg-white rounded-lg p-2 shadow flex items-center justify-center">
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
                  onDoubleClick={() => setSelectedAlert(a.original || a)}
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
          No alerts uploaded yet. Upload a Suricata <code>eve.json</code> file to see results.
        </p>
      )}

      {/* Inspect Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-3/4 max-w-2xl p-6 relative">
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
