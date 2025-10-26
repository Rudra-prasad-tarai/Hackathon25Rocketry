import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 4.3, duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
        <div className="inline-block">
          <div
            className="px-6 py-3 rounded-xl font-bold text-xl text-primary-foreground shadow-lg"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              border: '1px solid hsl(var(--glass-border))',
            }}
          >
            GReViT
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
