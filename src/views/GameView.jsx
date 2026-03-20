import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from 'howler';
import { PUZZLES } from "../data/puzzles";
import { useGameStore } from "../store/useGameStore";

/* ── SFX Assets ── */
const SFX = {
  success: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'], volume: 0.4 }),
  error:   new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'], volume: 0.2 }),
  complete: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], volume: 0.6 }),
  pop:     new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'], volume: 0.3 }),
};

function normalize(pts) { return [...pts].sort().join(""); }

function collinear(a, b, c, points) {
  const [x1,y1] = points[a], [x2,y2] = points[b], [x3,y3] = points[c];
  return Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) < 0.001;
}

/* ── Confetti Component ── */
function Confetti({ show }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      size: 8 + Math.random() * 8,
      duration: 1.2 + Math.random() * 0.8,
      delay: Math.random() * 0.5,
      rotate: Math.random() * 360,
      isRound: Math.random() > 0.5
    }));
  }, []);

  if (!show) return null;
  const colors = ['#7C5CFC','#FF6BB5','#4FE0D9','#FFD166','#FF8F50','#5BDB81'];
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {pieces.map((p) => (
        <motion.div 
          key={p.id}
          initial={{ y: -20, x: p.x, opacity: 1, rotate: 0 }}
          animate={{ y: 500, rotate: p.rotate + 360, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.isRound ? '50%' : '2px',
            background: colors[p.id % colors.length],
            zIndex: 10
          }} 
        />
      ))}
    </div>
  );
}

