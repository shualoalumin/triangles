import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

/* ── Triangle data ── */
const ALL_TRIANGLES = [
  "ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ",
  "ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ",
  "ABE","ABG","ACF","ACG","BCE","BCF",
  "ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ",
  "ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ",
  "XYZ"
];

const SIZE_GROUPS = {
  1:  { label: "1칸", enLabel: "Tiny",   color: "#5BDB81", tris: ["ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ"] },
  2:  { label: "2칸", enLabel: "Small",  color: "#4FE0D9", tris: ["ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ"] },
  3:  { label: "3칸", enLabel: "Medium", color: "#7C5CFC", tris: ["ABE","ABG","ACF","ACG","BCE","BCF"] },
  4:  { label: "4칸", enLabel: "Large",  color: "#FF8F50", tris: ["ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ"] },
  6:  { label: "6칸", enLabel: "Huge",   color: "#FF6BB5", tris: ["ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ"] },
  12: { label: "전체", enLabel: "Max",    color: "#FFD166", tris: ["XYZ"] },
};

const LINES = [["X","A","Y"],["X","C","Z"],["Y","B","Z"],["A","E","C"],["X","E","D","B"],["Y","F","D","C"],["A","D","G","Z"],["A","F","B"],["C","G","B"]];
const SC = 120;
const RP = { X:[0,2], Y:[-2,0], Z:[2,0], A:[-1,1], B:[0,0], C:[1,1], D:[0,2/3], E:[0,1], F:[-0.5,0.5], G:[0.5,0.5] };
const HR = 28;

function normalize(pts) { return [...pts].sort().join(""); }
function onLine(a, b) { return LINES.some(l => l.includes(a) && l.includes(b)); }
function collinear(a, b, c) {
  const [x1,y1] = RP[a], [x2,y2] = RP[b], [x3,y3] = RP[c];
  return Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) < 0.001;
}
function sizeOf(n) {
  for (const [s, g] of Object.entries(SIZE_GROUPS)) if (g.tris.includes(n)) return +s;
  return 0;
}

