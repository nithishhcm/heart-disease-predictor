import React, { useEffect, useRef } from 'react';

const ECGHeartbeat = ({ height = 80, color = '#00f0ff', speed = 2.5 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let h = (canvas.height = height);

    // ECG wave coordinates mapping (P-Q-R-S-T sequence)
    const ecgPattern = [
      { dx: 0, dy: 0 },     // Baseline
      { dx: 15, dy: 0 },    // Baseline
      { dx: 5, dy: -4 },    // P wave (slight positive)
      { dx: 5, dy: 0 },     // PR interval baseline
      { dx: 3, dy: 2 },     // Q wave (slight negative dip)
      { dx: 4, dy: -32 },   // R wave (sharp positive spike)
      { dx: 4, dy: 10 },    // S wave (sharp negative dip)
      { dx: 3, dy: 0 },     // Baseline
      { dx: 8, dy: -8 },    // T wave (medium positive dome)
      { dx: 8, dy: 0 },     // U wave / baseline transition
      { dx: 35, dy: 0 },    // Baseline wait
    ];

    let points = [];
    let x = 0;
    
    // Resize handler
    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        h = canvas.height = height;
      }
    };
    window.addEventListener('resize', handleResize);

    const midY = h / 2;

    const animate = () => {
      if (!ctx) return;

      // Subtle trace fade
      ctx.fillStyle = 'rgba(5, 5, 5, 0.12)';
      ctx.fillRect(0, 0, width, h);

      // Draw faint background grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Generate ECG pattern progression
      if (points.length === 0 || points[points.length - 1].x < width + 50) {
        // Find current pattern index based on last point position
        let lastX = points.length > 0 ? points[points.length - 1].x : 0;
        let lastY = points.length > 0 ? points[points.length - 1].y : midY;
        
        for (let i = 0; i < ecgPattern.length; i++) {
          const node = ecgPattern[i];
          lastX += node.dx;
          // Scale vertical deflection
          const targetY = midY + node.dy;
          points.push({ x: lastX, y: targetY });
        }
      }

      // Move points from right to left
      points.forEach((p) => {
        p.x -= speed;
      });

      // Remove points that slid off-screen
      points = points.filter((p) => p.x > -50);

      // Draw the glowing trace line
      ctx.beginPath();
      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          // Smooth curves using quadratics or linear segments
          ctx.lineTo(points[i].x, points[i].y);
        }
      }

      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Draw glowing scanning indicator head
      if (points.length > 0) {
        const leadPoint = points.find((p) => p.x > 0 && p.x < width);
        if (leadPoint) {
          ctx.beginPath();
          ctx.arc(leadPoint.x, leadPoint.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [height, color, speed]);

  return (
    <div className="w-full relative overflow-hidden bg-black/80 border border-gray-800 rounded-xl p-2">
      <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Lead II Realtime Monitor</span>
      </div>
      <canvas ref={canvasRef} className="w-full block" />
    </div>
  );
};

export default ECGHeartbeat;
