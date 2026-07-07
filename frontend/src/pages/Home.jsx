import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Activity, Heart as HeartIcon, Brain, Cpu, BookOpen,
  User, GitBranch, Mail, ExternalLink, ChevronDown,
  Zap, Shield, BarChart2, FlaskConical, ArrowRight
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Reusable: section fade-in when entering view
───────────────────────────────────────────── */
const FadeInSection = ({ children, delay = 0, direction = 'up' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 60 : direction === 'right' ? -60 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   Interactive SVG Heart
───────────────────────────────────────────── */
const InteractiveHeart = () => {
  const heartRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = (e) => {
    const rect = heartRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({
      x: ((e.clientY - cy) / (rect.height / 2)) * -14,
      y: ((e.clientX - cx) / (rect.width / 2)) * 14,
    });
  };

  return (
    <motion.div
      ref={heartRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false); }}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      style={{ perspective: '500px', transformStyle: 'preserve-3d', cursor: 'pointer' }}
      className="relative mb-6 select-none"
    >
      {/* Outer orbit ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 m-auto"
        style={{ width: '160px', height: '160px', top: '-20px', left: '-20px' }}
      >
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="74" fill="none"
            stroke="rgba(0,240,255,0.15)" strokeWidth="1"
            strokeDasharray="8 6" />
          {/* Orbit particle */}
          <circle cx="80" cy="6" r="3" fill="#00f0ff"
            style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }} />
        </svg>
      </motion.div>

      {/* Slow counter-orbit */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 m-auto"
        style={{ width: '190px', height: '190px', top: '-35px', left: '-35px' }}
      >
        <svg width="190" height="190" viewBox="0 0 190 190">
          <circle cx="95" cy="95" r="89" fill="none"
            stroke="rgba(112,0,255,0.1)" strokeWidth="1"
            strokeDasharray="4 10" />
          <circle cx="95" cy="6" r="2.5" fill="#7000ff"
            style={{ filter: 'drop-shadow(0 0 4px #7000ff)' }} />
        </svg>
      </motion.div>

      {/* Heart SVG */}
      <motion.svg
        width="120" height="110" viewBox="0 0 100 90"
        animate={{ scale: hovered ? [1, 1.12, 1] : [1, 1.07, 1] }}
        transition={{ duration: hovered ? 0.5 : 0.9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: hovered
          ? 'drop-shadow(0 0 18px rgba(0,240,255,0.9)) drop-shadow(0 0 40px rgba(0,240,255,0.5))'
          : 'drop-shadow(0 0 10px rgba(0,240,255,0.6)) drop-shadow(0 0 24px rgba(0,240,255,0.3))'
        }}
      >
        <defs>
          <radialGradient id="hg" cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#70ffff" />
            <stop offset="50%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#0055cc" />
          </radialGradient>
          {/* Outer glow shape */}
          <radialGradient id="hgGlow" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="rgba(0,240,255,0.35)" />
            <stop offset="100%" stopColor="rgba(0,240,255,0)" />
          </radialGradient>
        </defs>
        {/* Glow underlay */}
        <path
          d="M50,30 C50,20 35,10 27,18 C17,26 17,42 50,68 C83,42 83,26 73,18 C65,10 50,20 50,30 Z"
          fill="url(#hgGlow)"
          transform="scale(1.3) translate(-11.5,-8)"
        />
        {/* Main heart shape */}
        <path
          d="M50,30 C50,20 35,10 27,18 C17,26 17,42 50,68 C83,42 83,26 73,18 C65,10 50,20 50,30 Z"
          fill="url(#hg)"
        />
        {/* Specular highlight */}
        <ellipse cx="36" cy="28" rx="9" ry="6"
          fill="rgba(255,255,255,0.22)"
          transform="rotate(-25,36,28)"
        />
      </motion.svg>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   Vascular connector — replaces single line
   with branching vein + travelling pulses
───────────────────────────────────────────── */
const VascularConnector = ({ label }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  // Branch definitions [x1,y1, x2,y2] (centred around 200,100)
  const leftBranches = [
    [200, 100, 128, 58],
    [200, 100, 105, 92],
    [200, 100, 118, 130],
    [200, 100, 152, 148],
    [200, 100, 160, 56],
  ];
  const rightBranches = [
    [200, 100, 272, 58],
    [200, 100, 295, 92],
    [200, 100, 282, 130],
    [200, 100, 248, 148],
    [200, 100, 240, 56],
  ];
  // Tiny end-node positions
  const leftTips  = leftBranches.map(([,,x2,y2]) => [x2, y2]);
  const rightTips = rightBranches.map(([,,x2,y2]) => [x2, y2]);

  return (
    <div ref={ref} className="flex justify-center items-center py-2 select-none">
      <div className="relative">
        <svg width="400" height="200" viewBox="0 0 400 200" overflow="visible">
          <defs>
            <linearGradient id={`vg-top-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,240,255,0.1)" />
              <stop offset="100%" stopColor="rgba(0,240,255,0.9)" />
            </linearGradient>
            <linearGradient id={`vg-bot-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,240,255,0.9)" />
              <stop offset="100%" stopColor="rgba(112,0,255,0.1)" />
            </linearGradient>
            <filter id="glow-c">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── Left branches ── */}
          {leftBranches.map(([x1, y1, x2, y2], i) => (
            <motion.line key={`lb${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`rgba(0,240,255,${0.55 - i * 0.07})`}
              strokeWidth={1.8 - i * 0.22}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ delay: 0.55 + i * 0.08, duration: 0.35 }}
            />
          ))}
          {/* Left tip nodes */}
          {leftTips.map(([x, y], i) => (
            <motion.circle key={`lt${i}`} cx={x} cy={y} r={i < 2 ? 3 : 2}
              fill={`rgba(0,240,255,${0.7 - i * 0.1})`}
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.9 + i * 0.06, type: 'spring' }}
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,240,255,0.7))' }}
            />
          ))}

          {/* ── Right branches ── */}
          {rightBranches.map(([x1, y1, x2, y2], i) => (
            <motion.line key={`rb${i}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`rgba(112,0,255,${0.55 - i * 0.07})`}
              strokeWidth={1.8 - i * 0.22}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ delay: 0.55 + i * 0.08, duration: 0.35 }}
            />
          ))}
          {/* Right tip nodes */}
          {rightTips.map(([x, y], i) => (
            <motion.circle key={`rt${i}`} cx={x} cy={y} r={i < 2 ? 3 : 2}
              fill={`rgba(112,0,255,${0.7 - i * 0.1})`}
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.9 + i * 0.06, type: 'spring' }}
              style={{ filter: 'drop-shadow(0 0 3px rgba(112,0,255,0.7))' }}
            />
          ))}

          {/* ── Main vein top ── */}
          <motion.line x1="200" y1="0" x2="200" y2="100"
            stroke={`url(#vg-top-${label})`} strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.45 }}
          />
          {/* ── Main vein bottom ── */}
          <motion.line x1="200" y1="100" x2="200" y2="200"
            stroke={`url(#vg-bot-${label})`} strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.45, delay: 0.25 }}
          />

          {/* ── Travelling pulse packets ── */}
          {inView && [
            { delay: 0, color: '#00f0ff' },
            { delay: 1.1, color: '#7000ff' },
            { delay: 2.2, color: '#00f0ff' },
          ].map(({ delay, color }, i) => (
            <motion.circle key={`p${i}`} cx={200} r={4} fill={color}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              animate={{ cy: [0, 200] }}
              transition={{ duration: 1.4, delay, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
            />
          ))}

          {/* ── Central node ── */}
          <motion.circle cx="200" cy="100" r="10"
            fill="#00f0ff" filter="url(#glow-c)"
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
          />
          {/* Node ripple 1 */}
          {inView && <motion.circle cx="200" cy="100" r="10" fill="none"
            stroke="#00f0ff" strokeWidth="1.5"
            animate={{ r: [10, 30], opacity: [0.8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />}
          {/* Node ripple 2 */}
          {inView && <motion.circle cx="200" cy="100" r="10" fill="none"
            stroke="#7000ff" strokeWidth="1"
            animate={{ r: [10, 44], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, delay: 0.6, repeat: Infinity, ease: 'easeOut' }}
          />}
          {/* Inner bright dot */}
          <circle cx="200" cy="100" r="4" fill="white" opacity="0.8" />
        </svg>

        {/* Label */}
        {label && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 1.0 }}
            className="absolute top-1/2 -translate-y-1/2 left-[calc(50%+28px)]
                       text-xs font-mono text-[#00f0ff] whitespace-nowrap
                       bg-[rgba(0,240,255,0.07)] border border-[rgba(0,240,255,0.2)] px-2 py-0.5 rounded"
          >
            {label}
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Heartbeat SVG line (hero decoration)
───────────────────────────────────────────── */
const HeartbeatLine = () => (
  <svg viewBox="0 0 320 60" className="w-full max-w-xs" fill="none">
    <motion.polyline
      points="0,30 50,30 70,5 90,55 110,30 160,30 180,10 200,50 220,30 320,30"
      stroke="#00f0ff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
      style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }}
    />
  </svg>
);

/* ─────────────────────────────────────────────
   Section wrapper with left accent bar
───────────────────────────────────────────── */
const Section = ({ id, children, className = '' }) => (
  <section id={id} className={`relative max-w-5xl mx-auto px-6 ${className}`}>
    {children}
  </section>
);

/* ─────────────────────────────────────────────
   Feature card
───────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <FadeInSection delay={delay}>
    <div className="glass-panel p-6 flex flex-col gap-3 h-full group hover:border-[rgba(0,240,255,0.3)] transition-all duration-300">
      <div className="p-3 bg-[rgba(0,240,255,0.1)] rounded-xl w-fit border border-[rgba(0,240,255,0.2)] group-hover:bg-[rgba(0,240,255,0.2)] transition-colors">
        <Icon className="text-[#00f0ff]" size={22} />
      </div>
      <h4 className="text-white font-semibold text-base">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </FadeInSection>
);

/* ─────────────────────────────────────────────
   How-it-works step
───────────────────────────────────────────── */
const Step = ({ num, title, desc, delay }) => (
  <FadeInSection delay={delay}>
    <div className="flex gap-5 items-start">
      <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-[#00f0ff]
                      flex items-center justify-center text-[#00f0ff] font-bold text-sm
                      shadow-[0_0_12px_rgba(0,240,255,0.5)]">
        {num}
      </div>
      <div>
        <h4 className="text-white font-semibold mb-1">{title}</h4>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  </FadeInSection>
);

/* ═══════════════════════════════════════════
   MAIN HOME COMPONENT
═══════════════════════════════════════════ */
const Home = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  // Spine "fill" driven by overall page scroll
  const spineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full text-white">

      {/* ── Scrolling vertical nerve spine (decorative, left side) ── */}
      <div className="fixed left-6 top-0 bottom-0 flex flex-col items-center z-20 pointer-events-none hidden lg:flex">
        <motion.div
          className="w-px bg-gradient-to-b from-[rgba(0,240,255,0)] via-[rgba(0,240,255,0.5)] to-[rgba(112,0,255,0.5)]"
          style={{ height: '100vh', scaleY: spineScaleY, originY: 0 }}
        />
      </div>

      {/* ════════════════════════════════════
          1. HERO
      ════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        {/* Background glow blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)' }} />
        </div>

        {/* Interactive Heart */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          <InteractiveHeart />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-5xl md:text-7xl font-black tracking-tight mb-4"
        >
          <span className="neon-text-primary">NEURO</span>
          <span className="text-white">HEART</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-gray-300 text-lg md:text-xl max-w-2xl mb-4 leading-relaxed"
        >
          An AI-powered heart disease prediction system built with machine learning,
          trained on clinical data to help identify cardiac risk — instantly.
        </motion.p>

        {/* Student portfolio badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                     bg-[rgba(112,0,255,0.15)] border border-[rgba(112,0,255,0.4)]
                     text-[#b060ff] text-sm font-medium mb-10"
        >
          <BookOpen size={14} />
          Student Portfolio Project — Nithishh CM
        </motion.div>

        {/* Heartbeat */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-10"
        >
          <HeartbeatLine />
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to="/register"
            className="neon-button px-8 py-3 rounded-lg font-bold tracking-widest uppercase text-sm
                       flex items-center gap-2 justify-center"
          >
            <Zap size={16} /> Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-lg font-bold tracking-widest uppercase text-sm
                       border border-[rgba(255,255,255,0.15)] text-gray-300 hover:text-white
                       hover:border-white transition-all flex items-center gap-2 justify-center"
          >
            Sign In <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 flex flex-col items-center gap-1 text-gray-500 text-xs"
        >
          <span>Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════
          NERVE CONNECTOR 1
      ════════════════════════════════════ */}
      <div className="flex justify-center">
        <VascularConnector label="node_01 :: about_creator" index={0} />
      </div>

      {/* ════════════════════════════════════
          2. ABOUT THE CREATOR
      ════════════════════════════════════ */}
      <Section id="about" className="py-20">
        <FadeInSection>
          <div className="flex items-center gap-3 mb-12">
            <User className="text-[#00f0ff]" size={28} />
            <h2 className="text-4xl font-bold">
              About the <span className="neon-text-primary">Creator</span>
            </h2>
          </div>
        </FadeInSection>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Profile card */}
          <FadeInSection direction="right">
            <div className="glass-panel p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
                   style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)' }} />

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#7000ff]
                                flex items-center justify-center text-3xl font-black text-black shadow-[0_0_24px_rgba(0,240,255,0.4)]">
                  N
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Nithishh CM</h3>
                  <p className="text-[#00f0ff] text-sm font-mono mt-0.5">Student Developer</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[rgba(112,0,255,0.2)]
                                     border border-[rgba(112,0,255,0.4)] text-[#b060ff] font-medium">
                      🎓 Portfolio Project
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">
                I'm a student developer passionate about the intersection of <strong className="text-white">AI and healthcare</strong>.
                This project was built to explore how machine learning can be applied to real-world medical problems,
                while also serving as a showcase of full-stack development skills.
              </p>
            </div>
          </FadeInSection>

          {/* Skills/tech list */}
          <FadeInSection direction="left" delay={0.15}>
            <div className="space-y-4">
              {[
                { label: 'Machine Learning', detail: 'Scikit-learn · Random Forest · Feature Engineering', icon: Brain },
                { label: 'Backend',          detail: 'FastAPI · SQLAlchemy · JWT Authentication',         icon: Shield },
                { label: 'Frontend',         detail: 'React · Framer Motion · TailwindCSS',               icon: Cpu },
                { label: 'Data Science',     detail: 'Pandas · NumPy · Matplotlib · SHAP Explainability', icon: BarChart2 },
              ].map(({ label, detail, icon: Icon }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className="flex items-center gap-4 glass-panel px-5 py-3"
                >
                  <Icon size={18} className="text-[#7000ff] flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold">{label}</p>
                    <p className="text-gray-500 text-xs font-mono">{detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </Section>

      {/* NERVE CONNECTOR 2 */}
      <div className="flex justify-center">
        <VascularConnector label="node_02 :: what_it_does" index={1} />
      </div>

      {/* ════════════════════════════════════
          3. WHAT IT DOES
      ════════════════════════════════════ */}
      <Section id="what" className="py-20">
        <FadeInSection>
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-[#00f0ff]" size={28} />
            <h2 className="text-4xl font-bold">
              What It <span className="neon-text-primary">Does</span>
            </h2>
          </div>
          <p className="text-gray-400 text-base max-w-2xl mb-12">
            NeuroHeart analyses 13 clinical parameters — the same ones cardiologists use — and
            predicts the likelihood of heart disease using a trained machine learning model.
          </p>
        </FadeInSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={HeartIcon}
            title="Heart Disease Prediction"
            desc="Analyses 13 medical parameters to predict whether a patient is at risk of heart disease with high accuracy."
            delay={0}
          />
          <FeatureCard
            icon={Brain}
            title="AI Explainability (SHAP)"
            desc="Not just a black box — SHAP values show exactly which factors drove the prediction, making it interpretable."
            delay={0.1}
          />
          <FeatureCard
            icon={Shield}
            title="Secure User Accounts"
            desc="JWT-authenticated accounts keep your predictions private. Each session is encrypted end-to-end."
            delay={0.2}
          />
          <FeatureCard
            icon={BarChart2}
            title="Prediction History"
            desc="Every prediction is stored per user so you can track how risk profiles change over time."
            delay={0.3}
          />
          <FeatureCard
            icon={Cpu}
            title="Instant Results"
            desc="Inference runs in milliseconds. Fill in the form, hit submit, get a result — no waiting."
            delay={0.4}
          />
          <FeatureCard
            icon={FlaskConical}
            title="Clinically Grounded Data"
            desc="Trained on the UCI Heart Disease dataset — a well-established benchmark used in medical AI research."
            delay={0.5}
          />
        </div>
      </Section>

      {/* NERVE CONNECTOR 3 */}
      <div className="flex justify-center">
        <VascularConnector label="node_03 :: how_it_works" index={2} />
      </div>

      {/* ════════════════════════════════════
          4. HOW IT WORKS
      ════════════════════════════════════ */}
      <Section id="how" className="py-20">
        <FadeInSection>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-[#00f0ff]" size={28} />
            <h2 className="text-4xl font-bold">
              How It <span className="neon-text-primary">Works</span>
            </h2>
          </div>
          <p className="text-gray-400 text-base max-w-2xl mb-12">
            A full-stack pipeline from user input to machine-learning inference.
          </p>
        </FadeInSection>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Steps */}
          <div className="space-y-10">
            <Step num="01" title="Create an account"
              desc="Register with a username, email and password. Your data is bcrypt-hashed and stored in a SQLite database."
              delay={0} />
            <Step num="02" title="Enter clinical data"
              desc="Fill in 13 parameters: age, cholesterol, resting BP, chest pain type, thal, slope, and more."
              delay={0.1} />
            <Step num="03" title="Model inference"
              desc="A Random Forest classifier (trained offline on UCI data) runs on your scaled inputs in the FastAPI backend."
              delay={0.2} />
            <Step num="04" title="Read your results"
              desc="Get a clear risk score (0–100 %) plus a SHAP breakdown showing the top contributing factors."
              delay={0.3} />
            <Step num="05" title="Review history"
              desc="All predictions are stored under your account. Come back anytime to track changes."
              delay={0.4} />
          </div>

          {/* Architecture diagram card */}
          <FadeInSection direction="left" delay={0.2}>
            <div className="glass-panel p-6 font-mono text-xs space-y-3">
              {[
                { label: 'React Frontend',    color: '#00f0ff', badge: 'UI' },
                { label: '↓  HTTP / JWT',     color: '#7000ff', badge: '' },
                { label: 'FastAPI Backend',   color: '#00f0ff', badge: 'API' },
                { label: '↓  SQLAlchemy',     color: '#7000ff', badge: '' },
                { label: 'SQLite Database',   color: '#00f0ff', badge: 'DB' },
                { label: '↓  Pickle / Joblib',color: '#7000ff', badge: '' },
                { label: 'Random Forest Model', color: '#00f0ff', badge: 'ML' },
                { label: '↓  SHAP',           color: '#7000ff', badge: '' },
                { label: 'Explanation Output',color: '#00f0ff', badge: 'XAI' },
              ].map(({ label, color, badge }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between"
                >
                  <span style={{ color }}>{label}</span>
                  {badge && (
                    <span className="px-2 py-0.5 rounded text-black text-xs font-bold"
                          style={{ background: color }}>
                      {badge}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </Section>

      {/* NERVE CONNECTOR 4 */}
      <div className="flex justify-center">
        <VascularConnector label="node_04 :: why_created" index={3} />
      </div>

      {/* ════════════════════════════════════
          5. WHY IT WAS CREATED
      ════════════════════════════════════ */}
      <Section id="why" className="py-20">
        <FadeInSection>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-[#00f0ff]" size={28} />
            <h2 className="text-4xl font-bold">
              Why It Was <span className="neon-text-primary">Created</span>
            </h2>
          </div>
        </FadeInSection>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {[
            {
              title: 'Learning AI/ML',
              body: 'This project was built to gain hands-on experience with the full machine learning pipeline — from data preprocessing to model training, evaluation, and deployment.',
              icon: Brain, delay: 0,
            },
            {
              title: 'Portfolio Showcase',
              body: 'As a student developer, I wanted a real, functional project that demonstrates full-stack development, REST APIs, React, and applied machine learning in one place.',
              icon: Cpu, delay: 0.1,
            },
            {
              title: 'Healthcare Impact',
              body: 'Heart disease is the leading cause of death globally. I wanted to explore how technology can assist in early detection — even if only as a proof-of-concept.',
              icon: HeartIcon, delay: 0.2,
            },
          ].map(({ title, body, icon: Icon, delay }) => (
            <FadeInSection key={title} delay={delay}>
              <div className="glass-panel p-7 h-full hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-shadow">
                <Icon className="text-[#7000ff] mb-4" size={28} />
                <h3 className="text-white font-bold text-lg mb-3">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* Disclaimer */}
        <FadeInSection delay={0.3}>
          <div className="mt-10 glass-panel p-5 border-l-4 border-[#7000ff]">
            <p className="text-gray-400 text-sm leading-relaxed">
              <strong className="text-[#b060ff]">⚠ Disclaimer:</strong>{' '}
              This tool is a <strong className="text-white">student portfolio project</strong> and is
              <strong className="text-white"> not a medical device</strong>. It should never be used as a
              substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified
              healthcare provider for any health concerns.
            </p>
          </div>
        </FadeInSection>
      </Section>

      {/* NERVE CONNECTOR 5 */}
      <div className="flex justify-center">
        <VascularConnector label="node_05 :: contact" index={4} />
      </div>

      {/* ════════════════════════════════════
          6. CONTACT
      ════════════════════════════════════ */}
      <Section id="contact" className="py-20">
        <FadeInSection>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="text-[#00f0ff]" size={28} />
            <h2 className="text-4xl font-bold">
              Get in <span className="neon-text-primary">Touch</span>
            </h2>
          </div>
          <p className="text-gray-400 text-base mb-12">
            Questions, feedback, or just want to connect? Reach out!
          </p>
        </FadeInSection>

        <div className="grid sm:grid-cols-3 gap-5 mb-14">
          {[
            {
              icon: GitBranch,
              label: 'GitHub',
              value: 'github.com/nithishhcm',
              href: 'https://github.com/',
              color: '#00f0ff',
            },
            {
              icon: Mail,
              label: 'Email',
              value: 'nithishhcm7@gmail.com',
              href: 'mailto:nithishhcm7@gmail.com',
              color: '#7000ff',
            },
            {
              icon: ExternalLink,
              label: 'LinkedIn',
              value: 'linkedin.com/in/nithishhcm',
              href: 'https://linkedin.com/',
              color: '#00f0ff',
            },
          ].map(({ icon: Icon, label, value, href, color }, i) => (
            <FadeInSection key={label} delay={i * 0.1}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel p-6 flex flex-col items-center gap-3 text-center
                           hover:scale-105 transition-transform duration-300 block"
                style={{ '--hover-color': color }}
              >
                <div className="p-3 rounded-full border"
                     style={{ background: `${color}18`, borderColor: `${color}44` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-gray-500 text-xs font-mono break-all">{value}</p>
              </a>
            </FadeInSection>
          ))}
        </div>

        {/* Final CTA */}
        <FadeInSection delay={0.3}>
          <div className="text-center glass-panel p-10">
            <HeartIcon className="text-[#00f0ff] mx-auto mb-4 animate-pulse" size={36} />
            <h3 className="text-2xl font-bold mb-3">
              Ready to check your heart health?
            </h3>
            <p className="text-gray-400 text-sm mb-7 max-w-md mx-auto">
              Create a free account and run your first prediction in under 60 seconds.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/register"
                className="neon-button px-8 py-3 rounded-lg font-bold tracking-widest uppercase text-sm
                           flex items-center gap-2"
              >
                <Zap size={16} /> Create Account
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 rounded-lg font-bold tracking-widest uppercase text-sm
                           border border-[rgba(255,255,255,0.15)] text-gray-300 hover:text-white
                           hover:border-white transition-all flex items-center gap-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </FadeInSection>
      </Section>

      {/* Footer */}
      <footer className="text-center py-10 text-gray-600 text-xs font-mono border-t border-[rgba(255,255,255,0.05)] mt-10">
        <p>Built with ❤️ by <span className="text-[#00f0ff]">Nithishh CM</span> · Student Portfolio Project · {new Date().getFullYear()}</p>
        <p className="mt-1 text-gray-700">Not for medical use. For educational purposes only.</p>
      </footer>
    </div>
  );
};

export default Home;
