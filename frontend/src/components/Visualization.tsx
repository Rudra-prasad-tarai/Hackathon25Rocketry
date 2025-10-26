import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useMermaidRenderer } from '@/hooks/useMermaidRenderer';
import { FileCode2, ExternalLink, Code2, Loader2, X, Clipboard } from 'lucide-react';
import '@/styles/mermaid.css';

interface VisualizationProps {
  mermaidCode?: string;
}

// No dummy data

const Visualization = ({ mermaidCode: externalMermaidCode }: VisualizationProps) => {
  const { diagramRef, renderDiagram, isRendering, error } = useMermaidRenderer();
  const [currentMermaidCode, setCurrentMermaidCode] = useState<string | null>(externalMermaidCode || null);
  const [isCodeOpen, setIsCodeOpen] = useState(false);

  useEffect(() => {
    if (externalMermaidCode) {
      console.log('Received mermaid code:', externalMermaidCode);
      console.log('Code length:', externalMermaidCode.length);
      console.log('First 100 chars:', externalMermaidCode.substring(0, 100));
      setCurrentMermaidCode(externalMermaidCode);
      renderDiagram(externalMermaidCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMermaidCode]);

  // No fetch; diagram is provided by parent

  const handleOpenLiveEditor = async () => {
    if (!currentMermaidCode) return;
    const open = (url: string) => window.open(url, '_blank');
    const toBase64 = (u8: Uint8Array) => {
      let s = '';
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return btoa(s);
    };
    const makePakoUrl = (pakoObj: any) => {
      const payload = {
        code: currentMermaidCode,
        mermaid: JSON.stringify({ theme: 'default', flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' } }),
        autoSync: true,
        updateDiagram: true,
      };
      const json = JSON.stringify(payload);
      const uint8 = new TextEncoder().encode(json);
      const deflated = pakoObj.deflate(uint8);
      const b64 = toBase64(deflated);
      return `https://mermaid.live/edit#pako:${b64}`;
    };
    try {
      const wp = (window as any).pako;
      if (wp && typeof wp.deflate === 'function') {
        open(makePakoUrl(wp));
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[data-lib="pako"]');
        if (existing) return resolve();
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js';
        s.async = true;
        (s as any).dataset.lib = 'pako';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('pako cdn load failed'));
        document.head.appendChild(s);
      });
      const wp2 = (window as any).pako;
      if (wp2 && typeof wp2.deflate === 'function') {
        open(makePakoUrl(wp2));
        return;
      }
      const encoded = encodeURIComponent(currentMermaidCode);
      open(`https://mermaid.live/edit#code=${encoded}`);
    } catch {
      const encoded = encodeURIComponent(currentMermaidCode);
      open(`https://mermaid.live/edit#code=${encoded}`);
    }
  };

  const handleShowCode = () => {
    if (currentMermaidCode) setIsCodeOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Repository Visualization
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Interactive code flow diagram
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentMermaidCode && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShowCode}
                  className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all"
                  title="Show Code"
                >
                  <Code2 className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenLiveEditor}
                  className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all"
                  title="Open in Mermaid Live Editor"
                >
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 overflow-y-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
          >
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </motion.div>
        )}

        {!currentMermaidCode && !isRendering && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <FileCode2 className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Ready to Visualize
              </h3>
              <p className="text-muted-foreground max-w-md">
                The diagram will appear here once analysis finishes and Mermaid code is available.
              </p>
            </div>
          </motion.div>
        )}

        {isRendering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Rendering diagram...</p>
          </motion.div>
        )}

        {currentMermaidCode && (
          <div
            ref={diagramRef}
            className={`mermaid-visualization-container w-full flex justify-center items-start min-h-[500px] ${
              isRendering ? 'loading' : ''
            }`}
          />
        )}

        {/* Code Modal */}
        {isCodeOpen && currentMermaidCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-[min(90vw,1000px)] max-h-[80vh] bg-card border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Mermaid Diagram Code</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(currentMermaidCode)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    title="Copy to clipboard"
                  >
                    <Clipboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                  <button
                    onClick={() => setIsCodeOpen(false)}
                    className="p-2 rounded-md hover:bg-muted"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-auto">
                <pre className="text-sm bg-muted p-4 rounded-md border border-border overflow-auto"><code>{currentMermaidCode}</code></pre>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
};

export default Visualization;
