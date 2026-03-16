import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const ALL_TRIANGLES = [
  "ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ",
  "ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ",
  "ABE","ABG","ACF","ACG","BCE","BCF",
  "ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ",
  "ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ",
  "XYZ"
];

const SIZE_GROUPS = {
  1:  { label: "1칸", tris: ["ADE","ADF","BDF","BDG","CDE","CDG","AEX","CEX","AFY","BFY","BGZ","CGZ"] },
  2:  { label: "2칸", tris: ["ABD","ACD","BCD","ACX","ADX","CDX","ABY","ADY","BDY","BCZ","BDZ","CDZ"] },
  3:  { label: "3칸", tris: ["ABE","ABG","ACF","ACG","BCE","BCF"] },
  4:  { label: "4칸", tris: ["ABX","BCX","DXY","DXZ","ACY","BCY","DYZ","ABZ","ACZ"] },
  6:  { label: "6칸", tris: ["ABC","BXY","CXY","AXZ","BXZ","AYZ","CYZ"] },
  12: { label: "전체", tris: ["XYZ"] },
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
  for (const [s, g] of Object.entries(SIZE_GROUPS)) {
    if (g.tris.includes(n)) return +s;
  }
  return 0;
}

export default function GameView({ onBack }) {
  const { t } = useTranslation();
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme:dark)").matches
  );
  const [found, setFound] = useState(new Set());
  const [msg, setMsg] = useState({ text: "", type: "idle" });
  const [flash, setFlash] = useState(null);

  const isDragging = useRef(false);
  const dragTrail = useRef([]);
  const svgR = useRef(null);
  const clrR = useRef(null);
  const fRef = useRef(found);

  // Initialize message after mount so i18n is ready
  useEffect(() => {
    setMsg({ text: t("msg_idle"), type: "idle" });
  }, [t]);

  useEffect(() => { fRef.current = found; }, [found]);

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme:dark)");
    const handler = (e) => setDark(e.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);

  // Derived geometry
  const OX = 300, OY = 200;
  const PT = {};
  for (const [k, v] of Object.entries(RP)) PT[k] = [OX + v[0] * SC, OY - v[1] * SC];
  const PN = Object.keys(PT);
  const SEG = [];
  LINES.forEach(l => { for (let i = 0; i < l.length - 1; i++) SEG.push([l[i], l[i + 1]]); });

  const hitTest = useCallback((cx, cy) => {
    const svg = svgR.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const sx = (cx - r.left) * (600 / r.width);
    const sy = (cy - r.top) * (400 / r.height);
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
    setMsg({ text, type });
    if (clrR.current) clearTimeout(clrR.current);
    clrR.current = setTimeout(() => {
      setFlash(null);
      setMsg(p => p.type === "done" ? p : { text: t("msg_idle"), type: "idle" });
    }, 600);
  };

  const submit = useCallback((pts) => {
    if (pts.length !== 3) return;
    const k = normalize(pts);
    if (collinear(pts[0], pts[1], pts[2])) { doFlash(k, "error", t("msg_collinear")); return; }
    if (!onLine(pts[0], pts[1]) || !onLine(pts[1], pts[2]) || !onLine(pts[0], pts[2])) { doFlash(k, "error", t("msg_invalid")); return; }
    if (!ALL_TRIANGLES.includes(k)) { doFlash(k, "error", t("msg_invalid")); return; }

    const nf = new Set(fRef.current);
    if (nf.has(k)) { doFlash(k, "dup", "이미 찾았습니다!"); return; }

    nf.add(k);
    setFound(nf);
    const sl = SIZE_GROUPS[sizeOf(k)]?.label || "";
    if (nf.size === ALL_TRIANGLES.length) doFlash(k, "done", t("msg_done"));
    else doFlash(k, "ok", `✓ △${k} (${sl}) — ${nf.size}/${ALL_TRIANGLES.length}`);
  }, [t]);

  function simplifyPath(arr) {
    const distinct = [];
    for (const p of arr) { if (distinct[distinct.length - 1] !== p) distinct.push(p); }
    if (distinct.length < 3) return distinct;
    let res = [...distinct];
    let changed = true;
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
      setMsg({ text: `${simple.join(", ")} — ${3 - simple.length}개 더!`, type: "idle" });
    }
  };

  const progress = (found.size / ALL_TRIANGLES.length) * 100;
  const triPath = (k) => {
    const [a, b, c] = [...k];
    return `M${PT[a][0]},${PT[a][1]}L${PT[b][0]},${PT[b][1]}L${PT[c][0]},${PT[c][1]}Z`;
  };

  const K = {
    bg: dark ? "#1c1c20" : "#faf9f7",
    tx2: dark ? "#9a988f" : "#888",
    ln: dark ? "#555560" : "#bbb8b0",
    ac: dark ? "#AFA9EC" : "#534AB7",
  };

  const msgTheme = {
    ok:    { bg: dark ? "#0a3020" : "#e8f5e9", c: dark ? "#5DCAA5" : "#0F6E56" },
    error: { bg: dark ? "#3a1515" : "#fde8e8", c: dark ? "#F09595" : "#c0392b" },
    dup:   { bg: dark ? "#3a3015" : "#fff8e1", c: dark ? "#EF9F27" : "#854F0B" },
    done:  { bg: dark ? "#26215C" : "#ede7f6", c: dark ? "#AFA9EC" : "#534AB7" },
    idle:  { bg: dark ? "#28282e" : "#f0eeea", c: K.tx2 },
  };
  const mc = msgTheme[msg.type] || msgTheme.idle;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="text-sm font-bold opacity-60 hover:opacity-100 flex items-center gap-1">
          ← {t("back_to_map")}
        </button>
        <div className="text-sm font-bold text-[#534AB7] dark:text-[#AFA9EC]">
          {found.size} / {ALL_TRIANGLES.length}
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-[#534AB7] to-[#D4537E]"
        />
      </div>

      <div className="bg-white dark:bg-black/20 rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden touch-none shadow-xl">
        <svg ref={svgR} viewBox="0 0 600 400" className="w-full h-auto cursor-crosshair"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
          {[...found].map(tri => (
            <path key={tri} d={triPath(tri)} fill={K.ac} opacity={dark ? 0.15 : 0.08} />
          ))}
          {SEG.map(([a, b], i) => (
            <line key={i} x1={PT[a][0]} y1={PT[a][1]} x2={PT[b][0]} y2={PT[b][1]}
              stroke={K.ln} strokeWidth={1.5} opacity={0.6} />
          ))}
          {flash && <path d={triPath(flash)} fill={K.ac} opacity={0.4} stroke={K.ac} strokeWidth={2} />}
          {PN.map(name => {
            const [cx, cy] = PT[name];
            return (
              <g key={name}>
                <circle cx={cx} cy={cy} r={6} fill={K.bg} stroke={K.ln} strokeWidth={2} />
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={12} fontWeight="bold" fill={K.tx2}>{name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-center">
        <span style={{ backgroundColor: mc.bg, color: mc.c }} className="inline-block px-6 py-2 rounded-full text-sm font-bold shadow-sm">
          {msg.text}
        </span>
      </div>

      <div className="mt-8">
        <h4 className="text-xs font-bold opacity-40 mb-3 uppercase tracking-widest">{t("found")}</h4>
        <div className="flex flex-wrap gap-2">
          {[...found].map(tri => (
            <span key={tri} className="text-[10px] font-mono font-bold bg-white/10 px-2 py-1 rounded-md border border-white/5">
              △{tri}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