/* ── Win Modal ── */
function WinModal({ world, onClose }) {
  const { i18n } = useTranslation();
  const isKo = i18n.language === 'ko';
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)'
      }}
    >
      <motion.div 
        initial={{ scale: 0.7, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)', padding: 48, borderRadius: 32, textAlign: 'center', maxWidth: 400, width: '90%',
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }} className="animate-float">🏆</div>
        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: '#FFD166' }}>
          {isKo ? '미션 클리어!' : 'Mission Clear!'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          {isKo ? `${world.name}의 모든 보물을 찾았습니다!` : `You found all treasures in ${world.name}!`}
        </p>
        <button className="btn-primary w-full" onClick={onClose}>
          {isKo ? '월드맵으로 돌아가기' : 'Back to World Map'}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function GameView({ onBack, worldId = 1 }) {
  const { t, i18n } = useTranslation();
  const isKo = i18n.language === 'ko';
  const { addFoundShape, foundShapes } = useGameStore();
  
  const puzzle = useMemo(() => PUZZLES[worldId] || PUZZLES[1], [worldId]);
  const currentFound = useMemo(() => new Set(foundShapes[worldId] || []), [foundShapes, worldId]);
  
  const [msg, setMsg] = useState({ text: "", type: "idle" });
  const [flash, setFlash] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [activePoints, setActivePoints] = useState([]);

  const isDragging = useRef(false);
  const svgR = useRef(null);
  const clrR = useRef(null);

  // Initialize message
  useEffect(() => { 
    setMsg({ text: t("msg_idle"), type: "idle" });
  }, [t]);

  // Handle Win Condition
  useEffect(() => {
    if (puzzle.solutions.length > 0 && currentFound.size === puzzle.solutions.length) {
      setIsWin(true);
    } else {
      setIsWin(false);
    }
  }, [currentFound.size, puzzle.solutions.length]);

  const OX = 300, OY = 210, SC = 140;
  const PT = useMemo(() => {
    const p = {};
    for (const [k, v] of Object.entries(puzzle.points)) p[k] = [OX + v[0] * SC, OY - v[1] * SC];
    return p;
  }, [puzzle, SC]);

  const PN = useMemo(() => Object.keys(PT), [PT]);
  const SEG = useMemo(() => {
    const s = [];
    puzzle.lines.forEach(l => { for (let i = 0; i < l.length - 1; i++) s.push([l[i], l[i + 1]]); });
    return s;
  }, [puzzle]);

  const hitTest = useCallback((cx, cy) => {
    const svg = svgR.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const sx = (cx - r.left) * (600 / r.width);
    const sy = (cy - r.top) * (420 / r.height);
    let best = null, bd = 35 * 35;
    for (const n of PN) {
      const [px, py] = PT[n];
      const d = (sx - px) ** 2 + (sy - py) ** 2;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }, [PN, PT]);

  const doFlash = useCallback((tri, type, text) => {
    setFlash(tri);
    setMsg({ text, type });
    
    if (type === 'ok') {
      SFX.success.play();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    } else if (type === 'error') {
      SFX.error.play();
    } else if (type === 'done') {
      SFX.complete.play();
      setIsWin(true);
    }

    if (clrR.current) clearTimeout(clrR.current);
    clrR.current = setTimeout(() => {
      setFlash(null);
      setMsg(p => p.type === "done" ? p : { text: t("msg_idle"), type: "idle" });
    }, 1200);
  }, [t]);

  const onLine = useCallback((a, b) => puzzle.lines.some(l => l.includes(a) && l.includes(b)), [puzzle.lines]);

  const submit = useCallback((pts) => {
    const k = normalize(pts);
    const targetLen = puzzle.type === 'triangle' ? 3 : 4;
    
    if (pts.length !== targetLen) return;
    
    // Geometry check
    if (puzzle.type === 'triangle') {
      if (collinear(pts[0], pts[1], pts[2], puzzle.points)) { doFlash(k, "error", t("msg_collinear")); return; }
      for (let i = 0; i < 3; i++) {
        if (!onLine(pts[i], pts[(i+1)%3])) { doFlash(k, "error", t("msg_invalid")); return; }
      }
    } else {
      for (let i = 0; i < 4; i++) {
        if (!onLine(pts[i], pts[(i+1)%4])) { doFlash(k, "error", t("msg_invalid")); return; }
      }
    }

    if (!puzzle.solutions.includes(k)) { doFlash(k, "error", t("msg_invalid")); return; }
    if (currentFound.has(k)) { doFlash(k, "dup", isKo ? "이미 발견했어요! ✨" : "Already discovered! ✨"); return; }
    
    addFoundShape(worldId, k);
    
    let sl = "";
    for (const sk in puzzle.sizeGroups) {
      if (puzzle.sizeGroups[sk].tris.includes(k)) {
        sl = isKo ? puzzle.sizeGroups[sk].label : puzzle.sizeGroups[sk].enLabel;
        break;
      }
    }

    if (currentFound.size + 1 === puzzle.solutions.length) doFlash(k, "done", t("msg_done"));
    else doFlash(k, "ok", `🎨 ${puzzle.type === 'triangle' ? '△' : '□'}${k} (${sl}) — ${currentFound.size + 1}/${puzzle.solutions.length}`);
  }, [t, isKo, puzzle, currentFound, addFoundShape, worldId, doFlash, onLine]);

  const simplifyPath = useCallback((arr) => {
    const distinct = [];
    for (const p of arr) { if (distinct[distinct.length - 1] !== p) distinct.push(p); }
    const targetLength = puzzle.type === 'triangle' ? 3 : 4;
    if (distinct.length < targetLength) return distinct;
    let res = [...distinct], changed = true;
    while (changed && res.length > targetLength) {
      changed = false;
      for (let i = 1; i < res.length - 1; i++) {
        if (collinear(res[i - 1], res[i], res[i + 1], puzzle.points)) { res.splice(i, 1); changed = true; break; }
      }
    }
    if (res.length > targetLength && res[0] === res[res.length - 1]) res.pop();
    return res;
  }, [puzzle]);

  const onPointerDown = (e) => {
    const p = hitTest(e.clientX, e.clientY);
    if (!p) return;
    SFX.pop.play();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    setActivePoints([p]);
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const p = hitTest(e.clientX, e.clientY);
    if (!p) return;
    setActivePoints(prev => {
        if (prev[prev.length - 1] === p) return prev;
        SFX.pop.play();
        return [...prev, p];
    });
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const trail = [...activePoints];
    setActivePoints([]);
    const simple = simplifyPath(trail);
    const targetLen = puzzle.type === 'triangle' ? 3 : 4;
    if (simple.length === targetLen) submit(simple);
    else if (simple.length > 0) {
      const remaining = targetLen - simple.length;
      setMsg({ text: `${simple.join(" → ")} ... ${isKo ? `${remaining}개 더!` : `${remaining} more!`}`, type: "idle" });
    }
  };

  const progress = (currentFound.size / puzzle.solutions.length) * 100;
  
  const shapePath = (k) => {
    const pts = [...k];
    if (!PT[pts[0]]) return "";
    let d = `M${PT[pts[0]][0]},${PT[pts[0]][1]}`;
    for (let i = 1; i < pts.length; i++) {
        if (!PT[pts[i]]) continue;
        d += `L${PT[pts[i]][0]},${PT[pts[i]][1]}`;
    }
    return d + 'Z';
  };

  const msgTheme = {
    ok:    { bg: 'rgba(91,219,129,0.15)', border: 'rgba(91,219,129,0.3)', c: '#5BDB81', icon: '✨' },
    error: { bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.3)', c: '#FF6B6B', icon: '❌' },
    dup:   { bg: 'rgba(255,209,102,0.15)', border: 'rgba(255,209,102,0.3)', c: '#FFD166', icon: '🔄' },
    done:  { bg: 'rgba(124,92,252,0.15)', border: 'rgba(124,92,252,0.3)', c: '#B8A8FF', icon: '🏆' },
    idle:  { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', c: '#8B8FA8', icon: '🖱️' },
  };
  const mc = msgTheme[msg.type] || msgTheme.idle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {isWin && <WinModal world={puzzle} onClose={onBack} />}
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <motion.button 
          whileHover={{ x: -2 }} whileTap={{ scale: 0.95 }}
          className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          🏘️ {isKo ? '메인으로' : 'Home'}
        </motion.button>
        <div style={{
          background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.2)',
          borderRadius: 16, padding: '8px 20px', fontSize: 16, fontWeight: 900, color: '#B8A8FF'
        }}>
           {puzzle.type === 'triangle' ? '🔺' : '⏹️'} {currentFound.size} / {puzzle.solutions.length}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar" style={{ height: 12 }}>
        <motion.div
           className="progress-fill"
           initial={{ width: 0 }}
           animate={{ width: `${progress}%` }}
           transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        />
      </div>

      {/* Game Board */}
      <div className="game-board animate-bounce-in" style={{ position: 'relative', touchAction: 'none' }}>
        <Confetti show={showConfetti} />
        <svg ref={svgR} viewBox="0 0 600 420" style={{ width: '100%', height: 'auto', cursor: 'crosshair', display: 'block' }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>

          <defs>
            <radialGradient id="boardGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(124,92,252,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="600" height="420" fill="url(#boardGlow)" />

          {/* Found shapes */}
          {[...currentFound].map(k => {
            let col = '#7C5CFC';
            for (const sz in puzzle.sizeGroups) {
               if (puzzle.sizeGroups[sz].tris.includes(k)) {
                 col = puzzle.sizeGroups[sz]?.color || col;
                 break;
               }
            }
            return <path key={k} d={shapePath(k)} fill={col} opacity={0.15} />;
          })}

          {/* Lines */}
          {SEG.map(([a, b], i) => (
            <line key={i} x1={PT[a][0]} y1={PT[a][1]} x2={PT[b][0]} y2={PT[b][1]}
              stroke="rgba(255,255,255,0.1)" strokeWidth={2} strokeLinecap="round" />
          ))}

          {/* Drag Trail */}
          {activePoints.length > 1 && (
             <path 
               d={`M${activePoints.map(p => PT[p] ? `${PT[p][0]},${PT[p][1]}` : "").join('L')}`}
               fill="none" stroke="#4FE0D9" strokeWidth={3} strokeDasharray="6,6" opacity={0.5}
             />
          )}

          {/* Flash */}
          <AnimatePresence>
            {flash && (
              <motion.path
                key="flash"
                d={shapePath(flash)}
                fill={mc.c}
                opacity={0.4}
                stroke={mc.c}
                strokeWidth={3}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.4, scale: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          {/* Points */}
          {PN.map(name => {
            const [cx, cy] = PT[name];
            const active = activePoints.includes(name);
            return (
              <g key={name} style={{ cursor: 'pointer' }}>
                <circle cx={cx} cy={cy} r={active ? 12 : 8} fill="var(--bg-primary)" stroke={active ? "#4FE0D9" : "rgba(255,255,255,0.2)"} strokeWidth={2} />
                <circle cx={cx} cy={cy} r={active ? 6 : 4} fill={active ? "#4FE0D9" : "#7C5CFC"} />
                <text x={cx} y={cy - 16} textAnchor="middle" fontSize={13} fontWeight="900" fill={active ? "#4FE0D9" : "rgba(255,255,255,0.4)"} fontFamily="Outfit">{name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Message Pill */}
      <div style={{ textAlign: 'center', minHeight: 48 }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={msg.text}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="msg-pill"
            style={{ background: mc.bg, border: `2px solid ${mc.border}`, color: mc.c }}
          >
            <span style={{marginRight: 10}}>{mc.icon}</span> {msg.text}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, padding: 24, borderRadius: 24 }} className="glass">
        <h4 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 800, color: 'var(--text-secondary)' }}>
           📋 {isKo ? '찾아야 할 보물들' : 'Treasures to discover'}
        </h4>
        
        {Object.entries(puzzle.sizeGroups).map(([size, group]) => {
          const foundInGroup = group.tris.filter(s => currentFound.has(s));
          const allFound = foundInGroup.length === group.tris.length;
          return (
            <div key={size} style={{ marginBottom: 20 }}>
              <div className="size-group-header" style={{ color: allFound ? '#5BDB81' : 'var(--text-secondary)' }}>
                <span className="dot" style={{ background: allFound ? '#5BDB81' : '#444' }} />
                {isKo ? group.label : group.enLabel} — {foundInGroup.length} / {group.tris.length}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.tris.map(k => (
                  <span
                    key={k}
                    className={`tri-tag size-${size}`}
                    style={{ opacity: currentFound.has(k) ? 1 : 0.15, filter: currentFound.has(k) ? 'none' : 'grayscale(1)' }}
                  >
                    {puzzle.type === 'triangle' ? '△' : '□'}{k}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
