import { useEffect, useRef } from 'react';
import SiriWave from 'siriwavejs';

const RecordingBlob = ({ isActive, stream }) => {
  const containerRef = useRef(null);
  const siriWaveRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isActive && stream && containerRef.current) {
      // Initialize SiriWave
      siriWaveRef.current = new SiriWave({
        container: containerRef.current,
        width: 200,
        height: 100,
        style: 'ios9',
        amplitude: 0,
        speed: 0.1,
        color: '#6366f1', // indigo-500
        frequency: 2,
        autostart: true,
      });

      // Create audio context and analyzer
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      // Connect the stream to the analyzer
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start analyzing audio levels
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!isActive) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        // Normalize the value between 0 and 1
        const normalizedLevel = Math.min(average / 128, 1);
        
        // Update SiriWave amplitude
        if (siriWaveRef.current) {
          siriWaveRef.current.setAmplitude(normalizedLevel);
        }
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // Clear the container instead of using dispose
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      siriWaveRef.current = null;
    };
  }, [isActive, stream]);

  return (
    <div className="relative w-48 h-24 flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default RecordingBlob; 