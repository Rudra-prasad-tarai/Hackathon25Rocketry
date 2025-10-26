# Testing Guide - Mermaid Visualization

## How to Test the Mermaid Rendering

### Step 1: Start the Application
The dev server should already be running at `http://localhost:8081`

### Step 2: Navigate Through the App Flow

1. **Intro Animation** (5 seconds)
   - Watch "GitHub Repo Visualization Tool" → "GReViT" animation
   - The animation will complete automatically

2. **Repository Form** 
   - Enter any GitHub URL (e.g., `https://github.com/facebook/react`)
   - Click "Analyze" button
   - Watch the analyzing animation with progress stages:
     - Cloning repository
     - Parsing code files
     - Analyzing dependencies
     - Generating visualization
     - Complete

3. **Visualization Page** (Auto-loads after ~10 seconds)
   - The Mermaid diagram will **automatically load** after 0.5 seconds
   - You should see a beautiful diagram with custom indigo/purple styling

### Step 3: Test Mermaid Features

#### Available Actions:
- **Load Diagram**: Fetch and render a new diagram (cycles through 3 examples)
- **Refresh**: Re-render the current diagram
- **Show Code**: Opens the Mermaid code in a new window
- **Clear**: Removes the current diagram

#### Dummy Examples Available:
1. **Research Paper Flow** - Simple workflow diagram with decision nodes
2. **Complex ML Pipeline** - Multi-stage subgraph with detailed labels
3. **Simple Flowchart** - Horizontal flow with styled nodes

### Step 4: Verify Custom Styling

Check that the diagrams have:
- ✅ Indigo/purple color scheme (#6366f1, #8b5cf6)
- ✅ Gradient backgrounds (slate for light mode)
- ✅ Smooth hover effects on nodes
- ✅ Glass morphism effects with shadows
- ✅ Smooth animations on load
- ✅ Custom scrollbars
- ✅ Responsive design

### Step 5: Test Interactions

- **Hover over nodes**: Should see transform and shadow effects
- **Scroll**: Should work smoothly within the container
- **Click nodes**: Interactive nodes should be clickable (if defined in diagram)
- **Resize window**: Should be responsive on all screen sizes

## Quick Test (Skip Form)

If you want to test the Mermaid rendering directly without going through the form:

1. Open `/src/pages/Index.tsx`
2. Temporarily replace the content with:
```tsx
import Visualization from '@/components/Visualization';

const Index = () => {
  return <Visualization />;
};

export default Index;
```
3. Save and the Visualization will load immediately

## Troubleshooting

### Diagram Not Rendering?
- Check browser console for errors
- Verify `mermaid` package is installed: `npm list mermaid`
- Check that `/src/hooks/useMermaidRenderer.ts` exists
- Check that `/src/styles/mermaid.css` exists

### Styling Issues?
- Verify `/src/styles/mermaid.css` is imported in Visualization.tsx
- Check browser DevTools to see if CSS is loaded
- Try hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Auto-load Not Working?
- Check the useEffect in Visualization.tsx line 59-72
- Verify handleFetch is defined before the useEffect
- Check browser console for any JavaScript errors

## Expected Behavior

✅ **Working Correctly:**
- Diagram loads automatically after analyzing animation
- Smooth transitions and animations
- Custom indigo/purple theme applied
- Hover effects work on nodes
- Scrolling works properly within container
- Multiple dummy examples available

❌ **Not Working:**
- Blank screen after analyzing
- Default Mermaid theme (not custom colors)
- Scrolling issues
- No hover effects
- Errors in console

## Performance Notes

- First render may take 1-2 seconds (Mermaid initialization)
- Subsequent renders should be faster
- Large diagrams may take longer to render
- HMR (Hot Module Replacement) should work for code changes

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Next Steps

After verifying the Mermaid rendering works:
1. Connect to real API endpoint (replace dummy data)
2. Add more diagram examples
3. Implement diagram export (SVG/PNG)
4. Add zoom/pan controls for large diagrams
5. Add diagram customization options
