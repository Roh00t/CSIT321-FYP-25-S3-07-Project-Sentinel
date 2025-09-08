// src/pages/PricingPlansPage.tsx

import { useState } from 'react';

export default function PricingPlansPage() {
  const [selectedFeature, setSelectedFeature] = useState<{ title: string; desc: string; image: string } | null>(null);

  // Pricing plans data
  const plans = [
    {
      name: "Basic",
      price: "$0",
      period: "/forever",
      description: "Perfect for individuals and home networks.",
      features: [
        "Secure login & session management",
        "View, update, and delete your account",
        "Upload, view, and delete log files manually",
        "View alert table and inspect individual alerts",
        "Filter alerts by IP, timestamp, and severity",
        "Summary counters for daily & overall alerts",
        "Community support"
      ],
      cta: "Get Started Free",
      highlighted: false,
    },
    {
      name: "Plus",
      price: "$19",
      period: "/month",
      description: "For individuals who want real-time threat monitoring.",
      features: [
        "All Basic features",
        "Live IDS integration (Snort, Suricata, Zeek)",
        "Real-time alert feed & dashboard",
        "Threat intelligence: CVE, VirusTotal, OTX, AbuseIPDB",
        "GeoIP mapping for source/destination traffic",
        "Create, save, and reuse filters (recent & favorites)",
        "Customize dashboard layout & widgets",
        "Create and remove graphs to visualize trends",
        "Set anomaly detection thresholds with email alerts",
        "Generate automated PDF reports (weekly or on-demand)",
        "Download or email reports for compliance",
        "Priority email support",
        "Easy downgrade to Basic anytime"
      ],
      cta: "Start 7-Day Free Trial",
      highlighted: true,
    },
    {
      name: "Team Bundle (5 Users)",
      price: "$85",
      period: "/month",
      description: "Cost-effective bundle for small teams (5x Plus licenses).",
      features: [
        "5 licenses of the full Plus plan",
        "Each user gets full premium features",
        "No feature restrictions — all users are 'Plus'",
        "Central billing, individual logins",
        "Ideal for small teams, labs, or departments",
        "Flexible assignment — assign now or later",
        "Same downgrade flexibility for each license",
        "Save over 10% vs. buying 5 individual Plus plans"
      ],
      cta: "Upgrade Now",
      highlighted: false,
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-600 mb-4">
            SENTINEL
          </h1>
          <p className="text-2xl md:text-3xl text-gray-800 font-semibold mb-4">
            Pricing Plans
          </p>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Choose the plan that fits your needs — from personal learning to team collaboration. 
            All premium plans include real-time monitoring, threat intelligence, and full dashboard customization.
          </p>
        </div>
      </header>

      {/* Pricing Cards */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Simple, Fair Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white p-8 rounded-lg shadow-md border ${
                  plan.highlighted
                    ? 'ring-4 ring-blue-200 transform scale-105 md:scale-110'
                    : 'border-gray-100 hover:shadow-lg'
                } transition-all duration-300`}
              >
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full font-semibold py-3 rounded-md transition ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="text-center py-3 px-4 font-semibold text-gray-800">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {[
                  'Account Management',
                  'Manual Log Upload & Deletion',
                  'Alert Table & Inspection',
                  'Filter by IP, Time, Severity',
                  'Summary Counters',
                  'Live IDS Integration',
                  'Threat Intelligence',
                  'GeoIP Visualization',
                  'Save & Reuse Filters',
                  'Custom Dashboard Layout',
                  'Create & Remove Graphs',
                  'Anomaly Detection & Alerts',
                  'Automated PDF Reports',
                  'Download/Email Reports',
                  'Downgrade to Basic',
                  'Support'
                ].map((feature, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{feature}</td>
                    {plans.map((plan) => {
                      let included = false;
                      let note = '';

                      const premiumFeatures = [
                        'Live IDS Integration',
                        'Threat Intelligence',
                        'GeoIP Visualization',
                        'Save & Reuse Filters',
                        'Custom Dashboard Layout',
                        'Create & Remove Graphs',
                        'Anomaly Detection & Alerts',
                        'Automated PDF Reports',
                        'Download/Email Reports',
                        'Downgrade to Basic'
                      ];

                      if (plan.name === "Basic") {
                        included = !premiumFeatures.includes(feature);
                      } else {
                        included = true;
                      }

                      if (feature === 'Support') {
                        note = plan.name === 'Basic' 
                          ? 'Community' 
                          : 'Priority Email';
                      }

                      return (
                        <td key={plan.name} className="text-center py-3 px-4">
                          {included ? (
                            <div>
                              <svg
                                className="w-5 h-5 text-green-500 inline mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {note && <span className="text-xs text-gray-500">{note}</span>}
                            </div>
                          ) : (
                            <svg
                              className="w-5 h-5 text-red-500 inline"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* For Larger Teams */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-lg p-8 mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">For Teams Larger Than 5?</h2>
          <p className="text-xl mb-6 text-blue-100">
            Need 10, 25, or 50+ licenses? Get volume discounts and dedicated support.
          </p>
          <button className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-md shadow hover:bg-gray-100 transition inline-block">
            Contact Sales for Custom Quote
          </button>
        </section>

        {/* CTA Section */}
        <section className="text-center mb-16">
          <div className="bg-gray-100 text-gray-800 p-8 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Ready to Level Up Your Security?</h2>
            <p className="mb-6 text-gray-600">
              Whether you're a solo analyst or part of a growing team, SENTINEL gives you the tools to see threats clearly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700 transition">
                Start Free Trial
              </button>
              <button className="border-2 border-blue-600 text-blue-600 font-semibold px-6 py-3 rounded-md hover:bg-blue-50 transition">
                Explore Team Bundle
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm pb-8">
        © {new Date().getFullYear()} SENTINEL | Final Year Project
      </footer>

      {/* Optional Modal */}
      {selectedFeature && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedFeature(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full"
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
                  (e.target as HTMLImageElement).src = "/images/placeholder.png";
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