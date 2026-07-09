import { useEffect, useRef } from 'react';
import { BackgroundConfig } from '../types';

interface BackgroundSystemProps {
  config: BackgroundConfig;
}

export function BackgroundSystem({ config }: BackgroundSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read styles and controls from config
  const {
    type,
    opacity = 100,
    blur = 0,
    brightness = 100,
    darkOverlay = 40,
    zoom = 100,
    position = 'center',
    animationSpeed = 1,
    loop = true,
    muted = true,
    customFileBase64,
  } = config;

  // Render canvas animations
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Dynamic color helper
    const getRainbowColor = (tick: number, offset: number) => {
      const r = Math.sin(tick * 0.005 + offset) * 127 + 128;
      const g = Math.sin(tick * 0.005 + offset + 2) * 127 + 128;
      const b = Math.sin(tick * 0.005 + offset + 4) * 127 + 128;
      return `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, 0.45)`;
    };

    // --- Entity definition classes ---
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 3.5 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4 * animationSpeed;
        this.speedY = (Math.random() - 0.5) * 0.4 * animationSpeed;
        this.alpha = Math.random() * 0.5 + 0.25;
        this.color = `rgba(255, 255, 255, ${this.alpha})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > width) this.speedX *= -1;
        if (this.y < 0 || this.y > height) this.speedY *= -1;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
      }
    }

    class RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.length = Math.random() * 15 + 10;
        this.speed = (Math.random() * 8 + 6) * animationSpeed;
        this.opacity = Math.random() * 0.2 + 0.1;
      }

      update() {
        this.y += this.speed;
        if (this.y > height) {
          this.y = Math.random() * -100;
          this.x = Math.random() * width;
          this.speed = (Math.random() * 8 + 6) * animationSpeed;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.strokeStyle = `rgba(174, 207, 238, ${this.opacity})`;
        c.lineWidth = 1.2;
        c.moveTo(this.x, this.y);
        c.lineTo(this.x, this.y + this.length);
        c.stroke();
      }
    }

    class SnowFlake {
      x: number;
      y: number;
      radius: number;
      speed: number;
      wind: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 3 + 1;
        this.speed = (Math.random() * 1 + 0.5) * animationSpeed;
        this.wind = (Math.random() - 0.5) * 0.4 * animationSpeed;
        this.opacity = Math.random() * 0.4 + 0.2;
      }

      update() {
        this.y += this.speed;
        this.x += this.wind;

        if (this.y > height) {
          this.y = -10;
          this.x = Math.random() * width;
        }
        if (this.x < -10 || this.x > width + 10) {
          this.x = Math.random() * width;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
      }
    }

    class SakuraPetal {
      x: number;
      y: number;
      r: number;
      d: number;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height;
        this.r = Math.random() * 5 + 3; // petal size
        this.d = (Math.random() * 1 + 0.5) * animationSpeed; // density / speed
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() * 0.02 - 0.01) * animationSpeed;
      }

      update() {
        this.y += this.d * 1.2;
        this.x += Math.sin(this.y / 30) * 0.4 * animationSpeed;
        this.rotation += this.rotationSpeed;

        if (this.y > height) {
          this.y = -10;
          this.x = Math.random() * width;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);
        c.beginPath();
        // Draw elegant oval-like sakura petal
        c.ellipse(0, 0, this.r, this.r * 1.6, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255, 183, 197, 0.45)';
        c.fill();
        c.restore();
      }
    }

    class Star {
      x: number;
      y: number;
      size: number;
      twinkleSpeed: number;
      alpha: number;
      increasing: boolean;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.4;
        this.twinkleSpeed = (Math.random() * 0.005 + 0.002) * animationSpeed;
        this.alpha = Math.random() * 0.7 + 0.1;
        this.increasing = Math.random() > 0.5;
      }

      update() {
        if (this.increasing) {
          this.alpha += this.twinkleSpeed;
          if (this.alpha >= 0.8) this.increasing = false;
        } else {
          this.alpha -= this.twinkleSpeed;
          if (this.alpha <= 0.1) this.increasing = true;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
      }
    }

    class Firefly {
      x: number;
      y: number;
      size: number;
      angle: number;
      speed: number;
      pulsate: number;
      pulsateSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 4 + 2;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 0.3 + 0.1) * animationSpeed;
        this.pulsate = Math.random();
        this.pulsateSpeed = (Math.random() * 0.01 + 0.005) * animationSpeed;
      }

      update() {
        this.angle += (Math.random() * 0.1 - 0.05) * animationSpeed;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.pulsate += this.pulsateSpeed;
        if (this.pulsate > Math.PI) this.pulsate = 0;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(c: CanvasRenderingContext2D) {
        const glowAlpha = Math.sin(this.pulsate) * 0.5 + 0.15;
        const currentRadius = this.size * (1 + Math.sin(this.pulsate) * 0.3);

        const gradient = c.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          currentRadius * 2.5
        );
        gradient.addColorStop(0, `rgba(234, 179, 8, ${glowAlpha})`);
        gradient.addColorStop(0.3, `rgba(234, 179, 8, ${glowAlpha * 0.4})`);
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');

        c.beginPath();
        c.arc(this.x, this.y, currentRadius * 2.5, 0, Math.PI * 2);
        c.fillStyle = gradient;
        c.fill();
      }
    }

    class NebulaBlob {
      x: number;
      y: number;
      r: number;
      color: string;
      speed: number;
      angle: number;

      constructor(x: number, y: number, r: number, color: string, speed: number) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.color = color;
        this.speed = speed * animationSpeed;
        this.angle = Math.random() * Math.PI * 2;
      }

      update() {
        this.angle += this.speed * 0.02;
        // Float in a tiny orbit
        this.x += Math.cos(this.angle) * 0.12 * animationSpeed;
        this.y += Math.sin(this.angle) * 0.12 * animationSpeed;
      }

      draw(c: CanvasRenderingContext2D) {
        const grad = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
        grad.addColorStop(0, this.color);
        grad.addColorStop(0.5, this.color.replace('0.25', '0.08'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        c.beginPath();
        c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        c.fillStyle = grad;
        c.fill();
      }
    }

    // --- Instantiate Arrays based on current setting ---
    const particles: Particle[] = [];
    const rain: RainDrop[] = [];
    const snow: SnowFlake[] = [];
    const sakura: SakuraPetal[] = [];
    const stars: Star[] = [];
    const fireflies: Firefly[] = [];
    const nebulaBlobs: NebulaBlob[] = [];

    if (type === 'particles') {
      for (let i = 0; i < 45; i++) particles.push(new Particle());
    } else if (type === 'rain') {
      for (let i = 0; i < 80; i++) rain.push(new RainDrop());
    } else if (type === 'snow') {
      for (let i = 0; i < 60; i++) snow.push(new SnowFlake());
    } else if (type === 'sakura') {
      for (let i = 0; i < 35; i++) sakura.push(new SakuraPetal());
    } else if (type === 'stars' || type === 'galaxy') {
      for (let i = 0; i < 110; i++) stars.push(new Star());
      if (type === 'galaxy') {
        nebulaBlobs.push(new NebulaBlob(width * 0.3, height * 0.4, 180, 'rgba(236, 72, 153, 0.25)', 0.05));
        nebulaBlobs.push(new NebulaBlob(width * 0.7, height * 0.5, 230, 'rgba(168, 85, 247, 0.25)', 0.03));
        nebulaBlobs.push(new NebulaBlob(width * 0.5, height * 0.3, 190, 'rgba(59, 130, 246, 0.25)', 0.04));
      }
    } else if (type === 'fireflies') {
      for (let i = 0; i < 22; i++) fireflies.push(new Firefly());
    }

    let tick = 0;

    // --- Main Canvas Loop ---
    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      if (type === 'particles') {
        particles.forEach((p) => {
          p.update();
          p.draw(ctx);
        });

        // Draw connections between nearby particles
        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dist = Math.hypot(
              particles[i].x - particles[j].x,
              particles[i].y - particles[j].y
            );
            if (dist < 110) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - dist / 110) * 0.13})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
            }
          }
        }
        ctx.stroke();
      } else if (type === 'rain') {
        rain.forEach((r) => {
          r.update();
          r.draw(ctx);
        });
      } else if (type === 'snow') {
        snow.forEach((s) => {
          s.update();
          s.draw(ctx);
        });
      } else if (type === 'sakura') {
        sakura.forEach((p) => {
          p.update();
          p.draw(ctx);
        });
      } else if (type === 'stars' || type === 'galaxy') {
        stars.forEach((s) => {
          s.update();
          s.draw(ctx);
        });

        if (type === 'galaxy') {
          nebulaBlobs.forEach((b) => {
            b.update();
            b.draw(ctx);
          });
        }
      } else if (type === 'fireflies') {
        fireflies.forEach((f) => {
          f.update();
          f.draw(ctx);
        });
      } else if (type === 'gradient' || type === 'aurora') {
        // Draw custom modern dynamic backdrops directly on canvas
        const grad = ctx.createLinearGradient(0, 0, width, height);
        if (type === 'gradient') {
          grad.addColorStop(0, '#09090b');
          grad.addColorStop(0.5, '#18181b');
          grad.addColorStop(1, '#09090b');
        } else {
          // Animated Aurora shifts
          const col1 = getRainbowColor(tick, 0);
          const col2 = getRainbowColor(tick, Math.PI / 2);
          grad.addColorStop(0, '#020205');
          grad.addColorStop(0.4, col1);
          grad.addColorStop(0.8, col2);
          grad.addColorStop(1, '#05020a');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [type, animationSpeed]);

  // CSS Styles for standard presets
  const positionClass = {
    center: 'bg-center',
    top: 'bg-top',
    bottom: 'bg-bottom',
    left: 'bg-left',
    right: 'bg-right',
  }[position] || 'bg-center';

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none select-none transition-all duration-700 ease-out"
      style={{
        opacity: opacity / 100,
        filter: `blur(${blur}px) brightness(${brightness}%)`,
        transform: `scale(${zoom / 100})`,
      }}
    >
      {/* 1. RENDER STATIC IMAGE BACKGROUNDS */}
      {type === 'image' && (
        <div
          className={`absolute inset-0 w-full h-full bg-cover no-repeat ${positionClass} transition-all duration-700`}
          style={{
            backgroundImage: customFileBase64 ? `url(${customFileBase64})` : `url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000')`,
          }}
        />
      )}

      {/* 2. RENDER MP4 / WEBM VIDEO BACKGROUNDS */}
      {type === 'video' && customFileBase64 && (
        <video
          key={customFileBase64}
          autoPlay
          loop={loop}
          muted={muted}
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700`}
          style={{ objectPosition: position }}
        >
          <source src={customFileBase64} />
        </video>
      )}

      {/* 3. RENDER CANVAS BACKDROPS FOR HIGH FPS ANIMATIONS */}
      {(type === 'particles' ||
        type === 'rain' ||
        type === 'snow' ||
        type === 'sakura' ||
        type === 'stars' ||
        type === 'galaxy' ||
        type === 'fireflies' ||
        type === 'gradient' ||
        type === 'aurora') && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      )}

      {/* 4. RENDER AURORA/GRADIENT COMPLEMENTARY BACKDROPS */}
      {type === 'clouds' && (
        <div className="absolute inset-0 bg-slate-950 overflow-hidden">
          <div className="absolute -left-[20%] top-[10%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px] animate-pulse duration-[10000ms]" />
          <div className="absolute -right-[10%] bottom-[10%] w-[50%] h-[60%] rounded-full bg-sky-500/10 blur-[140px] animate-pulse duration-[14000ms]" />
          <div className="absolute left-[30%] top-[40%] w-[40%] h-[45%] rounded-full bg-pink-500/5 blur-[120px] animate-pulse duration-[8000ms]" />
        </div>
      )}

      {type === 'shapes' && (
        <div className="absolute inset-0 bg-zinc-950 overflow-hidden">
          <div className="absolute top-[20%] left-[15%] w-32 h-32 rounded-3xl bg-gradient-to-tr from-pink-500/15 to-purple-500/5 border border-white/5 blur-sm animate-bounce" style={{ animationDuration: '12s' }} />
          <div className="absolute bottom-[30%] right-[20%] w-44 h-44 rounded-full bg-gradient-to-br from-blue-500/15 to-emerald-500/5 border border-white/5 blur-sm animate-bounce" style={{ animationDuration: '18s' }} />
          <div className="absolute top-[50%] right-[10%] w-24 h-24 rotate-45 rounded-xl bg-gradient-to-bl from-yellow-500/10 to-orange-500/5 border border-white/5 blur-xs animate-spin" style={{ animationDuration: '30s' }} />
        </div>
      )}

      {/* 5. BLACK SOLID DARK OVERLAY ON TOP OF BACKGROUND LAYER */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500 pointer-events-none"
        style={{ opacity: darkOverlay / 100 }}
      />
    </div>
  );
}
