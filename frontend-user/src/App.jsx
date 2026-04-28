import { useState, useRef, useCallback } from "react";
import styles from "./App.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TYPE_META = {
  garbage:   { label: "Garbage detected",   color: "#D85A30", bg: "#FAECE7", icon: "🗑" },
  pollution: { label: "Pollution detected",  color: "#BA7517", bg: "#FAEEDA", icon: "☁" },
  smoke:     { label: "Smoke detected",      color: "#534AB7", bg: "#EEEDFE", icon: "💨" },
  clean:     { label: "Area looks clean",    color: "#3B6D11", bg: "#EAF3DE", icon: "✓"  },
};

function ConfBar({ value, color }) {
  return (
    <div className={styles.confRow}>
      <div className={styles.confLabel}>
        <span>Confidence</span>
        <span className={styles.confPct}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className={styles.confTrack}>
        <div className={styles.confFill} style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function App() {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [reporter, setReporter] = useState("");
  const [locText, setLocText]   = useState("");
  const [locCoords, setLocCoords] = useState({ lat: 30.04, lng: 31.23 });
  const [drag, setDrag]         = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocCoords({ lat, lng });
        setLocText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      },
      () => {
        setLocText("30.04412, 31.23571");
        setLocCoords({ lat: 30.04, lng: 31.23 });
      },
      { timeout: 4000 }
    );
  };

  const send = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("lat", locCoords.lat);
    form.append("lng", locCoords.lng);
    form.append("reporter", reporter || "anonymous");

    try {
      const res = await fetch(`${API}/detect`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Server error");
      }
      setResult(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setReporter("");
    setLocText("");
  };

  const meta = result ? (TYPE_META[result.type] || { label: result.type, color: "#888", bg: "#f5f5f5", icon: "?" }) : null;

  return (
    <div className={styles.app}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <span className={styles.brandName}>City<strong>Report</strong></span>
        </div>
        <div className={styles.activePill}>AI active</div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* LEFT — upload form */}
        <div className={styles.left}>
          <div className={styles.sectionLabel}>Upload image</div>

          <div
            className={`${styles.uploadZone} ${drag ? styles.dragOver : ""}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <img src={preview} alt="preview" className={styles.uploadPreview} />
            ) : (
              <>
                <div className={styles.uploadIconWrap}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="1.8">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <p className={styles.uploadTitle}>Drop photo here</p>
                <p className={styles.uploadSub}>or <span className={styles.uploadLink}>browse files</span> · JPEG, PNG, WEBP</p>
                <p className={styles.uploadSub}>Max 10 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          <div className={styles.divider} />

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Your name (optional)</label>
            <input
              className={styles.fieldInput}
              type="text"
              placeholder="e.g. Ahmed Karim"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Location</label>
            <div className={styles.fieldRow}>
              <input
                className={styles.fieldInput}
                type="text"
                placeholder="Auto-detected via GPS"
                value={locText}
                readOnly
              />
              <button className={`${styles.locBtn} ${locText ? styles.locActive : ""}`} onClick={detectLocation}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                </svg>
                Detect
              </button>
            </div>
          </div>

          <button className={styles.submitBtn} onClick={send} disabled={!file || loading}>
            {loading ? "Analyzing…" : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Analyze & report
              </>
            )}
          </button>

          {error && <div className={styles.errorBox}>⚠ {error}</div>}
        </div>

        {/* RIGHT — result */}
        <div className={styles.right}>
          {!result ? (
            <>
              <div className={styles.sectionLabel}>Result</div>
              <div className={styles.emptyState}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ opacity: 0.3 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>Upload a photo to get an AI detection result</p>
              </div>
              <div className={styles.divider} style={{ margin: "8px 0" }} />
              <div className={styles.sectionLabel} style={{ marginBottom: 10 }}>How it works</div>
              <div className={styles.steps}>
                {[
                  "Take or upload a photo of the issue",
                  "AI identifies: garbage, pollution, or smoke",
                  "Report is sent to the city dashboard instantly"
                ].map((s, i) => (
                  <div key={i} className={styles.step}>
                    <div className={styles.stepNum}>{i + 1}</div>
                    <span className={styles.stepText}>{s}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.sectionLabel}>Preview</div>
              <img src={preview} alt="uploaded" className={styles.resultImg} />

              <div className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultBadge} style={{ background: meta.bg }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                  </div>
                  <div>
                    <div className={styles.resultType}>{meta.label}</div>
                    <div className={styles.resultSub}>High confidence result</div>
                  </div>
                </div>

                <ConfBar value={result.confidence} color={meta.color} />

                <div className={styles.metaGrid}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Location</div>
                    <div className={styles.metaVal} style={{ fontSize: 11 }}>{result.lat.toFixed(5)}, {result.lng.toFixed(5)}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Reporter</div>
                    <div className={styles.metaVal}>{result.reporter}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Report ID</div>
                    <div className={styles.metaVal} style={{ fontSize: 11, fontFamily: "monospace" }}>{result.file_id?.slice(0, 8)}…</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Submitted</div>
                    <div className={styles.metaVal}>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>

                <div className={styles.successRow}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Report submitted to government dashboard</span>
                </div>
              </div>

              <button className={styles.resetBtn} onClick={reset}>Submit another report</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
