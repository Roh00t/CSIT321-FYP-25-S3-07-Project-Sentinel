//frontend\src\pages\alertPage.tsx
import { useState } from "react";
import axios from "axios";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/alerts/upload-alerts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error(err);
      alert("Failed to upload/parse file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Upload Suricata / Snort Alerts</h1>
      <input type="file" onChange={handleUpload} className="mb-4" />
      {loading && <p>Loading...</p>}

      {alerts.length > 0 && (
        <table className="table-auto border-collapse border border-gray-400 w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Timestamp</th>
              <th className="border p-2">Source IP</th>
              <th className="border p-2">Destination IP</th>
              <th className="border p-2">Signature</th>
              <th className="border p-2">Severity</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={i} className="hover:bg-gray-100">
                <td className="border p-2">{a.timestamp || "-"}</td>
                <td className="border p-2">{a.src_ip || "-"}</td>
                <td className="border p-2">{a.dest_ip || "-"}</td>
                <td className="border p-2">{a.signature || "-"}</td>
                <td className="border p-2">{a.severity || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
