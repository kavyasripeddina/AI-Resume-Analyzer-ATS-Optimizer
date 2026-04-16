import React, { useEffect, useRef } from 'react';

const DynamicStarBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars = [];
    const numStars = 400; // High density for space theme
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    function Star() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random() * width;
      this.radius = Math.random() * 1.5 + 0.5;
      this.baseAlpha = Math.random() * 0.5 + 0.5;
    }

    Star.prototype.update = function() {
      this.z -= 1.5;
      if (this.z <= 0) {
        this.z = width;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
      }
    };

    Star.prototype.draw = function() {
      let x, y, radius;
      
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const offsetX = (mouse.x - width / 2) * (1 - this.z / width) * 0.2;
      const offsetY = (mouse.y - height / 2) * (1 - this.z / width) * 0.2;

      x = (this.x - width / 2) * (width / this.z) + width / 2 + offsetX;
      y = (this.y - height / 2) * (width / this.z) + height / 2 + offsetY;
      radius = this.radius * (width / this.z);

      const alpha = Math.max(0, Math.min(1, this.baseAlpha * (1 - this.z / width) * 1.5));
      
      const isTeal = Math.random() > 0.5;
      const isViolet = Math.random() > 0.8;
      
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.1, radius), 0, Math.PI * 2);
      
      if (isTeal) {
         ctx.fillStyle = `rgba(20, 184, 166, ${alpha})`;
      } else if (isViolet) {
         ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
      } else {
         ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      }
      
      ctx.fill();
      ctx.closePath();
    };

    // Networking lines for close stars to give "AI/Tech" feel
    const drawConnections = () => {
      // For performance, only connect a subset
      const connectRadius = 100;
      for (let i = 0; i < 80; i++) {
        for (let j = i + 1; j < 80; j++) {
           let x1 = (stars[i].x - width / 2) * (width / stars[i].z) + width / 2;
           let y1 = (stars[i].y - height / 2) * (width / stars[i].z) + height / 2;
           let x2 = (stars[j].x - width / 2) * (width / stars[j].z) + width / 2;
           let y2 = (stars[j].y - height / 2) * (width / stars[j].z) + height / 2;

           const dx = x1 - x2;
           const dy = y1 - y2;
           const dist = Math.sqrt(dx*dx + dy*dy);
           
           if(dist < connectRadius) {
              const alpha = (1 - dist/connectRadius) * 0.15; // Fade out by distance
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.strokeStyle = `rgba(20, 184, 166, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
           }
        }
      }
    };

    for (let i = 0; i < numStars; i++) {
      stars.push(new Star());
    }

    const animate = () => {
      // Trail effect
      ctx.fillStyle = 'rgba(10, 11, 15, 0.3)'; // Match var(--color-bg) but translucent
      ctx.fillRect(0, 0, width, height);
      
      stars.forEach((star) => {
        star.update();
        star.draw();
      });
      
      // Connecting web
      drawConnections();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'transparent'
      }}
    />
  );
};

export default DynamicStarBackground;
