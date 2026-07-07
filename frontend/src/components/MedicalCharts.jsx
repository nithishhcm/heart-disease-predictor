import React from 'react';
import { motion } from 'framer-motion';

// Helper to convert polar coordinates to Cartesian (for drawing SVG pie/radar arcs)
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

// 1. RISK GAUGE CHART
export const RiskGauge = ({ value, label = "Event Probability" }) => {
  const pct = Math.round(value * 100);
  const radius = 80;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 100;
  
  // Circumference
  const circum = 2 * Math.PI * radius;
  // Arc represents 270 deg (from 135 deg to 405 deg)
  const arcLength = (270 / 360) * circum;
  const strokeDashoffset = arcLength - (value * arcLength);

  // Determine neon glow color based on risk levels
  let neonColor = '#00f0ff'; // Cyan
  let glowGradient = 'url(#cyanGlow)';
  if (value > 0.7) {
    neonColor = '#ef4444'; // Red
    glowGradient = 'url(#redGlow)';
  } else if (value > 0.4) {
    neonColor = '#f97316'; // Orange
    glowGradient = 'url(#orangeGlow)';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 relative bg-black/40 border border-gray-900 rounded-xl">
      <svg className="w-56 h-56" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#7000ff" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Grey background path */}
        <path
          d={describeArc(cx, cy, radius, 135, 405)}
          fill="none"
          stroke="#1f1f2e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Glowing Value path */}
        <motion.path
          d={describeArc(cx, cy, radius, 135, 405)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: 'drop-shadow(0px 0px 8px ' + neonColor + ')' }}
        />
        
        {/* Core probability numbers */}
        <text x="100" y="100" textAnchor="middle" fill="#ffffff" className="text-3xl font-extrabold" dy=".3em">
          {pct}%
        </text>
        <text x="100" y="130" textAnchor="middle" fill="#888899" className="text-[10px] font-bold uppercase tracking-widest">
          {label}
        </text>
      </svg>
      {value > 0.5 ? (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-950/40 border border-red-900/40 px-2.5 py-1 rounded-md text-[10px] text-red-400 font-bold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Critical Risk Action
        </div>
      ) : (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-green-950/40 border border-green-900/40 px-2.5 py-1 rounded-md text-[10px] text-green-400 font-bold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Stable Baseline
        </div>
      )}
    </div>
  );
};

// 2. FEATURE INFERENCE IMPORTANCE BAR CHART (Horizontal bars showing top SHAP/weights)
export const FeatureBarChart = ({ data }) => {
  // data is List of objects: { label: string, impact: float, value: string }
  const maxImpact = Math.max(...data.map(d => Math.abs(d.impact))) || 1.0;
  
  return (
    <div className="flex flex-col gap-4 p-5 bg-black/40 border border-gray-900 rounded-xl w-full">
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#7000ff]">AI Diagnostics Drivers</h4>
        <span className="text-[10px] text-gray-500 font-mono">WEIGHT SHAP IMPACT</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {data.map((item, idx) => {
          const widthPct = (Math.abs(item.impact) / maxImpact) * 100;
          const isRisk = item.impact > 0;
          const themeColor = isRisk ? '#ef4444' : '#00f0ff';
          const bgGlow = isRisk ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.2)';

          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-300 font-semibold">{item.label}</span>
                <span className="text-gray-500">{item.value}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-grow h-2.5 bg-gray-900 rounded-full overflow-hidden relative border border-gray-800/80">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: themeColor,
                      boxShadow: `0 0 10px ${bgGlow}`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.05, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[11px] font-mono w-12 text-right" style={{ color: themeColor }}>
                  {isRisk ? '+' : ''}{item.impact.toFixed(3)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. RADAR CLINICAL DEFLECTION MAP
export const RadarChart = ({ indicators }) => {
  // indicators: list of { name: string, value: float (0.0 to 1.0) }
  const cx = 100;
  const cy = 100;
  const r = 70;
  const total = indicators.length;
  
  // Calculate polygon points
  const points = indicators.map((ind, i) => {
    const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
    const factor = ind.value; // Scale 0-1
    return {
      x: cx + r * factor * Math.cos(angle),
      y: cy + r * factor * Math.sin(angle),
      labelX: cx + (r + 18) * Math.cos(angle),
      labelY: cy + (r + 10) * Math.sin(angle),
      indName: ind.name
    };
  });
  
  const polygonPointsStr = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-black/40 border border-gray-900 rounded-xl w-full">
      <h4 className="text-xs font-bold uppercase tracking-widest text-[#7000ff] mb-4 self-start border-b border-gray-800 pb-2 w-full">
        Physiological Balance Map
      </h4>
      <svg className="w-56 h-56" viewBox="0 0 200 200">
        {/* Background grids */}
        {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
          const gridPoints = indicators.map((_, i) => {
            const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
            return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
          }).join(" ");
          return (
            <polygon
              key={sIdx}
              points={gridPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="0.5"
            />
          );
        })}
        
        {/* Axis lines */}
        {points.map((p, i) => {
          const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + r * Math.cos(angle)}
              y2={cy + r * Math.sin(angle)}
              stroke="rgba(0, 240, 255, 0.1)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Polygons displaying telemetry */}
        <polygon
          points={polygonPointsStr}
          fill="rgba(112, 0, 255, 0.2)"
          stroke="#7000ff"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0px 0px 4px rgba(112,0,255,0.6))' }}
        />

        {/* Outer points indicator heads */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#00f0ff"
            stroke="#ffffff"
            strokeWidth="0.5"
          />
        ))}

        {/* Labels text */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            fill="#a3a3a3"
            fontSize="7"
            fontWeight="semibold"
          >
            {p.indName.toUpperCase()}
          </text>
        ))}
      </svg>
    </div>
  );
};

