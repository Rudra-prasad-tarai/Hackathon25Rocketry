import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState(1);
  const [displayText, setDisplayText] = useState('GitHub Repo Visualization Tool');
  const fullText = 'GitHub Repo Visualization Tool';
  const targetText = 'GReViT';
  const preservedIndices = [0, 7, 8, 12, 13, 26]; // G, R, e, V, i, T

  useEffect(() => {
    // Phase 1: Show full text (2s)
    const phase1Timer = setTimeout(() => {
      setPhase(2);
    }, 2000);

    return () => clearTimeout(phase1Timer);
  }, []);

  useEffect(() => {
    if (phase === 2) {
      // Phase 2: Wait 1s, then delete letters
      const phase2Timer = setTimeout(() => {
        let currentText = fullText;
        let deleteIndex = 0;
        const charsToDelete: number[] = [];
        
        for (let i = 0; i < fullText.length; i++) {
          if (!preservedIndices.includes(i)) {
            charsToDelete.push(i);
          }
        }

        const deleteInterval = setInterval(() => {
          if (deleteIndex < charsToDelete.length) {
            const charIndex = charsToDelete[deleteIndex];
            currentText = currentText.substring(0, charIndex) + ' ' + currentText.substring(charIndex + 1);
            setDisplayText(currentText.split('').filter(c => c !== ' ').join(''));
            deleteIndex++;
          } else {
            clearInterval(deleteInterval);
            // After deletion, wait 0.5s then move to phase 3
            setTimeout(() => {
              setPhase(3);
            }, 500);
          }
        }, 50);

        return () => clearInterval(deleteInterval);
      }, 1000);

      return () => clearTimeout(phase2Timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 3) {
      // Phase 3: Hold "GReViT" for 1s
      const phase3Timer = setTimeout(() => {
        setPhase(4);
      }, 1000);

      return () => clearTimeout(phase3Timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 4) {
      // Phase 4: Move to header position (0.8s)
      const phase4Timer = setTimeout(() => {
        setPhase(5);
      }, 800);

      return () => clearTimeout(phase4Timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 5) {
      // Phase 5: Fade out and complete quickly (0.2s)
      const phase5Timer = setTimeout(() => {
        onComplete();
      }, 200);

      return () => clearTimeout(phase5Timer);
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase < 5 && (
        <motion.div
          initial={{ 
            opacity: 1,
          }}
          animate={{
            opacity: phase >= 5 ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ 
            backgroundColor: phase >= 4 ? 'transparent' : '#5864F3',
            pointerEvents: phase >= 5 ? 'none' : 'auto'
          }}
        >
          <motion.div
            initial={{
              opacity: 1,
            }}
            animate={{
              position: phase >= 4 ? 'fixed' : 'relative',
              top: phase >= 4 ? 16 : 'auto',
              left: phase >= 4 ? 24 : 'auto',
              opacity: phase >= 5 ? 0 : 1,
            }}
            transition={{
              duration: phase >= 5 ? 0.2 : 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="px-6 py-3 rounded-xl"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              border: '1px solid hsl(var(--glass-border))',
            }}
          >
            <motion.div
              className="text-primary-foreground font-bold tracking-tight text-center"
              initial={{
                fontSize: '1.875rem',
              }}
              animate={{
                fontSize: phase >= 4 ? '1.25rem' : phase <= 2 ? '1.875rem' : '2.25rem',
              }}
              transition={{
                duration: phase === 3 ? 0.3 : 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {phase <= 2 ? displayText : targetText}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
