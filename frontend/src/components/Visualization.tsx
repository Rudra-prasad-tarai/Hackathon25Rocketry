import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useMermaidRenderer } from '../hooks/useMermaidRenderer';
import { FileCode2, ExternalLink, Code2, Loader2, X, Clipboard, Download } from 'lucide-react';
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

  const handleDownloadPng = async () => {
    const container = diagramRef.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    const downloadSvg = (svgElement: SVGSVGElement) => {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgElement);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    // Serialize SVG
    const serializer = new XMLSerializer();
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    // Ensure XMLNS present
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgClone.setAttribute('xmlns:xhtml', 'http://www.w3.org/1999/xhtml');
    // Precompute string for potential canvg path and standard path
    const svgString = serializer.serializeToString(svgClone);
    // If HTML labels are present, attempt canvg-based rasterization first
    const hasForeignObject = !!svgClone.querySelector('foreignObject');
    if (hasForeignObject) {
      try {
        const ensureCanvg = async () => {
          const w = window as any;
          if (w.canvg?.Canvg) return w.canvg;
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-lib="canvg"]');
            if (existing) return resolve();
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/canvg@4.0.1/lib/umd.min.js';
            s.async = true;
            (s as any).dataset.lib = 'canvg';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('canvg cdn load failed'));
            document.head.appendChild(s);
          });
          return (window as any).canvg;
        };
        const canvgLib = await ensureCanvg();
        if (canvgLib?.Canvg) {
          const vb = svgClone.getAttribute('viewBox');
          let width = 0, height = 0;
          if (vb) {
            const parts = vb.split(/\s+/).map(Number);
            if (parts.length === 4) { width = parts[2]; height = parts[3]; }
          }
          if (!width || !height) {
            try {
              const bb = (svg as any).getBBox?.();
              if (bb && bb.width && bb.height) { width = Math.ceil(bb.width); height = Math.ceil(bb.height); }
            } catch {}
          }
          if (!width || !height) {
            const rect = svg.getBoundingClientRect();
            width = Math.ceil(rect.width || 1200);
            height = Math.ceil(rect.height || 800);
          }
          width = Math.max(10, width);
          height = Math.max(10, height);

          const scale = 2;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.floor(width * scale));
          canvas.height = Math.max(1, Math.floor(height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const instance = await canvgLib.Canvg.from(ctx, svgString);
          await instance.render();
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 0));
          canvas.toBlob((pngBlob) => {
            const a = document.createElement('a');
            if (!pngBlob) {
              a.href = canvas.toDataURL('image/png');
            } else {
              const pngUrl = URL.createObjectURL(pngBlob);
              a.href = pngUrl;
            }
            a.download = 'diagram.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
          }, 'image/png');
          return;
        }
      } catch (e) {
        // Fall through to standard path; if that fails, we'll SVG-download
      }
    }
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

    try {
      const img = new Image();
      // Allow drawing without tainting canvas
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          // Determine size
          const vb = svgClone.getAttribute('viewBox');
          let width = 0;
          let height = 0;
          if (vb) {
            const parts = vb.split(/\s+/).map(Number);
            if (parts.length === 4) {
              width = parts[2];
              height = parts[3];
            }
          }
          if (!width || !height) {
            try {
              const bb = (svg as any).getBBox?.();
              if (bb && bb.width && bb.height) {
                width = Math.ceil(bb.width);
                height = Math.ceil(bb.height);
              }
            } catch {}
          }
          if (!width || !height) {
            const rect = svg.getBoundingClientRect();
            width = Math.ceil(rect.width || 1200);
            height = Math.ceil(rect.height || 800);
          }
          width = Math.max(10, width);
          height = Math.max(10, height);
          const scale = 2; // higher res export
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.floor(width * scale));
          canvas.height = Math.max(1, Math.floor(height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');
          // Background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              // Fallback to SVG download
              downloadSvg(svgClone);
              return;
            }
            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'diagram.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(pngUrl);
          }, 'image/png');
        } catch (err) {
          // Fallback to SVG
          downloadSvg(svgClone);
        }
      };
      img.onerror = () => {
        // Fallback to SVG
        downloadSvg(svgClone);
      };
      img.src = dataUrl;
    } catch (e) {
      // Fallback to SVG
      downloadSvg(svgClone);
    }
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
                  className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all"
                  title="Show Code"
                >
                  <Code2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Code</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleOpenLiveEditor}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                  title="Open in Mermaid Live Editor"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mermaid</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadPng}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all"
                  title="Download PNG"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PNG</span>
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
