import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// Helper function to combine class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// Beam definition (same as MyInterviews)
function createBeam(width, height) {
  const angle = -35 + Math.random() * 10;
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle: angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: 190 + Math.random() * 70,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

// Upload Card Component
function UploadCard({ title, description, icon, onUpload }) {
  return (
    <motion.div 
      className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-8 relative overflow-hidden"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 blur-3xl"></div>
      
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        
        <h3 className="text-2xl font-chakra font-semibold text-heading mb-2">{title}</h3>
        <p className="text-sm text-paragraph mb-6">{description}</p>
        
        <button 
          onClick={onUpload}
          className="py-2 px-6 bg-white/10 hover:bg-white/15 rounded-full text-sm font-medium text-heading transition-colors"
        >
          Upload Now
        </button>
      </div>
    </motion.div>
  );
}

// Main UploadCards component
function UploadCards() {
  const canvasRef = useRef(null);
  const beamsRef = useRef([]);
  const animationFrameRef = useRef(0);
  const MINIMUM_BEAMS = 20;
  const intensity = "medium";

  const opacityMap = {
    subtle: 0.7,
    medium: 0.85,
    strong: 1,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      const totalBeams = MINIMUM_BEAMS * 1.5;
      beamsRef.current = Array.from({ length: totalBeams }, () =>
        createBeam(canvas.width, canvas.height)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const resetBeam = (beam, index, totalBeams) => {
      const angle = -35 + Math.random() * 10;
      beam.x = Math.random() * canvas.width * 1.5 - canvas.width * 0.25;
      beam.y = -beam.length;
      beam.width = 30 + Math.random() * 60;
      beam.angle = angle;
      beam.speed = 0.6 + Math.random() * 1.2;
      beam.opacity = 0.12 + Math.random() * 0.16;
      beam.hue = 190 + Math.random() * 70;
    };

    const drawBeam = (ctx, beam) => {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);
      
      const gradient = ctx.createLinearGradient(0, 0, beam.width, 0);
      gradient.addColorStop(0, `hsla(${beam.hue}, 100%, 50%, 0)`);
      gradient.addColorStop(0.5, `hsla(${beam.hue}, 100%, 50%, ${beam.opacity})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, -beam.width / 2, beam.length, beam.width);
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      beamsRef.current.forEach((beam, index) => {
        beam.y += beam.speed;
        beam.pulse += beam.pulseSpeed;
        
        if (beam.y > canvas.height + beam.length) {
          resetBeam(beam, index, beamsRef.current.length);
        }
        
        drawBeam(ctx, beam);
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleResumeUpload = () => {
    // Handle resume upload logic
    console.log("Uploading resume...");
  };

  const handleJobRoleUpload = () => {
    // Handle job role upload logic
    console.log("Uploading job role...");
  };

  return (
    <div className="relative min-h-screen">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full -z-10"
        style={{ opacity: opacityMap[intensity] }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <UploadCard
            title="Upload Resume"
            description="Upload your resume to get personalized interview preparation"
            icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            onUpload={handleResumeUpload}
          />
          
          <UploadCard
            title="Job Role"
            description="Specify your target job role for customized interview questions"
            icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            onUpload={handleJobRoleUpload}
          />
        </div>
      </div>
    </div>
  );
}

export default UploadCards; 