// src/pages/PricingPlansPage.tsx
import { useState } from 'react';

export default function PricingPlansPage() {
  const [selectedFeature, setSelectedFeature] = useState<{ title: string; desc: string; image: string } | null>(null);

  // Pricing plans data
  const plans = [
    {
      name: "Basic",
      price: "$0",
      period: "forever",
      description: "Perfect for individuals and home networks.",
      features: [
        "Up to 1 IDS integration",
        "Real-time alert feed",
        "Basic dashboard widgets",
        "Email support",
        "Community access",
      ],
      cta: "Get Started Free",
      highlighted: false,
    },
    {
      name: "Plus",
      price: "$29",
      period: "/month",
      description: "Ideal for small teams and SMEs.",
      features: [
        "Up to 3 IDS integrations",
        "Advanced visualizations & maps",
        "Custom dashboards",
        "Role-based access (up to 5 users)",
        "Weekly reports & export",
        "Priority email support",
      ],
      cta: "Start 7-Day Free Trial",
      highlighted: true, // Highlighted plan
    },
    {
      name: "Pro",
      price: "$99",
      period: "/month",
      description: "For enterprises and security teams.",
      features: [
        "Unlimited IDS integrations",
        "Full threat intelligence (CVE + MITRE ATT&CK)",
        "Custom widgets & analytics",
        "Role-based access (unlimited users)",
        "Audit logs & compliance reports",
        "SLA-backed support (24/7)",
        "SIEM & API integration",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header with Brand */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-600 mb-4">
            SENTINEL
          </h1>
          <p className="text-2xl md:text-3xl text-gray-800 font-semibold mb-4">
            Pricing Plans
          </p>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Choose the plan that fits your needs — from home labs to enterprise SOC teams. 
            All plans include real-time threat visualization, CVE intelligence, and intuitive dashboards.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Pricing Cards */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Flexible Plans for Every Team</h2>
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
                  'IDS Integrations',
                  'Real-Time Alerts',
                  'Dashboard Customization',
                  'User Management',
                  'Export & Compliance Reports',
                  'Support',
                  'SIEM/API Integration',
                ].map((feature, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{feature}</td>
                    {plans.map((plan) => {
                      let included = false;
                      if (feature === 'IDS Integrations') included = plan.name !== 'Basic';
                      else if (feature === 'Dashboard Customization') included = plan.name !== 'Basic';
                      else if (feature === 'User Management') included = plan.name !== 'Basic';
                      else if (feature === 'Export & Compliance Reports') included = ['Plus', 'Pro'].includes(plan.name);
                      else if (feature === 'SIEM/API Integration') included = plan.name === 'Pro';
                      else included = true; // Most features are in all plans

                      return (
                        <td key={plan.name} className="text-center py-3 px-4">
                          {included ? (
                            <svg
                              className="w-5 h-5 text-green-500 inline"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
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

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-blue-600 text-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Ready to Secure Your Network?</h2>
            <p className="mb-6 text-blue-100">
              Join organizations worldwide using SENTINEL to visualize threats and respond faster.
            </p>
            <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-md shadow hover:bg-gray-100 transition">
              Start Free Trial
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm pb-8">
        © {new Date().getFullYear()} SENTINEL | Final Year Project
      </footer>

      {/* Optional: Reuse feature modal if needed */}
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