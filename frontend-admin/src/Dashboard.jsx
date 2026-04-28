import { useEffect, useState, useCallback, useRef } from "react";
import styles from "./Dashboard.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TYPE_META = {
  garbage:   { icon: "🗑️", color: "#ff6b35", label: "Garbage"   },
  pollution: { icon: "☁️", color: "#ffcc00", label: "Pollution" },
  smoke:     { icon: "💨", color: "#9966ff", label: "Smoke"     },
  clean:     { icon: "✅", color: "#00e5a0", label: "Clean"     },
};

function StatCard({ icon, label, value, color, delta }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: color }}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {delta !== undefined && (
        <div className={styles.statDelta} style={{ color: delta >= 0 ? "#00e5a0" : "#ff4455" }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} today
        </div>
      )}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className={styles.miniBar}>
      <div className={styles.miniBarFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function Dashboard() {
  const [reports, setReports]   = useState([]);
  const [stats, setStats]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);
  const googleMapRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [repRes, statRes] = await Promise.all([
        fetch(`${API}/reports?limit=300`),
        fetch(`${API}/stats`)
      ]);
      const repData  = await repRes.json();
      const statData = await statRes.json();
      setReports(repData);
      setStats(statData);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000); // auto-refresh every 15s
    return () => clearInterval(id);
  }, [fetchData]);

  // Initialize heatmap when Google Maps is ready
  useEffect(() => {
    if (!mapRef.current || !reports.length) return;

    const tryInit = () => {
      if (!window.google?.maps?.visualization) return;

      if (!googleMapRef.current) {
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 30.04, lng: 31.23 },
          zoom: 12,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0d1420" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#5a7090" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e2d44" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#060a10" }] },
          ],
        });
      }

      const filtered = filter === "all" ? reports : reports.filter(r => r.type === filter);
      const points = filtered.map(p => ({
        location: new window.google.maps.LatLng(p.lat, p.lng),
        weight: p.type === "pollution" ? 3 : p.type === "smoke" ? 2 : 1,
      }));

      if (heatLayerRef.current) heatLayerRef.current.setMap(null);
      heatLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: points,
        radius: 35,
        gradient: ["transparent", "#ff6b3520", "#ffcc0040", "#ff444580"],
      });
      heatLayerRef.current.setMap(googleMapRef.current);
    };

    const t = setInterval(() => {
      if (window.google?.maps?.visualization) {
        tryInit();
        clearInterval(t);
      }
    }, 200);

    return () => clearInterval(t);
  }, [reports, filter]);

  const filtered = reports
    .filter(r => filter === "all" || r.type === filter)
    .filter(r =>
      !search ||
      r.type?.includes(search.toLowerCase()) ||
      r.reporter?.toLowerCase().includes(search.toLowerCase()) ||
      r.file_id?.includes(search)
    );

  const maxCount = Math.max(...stats.map(s => s.count), 1);
  const total = reports.length;
  const nonClean = reports.filter(r => r.type !== "clean").length;

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>◈</span>
          <div>
            <div className={styles.sidebarTitle}>SMART CITY</div>
            <div className={styles.sidebarSub}>GOV DASHBOARD</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {["all", "garbage", "pollution", "smoke", "clean"].map(type => (
            <button
              key={type}
              className={`${styles.navBtn} ${filter === type ? styles.navActive : ""}`}
              onClick={() => setFilter(type)}
            >
              <span>{type === "all" ? "📊" : TYPE_META[type]?.icon}</span>
              <span>{type === "all" ? "All Reports" : TYPE_META[type]?.label}</span>
              <span className={styles.navCount}>
                {type === "all" ? total : reports.filter(r => r.type === type).length}
              </span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            Live · auto-refresh 15s
          </div>
          <button className={styles.refreshBtn} onClick={fetchData}>↻ Refresh</button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>
            {filter === "all" ? "Overview" : `${TYPE_META[filter]?.icon} ${TYPE_META[filter]?.label} Reports`}
          </h1>
          <input
            className={styles.search}
            type="text"
            placeholder="Search reports…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Stat cards */}
        <div className={styles.statGrid}>
          <StatCard icon="📋" label="Total Reports"  value={total}    color="#00d4ff" />
          <StatCard icon="⚠️" label="Issues Found"   value={nonClean} color="#ff6b35" />
          <StatCard icon="🗑️" label="Garbage"        value={reports.filter(r=>r.type==="garbage").length}   color="#ff6b35" />
          <StatCard icon="☁️" label="Pollution"      value={reports.filter(r=>r.type==="pollution").length} color="#ffcc00" />
          <StatCard icon="💨" label="Smoke"          value={reports.filter(r=>r.type==="smoke").length}     color="#9966ff" />
        </div>

        {/* Stats breakdown */}
        {stats.length > 0 && (
          <div className={styles.breakdown}>
            {stats.map(s => {
              const m = TYPE_META[s._id] || { icon: "❓", color: "#aaa", label: s._id };
              return (
                <div key={s._id} className={styles.breakdownRow}>
                  <span className={styles.breakdownLabel}>{m.icon} {m.label}</span>
                  <MiniBar value={s.count} max={maxCount} color={m.color} />
                  <span className={styles.breakdownVal} style={{ color: m.color }}>{s.count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Map */}
        <div className={styles.mapCard}>
          <div className={styles.mapTitle}>🗺 Heatmap</div>
          <div ref={mapRef} className={styles.mapContainer}>
            <div className={styles.mapPlaceholder}>
              <p>🗺 Google Maps Heatmap</p>
              <p className={styles.mapHint}>Add your Google Maps API key to index.html to enable</p>
            </div>
          </div>
        </div>

        {/* Reports table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span>Reports ({filtered.length})</span>
          </div>
          {loading ? (
            <div className={styles.loading}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No reports found</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Confidence</th>
                    <th>Reporter</th>
                    <th>Coordinates</th>
                    <th>Timestamp</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const m = TYPE_META[r.type] || { icon: "❓", color: "#aaa", label: r.type };
                    return (
                      <tr
                        key={i}
                        className={`${styles.row} ${selected === i ? styles.rowSelected : ""}`}
                        onClick={() => setSelected(selected === i ? null : i)}
                      >
                        <td>
                          <span className={styles.typeBadge} style={{ borderColor: m.color, color: m.color }}>
                            {m.icon} {m.label}
                          </span>
                        </td>
                        <td>
                          <div className={styles.confCell}>
                            <div className={styles.confMini} style={{ width: `${(r.confidence||0)*100}%`, background: m.color }} />
                            <span>{((r.confidence||0)*100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className={styles.mutedCell}>{r.reporter || "—"}</td>
                        <td className={styles.monoCell}>{r.lat?.toFixed(4)}, {r.lng?.toFixed(4)}</td>
                        <td className={styles.mutedCell}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : "—"}</td>
                        <td className={styles.monoCell}>{r.file_id?.slice(0, 8)}…</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