/* ── Confetti Effect ── */
function Confetti({ show }) {
  if (!show) return null;
  const colors = ['#7C5CFC','#FF6BB5','#4FE0D9','#FFD166','#FF8F50','#5BDB81'];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 40}%`,
          width: 8 + Math.random() * 6,
          height: 8 + Math.random() * 6,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: colors[i % colors.length],
          animation: `confetti-fall ${0.8 + Math.random() * 0.6}s ease-out forwards`,
          animationDelay: `${Math.random() * 0.3}s`,
          opacity: 0.9,
        }} />
      ))}
    </div>
  );
}

export default function GameView({ onBack }) {
  const { t, i18n } = useTranslation();
  const isKo = i18n.language === 'ko';
  const [found, setFound] = useState(new Set());
  const [msg, setMsg] = useState({ text: "", type: "idle" });
  const [flash, setFlash] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const isDragging = useRef(false);
  const dragTrail = useRef([]);
  const svgR = useRef(null);
  const clrR = useRef(null);
  const fRef = useRef(found);

  useEffect(() => { setMsg({ text: t("msg_idle"), type: "idle" }); }, [t]);
  useEffect(() => { fRef.current = found; }, [found]);

  /* ── Derived geometry (stable) ── */
  const OX = 300, OY = 210;
  const PT = useMemo(() => {
    const p = {};
    for (const [k, v] of Object.entries(RP)) p[k] = [OX + v[0] * SC, OY - v[1] * SC];
    return p;
  }, []);
  const PN = useMemo(() => Object.keys(PT), [PT]);
  const SEG = useMemo(() => {
    const s = [];
    LINES.forEach(l => { for (let i = 0; i < l.length - 1; i++) s.push([l[i], l[i + 1]]); });
    return s;
  }, []);

  const hitTest = useCallback((cx, cy) => {
    const svg = svgR.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const sx = (cx - r.left) * (600 / r.width);
    const sy = (cy - r.top) * (420 / r.height);
    let best = null, bd = HR * HR;
    for (const n of PN) {
      const [px, py] = PT[n];
      const d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }, [PN, PT]);

  const doFlash = (tri, type, text) => {
    setFlash(tri);
    setMsg({ text, type });
    if (type === 'ok') { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 1000); }
    if (clrR.current) clearTimeout(clrR.current);
    clrR.current = setTimeout(() => {
      setFlash(null);
      setMsg(p => p.type === "done" ? p : { text: t("msg_idle"), type: "idle" });
    }, 800);
  };

  const submit = useCallback((pts) => {
    if (pts.length !== 3) return;
    const k = normalize(pts);
    if (collinear(pts[0], pts[1], pts[2])) { doFlash(k, "error", t("msg_collinear")); return; }
    if (!onLine(pts[0], pts[1]) || !onLine(pts[1], pts[2]) || !onLine(pts[0], pts[2])) { doFlash(k, "error", t("msg_invalid")); return; }
    if (!ALL_TRIANGLES.includes(k)) { doFlash(k, "error", t("msg_invalid")); return; }
    const nf = new Set(fRef.current);
    if (nf.has(k)) { doFlash(k, "dup", isKo ? "이미 찾았어요! 😅" : "Already found! 😅"); return; }
    nf.add(k);
    setFound(nf);
    const sl = SIZE_GROUPS[sizeOf(k)]?.label || "";
    if (nf.size === ALL_TRIANGLES.length) doFlash(k, "done", t("msg_done"));
    else doFlash(k, "ok", `✨ △${k} (${sl}) — ${nf.size}/${ALL_TRIANGLES.length}`);
  }, [t, isKo]);

  function simplifyPath(arr) {
    const distinct = [];
    for (const p of arr) { if (distinct[distinct.length - 1] !== p) distinct.push(p); }
    if (distinct.length < 3) return distinct;
    let res = [...distinct], changed = true;
    while (changed && res.length > 2) {
      changed = false;
      for (let i = 1; i < res.length - 1; i++) {
        if (collinear(res[i - 1], res[i], res[i + 1])) { res.splice(i, 1); changed = true; break; }
      }
    }
    if (res.length > 2 && res[0] === res[res.length - 1]) res.pop();
    return res;
  }

  const onPointerDown = (e) => {
    const p = hitTest(e.clientX, e.clientY);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    dragTrail.current = [p];
  };
  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const p = hitTest(e.clientX, e.clientY);
    if (!p || dragTrail.current[dragTrail.current.length - 1] === p) return;
    dragTrail.current.push(p);
  };
  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const trail = dragTrail.current;
    dragTrail.current = [];
    const simple = simplifyPath(trail);
    if (simple.length === 3) submit(simple);
    else if (simple.length > 0) {
      setMsg({ text: `${simple.join(" → ")} ... ${isKo ? `${3 - simple.length}개 더!` : `${3 - simple.length} more!`}`, type: "idle" });
    }
  };

  const progress = (found.size / ALL_TRIANGLES.length) * 100;
  const triPath = (k) => {
    const [a, b, c] = [...k];
    return `M${PT[a][0]},${PT[a][1]}L${PT[b][0]},${PT[b][1]}L${PT[c][0]},${PT[c][1]}Z`;
  };

  const msgTheme = {
    ok:    { bg: 'rgba(91,219,129,0.15)', border: 'rgba(91,219,129,0.3)', c: '#5BDB81', icon: '✅' },
    error: { bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.3)', c: '#FF6B6B', icon: '❌' },
    dup:   { bg: 'rgba(255,209,102,0.15)', border: 'rgba(255,209,102,0.3)', c: '#FFD166', icon: '🔄' },
    done:  { bg: 'rgba(124,92,252,0.15)', border: 'rgba(124,92,252,0.3)', c: '#B8A8FF', icon: '🎉' },
    idle:  { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', c: '#8B8FA8', icon: '👆' },
  };
  const mc = msgTheme[msg.type] || msgTheme.idle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          ← {t("back_to_map")}
        </button>
        <div style={{
          background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.25)',
          borderRadius: 12, padding: '6px 16px',
          fontSize: 14, fontWeight: 800, color: '#B8A8FF',
        }}>
          🔺 {found.size} / {ALL_TRIANGLES.length}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 25 }}
        />
      </div>

      {/* Game Board */}
      <div className="game-board" style={{ position: 'relative', touchAction: 'none' }}>
        <Confetti show={showConfetti} />
        <svg ref={svgR} viewBox="0 0 600 420" style={{ width: '100%', height: 'auto', cursor: 'crosshair', display: 'block' }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>

          {/* Grid glow background */}
          <defs>
            <radialGradient id="boardGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(124,92,252,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="600" height="420" fill="url(#boardGlow)" />

          {/* Found triangle fills */}
          {[...found].map(tri => {
            const sz = sizeOf(tri);
            const col = SIZE_GROUPS[sz]?.color || '#7C5CFC';
            return <path key={tri} d={triPath(tri)} fill={col} opacity={0.12} />;
          })}

          {/* Lines */}
          {SEG.map(([a, b], i) => (
            <line key={i} x1={PT[a][0]} y1={PT[a][1]} x2={PT[b][0]} y2={PT[b][1]}
              stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
          ))}

          {/* Flash highlight */}
          <AnimatePresence>
            {flash && (
              <motion.path
                key="flash"
                d={triPath(flash)}
                fill={mc.c}
                opacity={0.35}
                stroke={mc.c}
                strokeWidth={2.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          {/* Points */}
          {PN.map(name => {
            const [cx, cy] = PT[name];
            return (
              <g key={name}>
                <circle cx={cx} cy={cy} r={8} fill="var(--bg-primary)" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                <circle cx={cx} cy={cy} r={4} fill="#7C5CFC" opacity={0.6} />
                <text x={cx} y={cy - 14} textAnchor="middle" fontSize={12} fontWeight="800"
                  fill="rgba(255,255,255,0.5)" fontFamily="Outfit, sans-serif">{name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Message */}
      <div style={{ textAlign: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={msg.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="msg-pill"
            style={{
              background: mc.bg,
              border: `1px solid ${mc.border}`,
              color: mc.c,
            }}
          >
            {mc.icon} {msg.text}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Found Triangles by Size Group */}
      <div style={{ marginTop: 16 }}>
        {Object.entries(SIZE_GROUPS).map(([size, group]) => {
          const foundInGroup = group.tris.filter(tri => found.has(tri));
          return (
            <div key={size} style={{ marginBottom: 16 }}>
              <div className="size-group-header">
                <span className="dot" style={{ background: group.color }} />
                {isKo ? group.label : group.enLabel} — {foundInGroup.length}/{group.tris.length}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.tris.map(tri => (
                  <span
                    key={tri}
                    className={`tri-tag size-${size}`}
                    style={{ opacity: found.has(tri) ? 1 : 0.25 }}
                  >
                    △{tri}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
