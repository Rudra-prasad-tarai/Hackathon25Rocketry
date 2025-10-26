import { motion } from 'framer-motion';
import { Upload, Github, Check, Loader2, Circle } from 'lucide-react';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import ErrorMessage from './ErrorMessage';
import Visualization from './Visualization';

const RepositoryForm = () => {
  const [githubUrl, setGithubUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [displayText, setDisplayText] = useState('Analyze');
  const [isTyping, setIsTyping] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isCompletionAnimating, setIsCompletionAnimating] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const WEBHOOK_URL = 'https://venjo8.app.n8n.cloud/webhook/234395ff-d51c-469b-afd2-8a7129560790';

  const stages = [
    { id: 1, label: 'Cloning repository' },
    { id: 2, label: 'Parsing code files' },
    { id: 3, label: 'Analyzing dependencies' },
    { id: 4, label: 'Generating visualization' },
    { id: 5, label: 'Complete' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
    } else {
      setError('Please upload a valid PDF file');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        setError('');
      } else {
        setError('Please upload a valid PDF file');
      }
    }
  };

  useEffect(() => {
    if (!isAnalyzing) return;

    // Type animation: "Analyze" -> "Analyzing..."
    const backspaceFrom = 'Analyze';
    const typeTo = 'Analyzing...';
    let currentIndex = backspaceFrom.length;

    const backspaceInterval = setInterval(() => {
      if (currentIndex > 6) {
        setDisplayText(backspaceFrom.substring(0, currentIndex - 1));
        currentIndex--;
      } else {
        clearInterval(backspaceInterval);
        
        // Type "ing..."
        let typeIndex = 6;
        const typeInterval = setInterval(() => {
          if (typeIndex <= typeTo.length) {
            setDisplayText(typeTo.substring(0, typeIndex));
            typeIndex++;
          } else {
            clearInterval(typeInterval);
            // Wait a bit before starting progress
            setTimeout(() => {
              setIsTyping(false);
            }, 500);
          }
        }, 100);
      }
    }, 100);

    return () => clearInterval(backspaceInterval);
  }, [isAnalyzing]);

  useEffect(() => {
    if (isTyping || !isAnalyzing) return;

    // Progress through stages, but stop before "Complete" until we have mermaidCode
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        // Stop at stage 3 (Analyzing dependencies) if we don't have mermaidCode yet
        if (prev < stages.length - 2 || (prev === stages.length - 2 && mermaidCode)) {
          const nextStage = prev + 1;
          
          // If we've reached the last stage, trigger completion animation
          if (nextStage === stages.length - 1) {
            clearInterval(stageInterval);
            setTimeout(() => {
              setIsCompletionAnimating(true);
            }, 1500);
          }
          
          return nextStage;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(stageInterval);
  }, [isTyping, isAnalyzing, mermaidCode, stages.length]);

  // Completion animation: "Analyzing..." -> "Analyzed"
  useEffect(() => {
    if (!isCompletionAnimating) return;

    const backspaceFrom = 'Analyzing...';
    const typeTo = 'Analyzed';
    let currentIndex = backspaceFrom.length;

    const backspaceInterval = setInterval(() => {
      if (currentIndex > 7) {
        setDisplayText(backspaceFrom.substring(0, currentIndex - 1));
        currentIndex--;
      } else {
        clearInterval(backspaceInterval);
        
        // Type "ed"
        let typeIndex = 7;
        const typeInterval = setInterval(() => {
          if (typeIndex <= typeTo.length) {
            setDisplayText(typeTo.substring(0, typeIndex));
            typeIndex++;
          } else {
            clearInterval(typeInterval);
            setIsComplete(true);
            // Show visualization after completion animation
            setTimeout(() => {
              setShowVisualization(true);
            }, 1000);
          }
        }, 100);
      }
    }, 100);

    return () => clearInterval(backspaceInterval);
  }, [isCompletionAnimating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!githubUrl.trim()) {
      setError('GitHub repository URL is required');
      return;
    }

    // Basic URL validation
    const urlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+/;
    if (!urlPattern.test(githubUrl)) {
      setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repository)');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setIsComplete(false);
    setIsCompletionAnimating(false);
    setCurrentStage(0);
    setIsTyping(true);
    setMermaidCode(null);

    try {
      // Call webhook with GitHub URL
      console.log('Calling webhook with:', { githubUrl, pdfFile: pdfFile?.name });
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_url: githubUrl,
          github_url: githubUrl,
          url: githubUrl,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorText = await response.text();
          console.error('Webhook error response:', errorText);
          
          // Try to parse as JSON for better error message
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.message || errorJson.error || errorText;
          } catch {
            errorDetails = errorText;
          }
        } catch (e) {
          errorDetails = 'Could not read error response';
        }
        
        throw new Error(`Webhook failed (${response.status}): ${errorDetails || response.statusText}`);
      }

      const data = await response.json();
      console.log('Webhook response:', data);
      
      // Extract mermaid code from response
      // Try multiple possible field names and nested structures
      let mermaidDiagram = null;
      
      // Check for direct text property
      if (data.text && typeof data.text === 'string') {
        mermaidDiagram = data.text;
      } 
      // Check for other common field names
      else if (data.mermaidCode || data.mermaid_code || data.diagram || 
               data.code || data.mermaid || data.visualization) {
        const candidate = data.mermaidCode || data.mermaid_code || data.diagram || 
                         data.code || data.mermaid || data.visualization;
        
        if (typeof candidate === 'string') {
          mermaidDiagram = candidate;
        } else if (typeof candidate === 'object' && candidate.text) {
          mermaidDiagram = candidate.text;
        } else if (typeof candidate === 'object' && candidate.code) {
          mermaidDiagram = candidate.code;
        }
      }
      // If data itself is a string
      else if (typeof data === 'string') {
        mermaidDiagram = data;
      }
      
      if (mermaidDiagram && typeof mermaidDiagram === 'string') {
        setMermaidCode(mermaidDiagram);
      } else {
        console.warn('Unexpected response format:', data);
        setError('Received response but could not find Mermaid diagram code');
        setIsAnalyzing(false);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.error('Error calling webhook:', err);
      
      let errorMessage = 'Failed to analyze repository';
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsAnalyzing(false);
      setIsTyping(false);
      setDisplayText('Analyze');
      return;
    }
  };

  const getStageIcon = (index: number) => {
    if (currentStage > index) {
      return <Check className="w-5 h-5" />;
    } else if (currentStage === index) {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    } else {
      return <Circle className="w-5 h-5" />;
    }
  };

  const getStageStatus = (index: number) => {
    if (currentStage > index) return 'completed';
    if (currentStage === index) return 'active';
    return 'pending';
  };


  // If visualization should be shown, render it instead
  if (showVisualization) {
    return <Visualization mermaidCode={mermaidCode || undefined} />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`w-full max-w-2xl mx-auto border rounded-2xl shadow-xl p-8 backdrop-blur-sm ${
          isAnalyzing 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-card border-border'
        }`}
      >
        {!isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Research Code Visualizer
            </h1>
            <p className="text-muted-foreground text-lg">
              Analyze and visualize research code repositories.
            </p>
          </motion.div>
        )}

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {!isAnalyzing && (
            <>
              <div>
                <label
                  htmlFor="github-url"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  GitHub Repository URL <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="github-url"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => {
                      setGithubUrl(e.target.value);
                      setError('');
                    }}
                    placeholder="https://github.com/username/repository"
                    className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Research Paper PDF (Optional)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent/5'
                  }`}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {pdfFile ? (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {pdfFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Drop your PDF here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF files only
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </>
          )}

          {!isAnalyzing ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Analyze
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Minimized input section - always visible during analysis */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="p-4 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
                    <Github className="w-4 h-4" />
                    <span className="truncate">{githubUrl}</span>
                  </div>
                  
                  {pdfFile && (
                    <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                      <Upload className="w-4 h-4" />
                      <span className="truncate">{pdfFile.name}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Header with typing animation */}
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-primary-foreground text-center"
              >
                {displayText}
                {!isComplete && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-1 h-8 bg-primary-foreground ml-1 align-middle"
                  />
                )}
              </motion.h2>

              {/* Progress section */}
              {!isTyping && !isCompletionAnimating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Vertical Timeline */}
                  <div className="relative pl-8 space-y-6">
                    {/* Vertical line */}
                    <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-primary-foreground/30" />
                    
                    {stages.map((stage, index) => {
                      const status = getStageStatus(index);
                      
                      return (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.15 }}
                          className="relative flex items-center gap-4"
                        >
                          {/* Icon circle */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.15 + 0.2 }}
                            className={`absolute left-[-32px] w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              status === 'completed'
                                ? 'bg-primary-foreground text-primary'
                                : status === 'active'
                                ? 'bg-primary-foreground/20 text-primary-foreground border-2 border-primary-foreground'
                                : 'bg-primary-foreground/10 text-primary-foreground/50'
                            }`}
                          >
                            {getStageIcon(index)}
                          </motion.div>

                          {/* Stage label */}
                          <div className={`py-2 transition-all duration-300 ${
                            status === 'active' ? 'font-semibold text-primary-foreground' : 'text-primary-foreground/60'
                          }`}>
                            {stage.label}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.form>
      </motion.div>

      {!isAnalyzing && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center mt-12 text-muted-foreground text-sm"
        >
          Powered by AI-driven code analysis
        </motion.footer>
      )}
    </>
  );
};

export default RepositoryForm;
