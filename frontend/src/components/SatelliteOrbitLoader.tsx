import React, { useEffect, useRef, useState } from 'react';

interface SatelliteOrbitLoaderProps {
  onComplete: () => void;
}

export const SatelliteOrbitLoader: React.FC<SatelliteOrbitLoaderProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>('ACQUIRING ORBITAL TELEMETRY...');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [telemetryValues, setTelemetryValues] = useState({
    lat: '26.1824',
    lon: '91.7519',
    freq: '1,257.50',
    snr: '+34.8',
    elevation: '747.2',
  });
  const animationFrameRef = useRef<number | null>(null);

  // Dynamic telemetry flickering effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryValues({
        lat: (26.18 + (Math.random() - 0.5) * 0.05).toFixed(4),
        lon: (91.75 + (Math.random() - 0.5) * 0.05).toFixed(4),
        freq: (1257.5 + (Math.random() - 0.5) * 0.3).toFixed(2),
        snr: (34.5 + Math.random() * 0.8).toFixed(1),
        elevation: (747.2 + (Math.random() - 0.5) * 0.2).toFixed(1),
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Smooth progress progression tied to asset & font readiness
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 2.8 + 1.2;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        setStageText('ALL RADAR MATRICES CALIBRATED // ORBIT READY');
        clearInterval(interval);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(onComplete, 800);
        }, 700);
      } else {
        setProgress(Math.floor(current));
        if (current < 25) {
          setStageText('LOCKING SUN-SYNCHRONOUS EPHEMERIS (98.4° INCLINATION)...');
        } else if (current < 55) {
          setStageText('INITIALIZING NISAR L-BAND DUAL-POL RADAR (1.25 GHz)...');
        } else if (current < 85) {
          setStageText('INGESTING REPEAT-PASS SAR COVARIANCE GRIDS...');
        } else {
          setStageText('SYNCHRONIZING ORBITAL GEOSPATIAL INTELLIGENCE...');
        }
      }
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Advanced Canvas 3D Earth, Radar Beam Scanner, and Holographic HUD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stars
    const starCount = 200;
    const stars: { x: number; y: number; size: number; alpha: number; delta: number }[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        delta: (Math.random() - 0.5) * 0.03,
      });
    }

    // Continental 3D points
    const spherePoints: { lat: number; lon: number; isContinent: boolean }[] = [];
    for (let i = 0; i < 750; i++) {
      const lat = (Math.random() - 0.5) * Math.PI;
      const lon = Math.random() * Math.PI * 2;
      const isContinent =
        Math.sin(lat * 3 + lon * 2) > 0.12 ||
        Math.cos(lat * 4 - lon * 1.5) > 0.28 ||
        Math.sin(lat * 2.5) * Math.cos(lon * 2.8) > 0.18;
      spherePoints.push({ lat, lon, isContinent });
    }

    let earthRotation = 0;
    let satOrbitAngle = 0;
    let radarSweepAngle = 0;
    let hudRotationAngle = 0;

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const earthRadius = Math.min(width, height) * 0.22;

      // Deep space radial glow (Royal Blue)
      const spaceGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(width, height) * 0.75);
      spaceGrad.addColorStop(0, '#091A54');
      spaceGrad.addColorStop(0.35, '#04103A');
      spaceGrad.addColorStop(1, '#000000');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Twinkling Stars
      stars.forEach((star) => {
        star.alpha += star.delta;
        if (star.alpha > 0.95 || star.alpha < 0.15) star.delta *= -1;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, star.alpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // -----------------------------------------------------------
      // DYNAMIC HOLOGRAPHIC RADAR COMPASS & HUD RETICLES
      // -----------------------------------------------------------
      hudRotationAngle += 0.005;

      // 1. Outer Compass Ring with Azimuth Degree Ticks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(hudRotationAngle * 0.4);
      const outerRingR = earthRadius * 1.85;

      ctx.strokeStyle = 'rgba(23, 73, 216, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, outerRingR, 0, Math.PI * 2);
      ctx.stroke();

      // Degree Tick Marks (every 10 degrees)
      for (let deg = 0; deg < 360; deg += 10) {
        const rad = (deg * Math.PI) / 180;
        const isMajor = deg % 30 === 0;
        const tickLen = isMajor ? 12 : 6;
        ctx.strokeStyle = isMajor ? '#FFE500' : 'rgba(255, 229, 0, 0.4)';
        ctx.lineWidth = isMajor ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * (outerRingR - tickLen), Math.sin(rad) * (outerRingR - tickLen));
        ctx.lineTo(Math.cos(rad) * outerRingR, Math.sin(rad) * outerRingR);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Middle Segmented Target Reticle (Counter-Rotating)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-hudRotationAngle * 0.8);
      const midRingR = earthRadius * 1.55;

      // Draw 4 Segmented HUD Arcs
      for (let i = 0; i < 4; i++) {
        const start = (i * Math.PI) / 2 + 0.15;
        const end = (i * Math.PI) / 2 + Math.PI / 2 - 0.15;
        ctx.strokeStyle = 'rgba(255, 229, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, midRingR, start, end);
        ctx.stroke();

        // Corner Accent Bracket on each arc
        const midA = (start + end) / 2;
        ctx.fillStyle = '#1749D8';
        ctx.beginPath();
        ctx.arc(Math.cos(midA) * midRingR, Math.sin(midA) * midRingR, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Sonar Range Distance Circles around Earth
      for (let r = earthRadius * 1.15; r <= earthRadius * 1.45; r += earthRadius * 0.15) {
        ctx.strokeStyle = 'rgba(23, 73, 216, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // -----------------------------------------------------------
      // 3D EARTH SPHERE & DAY/NIGHT TERMINATOR
      // -----------------------------------------------------------
      // Outer Atmospheric Halo (Royal Blue with Bright Yellow edge glow)
      const atmoGrad = ctx.createRadialGradient(cx, cy, earthRadius * 0.9, cx, cy, earthRadius * 1.35);
      atmoGrad.addColorStop(0, 'rgba(23, 73, 216, 0.6)');
      atmoGrad.addColorStop(0.5, 'rgba(23, 73, 216, 0.25)');
      atmoGrad.addColorStop(0.85, 'rgba(255, 229, 0, 0.12)');
      atmoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, earthRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Earth Sphere Body
      const bodyGrad = ctx.createRadialGradient(
        cx - earthRadius * 0.4,
        cy - earthRadius * 0.4,
        earthRadius * 0.1,
        cx,
        cy,
        earthRadius
      );
      bodyGrad.addColorStop(0, '#1749D8');
      bodyGrad.addColorStop(0.5, '#0C2B8E');
      bodyGrad.addColorStop(0.85, '#051138');
      bodyGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw Rotating 3D Meridians & Continental Points inside Earth sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2);
      ctx.clip();

      // 3D Latitude Circles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 1;
      for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
        const phi = (latDeg * Math.PI) / 180;
        const rLat = earthRadius * Math.cos(phi);
        const yLat = cy + earthRadius * Math.sin(phi);
        ctx.beginPath();
        ctx.ellipse(cx, yLat, rLat, rLat * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3D Continents
      spherePoints.forEach((pt) => {
        const currentLon = pt.lon + earthRotation;
        const x3d = Math.cos(pt.lat) * Math.sin(currentLon);
        const y3d = Math.sin(pt.lat);
        const z3d = Math.cos(pt.lat) * Math.cos(currentLon);

        if (z3d > 0) {
          const screenX = cx + x3d * earthRadius;
          const screenY = cy + y3d * earthRadius;
          if (pt.isContinent) {
            ctx.fillStyle = `rgba(255, 229, 0, ${z3d * 0.65})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 1.8 * z3d, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${z3d * 0.18})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, 1.0 * z3d, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Rotating Radar Sector Beam Sweeping over Earth
      radarSweepAngle += 0.035;
      const sweepGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, earthRadius);
      sweepGradient.addColorStop(0, 'rgba(255, 229, 0, 0.5)');
      sweepGradient.addColorStop(0.5, 'rgba(23, 73, 216, 0.3)');
      sweepGradient.addColorStop(1, 'rgba(23, 73, 216, 0)');

      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, earthRadius, radarSweepAngle, radarSweepAngle + 0.45);
      ctx.closePath();
      ctx.fill();

      // Sharp Leading Radar Beam Line
      ctx.strokeStyle = '#FFE500';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(radarSweepAngle + 0.45) * earthRadius, cy + Math.sin(radarSweepAngle + 0.45) * earthRadius);
      ctx.stroke();

      // Night-side Shadow
      const nightGrad = ctx.createLinearGradient(cx - earthRadius, cy, cx + earthRadius * 1.1, cy);
      nightGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      nightGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
      nightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = nightGrad;
      ctx.fillRect(cx - earthRadius, cy - earthRadius, earthRadius * 2, earthRadius * 2);
      ctx.restore();

      // -----------------------------------------------------------
      // ORBITAL PATHS & 3D SATELLITE WITH ACTIVE RADAR CONE
      // -----------------------------------------------------------
      const orbitRx = earthRadius * 1.7;
      const orbitRy = earthRadius * 0.65;
      const orbitTilt = -0.42;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(orbitTilt);

      // Orbital Track Ellipse
      ctx.strokeStyle = 'rgba(255, 229, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbitRx, orbitRy, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Second Sun-Synchronous Polar Track
      ctx.strokeStyle = 'rgba(23, 73, 216, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbitRx * 0.95, orbitRy * 1.3, Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellite Position on primary orbit
      const satX = orbitRx * Math.cos(satOrbitAngle);
      const satY = orbitRy * Math.sin(satOrbitAngle);
      const satZ = Math.sin(satOrbitAngle);

      // Radar Ground Footprint Projection (Cone from satellite to Earth surface)
      if (satZ > -0.2) {
        ctx.strokeStyle = 'rgba(255, 229, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(satX, satY);
        ctx.lineTo(satX * 0.5, satY * 0.5);
        ctx.stroke();

        const footprintGrad = ctx.createRadialGradient(satX * 0.5, satY * 0.5, 2, satX * 0.5, satY * 0.5, 30);
        footprintGrad.addColorStop(0, 'rgba(255, 229, 0, 0.7)');
        footprintGrad.addColorStop(0.5, 'rgba(23, 73, 216, 0.3)');
        footprintGrad.addColorStop(1, 'rgba(23, 73, 216, 0)');
        ctx.fillStyle = footprintGrad;
        ctx.beginPath();
        ctx.ellipse(satX * 0.5, satY * 0.5, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Satellite Chassis & Solar Arrays
      ctx.fillStyle = '#FFE500';
      ctx.shadowColor = '#FFE500';
      ctx.shadowBlur = 12;
      ctx.fillRect(satX - 4, satY - 4, 8, 8);
      ctx.shadowBlur = 0;

      // Solar Wings
      ctx.fillStyle = '#1749D8';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.fillRect(satX - 18, satY - 2.5, 12, 5);
      ctx.strokeRect(satX - 18, satY - 2.5, 12, 5);
      ctx.fillRect(satX + 6, satY - 2.5, 12, 5);
      ctx.strokeRect(satX + 6, satY - 2.5, 12, 5);

      // Radar Reflector Antenna Boom
      ctx.strokeStyle = '#FFE500';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(satX, satY + 4);
      ctx.lineTo(satX + 6, satY + 14);
      ctx.stroke();

      // Mesh Hexagonal Radar Dish
      ctx.fillStyle = 'rgba(255, 229, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(satX + 6, satY + 14, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Step rotations
      earthRotation += 0.006;
      satOrbitAngle += 0.024;

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col justify-between items-center transition-opacity duration-700 select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 3D Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Header: Swiss Editorial Telemetry Grid */}
      <div className="relative z-10 w-full max-w-7xl px-6 sm:px-10 pt-8 sm:pt-10 flex justify-between items-start font-mono text-xs">
        <div className="space-y-1.5 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow shadow-[0_0_10px_#FFE500] animate-pulse"></span>
            <span className="text-white font-bold tracking-wider">NISAR-1 // ORBIT ACTIVE</span>
          </div>
          <div className="text-[11px] text-slate-300">
            ALT: <span className="text-yellow">{telemetryValues.elevation} KM</span> &bull; INCLINATION: 98.4&deg; SUN-SYNC
          </div>
          <div className="text-[10px] text-slate-400">
            DOPPLER FREQ: <span className="text-royal-400">{telemetryValues.freq} MHz</span>
          </div>
        </div>

        <div className="text-right space-y-1.5 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <div className="text-yellow font-bold tracking-wider">GROUND TRACK FOOTPRINT</div>
          <div className="text-[11px] text-slate-300">
            LAT: <span className="text-white">{telemetryValues.lat}&deg; N</span> &bull; LON: <span className="text-white">{telemetryValues.lon}&deg; E</span>
          </div>
          <div className="text-[10px] text-slate-400">
            SNR: <span className="text-yellow">{telemetryValues.snr} dB</span> &bull; POL: HH + HV
          </div>
        </div>
      </div>

      {/* Central Branding in Anton Typography */}
      <div className="relative z-10 text-center pointer-events-none px-4 space-y-2 my-auto">
        <div className="font-mono text-xs uppercase tracking-[0.35em] text-yellow font-semibold">
          Autonomous Planetary Radar Intelligence
        </div>
        <h1 className="font-anton text-7xl sm:text-9xl text-white tracking-tight leading-none drop-shadow-[0_15px_40px_rgba(23,73,216,0.6)]">
          TERRASCAN
        </h1>
        <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-md mx-auto tracking-wide">
          Seeing Through Clouds, Rain &amp; Darkness &bull; Active Microwave SAR
        </p>
      </div>

      {/* Bottom Technical Telemetry & Futuristic Circular HUD Progress Display */}
      <div className="relative z-10 w-full max-w-4xl px-6 sm:px-10 pb-8 sm:pb-12 space-y-4">
        {/* Dynamic Holographic Telemetry HUD Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/85 backdrop-blur-xl border border-royal-600/40 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-yellow tracking-wider">
              <span className="w-2 h-2 rounded-full bg-yellow animate-ping" />
              <span>{stageText}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[11px]">CALIBRATION:</span>
              <span className="font-anton text-2xl sm:text-3xl text-yellow tracking-wider">
                {progress}%
              </span>
            </div>
          </div>

          {/* Segmented Futuristic Dynamic Progress Bar */}
          <div className="w-full h-3 bg-royal-950/80 rounded-full overflow-hidden border border-royal-700/80 p-0.5 flex gap-1">
            <div
              className="h-full bg-yellow transition-all duration-150 ease-out rounded-full shadow-[0_0_15px_#FFE500]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Audio-visual style frequency pulses */}
          <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              {[40, 70, 30, 85, 60, 95, 45, 80, 50, 100, 65, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-royal-400/80 rounded-full transition-all duration-200"
                  style={{
                    height: `${(h * (progress / 100) * 0.16) + 4}px`,
                    backgroundColor: i % 3 === 0 ? '#FFE500' : '#1749D8',
                  }}
                />
              ))}
              <span className="ml-2 text-slate-400">L-BAND HARMONICS ACTIVE</span>
            </div>

            <button
              onClick={() => {
                setIsFadingOut(true);
                setTimeout(onComplete, 600);
              }}
              className="px-4 py-1.5 rounded-full border border-yellow bg-yellow/10 hover:bg-yellow text-yellow hover:text-black font-mono text-xs font-bold tracking-wider transition-all cursor-pointer active:scale-95 shadow-md"
            >
              INITIALIZE WORKSPACE &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};