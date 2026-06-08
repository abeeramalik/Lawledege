import { motion, AnimatePresence } from 'framer-motion';

const RagAvatar = ({ state }) => {
  const images = {
    idle: "https://i.ibb.co/FLTmmjQW/Idle.png",
    thinking: "https://i.ibb.co/yn0Mm5F9/Thinking.png",
    speaking: "https://i.ibb.co/KxTsmKHp/Speaking.png"
  };

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* THE YELLOW GLOW BACKDROP */}
        <motion.div 
          key="glow"
          animate={{ 
            scale: state === 'thinking' ? [1, 1.15, 1] : 1,
            opacity: state === 'speaking' ? 0.8 : 0.4 
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute w-40 h-40 md:w-48 md:h-48 rounded-full bg-[#F59E0B] blur-[40px] md:blur-[60px]"
        />

        {/* THE AVATAR IMAGE */}
        <motion.img 
          key={state}
          src={images[state]}
          alt={`Lawledge Guide ${state}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full h-full object-contain filter drop-shadow-2xl"
          onError={(e) => {
             // Fallback if images fail loading
             e.currentTarget.style.display = 'none';
          }}
        />
      </AnimatePresence>
    </div>
  );
};

export default RagAvatar;
