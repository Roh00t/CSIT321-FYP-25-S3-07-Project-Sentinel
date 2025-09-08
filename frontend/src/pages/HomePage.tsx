// src/pages/HomePage.tsx
import { useState } from 'react';
import sentinelLogo from '../assets/sentinel-icon.svg'; // Used as fallback image for popups

// Define the interface for a feature
interface Feature {
  title: string;
  desc: string;
  image: string;
}

export default function HomePage() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const features: Feature[] = [
    {
      title: "Multi-IDS Integration",
      desc: "Seamlessly ingest logs from Snort, Suricata, Zeek, and more for unified threat visibility.",
      image: "/images/realtime-vis.png",
    },
    {
      title: "Real-Time Visualization",
      desc: "Live alerts, dynamic graphs, and interactive dashboards for instant situational awareness.",
      image: "/images/realtime-vis.png",
    },
    {
      title: "Smart Threat Intelligence",
      desc: "Enrich alerts with CVE details, VirusTotal, AbuseIPDB, and OTX for deeper context and faster response.",
      image: "/images/cve-intel.png",
    },
    {
      title: "Customizable Dashboards",
      desc: "Tailor your view with resizable widgets, saved filters, and personalized layouts to match your workflow.",
      image: "/images/custom-dash.png",
    },
    {
      title: "Flexible Subscription Tiers",
      desc: "Start with Basic for personal use, upgrade to Plus for real-time monitoring, threat feeds, and advanced analytics.",
      image: "/images/tiers.png", // Consider creating this image
    },
    {
      title: "Automated Reporting & Compliance",
      desc: "Generate and schedule PDF reports or email summaries for audit trails, compliance, and incident documentation.",
      image: "/images/reports.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header with Centered Brand */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-600 mb-4">
            SENTINEL
          </h1>
          <p className="text-2xl md:text-3xl text-gray-800 font-semibold mb-4">
            IDS Threat Visualization & Response Dashboard
          </p>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            A powerful, user-friendly platform that transforms complex intrusion detection logs into actionable insights — 
            empowering organizations and individuals to detect, analyze, and respond to cyber threats with clarity and confidence.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Overview */}
        <section className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Secure Your Network, Simplify Your Response</h2>
          <p className="text-gray-700 text-lg leading-relaxed max-w-4xl mx-auto">
            In today’s evolving threat landscape, detecting attacks is only the first step. Our web-based dashboard integrates with 
            open-source IDS tools like <span className="font-semibold">Snort, Suricata, and Zeek</span>, aggregating and visualizing 
            raw log data into intuitive, real-time insights — making cybersecurity accessible even for small teams, schools, and home networks.
          </p>
        </section>

        {/* Key Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer transform hover:scale-105 duration-200"
                onClick={() => setSelectedFeature(feature)}
              >
                <h3 className="text-xl font-semibold text-blue-600 mb-2">{feature.title}</h3>
                <p className="text-gray-700">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tiered Plans Preview */}
        <section className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Built for Everyone</h2>
          <p className="text-gray-700 text-lg mb-8">
            From home labs to enterprises, our tiered structure scales with your needs:
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-center">
            {["Basic", "Plus", "Team Bundle"].map((tier) => (
              <div
                key={tier}
                className="bg-white px-6 py-4 rounded-lg shadow border border-blue-100 inline-block w-48"
              >
                <h3 className="text-lg font-semibold text-gray-800">{tier}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {tier === "Basic" && "Perfect for individuals and home networks."}
                  {tier === "Plus" && "For individuals who want real-time threat monitoring."}
                  {tier === "Team Bundle" && "Cost-effective bundle for small teams (5x Plus licenses)."}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-blue-600 text-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Ready to Take Control of Your Network Security?</h2>
            <p className="mb-6 text-blue-100">
              Log in or get started to monitor threats in real time and turn raw data into defense.
            </p>
            <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-md shadow hover:bg-gray-100 transition">
              Go to Dashboard
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm pb-8">
        © {new Date().getFullYear()} SENTINEL | Final Year Project
      </footer>

      {/* Modal for Feature Preview */}
      {selectedFeature && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedFeature(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">{selectedFeature.title}</h3>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-semibold"
                >
                  &times;
                </button>
              </div>
              <img
                src={selectedFeature.image}
                alt={selectedFeature.title}
                className="w-full h-auto rounded-md mb-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = sentinelLogo;
                }}
              />
              <p className="text-gray-700 text-lg">{selectedFeature.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}