import { useState, useMemo } from "react";
import axios from "axios";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

  const [filters, setFilters] = useState({
    minSeverity: 0,
    alertsOnly: false,
    protocols: new Set<string>()
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

  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter((a) => {
    if (filters.alertsOnly && !a.signature) return false;
    if (filters.minSeverity && (!a.severity || a.severity > filters.minSeverity))
      return false;
    if (filters.protocols.size && !filters.protocols.has(a.protocol)) return false;
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
    if (a.src_ip) topTalkers[a.src_ip] = (topTalkers[a.src_ip] || 0) + 1;
    if (a.dest_ip) topHosts[a.dest_ip] = (topHosts[a.dest_ip] || 0) + 1;
    if (a.signature) topSignatures[a.signature] = (topSignatures[a.signature] || 0) + 1;
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
      </div>
      {/* Summary Counters */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        </div>
      )}


      {/* Filters */}
      {alerts.length > 0 && (
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

          <button
            onClick={() =>
              setFilters({ minSeverity: 0, alertsOnly: false, protocols: new Set() })
            }
            className="ml-4 px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            Show All
          </button>
        </div>
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
                <th className="p-3 text-left font-medium text-gray-700">Destination IP</th>
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
                  <td className="p-3">{a.dest_ip || "-"}</td>
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
