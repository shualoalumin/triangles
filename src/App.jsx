import { useState, useCallback, useRef, useEffect } from "react";

const ALL_TRIANGLES = [
  "ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ",
  "ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ",
  "ABE","ABG","ACF","ACG","BCE","BCF",
  "ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ",
  "ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ",
  "XYZ"
];

const SIZE_GROUPS = {
  1:  { label: "1칸", tris: ["ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ"],
        light: { border: "#9FE1CB", accent: "#0F6E56" }, dark: { border: "#0F6E56", accent: "#5DCAA5" }},
  2:  { label: "2칸", tris: ["ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ"],
        light: { border: "#B5D4F4", accent: "#185FA5" }, dark: { border: "#185FA5", accent: "#85B7EB" }},
  3:  { label: "3칸", tris: ["ABE","ABG","ACF","ACG","BCE","BCF"],
        light: { border: "#CECBF6", accent: "#534AB7" }, dark: { border: "#534AB7", accent: "#AFA9EC" }},
  4:  { label: "4칸", tris: ["ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ"],
        light: { border: "#F5C4B3", accent: "#993C1D" }, dark: { border: "#993C1D", accent: "#F0997B" }},
  6:  { label: "6칸", tris: ["ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ"],
        light: { border: "#F4C0D1", accent: "#D4537E" }, dark: { border: "#993556", accent: "#ED93B1" }},
  12: { label: "전체", tris: ["XYZ"],
        light: { border: "#FAC775", accent: "#854F0B" }, dark: { border: "#854F0B", accent: "#EF9F27" }},
};

const DN = {"AEX":"XAE","CEX":"XCE","AFY":"YAF","BFY":"YBF","BGZ":"ZBG","CGZ":"ZCG","ACX":"XAC","ADX":"XAD","CDX":"XCD","ABY":"YAB","ADY":"YAD","BDY":"YBD","BCZ":"ZBC","BDZ":"ZBD","CDZ":"ZCD","ABX":"XAB","BCX":"XBC","DXY":"XYD","DXZ":"XZD","ACY":"YAC","BCY":"YBC","DYZ":"YZD","ABZ":"ZAB","ACZ":"ZAC","BXY":"XYB","CXY":"XYC","AXZ":"XZA","BXZ":"XZB","AYZ":"YZA","CYZ":"YZC"};
function dn(n) { return DN[n] || n; }

const LINES = [["X","A","Y"],["X","C","Z"],["Y","B","Z"],["A","E","C"],["X","E","D","B"],["Y","F","D","C"],["A","D","G","Z"],["A","F","B"],["C","G","B"]];

function normalize(t) { return [...t].sort().join(""); }
function onLine(a, b) { return LINES.some(l => l.includes(a) && l.includes(b)); }
function collinear(a, b, c) {
  const [x1,y1] = RP[a], [x2,y2] = RP[b], [x3,y3] = RP[c];
  return Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) < 0.001;
}
function sizeOf(n) { for (const [s, g] of Object.entries(SIZE_GROUPS)) if (g.tris.includes(n)) return +s; return 0; }
function gcol(s, d) { return d ? SIZE_GROUPS[s].dark : SIZE_GROUPS[s].light; }

const SC = 120, OX = 300, OY = 290;
const RP = { X:[0,2], Y:[-2,0], Z:[2,0], A:[-1,1], B:[0,0], C:[1,1], D:[0,2/3], E:[0,1], F:[-0.5,0.5], G:[0.5,0.5] };
const PT = {};
for (const [k, v] of Object.entries(RP)) PT[k] = [OX + v[0] * SC, OY - v[1] * SC];
const PN = Object.keys(PT);
const SEG = [];
LINES.forEach(l => { for (let i = 0; i < l.length - 1; i++) SEG.push([l[i], l[i + 1]]); });
const HR = 28;

function useDark() {
  const [d, set] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme:dark)").matches);
  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme:dark)");
    const h = (e) => set(e.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return d;
}