// 4. TREND TIMELINE LINE CHART
export const TrendTimeline = ({ history }) => {
  // history is List of: { dateStr: string, probability: float }
  if (history.length === 0) return null;
  
  const width = 500;
  const height = 180;
  const padding = 30;
  
  const activeW = width - 2 * padding;
  const activeH = height - 2 * padding;

  const pointsCount = history.length;
  
  const coords = history.map((item, idx) => {
    const x = padding + (idx / (pointsCount > 1 ? pointsCount - 1 : 1)) * activeW;
    const y = padding + activeH - (item.probability * activeH);
    return { x, y, ...item };
  });

  const pathStr = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(" ");
  const areaStr = `${pathStr} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return (
    <div className="flex flex-col gap-3 p-5 bg-black/40 border border-gray-900 rounded-xl w-full">
      <div className="flex justify-between items-center border-b border-gray-800 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#7000ff]">Cardiovascular Risk Timeline</h4>
        <span className="text-[10px] text-gray-500 font-mono">DATES & INFERENCE SCORES</span>
      </div>

      <svg className="w-full h-auto" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7000ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7000ff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((v, i) => {
          const y = padding + activeH - (v * activeH);
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" strokeDasharray="2,2" />
              <text x={padding - 8} y={y + 3} fill="#666" fontSize="7" textAnchor="end">{v * 100}%</text>
            </g>
          );
        })}

        {/* Fill Area */}
        <motion.path
          d={areaStr}
          fill="url(#areaGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0 }}
        />

        {/* Trace Line */}
        <motion.path
          d={pathStr}
          fill="none"
          stroke="#7000ff"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ filter: 'drop-shadow(0px 0px 5px rgba(112,0,255,0.7))' }}
        />

        {/* Node dots */}
        {coords.map((c, idx) => (
          <g key={idx}>
            <circle cx={c.x} cy={c.y} r="4" fill="#00f0ff" stroke="#ffffff" strokeWidth="1" />
            {/* Label texts */}
            <text x={c.x} y={c.y - 8} fill="#ffffff" fontSize="7" textAnchor="middle" fontWeight="bold">
              {Math.round(c.probability * 100)}%
            </text>
            <text x={c.x} y={height - padding + 12} fill="#6b7280" fontSize="7" textAnchor="middle" transform={`rotate(15, ${c.x}, ${height - padding + 12})`}>
              {c.dateStr}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
