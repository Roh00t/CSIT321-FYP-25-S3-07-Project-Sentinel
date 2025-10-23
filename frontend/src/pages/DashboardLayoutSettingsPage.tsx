// src/pages/DashboardLayoutSettingsPage.tsx
import { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import apiClient from "../components/apiClient";
import { useNavigate } from "react-router-dom";

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_LAYOUT: Layout[] = [
  { i: "upload-controls", x: 0, y: 0, w: 12, h: 1 },
  { i: "charts", x: 0, y: 2, w: 12, h: 4 },
  { i: "summary-metrics", x: 0, y: 8, w: 12, h: 3 },
  { i: "filters", x: 0, y: 12, w: 12, h: 2 },
  { i: "alerts-table", x: 0, y: 15, w: 12, h: 10 },
];

const WIDGET_TITLES: Record<string, string> = {
  "upload-controls": "Upload & Settings",
  "charts": "Charts",
  "summary-metrics": "Summary Metrics",
  "filters": "Filters",
  "alerts-table": "Alerts Table",
};

const ALL_WIDGET_IDS = DEFAULT_LAYOUT.map(item => item.i);

// Helper: get default item by ID
const getDefaultItem = (id: string): Layout => {
  const found = DEFAULT_LAYOUT.find(item => item.i === id);
  return found ? { ...found } : { i: id, x: 0, y: 0, w: 12, h: 1 };
};

interface LayoutItem {
  i: string;
  x: number | string;
  y: number | string;
  w: number | string;
  h: number | string;
}

export default function DashboardLayoutSettingsPage() {
  const [fullLayout, setFullLayout] = useState<Layout[]>(DEFAULT_LAYOUT); // ✅ Always full
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        console.log("Fetching user layout...");
        const res = await apiClient.get("/api/user-layout");
        let rawLayout = res.data.layout || [];

        // Normalize saved layout
        const normalizedSaved = (rawLayout as LayoutItem[]).map(item => ({
          i: String(item.i),
          x: Number(item.x),
          y: Number(item.y),
          w: Number(item.w),
          h: Number(item.h),
        })).filter(item => 
          !isNaN(item.x) && !isNaN(item.y) && !isNaN(item.w) && !isNaN(item.h) && item.w > 0 && item.h > 0
        );

        // Build full layout: use saved if present, otherwise default
        const savedMap = new Map(normalizedSaved.map(item => [item.i, item]));
        const newFullLayout = DEFAULT_LAYOUT.map(defaultItem => {
          return savedMap.has(defaultItem.i) 
            ? savedMap.get(defaultItem.i)! 
            : { ...defaultItem };
        });

        // Hidden = default widgets NOT in saved layout
        const savedIds = new Set(normalizedSaved.map(item => item.i));
        const newHidden = new Set<string>();
        ALL_WIDGET_IDS.forEach(id => {
          if (!savedIds.has(id)) {
            newHidden.add(id);
          }
        });

        setFullLayout(newFullLayout);
        setHiddenWidgets(newHidden);
      } catch (err: any) {
        console.error("❌ Failed to load layout:", err);
        alert("Failed to load layout settings. Using default layout.");
        setFullLayout(DEFAULT_LAYOUT);
        setHiddenWidgets(new Set());
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, []);

  const saveLayout = async () => {
    try {
      // Save only non-hidden widgets
      const visibleLayout = fullLayout.filter(item => !hiddenWidgets.has(item.i));
      await apiClient.put("/api/user-layout", { layout: visibleLayout });
      alert("Layout saved successfully!");
      navigate("/app/alerts");
    } catch (err) {
      console.error("Failed to save layout", err);
      alert("Failed to save layout");
    }
  };

  const resetLayout = () => {
    if (confirm("Reset to default layout?")) {
      setFullLayout(DEFAULT_LAYOUT);
      setHiddenWidgets(new Set());
    }
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setHiddenWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  // ✅ Visible layout for rendering
  const visibleLayout = fullLayout.filter(item => !hiddenWidgets.has(item.i));

  if (loading) {
    return <div className="p-8">Loading layout settings...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Layout Settings</h1>
        <div className="flex gap-3">
          <button
            onClick={resetLayout}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset to Default
          </button>
          <button
            onClick={saveLayout}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save & Go to Dashboard
          </button>
        </div>
      </div>

      {/* Widget Visibility Toggles */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-sm font-medium text-gray-700 mb-2">Show/Hide Widgets</h2>
        <div className="flex flex-wrap gap-4">
          {ALL_WIDGET_IDS.map(id => (
            <label key={id} className="flex items-center">
              <input
                type="checkbox"
                checked={!hiddenWidgets.has(id)}
                onChange={() => toggleWidgetVisibility(id)}
                className="mr-2 h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm">{WIDGET_TITLES[id] || id}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        Drag and resize visible widgets below to customize your dashboard.
      </div>

      {visibleLayout.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No widgets visible. Enable at least one widget above.
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: visibleLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          onLayoutChange={(newLayout) => {
            // Merge changes back into fullLayout
            const updatedFull = [...fullLayout];
            newLayout.forEach(updatedItem => {
              const index = updatedFull.findIndex(item => item.i === updatedItem.i);
              if (index !== -1) {
                updatedFull[index] = updatedItem;
              }
            });
            setFullLayout(updatedFull);
          }}
          isDraggable={true}
          isResizable={true}
        >
          {visibleLayout.map((item) => (
            <div key={item.i} className="bg-white border rounded shadow">
              <div className="bg-gray-100 px-3 py-2 font-medium border-b">
                {WIDGET_TITLES[item.i] || item.i}
              </div>
              <div className="p-4 min-h-[100px] flex items-center justify-center text-gray-500">
                Preview area
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => navigate("/app/alerts")}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={saveLayout}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Layout
        </button>
      </div>
    </div>
  );
}