export default function App() {
  const dark = useDark();
  const [found, setFound] = useState(new Set());
  const [msg, setMsg] = useState({ text: "세 점을 드래그하거나 클릭하세요!", type: "idle" });
  const [hints, setHints] = useState(false);
  const [revealed, setRevealed] = useState(new Set());
  const [flash, setFlash] = useState(null);
  const [flashT, setFlashT] = useState(null);

  // Interaction state
  const isDragging = useRef(false);
  const dragTrail = useRef([]);         // all points touched in order (with repeats removed)
  const [trailRender, setTrailRender] = useState([]);  // for rendering only
  const [taps, setTaps] = useState([]);
  const justReleasedDrag = useRef(false);

  const svgR = useRef(null);
  const clrR = useRef(null);
  const fRef = useRef(found);
  useEffect(() => {
    fRef.current = found;
  }, [found]);

  const hitTest = useCallback((cx, cy) => {
    const svg = svgR.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const sx = (cx - r.left) * (600 / r.width);
    const sy = (cy - r.top) * (340 / r.height);
    let best = null, bd = HR * HR;
    for (const n of PN) {
      const [px, py] = PT[n];
      const d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }, []);

  const doFlash = (tri, type, text) => {
    setFlash(tri);
    setFlashT(type);
    setMsg({ text, type });
    if (clrR.current) clearTimeout(clrR.current);
    clrR.current = setTimeout(() => {
      setFlash(null);
      setFlashT(null);
      setMsg(p => p.type === "done" ? p : { text: "세 점을 드래그하거나 클릭하세요!", type: "idle" });
    }, 600);
  };

  const submit = useCallback((pts) => {
    if (pts.length !== 3) return;
    const k = normalize(pts);
    if (collinear(pts[0], pts[1], pts[2])) { doFlash(k, "error", "⚠ 일직선!"); return; }
    if (!onLine(pts[0], pts[1]) || !onLine(pts[1], pts[2]) || !onLine(pts[0], pts[2])) { doFlash(k, "error", "⚠ 직선 위에 없는 변!"); return; }
    if (!ALL_TRIANGLES.includes(k)) { doFlash(k, "error", "⚠ 유효하지 않음"); return; }
    const nf = new Set(fRef.current);
    nf.add(k);
    setFound(nf);
    const sl = SIZE_GROUPS[sizeOf(k)]?.label || "";
    if (nf.size === 47) doFlash(k, "done", "🎉 완성! 47/47!");
    else doFlash(k, "ok", `✓ △${k} (${sl}) — ${nf.size}/47`);
  }, []);

  // Simplify path by removing intermediate collinear points
  function simplifyPath(arr) {
    const distinct = [];
    for (const p of arr) { if (distinct[distinct.length - 1] !== p) distinct.push(p); }
    if (distinct.length < 3) return distinct;

    let res = [...distinct];
    let changed = true;
    while (changed && res.length > 2) {
      changed = false;
      for (let i = 1; i < res.length - 1; i++) {
        if (collinear(res[i - 1], res[i], res[i + 1])) {
          res.splice(i, 1);
          changed = true;
          break;
        }
      }
    }
    // If closed loop, remove last duplicated vertex
    if (res.length > 2 && res[0] === res[res.length - 1]) res.pop();
    return res;
  }

  // --- Pointer handlers ---
  const onPointerDown = useCallback((e) => {
    const p = hitTest(e.clientX, e.clientY);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    dragTrail.current = [p];
    setTrailRender([p]);
    setTaps([]);
  }, [hitTest]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const p = hitTest(e.clientX, e.clientY);
    if (!p) return;
    const trail = dragTrail.current;
    // Skip if same as last point
    if (trail[trail.length - 1] === p) return;
    // Just append — no cutting, no validation, completely free
    trail.push(p);
    dragTrail.current = trail;
    setTrailRender([...trail]);
  }, [hitTest]);

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    justReleasedDrag.current = true;
    setTimeout(() => { justReleasedDrag.current = false; }, 50);

    const trail = dragTrail.current;
    dragTrail.current = [];
    setTrailRender([]);

    const simple = simplifyPath(trail);

    if (simple.length === 3) {
      submit(simple);
    } else if (simple.length > 0 && simple.length < 3) {
      setTaps(simple);
      setMsg({ text: `${simple.join(", ")} — ${3 - simple.length}개 더 클릭!`, type: "idle" });
    }
  }, [submit]);

  // Tap mode: click to add/remove points
  const onSvgClick = useCallback((e) => {
    // Ignore click events that fire right after drag release
    if (justReleasedDrag.current) return;
    if (isDragging.current) return;

    const p = hitTest(e.clientX, e.clientY);
    if (!p) return;

    setTaps(prev => {
      if (prev.includes(p)) {
        const next = prev.filter(x => x !== p);
        setMsg(next.length
          ? { text: `${next.join(", ")} — ${3 - next.length}개 더!`, type: "idle" }
          : { text: "세 점을 드래그하거나 클릭하세요!", type: "idle" });
        return next;
      }
      const next = [...prev, p];
      if (next.length === 3) {
        submit(next);
        return [];
      }
      setMsg({ text: `${next.join(", ")} — ${3 - next.length}개 더!`, type: "idle" });
      return next;
    });
  }, [hitTest, submit]);

  // Render helpers
  const activePoints = trailRender.length > 0 ? trailRender : taps;
  const uniqueActive = [...new Set(activePoints)];
  const simplifiedTrail = trailRender.length >= 2 ? simplifyPath(trailRender) : null;
  const preview3 = simplifiedTrail && simplifiedTrail.length === 3 ? simplifiedTrail : null;

  const reset = () => {
    setFound(new Set()); setTrailRender([]); setTaps([]);
    dragTrail.current = []; isDragging.current = false;
    setMsg({ text: "세 점을 드래그하거나 클릭하세요!", type: "idle" });
    setHints(false); setRevealed(new Set()); setFlash(null); setFlashT(null);
  };

  const countInGroup = (tris) => tris.filter(t => found.has(t)).length;
  const progress = found.size / 47 * 100;

  const triPath = (k) => {
    const [a, b, c] = [...k];
    return `M${PT[a][0]},${PT[a][1]}L${PT[b][0]},${PT[b][1]}L${PT[c][0]},${PT[c][1]}Z`;
  };
  const triPathPts = (p) => `M${PT[p[0]][0]},${PT[p[0]][1]}L${PT[p[1]][0]},${PT[p[1]][1]}L${PT[p[2]][0]},${PT[p[2]][1]}Z`;

  // Theme
  const K = {
    bg: dark ? "#1c1c20" : "#faf9f7",
    card: dark ? "#232328" : "#fff",
    surf: dark ? "#28282e" : "#f0eeea",
    bdr: dark ? "#3a3a42" : "#e0ddd6",
    bdr2: dark ? "#444450" : "#ccc",
    tx: dark ? "#e8e6e0" : "#1a1a1a",
    tx2: dark ? "#9a988f" : "#888",
    tx3: dark ? "#6a685f" : "#aaa",
    ln: dark ? "#555560" : "#bbb8b0",
    pf: dark ? "#2a2a30" : "#fff",
    ps: dark ? "#888890" : "#888",
    pl: dark ? "#b0aea5" : "#555",
    ac: dark ? "#AFA9EC" : "#534AB7",
    pbg: dark ? "#2a2a30" : "#e8e5df",
    ptx: dark ? "#ccc" : "#555",
    chip: dark ? "#2a2a30" : "#f0eeea",
    hint: dark ? "#333338" : "#e8e5df",
    tag: dark ? "#1a1a1e" : "#fff",
    svgBg: dark ? "#222228" : "#f5f3ef",
  };

  const msgTheme = {
    ok:    { bg: dark ? "#0a3020" : "#e8f5e9", c: dark ? "#5DCAA5" : "#0F6E56", b: dark ? "#0F6E56" : "#a5d6a7" },
    error: { bg: dark ? "#3a1515" : "#fde8e8", c: dark ? "#F09595" : "#c0392b", b: dark ? "#791F1F" : "#f5c1c1" },
    dup:   { bg: dark ? "#3a2a08" : "#fef3e0", c: dark ? "#EF9F27" : "#854F0B", b: dark ? "#633806" : "#f5d9a0" },
    done:  { bg: dark ? "#26215C" : "#ede7f6", c: dark ? "#AFA9EC" : "#534AB7", b: dark ? "#534AB7" : "#b39ddb" },
    idle:  { bg: K.surf, c: K.tx2, b: K.bdr },
  };
  const mc = msgTheme[msg.type] || msgTheme.idle;
  const errC = dark ? "#F09595" : "#c0392b";

  // Trail lines between consecutive points
  const trailLineEls = [];
  for (let i = 0; i < trailRender.length - 1; i++) {
    const [x1, y1] = PT[trailRender[i]];
    const [x2, y2] = PT[trailRender[i + 1]];
    trailLineEls.push(
      <line key={`tr${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={K.ac} strokeWidth={2} opacity={0.35} strokeLinecap="round" />
    );
  }
  // Tap selection lines
  for (let i = 0; i < taps.length - 1; i++) {
    const [x1, y1] = PT[taps[i]];
    const [x2, y2] = PT[taps[i + 1]];
    trailLineEls.push(
      <line key={`tap${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={K.ac} strokeWidth={2} opacity={0.5} strokeLinecap="round" />
    );
  }

  // Label offsets
  const LX = { A: -14, C: 14, Y: -16, Z: 16, E: -14, F: -16, G: 16, D: 14, B: 0, X: 0 };
  const LY = { X: -16, B: 20, Y: 18, Z: 18, A: -8, C: -8, E: -4, F: 14, G: 14, D: 14 };

  return (
    <div style={{
      fontFamily: "'Noto Sans KR','Pretendard',-apple-system,sans-serif",
      color: K.tx, background: K.bg,
      minHeight: "100vh", minWidth: "100vw",
      padding: 0, margin: 0, boxSizing: "border-box",
      position: "absolute", inset: 0, overflow: "auto"
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.5px", color: K.tx }}>
            삼각형 찾기 놀이터
          </h2>
          <p style={{ fontSize: 13, color: K.tx2, margin: 0 }}>
            세 점 위를 자유롭게 드래그 → 놓으면 판정! (클릭도 OK)
          </p>
        </div>

        {/* Progress */}
        <div style={{ background: K.pbg, borderRadius: 20, height: 28, position: "relative", overflow: "hidden", marginBottom: 8 }}>
          <div style={{
            height: "100%", borderRadius: 20,
            transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
            width: `${progress}%`,
            background: found.size === 47
              ? (dark ? "linear-gradient(90deg,#AFA9EC,#ED93B1)" : "linear-gradient(90deg,#534AB7,#D4537E)")
              : (dark ? "linear-gradient(90deg,#5DCAA5,#85B7EB)" : "linear-gradient(90deg,#0F6E56,#185FA5)")
          }} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, fontWeight: 600,
            color: progress > 45 ? "#fff" : K.ptx
          }}>{found.size}/47</div>
        </div>

        {/* Size chips */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10, justifyContent: "center" }}>
          {Object.entries(SIZE_GROUPS).map(([s, g]) => {
            const fc = countInGroup(g.tris);
            const total = g.tris.length;
            const done = fc === total;
            const c = dark ? g.dark : g.light;
            return (
              <div key={s} style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 14,
                background: done ? c.accent : K.chip,
                color: done ? K.tag : c.accent,
                fontWeight: 600,
                border: `1.5px solid ${done ? c.accent : c.border}`,
                transition: "all 0.3s"
              }}>{g.label} {fc}/{total}</div>
            );
          })}
        </div>

        {/* SVG figure */}
        <div style={{
          background: K.svgBg, borderRadius: 16,
          border: `1px solid ${K.bdr}`, overflow: "hidden", touchAction: "none"
        }}>
          <svg ref={svgR} viewBox="0 0 600 340"
            style={{ width: "100%", display: "block", cursor: "crosshair", touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={onSvgClick}
          >
            <defs><style>{`
              @keyframes tF{0%{opacity:0}30%{opacity:.4}100%{opacity:.12}}
              @keyframes tE{0%{opacity:0}30%{opacity:.3}100%{opacity:0}}
            `}</style></defs>

            {/* Found triangle fills */}
            {[...found].map(tri => {
              const c = gcol(sizeOf(tri), dark);
              return (
                <path key={`f-${tri}`} d={triPath(tri)}
                  fill={c.accent} opacity={dark ? 0.1 : 0.05} stroke="none" />
              );
            })}

            {/* Flash animation */}
            {flash && (() => {
              const isErr = flashT === "error";
              const isDup = flashT === "dup";
              const c = (isErr || isDup) ? null : gcol(sizeOf(flash), dark);
              const col = isErr ? errC : isDup ? (dark ? "#EF9F27" : "#854F0B") : c.accent;
              return (
                <path d={triPath(flash)} fill={col} stroke={col}
                  strokeWidth={2} strokeLinejoin="round"
                  style={{ animation: isErr ? "tE 0.5s ease-out forwards" : "tF 0.5s ease-out forwards" }} />
              );
            })()}

            {/* Live preview: last 3 distinct during drag */}
            {preview3 && (
              <path d={triPathPts(preview3)} fill={K.ac} opacity={0.12}
                stroke={K.ac} strokeWidth={2} strokeLinejoin="round" strokeDasharray="6 4" />
            )}

            {/* Trail / tap lines */}
            {trailLineEls}

            {/* Figure line segments */}
            {SEG.map(([a, b], i) => (
              <line key={`s${i}`} x1={PT[a][0]} y1={PT[a][1]}
                x2={PT[b][0]} y2={PT[b][1]} stroke={K.ln} strokeWidth={1.2} />
            ))}

            {/* Points */}
            {Object.entries(PT).map(([name, [cx, cy]]) => {
              const isInTrail = uniqueActive.includes(name);
              const isInPreview = preview3 && preview3.includes(name);
              const hi = isInPreview || (isInTrail && !preview3);
              return (
                <g key={name} style={{ cursor: "pointer" }}>
                  <circle cx={cx} cy={cy} r={22} fill="transparent" />
                  <circle cx={cx} cy={cy}
                    r={hi ? 9 : isInTrail ? 7 : 6}
                    fill={hi ? K.ac : isInTrail ? (dark ? "#555" : "#ddd") : K.pf}
                    stroke={hi ? K.ac : isInTrail ? K.ac : K.ps}
                    strokeWidth={hi ? 2.5 : isInTrail ? 2 : 1.8}
                    style={{ transition: "all 0.06s" }} />
                  <text
                    x={cx + (LX[name] || 0)} y={cy + (LY[name] || -16)}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={14} fontWeight={hi ? 700 : 500}
                    fill={hi ? K.ac : K.pl}
                    style={{ userSelect: "none", pointerEvents: "none", transition: "all 0.06s" }}
                  >{name}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Message bar — outside SVG */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{
            display: "inline-block",
            background: mc.bg, color: mc.c,
            fontSize: 13, fontWeight: 600,
            padding: "6px 20px", borderRadius: 16,
            border: `1px solid ${mc.b}`,
            transition: "all 0.12s",
            boxShadow: dark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.05)"
          }}>
            {trailRender.length > 0
              ? `${[...new Set(trailRender)].join(" → ")}${trailRender.length >= 3 ? "  (놓으면 판정)" : ""}`
              : msg.text
            }
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} style={{
            padding: "7px 18px", borderRadius: 10,
            border: `1.5px solid ${K.bdr2}`, background: K.card,
            fontSize: 13, fontWeight: 600, cursor: "pointer", color: K.tx2
          }}>처음부터 다시</button>
          <button onClick={() => setHints(!hints)} style={{
            padding: "7px 18px", borderRadius: 10,
            border: `1.5px solid ${K.bdr2}`,
            background: hints ? K.ac : K.card,
            color: hints ? "#fff" : K.tx2,
            fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>
            {hints ? "힌트 닫기" : `힌트 (${47 - found.size}개 남음)`}
          </button>
          {taps.length > 0 && (
            <button onClick={() => {
              setTaps([]);
              setMsg({ text: "세 점을 드래그하거나 클릭하세요!", type: "idle" });
            }} style={{
              padding: "7px 18px", borderRadius: 10,
              border: `1.5px solid ${dark ? "#791F1F" : "#f5c1c1"}`,
              background: K.card, fontSize: 13, fontWeight: 600,
              cursor: "pointer", color: errC
            }}>선택 취소</button>
          )}
        </div>

        {/* Hints panel */}
        {hints && (
          <div style={{
            marginTop: 12, background: K.svgBg, borderRadius: 14,
            border: `1px solid ${K.bdr}`, padding: 14
          }}>
            <p style={{ fontSize: 13, color: K.tx2, margin: "0 0 10px", textAlign: "center" }}>
              클릭하면 답이 보입니다
            </p>
            {Object.entries(SIZE_GROUPS).map(([s, g]) => {
              const missing = g.tris.filter(t => !found.has(t));
              const c = dark ? g.dark : g.light;
              if (!missing.length) {
                return (
                  <div key={s} style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>{g.label}</span>
                    <span style={{ fontSize: 12, color: K.tx3, marginLeft: 6 }}>✓ 완료!</span>
                  </div>
                );
              }
              return (
                <div key={s} style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c.accent }}>{g.label}</span>
                  <span style={{ fontSize: 12, color: K.tx3, marginLeft: 6 }}>({missing.length}개)</span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {missing.map(tri => {
                      const rv = revealed.has(tri);
                      const d = dn(tri);
                      const hint = `${d[0]}·?·${d[2]}`;
                      return (
                        <span key={tri} onClick={() => {
                          const n = new Set(revealed);
                          rv ? n.delete(tri) : n.add(tri);
                          setRevealed(n);
                        }} style={{
                          fontSize: 12, padding: "3px 10px", borderRadius: 8,
                          background: rv ? c.accent : K.hint,
                          color: rv ? K.tag : K.tx2,
                          cursor: "pointer", fontFamily: "monospace", fontWeight: 600,
                          transition: "all 0.12s", userSelect: "none",
                          border: `1px solid ${rv ? c.accent : K.bdr2}`
                        }}>{rv ? `△${tri}` : hint}</span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Found list */}
        {found.size > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: K.tx2, padding: "6px 0", borderTop: `1px solid ${K.bdr}` }}>
              찾은 삼각형 ({found.size}개)
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "8px 0" }}>
              {[...found].sort((a, b) => sizeOf(a) - sizeOf(b) || a.localeCompare(b)).map(tri => {
                const c = gcol(sizeOf(tri), dark);
                return (
                  <span key={tri} style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 6,
                    fontFamily: "monospace", fontWeight: 600,
                    background: c.accent, color: K.tag, opacity: 0.85
                  }}>△{tri}</span>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
