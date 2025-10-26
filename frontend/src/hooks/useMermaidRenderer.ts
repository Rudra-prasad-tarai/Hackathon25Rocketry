import { useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';

interface UseMermaidRendererReturn {
  diagramRef: React.RefObject<HTMLDivElement>;
  renderDiagram: (mermaidCode: string) => Promise<void>;
  clearDiagram: () => void;
  isRendering: boolean;
  error: string | null;
}

export const useMermaidRenderer = (): UseMermaidRendererReturn => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // Initialize Mermaid with custom configuration
  const initializeMermaid = useCallback(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#fff',
        primaryBorderColor: '#4f46e5',
        lineColor: '#8b5cf6',
        secondaryColor: '#a78bfa',
        tertiaryColor: '#c4b5fd',
        background: '#ffffff',
        mainBkg: '#e0e7ff',
        secondBkg: '#ddd6fe',
        tertiaryBkg: '#ede9fe',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
        nodeSpacing: 80,
        rankSpacing: 80,
      },
      securityLevel: 'loose', // Allow click events and external links
      suppressErrorRendering: false,
      logLevel: 'debug',
    });
  }, []);

  // Render the Mermaid diagram
  const renderDiagram = useCallback(async (mermaidCode: string) => {
    if (!mermaidCode || !diagramRef.current) {
      setError('No diagram code provided or container not ready');
      return;
    }

    setIsRendering(true);
    setError(null);

    try {
      // Clear previous diagram and observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      diagramRef.current.innerHTML = '';

      // Initialize Mermaid with custom theme
      initializeMermaid();

      // Clean up the mermaid code
      let cleanedCode = mermaidCode.trim();
      
      // Remove any escaped newlines and replace with actual newlines
      cleanedCode = cleanedCode.replace(/\\n/g, '\n');
      
      // Remove any surrounding quotes if present
      if ((cleanedCode.startsWith('"') && cleanedCode.endsWith('"')) ||
          (cleanedCode.startsWith("'") && cleanedCode.endsWith("'"))) {
        cleanedCode = cleanedCode.slice(1, -1);
      }

      console.log('About to render mermaid code:', cleanedCode.substring(0, 200));

      // Create unique ID for this render
      const diagramId = `mermaid-diagram-${Date.now()}`;
      const diagramElement = document.createElement('div');
      diagramElement.id = diagramId;
      diagramElement.className = 'mermaid-diagram-element';
      diagramElement.style.visibility = 'hidden';

      diagramRef.current.appendChild(diagramElement);

      // Render the diagram
      console.log('Calling mermaid.render...');
      const { svg, bindFunctions } = await mermaid.render(
        `${diagramId}-svg`,
        cleanedCode
      );
      console.log('Mermaid render successful, SVG length:', svg.length);

      // Insert the rendered SVG
      diagramElement.innerHTML = svg;
      // Ensure the diagram element is visible before measuring sizes
      diagramElement.style.visibility = 'visible';
      diagramElement.style.display = 'flex';

      // Handle interactive elements and sizing
      const svgElement = diagramElement.querySelector('svg');
      if (svgElement) {
        // Ensure sizing is visible
        try {
          svgElement.setAttribute('width', '100%');
          (svgElement as SVGElement).style.width = '100%';
          (svgElement as SVGElement).style.height = 'auto';
          (svgElement as SVGElement).style.display = 'block';
          // Add viewBox if missing using bbox or width/height
          if (!svgElement.getAttribute('viewBox')) {
            let vbSet = false;
            const widthAttr = svgElement.getAttribute('width');
            const heightAttr = svgElement.getAttribute('height');
            const widthNum = widthAttr && /\d+/.test(widthAttr) ? parseFloat(widthAttr) : undefined;
            const heightNum = heightAttr && /\d+/.test(heightAttr) ? parseFloat(heightAttr) : undefined;
            if (widthNum && heightNum) {
              svgElement.setAttribute('viewBox', `0 0 ${widthNum} ${heightNum}`);
              vbSet = true;
            }
            if (!vbSet && (svgElement as any).getBBox) {
              const bb = (svgElement as any).getBBox();
              if (bb && bb.width && bb.height) {
                svgElement.setAttribute('viewBox', `0 0 ${bb.width} ${bb.height}`);
                // Ensure proper aspect ratio and a visible minimum height
                svgElement.setAttribute('preserveAspectRatio', 'xMidYMin meet');
                (svgElement as SVGElement).style.minHeight = `${Math.max(600, Math.ceil(bb.height))}px`;
                vbSet = true;
              }
            }
            // Only remove hard height if viewBox has been set (so auto height can work)
            if (vbSet && svgElement.hasAttribute('height')) {
              svgElement.removeAttribute('height');
            }
          } else {
            // If viewBox already exists, no need for hard height
            if (svgElement.hasAttribute('height')) {
              svgElement.removeAttribute('height');
            }
            // Also set preserveAspectRatio for better scaling
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMin meet');
          }
          const rect = (svgElement as SVGElement).getBoundingClientRect();
          console.log('Rendered SVG rect:', { width: rect.width, height: rect.height });
          if (!rect.height || rect.height === 0) {
            diagramElement.style.minHeight = '600px';
            console.warn('SVG height was 0; applied minHeight fallback on container');
          }
        } catch (e) {
          console.warn('Failed to adjust SVG sizing', e);
        }

        // Force all labels to black (override any inline labelStyle)
        try {
          const forceBlackLabels = () => {
            // SVG text labels
            const svgTexts = svgElement.querySelectorAll('text, .nodeLabel, .edgeLabel');
            svgTexts.forEach((el) => {
              if (el instanceof SVGTextElement) {
                el.setAttribute('fill', '#000');
                (el as any).style?.setProperty('fill', '#000', 'important');
              }
              (el as HTMLElement).style?.setProperty('color', '#000', 'important');
            });

            // HTML labels inside foreignObject
            const htmls = svgElement.querySelectorAll('foreignObject, foreignObject *');
            htmls.forEach((el) => {
              (el as HTMLElement).style?.setProperty('color', '#000', 'important');
            });
          };
          forceBlackLabels();
        } catch (e) {
          console.warn('Failed to force label color to black', e);
        }

        // Bind click events if they exist
        if (bindFunctions) {
          bindFunctions(diagramElement);
        }

        // Ensure all SVG anchors open in a new tab
        const anchors = svgElement.querySelectorAll('a');
        anchors.forEach((a) => {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
          a.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const href =
              a.getAttribute('href') ||
              a.getAttribute('xlink:href') ||
              ((a as any).href && (a as any).href.baseVal) ||
              (a as any).href ||
              '';
            if (href) {
              window.open(href, '_blank');
            }
          });
        });

        // Add click handler for nodes
        const handleNodeClick = (event: Event) => {
          const target = event.target as HTMLElement;
          const nodeElement = target.closest('.node, [data-id]');

          if (nodeElement) {
            const clickUrl =
              nodeElement.getAttribute('data-click') ||
              nodeElement.getAttribute('data-href') ||
              nodeElement.getAttribute('href');

            const nodeId = nodeElement.getAttribute('data-id') || nodeElement.id;

            if (clickUrl && clickUrl.startsWith('http')) {
              event.preventDefault();
              event.stopPropagation();
              window.open(clickUrl, '_blank');
            } else if (nodeId && cleanedCode) {
              // Try to find click events in the mermaid code
              const clickMatch = cleanedCode.match(
                new RegExp(`click\\s+${nodeId}\\s+\"([^\"]+)\"`)
              );
              if (clickMatch && clickMatch[1]) {
                event.preventDefault();
                event.stopPropagation();
                window.open(clickMatch[1], '_blank');
              }
            }
          }
        };

        // Add click listeners
        svgElement.addEventListener('click', handleNodeClick);

        // Add cursor pointer to clickable nodes
        const nodes = svgElement.querySelectorAll(
          '.node, .flowchart-node, [id*="flowchart"]'
        );
        nodes.forEach((node) => {
          (node as HTMLElement).style.cursor = 'pointer';
          node.addEventListener('click', handleNodeClick);
        });

        // Set up mutation observer for dynamically added content
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                if (
                  element.matches('.node, .flowchart-node, [id*="flowchart"]')
                ) {
                  element.style.cursor = 'pointer';
                  element.addEventListener('click', handleNodeClick);
                }
              }
            });
          });
        });

        observer.observe(svgElement, { childList: true, subtree: true });
        observerRef.current = observer;
      } else {
        console.warn('SVG element not found in rendered diagram');
      }

      // Finalize
      console.log('Diagram element ready:', diagramElement);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to render diagram';
      setError(errorMessage);
      console.error('Mermaid rendering error:', err);

      if (diagramRef.current) {
        diagramRef.current.innerHTML = `
          <div class="mermaid-error">
            <h4>Failed to render diagram</h4>
            <p>${errorMessage}</p>
          </div>
        `;
      }
    } finally {
      setIsRendering(false);
    }
  }, [initializeMermaid]);

  // Clear the diagram
  const clearDiagram = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (diagramRef.current) {
      diagramRef.current.innerHTML = '';
    }

    setError(null);
  }, []);

  return {
    diagramRef,
    renderDiagram,
    clearDiagram,
    isRendering,
    error,
  };
};
