import React, { useState, useEffect } from 'react';

interface Preset {
  id: string;
  name: string;
  prompt: string;
  tag: string;
  guidance: number;
  denoise: number;
  steps: number;
}

interface RefImage {
  id: string;
  name: string;
  type: string;
}

interface Node {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

interface DragState {
  type: 'node' | 'canvas';
  id?: string;
  startX: number;
  startY: number;
  initX: number;
  initY: number;
}

export function VisualLabCanvas() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('preset-a');
  const [selectedRef, setSelectedRef] = useState<string>('ref-a');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationCount, setGenerationCount] = useState<number>(104);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [activeTool, setActiveTool] = useState<string>('select');

  // Canvas positions and panning
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  // Collapse state for each node
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Custom added nodes (FX Filters)
  const [customNodeCount, setCustomNodeCount] = useState(0);
  const [customNodeState, setCustomNodeState] = useState<Record<string, { intensity: number; fxType: string }>>({});

  // Nodes list
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'prompt', title: 'T-Prompt', x: 15, y: 20, width: 110, height: 95, type: 'prompt' },
    { id: 'ref', title: 'I-Ref', x: 15, y: 125, width: 110, height: 85, type: 'ref' },
    { id: 'style', title: 'Style Guidelines', x: 15, y: 220, width: 110, height: 60, type: 'style' },
    { id: 'studio', title: 'Studio Gen', x: 155, y: 60, width: 130, height: 140, type: 'studio' },
    { id: 'refiner', title: 'Refiner', x: 305, y: 100, width: 110, height: 75, type: 'refiner' },
    { id: 'output', title: 'Output', x: 435, y: 40, width: 110, height: 170, type: 'output' }
  ]);

  const prompts: Preset[] = [
    { id: 'preset-a', name: 'Deep Space', prompt: 'Sleek gravity well, oklch teal accent rings', tag: 'ASTRONOMY', guidance: 7.5, denoise: 0.65, steps: 30 },
    { id: 'preset-b', name: 'Min Grid', prompt: 'Raw telemetry coordinates, outline typography', tag: 'VECTOR', guidance: 4.0, denoise: 0.15, steps: 20 },
    { id: 'preset-c', name: 'Accretion Flow', prompt: 'Concentric particle wave, brand-violet sparks', tag: 'DYNAMICS', guidance: 8.5, denoise: 0.80, steps: 40 }
  ];

  const refImages: RefImage[] = [
    { id: 'ref-a', name: 'Gravity', type: 'SVG' },
    { id: 'ref-b', name: 'Grid', type: 'Mesh' },
    { id: 'ref-c', name: 'Horizon', type: 'Noise' }
  ];

  const handlePromptChange = (id: string) => {
    if (isGenerating || id === selectedPrompt) return;
    setSelectedPrompt(id);
    triggerGeneration();
  };

  const handleRefChange = (id: string) => {
    if (isGenerating || id === selectedRef) return;
    setSelectedRef(id);
    triggerGeneration();
  };

  const triggerGeneration = () => {
    setIsGenerating(true);
    const timer = setTimeout(() => {
      setIsGenerating(false);
      setGenerationCount(prev => prev + 1);
    }, 850);
    return () => clearTimeout(timer);
  };

  const activePrompt = prompts.find(p => p.id === selectedPrompt) || prompts[0];
  const activeRef = refImages.find(r => r.id === selectedRef) || refImages[0];

  // Dragging handlers for nodes
  const handleNodeDragStart = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (activeTool === 'pan') return; // Pan tool overrides dragging
    if (e.button !== 0) return; // Only drag with left click
    e.stopPropagation();

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDragState({
      type: 'node',
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initX: node.x,
      initY: node.y
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleNodeDragMove = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (!dragState || dragState.type !== 'node' || dragState.id !== nodeId) return;
    e.stopPropagation();

    const scale = zoomScale / 100;
    const dx = (e.clientX - dragState.startX) / scale;
    const dy = (e.clientY - dragState.startY) / scale;

    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          x: Math.max(-300, Math.min(900, dragState.initX + dx)),
          y: Math.max(-200, Math.min(700, dragState.initY + dy))
        };
      }
      return node;
    }));
  };

  const handleNodeDragEnd = (e: React.PointerEvent<HTMLDivElement>, nodeId: string) => {
    if (!dragState || dragState.type !== 'node' || dragState.id !== nodeId) return;
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }
    setDragState(null);
  };

  // Canvas panning handlers
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only pan if we clicked on the background grid, or if hand tool is active
    const target = e.target as HTMLElement;
    if (target.closest('.canvas-node') || target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }

    if (e.button !== 0 && e.button !== 1) return; // Left or middle click only

    setDragState({
      type: 'canvas',
      startX: e.clientX,
      startY: e.clientY,
      initX: panOffset.x,
      initY: panOffset.y
    });

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.type !== 'canvas') return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    setPanOffset({
      x: dragState.initX + dx,
      y: dragState.initY + dy
    });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.type !== 'canvas') return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore
    }
    setDragState(null);
  };

  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Add custom FX Filter node (chained in between Refiner and Output)
  const handleAddNode = () => {
    const id = `custom-${customNodeCount + 1}`;
    setCustomNodeCount(prev => prev + 1);

    // Spawn node near center of viewport
    const scale = zoomScale / 100;
    const x = Math.max(100, (230 - panOffset.x) / scale);
    const y = Math.max(80, (150 - panOffset.y) / scale);

    const newNode: Node = {
      id,
      title: `FX Filter #${customNodeCount + 1}`,
      x,
      y,
      width: 110,
      height: 75,
      type: 'custom'
    };

    setCustomNodeState(prev => ({
      ...prev,
      [id]: { intensity: 50, fxType: 'Glow' }
    }));

    setNodes(prev => {
      // Insert custom nodes before the Output node (which is usually last)
      const outputIndex = prev.findIndex(n => n.id === 'output');
      if (outputIndex !== -1) {
        const newNodes = [...prev];
        newNodes.splice(outputIndex, 0, newNode);
        return newNodes;
      }
      return [...prev, newNode];
    });

    triggerGeneration();
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setCollapsedNodes(prev => {
      const updated = { ...prev };
      delete updated[nodeId];
      return updated;
    });
    setCustomNodeState(prev => {
      const updated = { ...prev };
      delete updated[nodeId];
      return updated;
    });
    triggerGeneration();
  };

  const updateCustomNode = (nodeId: string, intensity: number, fxType: string) => {
    setCustomNodeState(prev => ({
      ...prev,
      [nodeId]: { intensity, fxType }
    }));
    triggerGeneration();
  };

  // Dynamic Port Coordinates Calculator
  const getPortPosition = (nodeId: string, portType: 'in' | 'out', index: number = 0) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const isCollapsed = collapsedNodes[nodeId];

    if (node.type === 'custom') {
      if (portType === 'in') {
        return { x: node.x, y: isCollapsed ? node.y + 10 : node.y + 35 };
      } else {
        return { x: node.x + node.width, y: isCollapsed ? node.y + 10 : node.y + 35 };
      }
    }

    if (nodeId === 'prompt') {
      return { x: node.x + node.width, y: isCollapsed ? node.y + 10 : node.y + 35 };
    }
    if (nodeId === 'ref') {
      return { x: node.x + node.width, y: isCollapsed ? node.y + 10 : node.y + 35 };
    }
    if (nodeId === 'style') {
      return { x: node.x + node.width, y: isCollapsed ? node.y + 10 : node.y + 30 };
    }
    if (nodeId === 'studio') {
      if (portType === 'in') {
        const yOffsets = [30, 70, 110];
        return { x: node.x, y: isCollapsed ? node.y + 12 : node.y + yOffsets[index] };
      } else {
        return { x: node.x + node.width, y: isCollapsed ? node.y + 12 : node.y + 70 };
      }
    }
    if (nodeId === 'refiner') {
      if (portType === 'in') {
        return { x: node.x, y: isCollapsed ? node.y + 10 : node.y + 30 };
      } else {
        return { x: node.x + node.width, y: isCollapsed ? node.y + 10 : node.y + 30 };
      }
    }
    if (nodeId === 'output') {
      return { x: node.x, y: isCollapsed ? node.y + 10 : node.y + 90 };
    }
    return { x: 0, y: 0 };
  };

  // Draw Horizontal Bezier Connection Path
  const drawBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  // Dynamic Wires Routing (Chaining custom nodes automatically)
  const getConnections = () => {
    const customNodes = nodes.filter(n => n.type === 'custom');
    const connections: { from: string; fromPort: 'out'; to: string; toPort: 'in'; color: string; index?: number }[] = [
      { from: 'prompt', fromPort: 'out', to: 'studio', toPort: 'in', color: 'var(--color-primary)', index: 0 },
      { from: 'ref', fromPort: 'out', to: 'studio', toPort: 'in', color: 'var(--color-primary)', index: 1 },
      { from: 'style', fromPort: 'out', to: 'studio', toPort: 'in', color: 'var(--color-brand-violet)', index: 2 }
    ];

    if (customNodes.length === 0) {
      connections.push({ from: 'studio', fromPort: 'out', to: 'refiner', toPort: 'in', color: 'var(--color-primary)' });
      connections.push({ from: 'refiner', fromPort: 'out', to: 'output', toPort: 'in', color: 'var(--color-primary)' });
    } else {
      connections.push({ from: 'studio', fromPort: 'out', to: 'refiner', toPort: 'in', color: 'var(--color-primary)' });
      
      // Connect Refiner -> first custom node
      connections.push({ from: 'refiner', fromPort: 'out', to: customNodes[0].id, toPort: 'in', color: 'var(--color-brand-violet)' });
      
      // Connect custom nodes sequentially
      for (let i = 0; i < customNodes.length - 1; i++) {
        connections.push({
          from: customNodes[i].id as any,
          fromPort: 'out',
          to: customNodes[i + 1].id,
          toPort: 'in',
          color: 'var(--color-brand-violet)'
        });
      }
      
      // Connect last custom node -> Output
      connections.push({
        from: customNodes[customNodes.length - 1].id as any,
        fromPort: 'out',
        to: 'output',
        toPort: 'in',
        color: 'var(--color-primary)'
      });
    }

    return connections;
  };

  const connectionsList = getConnections();

  return (
    <div 
      className="relative w-full aspect-[16/10] max-w-[560px] mx-auto bg-background/50 border border-border/10 rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between font-mono select-none" 
      style={{ boxShadow: '0 10px 30px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)' }}
    >
      {/* Styles for dynamic canvas animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow-dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-dash {
          stroke-dasharray: 5 5;
          animation: flow-dash 1.4s linear infinite;
        }
        .animate-flow-dash-fast {
          stroke-dasharray: 5 5;
          animation: flow-dash 0.6s linear infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}} />

      {/* Top Figma-Style Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/10 bg-card/40 backdrop-blur-md z-30 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          <span className="text-[8px] font-bold text-muted-foreground/60 uppercase">social-plus // canvas</span>
        </div>
        
        {/* Editor Tools */}
        <div className="flex items-center bg-background/80 border border-border/15 p-0.5 rounded-md gap-0.5 text-[10px]">
          <button 
            onClick={() => setActiveTool('select')}
            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${activeTool === 'select' ? 'bg-primary text-background font-bold' : 'hover:bg-card text-muted-foreground hover:text-foreground'} cursor-pointer`}
            title="Select & Drag Nodes"
          >
            ↖
          </button>
          <button 
            onClick={() => setActiveTool('pan')}
            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${activeTool === 'pan' ? 'bg-primary text-background font-bold' : 'hover:bg-card text-muted-foreground hover:text-foreground'} cursor-pointer`}
            title="Pan Canvas (Hand)"
          >
            ✋
          </button>
          <button 
            onClick={handleAddNode}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer font-bold"
            title="Add FX Filter Node"
          >
            +
          </button>
        </div>

        <span className="text-[8px] font-bold bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded">Flora Canvas</span>
      </div>

      {/* Infinite Canvas Simulation Wrapper */}
      <div 
        className="relative flex-1 w-full overflow-hidden select-none" 
        style={{ 
          backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', 
          backgroundSize: `${16 * (zoomScale / 100)}px ${16 * (zoomScale / 100)}px`,
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          cursor: activeTool === 'pan' ? (dragState?.type === 'canvas' ? 'grabbing' : 'grab') : 'default'
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
      >
        {/* Dynamic Nodes & Cables Container */}
        <div 
          className="w-full h-full relative"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale / 100})`,
            transformOrigin: 'top left',
            transition: dragState ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* SVG Bezier Connections Layer */}
          <svg className="absolute inset-0 w-[1200px] h-[800px] pointer-events-none z-0">
            {connectionsList.map((conn, idx) => {
              const p1 = getPortPosition(conn.from, conn.fromPort);
              const p2 = getPortPosition(conn.to, conn.toPort, conn.index);
              const pathD = drawBezier(p1.x, p1.y, p2.x, p2.y);
              
              return (
                <g key={`${conn.from}-${conn.to}-${idx}`}>
                  {/* Background thin wire */}
                  <path 
                    d={pathD} 
                    stroke="var(--color-border)" 
                    strokeWidth="1.5" 
                    fill="none" 
                    opacity="0.25" 
                  />
                  {/* Glowing dynamic flow line */}
                  <path 
                    d={pathD} 
                    stroke={conn.color} 
                    strokeWidth="1.5" 
                    fill="none" 
                    className={isGenerating ? 'animate-flow-dash-fast' : 'animate-flow-dash'} 
                    opacity="0.85" 
                  />
                </g>
              );
            })}
          </svg>

          {/* Prompt Node */}
          {(() => {
            const node = nodes.find(n => n.id === 'prompt')!;
            const isCollapsed = !!collapsedNodes[node.id];
            return (
              <div 
                className="absolute bg-background/95 border border-border/15 rounded-lg flex flex-col p-2 text-[8px] z-10 canvas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: isCollapsed ? 24 : node.height,
                  boxShadow: '0 4px 12px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)',
                  transition: dragState && dragState.id === node.id ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out'
                }}
              >
                <div 
                  className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${isCollapsed ? '' : 'border-b border-border/5 pb-1 mb-1.5'}`}
                  onPointerDown={(e) => handleNodeDragStart(e, node.id)}
                  onPointerMove={(e) => handleNodeDragMove(e, node.id)}
                  onPointerUp={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <span className="font-bold text-muted-foreground/60 uppercase">T-Prompt</span>
                  <button 
                    onClick={() => toggleNodeCollapse(node.id)}
                    className="hover:text-primary transition-colors cursor-pointer text-[8px] px-1 font-bold"
                  >
                    {isCollapsed ? '＋' : '－'}
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col gap-1">
                    {prompts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handlePromptChange(p.id)}
                        className={`px-1.5 py-0.5 text-left rounded text-[8px] transition-colors duration-fast ${selectedPrompt === p.id ? 'bg-primary text-background font-bold' : 'bg-card/40 text-foreground hover:bg-card hover:text-foreground'} cursor-pointer`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                <div 
                  className="absolute right-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '31px' }}
                  title="Out"
                ></div>
              </div>
            );
          })()}

          {/* Ref Node */}
          {(() => {
            const node = nodes.find(n => n.id === 'ref')!;
            const isCollapsed = !!collapsedNodes[node.id];
            return (
              <div 
                className="absolute bg-background/95 border border-border/15 rounded-lg flex flex-col p-2 text-[8px] z-10 canvas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: isCollapsed ? 24 : node.height,
                  boxShadow: '0 4px 12px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)',
                  transition: dragState && dragState.id === node.id ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out'
                }}
              >
                <div 
                  className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${isCollapsed ? '' : 'border-b border-border/5 pb-1 mb-1.5'}`}
                  onPointerDown={(e) => handleNodeDragStart(e, node.id)}
                  onPointerMove={(e) => handleNodeDragMove(e, node.id)}
                  onPointerUp={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <span className="font-bold text-muted-foreground/60 uppercase">I-Ref</span>
                  <button 
                    onClick={() => toggleNodeCollapse(node.id)}
                    className="hover:text-primary transition-colors cursor-pointer text-[8px] px-1 font-bold"
                  >
                    {isCollapsed ? '＋' : '－'}
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="grid grid-cols-3 gap-1">
                    {refImages.map(r => (
                      <button 
                        key={r.id}
                        onClick={() => handleRefChange(r.id)}
                        className={`h-7 rounded flex items-center justify-center border text-[7px] font-bold ${selectedRef === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/10 bg-card/25 hover:border-border/30'} cursor-pointer`}
                        title={`${r.name} (${r.type})`}
                      >
                        {r.name.substring(0, 4)}
                      </button>
                    ))}
                  </div>
                )}
                <div 
                  className="absolute right-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '31px' }}
                  title="Out"
                ></div>
              </div>
            );
          })()}

          {/* Style Node */}
          {(() => {
            const node = nodes.find(n => n.id === 'style')!;
            const isCollapsed = !!collapsedNodes[node.id];
            return (
              <div 
                className="absolute bg-background/95 border border-border/15 rounded-lg flex flex-col p-2 text-[8px] z-10 canvas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: isCollapsed ? 24 : node.height,
                  boxShadow: '0 4px 12px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)',
                  transition: dragState && dragState.id === node.id ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out'
                }}
              >
                <div 
                  className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${isCollapsed ? '' : 'border-b border-border/5 pb-1 mb-1'}`}
                  onPointerDown={(e) => handleNodeDragStart(e, node.id)}
                  onPointerMove={(e) => handleNodeDragMove(e, node.id)}
                  onPointerUp={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <span className="font-bold text-muted-foreground/60 uppercase">Style</span>
                  <button 
                    onClick={() => toggleNodeCollapse(node.id)}
                    className="hover:text-primary transition-colors cursor-pointer text-[8px] px-1 font-bold"
                  >
                    {isCollapsed ? '＋' : '－'}
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="flex items-center justify-between mt-1 px-1">
                    <span className="w-2 h-2 rounded bg-primary" title="Teal font"></span>
                    <span className="w-2 h-2 rounded bg-brand-violet" title="Violet accent"></span>
                    <span className="w-2 h-2 rounded bg-card border border-border/10" title="Slate dark"></span>
                    <span className="text-[6px] text-muted-foreground/50">OKLCH</span>
                  </div>
                )}
                <div 
                  className="absolute right-[-4px] w-2 h-2 rounded-full bg-brand-violet border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '26px' }}
                  title="Out"
                ></div>
              </div>
            );
          })()}

          {/* Studio Gen Node */}
          {(() => {
            const node = nodes.find(n => n.id === 'studio')!;
            const isCollapsed = !!collapsedNodes[node.id];
            return (
              <div 
                className="absolute bg-background/95 border border-border/15 rounded-lg flex flex-col p-3.5 text-[8px] z-10 canvas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: isCollapsed ? 28 : node.height,
                  boxShadow: '0 4px 12px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)',
                  transition: dragState && dragState.id === node.id ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out'
                }}
              >
                <div 
                  className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${isCollapsed ? '' : 'border-b border-border/5 pb-1 mb-2.5'}`}
                  onPointerDown={(e) => handleNodeDragStart(e, node.id)}
                  onPointerMove={(e) => handleNodeDragMove(e, node.id)}
                  onPointerUp={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <span className="font-bold text-primary uppercase">Studio Gen</span>
                  <div className="flex items-center gap-1">
                    {!isCollapsed && <span className="font-mono text-[7px] text-muted-foreground/50 mr-1">v1.2</span>}
                    <button 
                      onClick={() => toggleNodeCollapse(node.id)}
                      className="hover:text-primary transition-colors cursor-pointer text-[8px] px-1 font-bold"
                    >
                      {isCollapsed ? '＋' : '－'}
                    </button>
                  </div>
                </div>
                
                {!isCollapsed && (
                  <div className="space-y-2 text-[7px]">
                    <div>
                      <div className="flex justify-between text-muted-foreground mb-0.5">
                        <span>Guidance Scale</span>
                        <span className="text-foreground font-bold">{activePrompt.guidance}</span>
                      </div>
                      <div className="w-full h-1 bg-card rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(activePrompt.guidance / 10) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-muted-foreground mb-0.5">
                        <span>Denoising</span>
                        <span className="text-foreground font-bold">{activePrompt.denoise}</span>
                      </div>
                      <div className="w-full h-1 bg-card rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${activePrompt.denoise * 100}%` }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-border/5 pt-1 text-muted-foreground/60">
                      <span>Steps</span>
                      <span className="text-foreground">{activePrompt.steps}</span>
                    </div>
                  </div>
                )}

                {/* Input Ports (Left) */}
                <div 
                  className="absolute left-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '10px' : '26px' }} 
                  title="In Prompt"
                ></div>
                <div 
                  className="absolute left-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '10px' : '66px' }} 
                  title="In Image"
                ></div>
                <div 
                  className="absolute left-[-4px] w-2 h-2 rounded-full bg-brand-violet border border-background shadow-sm"
                  style={{ top: isCollapsed ? '10px' : '106px' }} 
                  title="In Style"
                ></div>
                
                {/* Output Port (Right) */}
                <div 
                  className="absolute right-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '10px' : '66px' }} 
                  title="Out"
                ></div>
              </div>
            );
          })()}

          {/* Refiner Node */}
          {(() => {
            const node = nodes.find(n => n.id === 'refiner')!;
            const isCollapsed = !!collapsedNodes[node.id];
            return (
              <div 
                className="absolute bg-background/95 border border-border/15 rounded-lg flex flex-col p-2.5 text-[8px] z-10 canvas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: isCollapsed ? 24 : node.height,
                  boxShadow: '0 4px 12px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)',
                  transition: dragState && dragState.id === node.id ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out'
                }}
              >
                <div 
                  className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${isCollapsed ? '' : 'border-b border-border/5 pb-1 mb-1.5'}`}
                  onPointerDown={(e) => handleNodeDragStart(e, node.id)}
                  onPointerMove={(e) => handleNodeDragMove(e, node.id)}
                  onPointerUp={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <span className="font-bold text-muted-foreground/60 uppercase">Refiner</span>
                  <button 
                    onClick={() => toggleNodeCollapse(node.id)}
                    className="hover:text-primary transition-colors cursor-pointer text-[8px] px-1 font-bold"
                  >
                    {isCollapsed ? '＋' : '－'}
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="space-y-1 font-mono text-[7px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Contrast</span>
                      <span className="text-success font-semibold">8.2:1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Color Check</span>
                      <span className="text-foreground">MATCH</span>
                    </div>
                  </div>
                )}

                {/* Input Port */}
                <div 
                  className="absolute left-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '26px' }}
                  title="In"
                ></div>
                {/* Output Port */}
                <div 
                  className="absolute right-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '26px' }}
                  title="Out"
                ></div>
              </div>
            );
          })()}

          {/* Custom Nodes */}
          {nodes.filter(n => n.type === 'custom').map(node => {
            const isCollapsed = !!collapsedNodes[node.id];
            const nodeState = customNodeState[node.id] || { intensity: 50, fxType: 'Glow' };
            
            return (
              <div 
                key={node.id}
                className="absolute bg-background/95 border border-border/15 rounded-lg flex flex-col p-2 text-[8px] z-10 canvas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: isCollapsed ? 24 : node.height,
                  boxShadow: '0 4px 12px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)',
                  transition: dragState && dragState.id === node.id ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out'
                }}
              >
                {/* Header */}
                <div 
                  className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${isCollapsed ? '' : 'border-b border-border/5 pb-1 mb-1.5'}`}
                  onPointerDown={(e) => handleNodeDragStart(e, node.id)}
                  onPointerMove={(e) => handleNodeDragMove(e, node.id)}
                  onPointerUp={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <span className="font-bold text-brand-violet uppercase truncate max-w-[55px]" title={node.title}>{node.title}</span>
                  <div className="flex items-center gap-0.5">
                    <button 
                      onClick={() => toggleNodeCollapse(node.id)}
                      className="hover:text-primary transition-colors cursor-pointer text-[8px] px-0.5 font-bold"
                      title={isCollapsed ? "Expand" : "Collapse"}
                    >
                      {isCollapsed ? '＋' : '－'}
                    </button>
                    <button 
                      onClick={() => handleDeleteNode(node.id)}
                      className="hover:text-red-500 transition-colors cursor-pointer text-[8px] px-0.5"
                      title="Delete Node"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {/* Body */}
                {!isCollapsed && (
                  <div className="flex-1 flex flex-col gap-1 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground/60 text-[6.5px]">Type</span>
                      <select 
                        value={nodeState.fxType}
                        onChange={(e) => updateCustomNode(node.id, nodeState.intensity, e.target.value)}
                        className="bg-card border border-border/10 rounded px-1 py-0.2 text-[6.5px] text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="Glow">Glow</option>
                        <option value="Grain">Grain</option>
                        <option value="Contrast">Contrast</option>
                        <option value="Halftone">Halftone</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between text-muted-foreground/60 text-[6.5px] mb-0.5">
                        <span>Intensity</span>
                        <span className="text-foreground font-semibold">{nodeState.intensity}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={nodeState.intensity}
                        onChange={(e) => updateCustomNode(node.id, parseInt(e.target.value), nodeState.fxType)}
                        className="w-full accent-primary h-1 bg-card rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
                
                {/* Ports */}
                <div 
                  className="absolute left-[-4px] w-2 h-2 rounded-full bg-brand-violet border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '31px' }}
                  title="In"
                ></div>
                <div 
                  className="absolute right-[-4px] w-2 h-2 rounded-full bg-brand-violet border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '31px' }}
                  title="Out"
                ></div>
              </div>
            );
          })}

          {/* Output Node */}
          {(() => {
            const node = nodes.find(n => n.id === 'output')!;
            const isCollapsed = !!collapsedNodes[node.id];
            return (
              <div 
                className="absolute bg-background/95 border border-border/15 rounded-lg flex flex-col p-2.5 z-10 canvas-node"
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: isCollapsed ? 24 : node.height,
                  boxShadow: '0 4px 12px oklch(0% 0 0 / 40%), inset 0 1px 0 oklch(100% 0 0 / 8%)',
                  transition: dragState && dragState.id === node.id ? 'none' : 'left 0.05s ease-out, top 0.05s ease-out'
                }}
              >
                <div 
                  className={`flex items-center justify-between cursor-grab active:cursor-grabbing select-none ${isCollapsed ? '' : 'border-b border-border/5 pb-1'}`}
                  onPointerDown={(e) => handleNodeDragStart(e, node.id)}
                  onPointerMove={(e) => handleNodeDragMove(e, node.id)}
                  onPointerUp={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <span className="font-bold text-muted-foreground/60 uppercase text-[8px]">Output</span>
                  <div className="flex items-center gap-1">
                    {!isCollapsed && <span className="text-primary font-bold text-[7px]">1:1</span>}
                    <button 
                      onClick={() => toggleNodeCollapse(node.id)}
                      className="hover:text-primary transition-colors cursor-pointer text-[8px] px-1 font-bold"
                    >
                      {isCollapsed ? '＋' : '－'}
                    </button>
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 flex flex-col justify-between mt-1.5 h-[130px]">
                    {/* Render box */}
                    <div className="flex-1 w-full flex flex-col justify-center items-center my-1 relative overflow-hidden bg-card/25 border border-border/5 rounded p-1.5 select-none">
                      {isGenerating ? (
                        <div className="w-full h-full flex flex-col justify-center items-center gap-1.5">
                          <div className="h-1.5 w-full rounded bg-muted skeleton-shimmer"></div>
                          <div className="h-1.5 w-3/4 rounded bg-muted skeleton-shimmer"></div>
                          <svg className="animate-spin h-3.5 w-3.5 text-primary mt-1" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col justify-between text-left relative z-10">
                          <span className="text-[6px] font-bold text-primary bg-primary/10 border border-primary/20 px-1 py-0.2 rounded-sm uppercase tracking-widest truncate self-start">{activePrompt.tag}</span>
                          
                          {/* Micro SVG preview changing with inputs and filters */}
                          <div className="w-full flex-1 flex items-center justify-center my-1 relative">
                            <svg viewBox="0 0 100 100" className="w-12 h-12 pointer-events-none text-muted-foreground/10 relative z-10">
                              {selectedPrompt === 'preset-a' && (
                                <g>
                                  <circle cx="50" cy="50" r="38" stroke="var(--color-primary)" strokeWidth="0.5" fill="none" strokeDasharray="2 3" className="opacity-60" />
                                  <circle cx="50" cy="50" r="26" stroke="var(--color-brand-violet)" strokeWidth="0.75" fill="none" className="opacity-40 animate-[spin_8s_linear_infinite]" />
                                  <circle cx="50" cy="50" r="12" stroke="var(--color-primary)" strokeWidth="0.5" fill="none" />
                                </g>
                              )}
                              {selectedPrompt === 'preset-b' && (
                                <g>
                                  <rect x="20" y="20" width="60" height="60" stroke="var(--color-border)" strokeWidth="0.5" fill="none" />
                                  <line x1="20" y1="50" x2="80" y2="50" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.3" />
                                  <line x1="50" y1="20" x2="50" y2="80" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.3" />
                                  <circle cx="50" cy="50" r="8" stroke="var(--color-brand-violet)" strokeWidth="0.75" fill="none" />
                                </g>
                              )}
                              {selectedPrompt === 'preset-c' && (
                                <g>
                                  <circle cx="50" cy="50" r="35" stroke="var(--color-brand-violet)" strokeWidth="0.5" fill="none" strokeDasharray="4 4" className="animate-[spin_20s_linear_infinite]" />
                                  <path d="M 20 50 Q 35 25, 50 50 T 80 50" stroke="var(--color-primary)" strokeWidth="0.75" fill="none" className="opacity-80" />
                                </g>
                              )}
                            </svg>
                            
                            {/* Dynamic overlay FX filters */}
                            {nodes.filter(n => n.type === 'custom').map(node => {
                              const nodeState = customNodeState[node.id] || { intensity: 50, fxType: 'Glow' };
                              if (nodeState.intensity <= 0) return null;
                              
                              const opacity = (nodeState.intensity / 100) * 0.45;
                              if (nodeState.fxType === 'Glow') {
                                return (
                                  <div 
                                    key={node.id} 
                                    className="absolute inset-0 bg-primary/20 blur-sm pointer-events-none rounded-sm" 
                                    style={{ opacity }} 
                                  />
                                );
                              }
                              if (nodeState.fxType === 'Grain') {
                                return (
                                  <div 
                                    key={node.id} 
                                    className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none rounded-sm" 
                                    style={{ opacity: opacity * 0.4 }} 
                                  />
                                );
                              }
                              if (nodeState.fxType === 'Contrast') {
                                return (
                                  <div 
                                    key={node.id} 
                                    className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none rounded-sm" 
                                    style={{ opacity }} 
                                  />
                                );
                              }
                              if (nodeState.fxType === 'Halftone') {
                                return (
                                  <div 
                                    key={node.id} 
                                    className="absolute inset-0 bg-[radial-gradient(circle,currentColor_1px,transparent_1.5px)] bg-[size:6px_6px] text-primary/30 pointer-events-none rounded-sm" 
                                    style={{ opacity }} 
                                  />
                                );
                              }
                              return null;
                            })}
                          </div>
                          
                          <div className="h-3.5 w-full bg-primary/20 border border-primary/30 flex items-center justify-center rounded-sm mt-1 z-10">
                            <span className="text-[5px] text-foreground font-bold tracking-wider uppercase">Variant Rendered</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[6px] text-muted-foreground/60 truncate mt-1">REF: {activeRef.name}</span>
                  </div>
                )}
                <div 
                  className="absolute left-[-4px] w-2 h-2 rounded-full bg-primary border border-background shadow-sm"
                  style={{ top: isCollapsed ? '8px' : '96px' }}
                  title="In"
                ></div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Floating Canvas Navigation Overlays (Miro/Figma style) */}
      {/* Zoom controls bottom-left */}
      <div className="absolute left-4 bottom-4 flex items-center bg-background/90 border border-border/15 px-2 py-1 rounded-md gap-2 text-[9px] z-30 select-none shadow-md">
        <button 
          onClick={() => setZoomScale(prev => Math.max(50, prev - 10))}
          className="hover:text-primary transition-colors cursor-pointer w-4 h-4 flex items-center justify-center font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <span className="font-semibold text-foreground tracking-tighter w-8 text-center">{zoomScale}%</span>
        <button 
          onClick={() => setZoomScale(prev => Math.min(150, prev + 10))}
          className="hover:text-primary transition-colors cursor-pointer w-4 h-4 flex items-center justify-center font-bold"
          title="Zoom In"
        >
          +
        </button>
        <div className="w-[1px] h-3 bg-border/20 mx-0.5"></div>
        <button 
          onClick={() => { setZoomScale(100); setPanOffset({ x: 0, y: 0 }); }}
          className="hover:text-primary transition-colors cursor-pointer text-[8px]"
          title="Recenter & Reset Zoom"
        >
          ⛶
        </button>
      </div>

      {/* Footer statistics bar */}
      <div className="flex justify-between items-center px-4 py-2 border-t border-border/10 bg-card/20 z-20 text-[9px] text-muted-foreground/50 select-none">
        <span>BATCH_ID · 01J2K</span>
        <span className="font-bold">TOTAL GENERATIONS · {generationCount}</span>
      </div>
    </div>
  );
}
