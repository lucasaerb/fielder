import React, { useRef, useEffect } from 'react';

const Metamorphosis: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const numLines = 120;
    const lineSegments = 180;
    const baseLineAlpha = 0.5;
    const baseLineWidth = 0.6;
    const rotateSpeed = 0.00025;

    // Organic breathing parameters for natural flow
    const baseBreathingSpeed = 0.003;
    const baseBreathingAmplitude = 0.4;
    const secondaryBreathSpeed = 0.005;
    const tertiaryBreathSpeed = 0.007;

    let time = 2000;

    const forms = [
      (u: number, v: number, t: number) => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        
        // Natural flowing breathing patterns
        const breathe = 1 + baseBreathingAmplitude * Math.sin(t * baseBreathingSpeed) * 
                       (0.5 + 0.3 * Math.sin(t * secondaryBreathSpeed + phi * 2));
        
        // Organic pulsing for natural movement
        const organicPulse = 1 + 0.15 * Math.sin(t * baseBreathingSpeed * 1.2) * Math.cos(t * tertiaryBreathSpeed);
        
        let r = (120 + 30 * Math.sin(phi * 4 + theta * 2)) * breathe * organicPulse;
        r += 20 * Math.sin(phi * 6) * Math.cos(theta * 3) * breathe;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi) + 20 * Math.sin(theta * 5 + phi * 3) * breathe * organicPulse;
        return { x, y, z };
      },
      (u: number, v: number, t: number) => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        
        // Flowing expansion patterns
        const breathe = 1 + baseBreathingAmplitude * 0.8 * Math.cos(t * baseBreathingSpeed + Math.PI / 3) * 
                       (0.6 + 0.4 * Math.cos(t * tertiaryBreathSpeed + theta));
        
        // Smooth flowing waves
        const flowingWave = 1 + 0.12 * Math.cos(t * baseBreathingSpeed * 0.8) * Math.sin(t * secondaryBreathSpeed);
        
        let r = (150 + 20 * Math.cos(phi * 8)) * breathe * flowingWave;
        r *= (0.8 + 0.2 * Math.abs(Math.cos(theta * 2))) * breathe;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi) * (0.8 + 0.3 * Math.sin(theta * 4)) * breathe * flowingWave;
        return { x, y, z };
      },
      (u: number, v: number, t: number) => {
        const theta = u * Math.PI * 2;
        const phi = v * Math.PI;
        
        // Natural rhythmic breathing
        const breathe = 1 + baseBreathingAmplitude * 0.9 * Math.sin(t * baseBreathingSpeed + Math.PI / 2) * 
                       (0.4 + 0.6 * Math.sin(t * secondaryBreathSpeed + phi + theta));
        
        // Gentle organic morphing
        const organicMorph = 1 + 0.18 * Math.sin(t * baseBreathingSpeed * 1.1 + phi) * Math.cos(t * tertiaryBreathSpeed * 0.7);
        
        let r = 120 * breathe * organicMorph;
        r += 50 * Math.sin(phi * 3) * Math.sin(theta * 2.5) * breathe * organicMorph;
        r += 30 * Math.cos(phi * 5 + theta) * breathe;
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        const hollow = Math.max(0, Math.sin(phi * 2 + theta * 3) - 0.7);
        r *= (1 - hollow * 0.8) * breathe * organicMorph;
        return { x, y, z };
      }
    ];

    const interpolateForms = (formA: any, formB: any, u: number, v: number, t: number, blend: number) => {
      const pointA = formA(u, v, t);
      const pointB = formB(u, v, t);
      return {
        x: pointA.x * (1 - blend) + pointB.x * blend,
        y: pointA.y * (1 - blend) + pointB.y * blend,
        z: pointA.z * (1 - blend) + pointB.z * blend
      };
    };

    const getCurrentForm = (u: number, v: number, t: number) => {
      const totalForms = forms.length;
      const cycleTime = 600;
      const position = (t % (cycleTime * totalForms)) / cycleTime;
      const formIndex = Math.floor(position);
      const nextFormIndex = (formIndex + 1) % totalForms;
      const rawBlend = position - formIndex;
      const pauseTime = 0;
      const transitionTime = 1 - (pauseTime * 2);
      let blend;
      if (rawBlend < pauseTime) {
        blend = 0;
      } else if (rawBlend > (1 - pauseTime)) {
        blend = 1;
      } else {
        const normalizedTime = (rawBlend - pauseTime) / transitionTime;
        blend = normalizedTime < 0.5 
          ? 4 * normalizedTime * normalizedTime * normalizedTime 
          : 1 - Math.pow(-2 * normalizedTime + 2, 3) / 2;
      }
      return interpolateForms(
        forms[formIndex],
        forms[nextFormIndex],
        u, v, t, blend
      );
    };

    const animate = () => {
      // Natural flowing breathing effects
      const primaryBreath = Math.sin(time * baseBreathingSpeed);
      const secondaryBreath = Math.cos(time * secondaryBreathSpeed);
      const tertiaryBreath = Math.sin(time * tertiaryBreathSpeed);
      
      // Organic scaling with natural rhythm
      const organicScale = 1 + 0.12 * primaryBreath + 0.06 * secondaryBreath + 0.04 * tertiaryBreath;
      
      // Natural opacity flow
      const flowingAlpha = baseLineAlpha * (0.75 + 0.25 * (primaryBreath * 0.5 + 0.5));
      
      // Gentle line weight variation
      const flowingLineWidth = baseLineWidth * (0.85 + 0.3 * (secondaryBreath * 0.4 + 0.6));

      // Clear with transparent background
      ctx.clearRect(0, 0, width, height);

      // Smooth natural rotation
      const rotateZ = time * rotateSpeed * 0.1;

      // Cool rainbow spring/autumn color palette function
      const getSeasonalColor = (position: number, variation: number = 0) => {
        const colors = [
          { r: 102, g: 187, b: 106 }, // Spring green
          { r: 66, g: 165, b: 245 },  // Cool blue
          { r: 156, g: 39, b: 176 },  // Purple
          { r: 255, g: 152, b: 0 },   // Autumn orange
          { r: 244, g: 67, b: 54 },   // Coral red
          { r: 0, g: 150, b: 136 },   // Teal
          { r: 255, g: 193, b: 7 },   // Golden yellow
          { r: 63, g: 81, b: 181 },   // Indigo
          { r: 139, g: 69, b: 19 },   // Saddle brown
          { r: 76, g: 175, b: 80 }    // Forest green
        ];
        
        const colorIndex = (position + variation + time * 0.004) % colors.length; // Natural color cycling
        const colorA = colors[Math.floor(colorIndex)];
        const colorB = colors[Math.ceil(colorIndex) % colors.length];
        const blend = colorIndex % 1;
        
        const r = Math.round(colorA.r * (1 - blend) + colorB.r * blend);
        const g = Math.round(colorA.g * (1 - blend) + colorB.g * blend);
        const b = Math.round(colorA.b * (1 - blend) + colorB.b * blend);
        
        return { r, g, b };
      };

      for (let i = 0; i < numLines; i++) {
        const v = i / (numLines - 1);
        ctx.beginPath();
        
        // Natural local breathing variation
        const localBreathing = 1 + 0.12 * Math.sin(time * baseBreathingSpeed + v * Math.PI * 2);
        const dynamicAlpha = flowingAlpha * localBreathing;
        
        // Natural color flow
        const colorPos = v * 5 + time * 0.002; // Gentle color position flow
        const color = getSeasonalColor(colorPos);
        
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${dynamicAlpha})`;
        ctx.lineWidth = flowingLineWidth;

        let lastPointVisible = false;

        for (let j = 0; j <= lineSegments; j++) {
          const u = j / lineSegments;
          const point = getCurrentForm(u, v, time);

          const rotatedX = point.x * Math.cos(rotateZ) - point.y * Math.sin(rotateZ);
          const rotatedY = point.x * Math.sin(rotateZ) + point.y * Math.cos(rotateZ);
          const rotatedZ = point.z;

          const scale = (1.35 + rotatedZ * 0.001) * organicScale;
          const projX = width / 2 + rotatedX * scale;
          const projY = height / 2 + rotatedY * scale;

          const pointVisible = rotatedZ > -50;

          if (j === 0) {
            if (pointVisible) {
              ctx.moveTo(projX, projY);
              lastPointVisible = true;
            }
          } else {
            if (pointVisible && lastPointVisible) {
              ctx.lineTo(projX, projY);
            } else if (pointVisible && !lastPointVisible) {
              ctx.moveTo(projX, projY);
            }
          }

          lastPointVisible = pointVisible;
        }
        ctx.stroke();
      }

      // Secondary lines with natural flow
      for (let i = 0; i < numLines * 0.3; i++) {
        const u = i / (numLines * 0.3 - 1);
        ctx.beginPath();
        
        const localBreathing = 1 + 0.08 * Math.cos(time * secondaryBreathSpeed + u * Math.PI * 3);
        const secondaryAlpha = flowingAlpha * 0.7 * localBreathing;
        
        // Secondary color flow with different pattern
        const colorPos = u * 7 + time * 0.003;
        const color = getSeasonalColor(colorPos, 2);
        
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${secondaryAlpha})`;
        ctx.lineWidth = flowingLineWidth * 0.7;

        let lastPointVisible = false;

        for (let j = 0; j <= lineSegments * 0.5; j++) {
          const v = j / (lineSegments * 0.5);
          const point = getCurrentForm(u, v, time);

          const rotatedX = point.x * Math.cos(rotateZ) - point.y * Math.sin(rotateZ);
          const rotatedY = point.x * Math.sin(rotateZ) + point.y * Math.cos(rotateZ);
          const rotatedZ = point.z;

          const scale = (1.35 + rotatedZ * 0.001) * organicScale;
          const projX = width / 2 + rotatedX * scale;
          const projY = height / 2 + rotatedY * scale;

          const pointVisible = rotatedZ > -50;

          if (j === 0) {
            if (pointVisible) {
              ctx.moveTo(projX, projY);
              lastPointVisible = true;
            }
          } else {
            if (pointVisible && lastPointVisible) {
              ctx.lineTo(projX, projY);
            } else if (pointVisible && !lastPointVisible) {
              ctx.moveTo(projX, projY);
            }
          }

          lastPointVisible = pointVisible;
        }
        ctx.stroke();
      }

      // Natural time progression
      time += 0.5;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (canvas && ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <canvas ref={canvasRef} width={560} height={560} />
    </div>
  );
};

export default Metamorphosis; 