import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnalyzingOverlayProps {
  githubUrl: string;
  pdfFileName?: string;
}

const AnalyzingOverlay = ({ githubUrl, pdfFileName }: AnalyzingOverlayProps) => {
  const [text, setText] = useState('Analyse');
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Animate "Analyse" -> "Analysing"
    const targetText = 'Analysing';
    let currentIndex = text.length;

    // First backspace to "Analys"
    const backspaceInterval = setInterval(() => {
      if (currentIndex > 6) {
        setText(text.substring(0, currentIndex - 1));
        currentIndex--;
      } else {
        clearInterval(backspaceInterval);
        // Then type "ing"
        let typeIndex = 0;
        const typeInterval = setInterval(() => {
          if (typeIndex < 3) {
            setText((prev) => prev + targetText[6 + typeIndex]);
            typeIndex++;
          } else {
            clearInterval(typeInterval);
            setShowStatus(true);
          }
        }, 100);
      }
    }, 100);

    return () => clearInterval(backspaceInterval);
  }, []);

  return (
    <motion.div
      initial={{ scale: 1, borderRadius: '8px' }}
      animate={{ scale: 50, borderRadius: '0px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-primary flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="text-primary-foreground text-2xl font-semibold">Analyze</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center space-y-8 px-4"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-8">
          {text}
        </h2>

        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.2 }}
            className="space-y-4 max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex items-center gap-3 text-primary-foreground/90"
            >
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-primary-foreground"
              />
              <span className="text-lg">Processing GitHub repository: {githubUrl}</span>
            </motion.div>

            {pdfFileName && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="flex items-center gap-3 text-primary-foreground/90"
              >
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  className="w-2 h-2 rounded-full bg-primary-foreground"
                />
                <span className="text-lg">Analyzing research paper: {pdfFileName}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AnalyzingOverlay;
