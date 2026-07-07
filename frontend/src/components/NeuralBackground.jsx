import React, { useEffect, useRef } from 'react';

const NeuralBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    let animFrameId;
    let mouse = { x: null, y: null, radius: 130 };

    const init = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Lightweight density — 1 node per 10 000 px²
      const numParticles = Math.floor((width * height) / 10000);
      particles = [];

      for (let i = 0; i < numParticles; i++) {
        const r = Math.random() * 2 + 1;
        particles.push({
          x:     Math.random() * width,
          y:     Math.random() * height,
          vx:    (Math.random() - 0.5) * 0.8,
          vy:    (Math.random() - 0.5) * 0.8,
          base:  r,
          r,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // Subtle dark trail
      ctx.fillStyle = 'rgba(5, 5, 5, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const CONNECT = 110; // max connection distance

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width)  p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse repulsion
        let mouseNear = false;
        if (mouse.x !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < mouse.radius) {
            const f = (mouse.radius - d) / mouse.radius;
            p.x -= (dx / d) * f * 2;
            p.y -= (dy / d) * f * 2;
            p.r  = p.base + f * 2;
            mouseNear = true;
          } else {
            p.r = p.base;
          }
        }

        p.pulse += 0.05;
        const cr = p.r + Math.sin(p.pulse) * 0.4;

        // Node dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, cr, 0, Math.PI * 2);
        ctx.fillStyle = mouseNear ? '#00f0ff' : '#7000ff';
        ctx.fill();

        // Connections — only forward pass to avoid double-drawing
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const ddx = p.x - p2.x;
          const ddy = p.y - p2.y;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);

          if (dist < CONNECT) {
            const alpha = (1 - dist / CONNECT) * 0.6;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(112, 0, 255, ${alpha})`;
            ctx.lineWidth   = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animFrameId = requestAnimationFrame(draw);
    };

    const onResize    = () => { cancelAnimationFrame(animFrameId); init(); draw(); };
    const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseOut  = ()  => { mouse.x = null; mouse.y = null; };

    window.addEventListener('resize',    onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout',  onMouseOut);

    init();
    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize',    onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout',  onMouseOut);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
    />
  );
};

export default NeuralBackground;
