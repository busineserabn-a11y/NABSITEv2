import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, QrCode, Store, Utensils, Laptop, Building2, ShieldCheck } from 'lucide-react';

interface HeroMotionVisualProps {
  motionIntensity?: 'low' | 'medium' | 'high' | 'off';
  enableHandAnimation?: boolean;
  enableParticles?: boolean;
  enableFloatingCards?: boolean;
  enableParallax?: boolean;
  enableGlow?: boolean;
}

export const HeroMotionVisual: React.FC<HeroMotionVisualProps> = ({
  motionIntensity = 'medium',
  enableHandAnimation = true,
  enableParticles = true,
  enableFloatingCards = true,
  enableParallax = true,
  enableGlow = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user system reduced-motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Intensity multiplier
  const intensityFactor =
    motionIntensity === 'off' || prefersReducedMotion
      ? 0
      : motionIntensity === 'low'
      ? 0.4
      : motionIntensity === 'high'
      ? 1.4
      : 1.0;

  // Track cursor coordinates relative to container center
  useEffect(() => {
    if (!enableParallax || intensityFactor === 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left - rect.width / 2;
      const clientY = e.clientY - rect.top - rect.height / 2;
      setMousePos((prev) => ({
        ...prev,
        targetX: clientX / (rect.width / 2),
        targetY: clientY / (rect.height / 2),
      }));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = touch.clientX - rect.left - rect.width / 2;
      const clientY = touch.clientY - rect.top - rect.height / 2;
      setMousePos((prev) => ({
        ...prev,
        targetX: (clientX / (rect.width / 2)) * 0.5,
        targetY: (clientY / (rect.height / 2)) * 0.5,
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enableParallax, intensityFactor]);

  // Smooth lerp animation loop for mouse movement
  useEffect(() => {
    let animFrame: number;
    const updateLerp = () => {
      setMousePos((prev) => {
        const dx = (prev.targetX - prev.x) * 0.08;
        const dy = (prev.targetY - prev.y) * 0.08;
        return {
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        };
      });
      animFrame = requestAnimationFrame(updateLerp);
    };
    animFrame = requestAnimationFrame(updateLerp);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Particle Canvas for Constellation & Connection Beam
  useEffect(() => {
    if (!enableParticles || intensityFactor === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
    }> = [];

    const numParticles = Math.floor(35 * intensityFactor);
    const colors = ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24', '#e2e8f0'];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4 * intensityFactor,
        vy: (Math.random() - 0.5) * 0.4 * intensityFactor,
        radius: Math.random() * 2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.2,
      });
    }

    let frameId: number;
    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Central connection pulse zone
      const centerX = width / 2;
      const centerY = height / 2 + 10;
      const pulseRadius = (Math.sin(time * 2) * 15 + 40) * intensityFactor;

      // Draw subtle energy lines between nearby particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.2 * (1 - dist / 85) * intensityFactor})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles with slight magnetic pull toward center
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw central light aura
      if (enableGlow) {
        const radGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          pulseRadius * 2.5
        );
        radGrad.addColorStop(0, `rgba(251, 191, 36, ${0.25 * intensityFactor})`);
        radGrad.addColorStop(0.5, `rgba(16, 185, 129, ${0.12 * intensityFactor})`);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, [enableParticles, intensityFactor, enableGlow]);

  // CSS Parallax Offsets
  const tiltX = mousePos.x * 12 * intensityFactor;
  const tiltY = mousePos.y * 10 * intensityFactor;
  const cardTiltX = mousePos.x * -18 * intensityFactor;
  const cardTiltY = mousePos.y * -14 * intensityFactor;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-6xl mx-auto h-[380px] sm:h-[460px] md:h-[520px] lg:h-[560px] flex items-center justify-center select-none overflow-hidden"
    >
      {/* Background Ambience Glow */}
      {enableGlow && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[300px] bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-sky-500/20 rounded-full blur-3xl" />
        </div>
      )}

      {/* Particle Canvas */}
      {enableParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />
      )}

      {/* Cinematic Digital Hands Composition SVG */}
      <div
        className="relative w-full h-full flex items-center justify-center z-10"
        style={{
          transform: `perspective(1000px) rotateY(${tiltX * 0.4}deg) rotateX(${-tiltY * 0.4}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full object-contain pointer-events-none filter drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Cyber Gradient */}
            <linearGradient id="cyberArmGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="85%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            {/* Circuit Glow */}
            <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Human Hand Gradient */}
            <linearGradient id="humanArmGrad" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#1e293b" />
              <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fef3c7" />
            </linearGradient>

            {/* Radial Spark Pulse */}
            <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fbbf24" />
              <stop offset="70%" stopColor="#10b981" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* BACKGROUND SUBTLE TECHNICAL GRID LINES */}
          <g opacity="0.15" stroke="#94a3b8" strokeWidth="0.75" strokeDasharray="4 6">
            <line x1="100" y1="300" x2="900" y2="300" />
            <line x1="500" y1="100" x2="500" y2="500" />
            <circle cx="500" cy="300" r="120" />
            <circle cx="500" cy="300" r="220" />
          </g>

          {/* 1. LEFT SIDE: DIGITAL / CYBERNETIC / AI HAND */}
          <g
            className={enableHandAnimation && intensityFactor > 0 ? 'animate-hand-left' : ''}
            style={{
              transformOrigin: '200px 300px',
            }}
          >
            {/* Cyber Arm Chassis */}
            <path
              d="M -40 370 L 140 350 L 220 335 L 290 325 L 340 310 L 390 295 L 435 285 L 475 285 Q 482 285 484 288 Q 484 292 478 296 L 430 315 L 380 335 L 320 365 L 230 400 L 120 425 L -40 460 Z"
              fill="url(#cyberArmGrad)"
              stroke="#0284c7"
              strokeWidth="1.5"
              opacity="0.9"
            />

            {/* Cyber Joint Plates & Mechanical Segments */}
            <path
              d="M 160 340 L 210 328 L 240 375 L 180 395 Z"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <path
              d="M 270 318 L 320 305 L 345 348 L 290 365 Z"
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />

            {/* Digital Robotic Fingers */}
            {/* Thumb */}
            <path
              d="M 330 355 L 380 380 L 410 395 L 415 390 L 380 365 L 340 340 Z"
              fill="#0f172a"
              stroke="#38bdf8"
              strokeWidth="1.2"
            />
            {/* Middle Finger */}
            <path
              d="M 380 315 L 430 310 L 465 310 L 460 318 L 420 322 L 375 328 Z"
              fill="#1e293b"
              stroke="#0284c7"
              strokeWidth="1"
            />
            {/* Ring / Pinky */}
            <path
              d="M 360 330 L 410 335 L 445 340 L 440 348 L 400 348 L 350 345 Z"
              fill="#0f172a"
              stroke="#0284c7"
              strokeWidth="1"
            />

            {/* Glowing Circuit Node Lines on Cyber Hand */}
            <g filter="url(#neonGlow)">
              <path
                d="M 40 390 L 160 370 L 230 355 L 320 335 L 410 300 L 478 288"
                stroke="url(#circuitGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                className="animate-pulse"
              />
              <circle cx="230" cy="355" r="4" fill="#38bdf8" />
              <circle cx="320" cy="335" r="4" fill="#38bdf8" />
              <circle cx="410" cy="300" r="4.5" fill="#f59e0b" />
              <circle cx="482" cy="288" r="5" fill="#fbbf24" />
            </g>
          </g>

          {/* 2. RIGHT SIDE: ORGANIC / HUMAN HAND */}
          <g
            className={enableHandAnimation && intensityFactor > 0 ? 'animate-hand-right' : ''}
            style={{
              transformOrigin: '800px 300px',
            }}
          >
            {/* Human Arm & Palm Silhouette */}
            <path
              d="M 1040 390 L 860 365 L 770 345 L 690 330 L 630 315 L 570 300 L 522 292 Q 514 290 514 286 Q 518 282 528 284 L 585 292 L 650 305 L 720 335 L 800 375 L 900 410 L 1040 450 Z"
              fill="url(#humanArmGrad)"
              stroke="#f59e0b"
              strokeWidth="1.5"
              opacity="0.92"
            />

            {/* Human Thumb & Fingers */}
            {/* Thumb */}
            <path
              d="M 680 345 L 620 375 L 585 390 L 580 382 L 625 358 L 665 330 Z"
              fill="#1e293b"
              stroke="#f59e0b"
              strokeWidth="1.2"
            />
            {/* Middle Finger */}
            <path
              d="M 620 318 L 565 315 L 530 315 L 535 322 L 575 325 L 625 330 Z"
              fill="#1e293b"
              stroke="#f59e0b"
              strokeWidth="1"
            />
            {/* Ring / Pinky */}
            <path
              d="M 640 335 L 590 340 L 555 345 L 560 352 L 600 350 L 650 345 Z"
              fill="#0f172a"
              stroke="#f59e0b"
              strokeWidth="1"
            />

            {/* Golden Energy Veins on Human Hand */}
            <g filter="url(#neonGlow)">
              <path
                d="M 960 410 L 840 385 L 750 355 L 660 328 L 580 305 L 522 288"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="8 4"
                opacity="0.85"
                className="animate-pulse"
              />
              <circle cx="750" cy="355" r="3.5" fill="#f59e0b" />
              <circle cx="660" cy="328" r="4" fill="#fbbf24" />
              <circle cx="580" cy="305" r="4.5" fill="#fef3c7" />
              <circle cx="518" cy="286" r="5" fill="#ffffff" />
            </g>
          </g>

          {/* 3. CENTER CONTACT SPARK & CONNECTION PULSE */}
          <g className="animate-pulse">
            {/* Expanding Concentric Rings */}
            <circle
              cx="500"
              cy="287"
              r="18"
              stroke="#fbbf24"
              strokeWidth="1.5"
              opacity="0.6"
              className="animate-ping"
              style={{ animationDuration: '3s' }}
            />
            <circle
              cx="500"
              cy="287"
              r="34"
              stroke="#10b981"
              strokeWidth="1"
              opacity="0.4"
              className="animate-ping"
              style={{ animationDuration: '4.5s' }}
            />

            {/* Radiant Spark Core */}
            <circle cx="500" cy="287" r="14" fill="url(#sparkGlow)" filter="url(#neonGlow)" />
            <circle cx="500" cy="287" r="4.5" fill="#ffffff" />

            {/* Dynamic Energy Arc */}
            <path
              d="M 482 288 Q 500 275 518 286"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#neonGlow)"
            />
          </g>
        </svg>

        {/* 4. FLOATING NABSITE WEBSITE CARDS WITH ORBIT PARALLAX */}
        {enableFloatingCards && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${cardTiltX}px, ${cardTiltY}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            {/* Card 1: Bole Prime QR Menu (Top Left) */}
            <div className="absolute top-4 sm:top-8 left-4 sm:left-10 md:left-16 p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 shadow-2xl shadow-amber-500/10 flex items-center gap-3 animate-float-slow">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="text-left pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-[9px] font-mono text-amber-400 font-extrabold uppercase tracking-wider">
                    QR DIGITAL MENU
                  </span>
                </div>
                <p className="text-xs font-black text-white">Bole Prime Grill</p>
                <p className="text-[10px] text-slate-400">18 Custom Layouts</p>
              </div>
            </div>

            {/* Card 2: Live Table Stand QR (Top Right) */}
            <div className="absolute top-6 sm:top-10 right-4 sm:right-10 md:right-16 p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-emerald-500/40 shadow-2xl shadow-emerald-500/10 flex items-center gap-3 animate-float-medium">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase">
                    PRINTED ACRYLIC STAND
                  </span>
                </div>
                <p className="text-xs font-black text-white">Table Stand #08</p>
                <p className="text-[10px] text-emerald-400 font-semibold">&lt; 40ms Scan &amp; Load</p>
              </div>
            </div>

            {/* Card 3: 324 Bespoke Architectures (Bottom Left) */}
            <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-14 md:left-24 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-sky-500/40 shadow-2xl flex items-center gap-3 animate-float-delayed">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs">
                324
              </div>
              <div className="text-left pr-1">
                <p className="text-[11px] font-black text-white">Real Archetypes</p>
                <p className="text-[9px] text-slate-400">18 Industries × 18 Systems</p>
              </div>
            </div>

            {/* Card 4: Verified Ethiopian Commercials (Bottom Right) */}
            <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-14 md:right-24 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 shadow-2xl flex items-center gap-3 animate-float-slow">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
              <div className="text-left pr-1">
                <p className="text-[11px] font-black text-white">100% Commercial Trust</p>
                <p className="text-[9px] text-emerald-400 font-semibold">Instant Telegram &amp; Call</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Keyframe Animations for Smooth Movement */}
      <style>{`
        @keyframes handReachLeft {
          0%, 100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          50% {
            transform: translate(16px, -4px) rotate(1.2deg);
          }
        }
        @keyframes handReachRight {
          0%, 100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          50% {
            transform: translate(-14px, 3px) rotate(-1deg);
          }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatDelayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }

        .animate-hand-left {
          animation: handReachLeft 6s ease-in-out infinite;
        }
        .animate-hand-right {
          animation: handReachRight 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: floatSlow 5s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: floatMedium 6.5s ease-in-out infinite 1s;
        }
        .animate-float-delayed {
          animation: floatDelayed 7s ease-in-out infinite 2s;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-hand-left,
          .animate-hand-right,
          .animate-float-slow,
          .animate-float-medium,
          .animate-float-delayed {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
