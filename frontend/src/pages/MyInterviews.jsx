import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Helper function to combine class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// Beam definition
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

// Interview Card Component
function InterviewCard({ title, date, score, questions }) {
  const progressColor = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-blue-500' : 'bg-red-500';
  
  return (
    <motion.div 
      className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 md:p-8 relative overflow-hidden"
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 blur-3xl"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-chakra font-semibold text-heading mb-1 sm:mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-paragraph">{date}</p>
        </div>
        
        <div className="flex items-center bg-white/5 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
          <div className="text-2xl sm:text-3xl font-bold text-heading mr-2">{score}%</div>
          <div className="text-xs sm:text-sm text-paragraph">{questions} questions</div>
        </div>
      </div>
      
      <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
        <div className="w-full bg-gray-700/30 rounded-full h-2 sm:h-3 overflow-hidden">
          <div className={`h-full ${progressColor}`} style={{ width: `${score}%` }}></div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="py-1.5 sm:py-2 px-4 sm:px-6 bg-white/10 hover:bg-white/15 rounded-full text-xs sm:text-sm font-medium text-heading transition-colors">
          View Details
        </button>
      </div>
    </motion.div>
  );
}

// Main MyInterviews page
function MyInterviews() {
  const canvasRef = useRef(null);
  const beamsRef = useRef([]);
  const animationFrameRef = useRef(0);
  const MINIMUM_BEAMS = 10;
  const intensity = "medium";
  const lastTimeRef = useRef(0);
  const fps = 60;
  const frameInterval = 1000 / fps;

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

    function resetBeam(beam, index, totalBeams) {
      if (!canvas) return beam;
      
      const column = index % 3;
      const spacing = canvas.width / 3;

      beam.y = canvas.height + 100;
      beam.x =
        column * spacing +
        spacing / 2 +
        (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 100 + Math.random() * 100;
      beam.speed = 0.5 + Math.random() * 0.4;
      beam.hue = 190 + (index * 70) / totalBeams;
      beam.opacity = 0.2 + Math.random() * 0.1;
      return beam;
    }

    function drawBeam(ctx, beam) {
      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity *
        (0.8 + Math.sin(beam.pulse) * 0.2) *
        opacityMap[intensity];

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`);
      gradient.addColorStop(0.1, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(0.4, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`);
      gradient.addColorStop(0.6, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`);
      gradient.addColorStop(0.9, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    }

    function animate(currentTime) {
      if (!canvas || !ctx) return;

      // Frame rate limiting
      if (currentTime - lastTimeRef.current < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTimeRef.current = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "blur(35px)";

      const totalBeams = beamsRef.current.length;
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams);
        }

        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="pt-20 sm:pt-24 md:pt-28">
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ filter: "blur(15px)" }}
        />

        <motion.div
          className="absolute inset-0 bg-neutral-950/5"
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 10,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          style={{
            backdropFilter: "blur(50px)",
          }}
        />

        <div className="relative z-10 flex min-h-screen w-full items-start justify-start">
          <div className="flex flex-col items-start justify-start gap-4 sm:gap-6 px-4 sm:px-8 md:px-16 w-full max-w-7xl mx-auto mt-4 sm:mt-6">
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-heading tracking-tighter font-zen text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              My Interviews
            </motion.h1>
            
            <motion.div
              className="mt-4 sm:mt-8 w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              {/* Interview Cards Section */}
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <InterviewCard 
                  title="Frontend Developer" 
                  date="May 15, 2023"
                  score={85}
                  questions={12}
                />
                <InterviewCard 
                  title="React Developer" 
                  date="June 2, 2023"
                  score={92}
                  questions={15}
                />
                <InterviewCard 
                  title="UI/UX Designer" 
                  date="July 10, 2023"
                  score={78}
                  questions={10}
                />
                <InterviewCard 
                  title="Full Stack Developer" 
                  date="August 22, 2023"
                  score={88}
                  questions={14}
                />
                <InterviewCard 
                  title="Backend Engineer" 
                  date="September 5, 2023"
                  score={95}
                  questions={18}
                />
                <InterviewCard 
                  title="DevOps Engineer" 
                  date="October 12, 2023"
                  score={82}
                  questions={16}
                />
                <InterviewCard 
                  title="Data Scientist" 
                  date="November 8, 2023"
                  score={91}
                  questions={20}
                />
                <InterviewCard 
                  title="Mobile Developer" 
                  date="December 15, 2023"
                  score={87}
                  questions={13}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyInterviews; 