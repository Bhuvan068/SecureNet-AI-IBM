import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Typography, Paper, Chip, LinearProgress, Alert, useTheme, Tooltip, IconButton, Dialog, DialogContent, DialogTitle, Button } from '@mui/material';
import { Fullscreen, FullscreenExit, ZoomIn, ZoomOut, RestartAlt } from '@mui/icons-material';
import { fetchKnowledgeGraph } from '../api/enterprise';

interface KGNode { id: string; label: string; type: string; count: number; }
interface KGEdge { source: string; target: string; weight: number; }

const TYPE_COLORS: Record<string, string> = {
  attack:   '#f85149',
  protocol: '#3b82d4',
  service:  '#7c5cd8',
  severity: '#d29922',
};
const TYPE_RADII: Record<string, number> = { attack: 28, protocol: 20, service: 18, severity: 22 };

export default function KnowledgeGraph() {
  const [nodes,   setNodes]   = useState<KGNode[]>([]);
  const [edges,   setEdges]   = useState<KGEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [selected, setSelected] = useState<KGNode | null>(null);
  
  // Fullscreen & Transform state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';

  useEffect(() => {
    fetchKnowledgeGraph()
      .then(data => { setNodes(data.nodes.slice(0, 30)); setEdges(data.edges.slice(0, 60)); })
      .catch(() => setError('No knowledge graph data yet.'))
      .finally(() => setLoading(false));
  }, []);

  const layout = useMemo(() => {
    if (!nodes.length) return {};
    const W = 700, H = 480;
    const byType: Record<string, KGNode[]> = {};
    for (const n of nodes) {
      (byType[n.type] ??= []).push(n);
    }
    const positions: Record<string, { x: number; y: number }> = {};
    const typeRows: Record<string, [number, number]> = {
      attack:   [W * 0.5,  H * 0.2],
      protocol: [W * 0.15, H * 0.6],
      service:  [W * 0.5,  H * 0.8],
      severity: [W * 0.85, H * 0.6],
    };

    for (const [type, typeNodes] of Object.entries(byType)) {
      const [cx, cy] = typeRows[type] ?? [W / 2, H / 2];
      const n = typeNodes.length;
      typeNodes.forEach((node, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r     = Math.min(60 + n * 8, 140);
        positions[node.id] = {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        };
      });
    }
    return positions;
  }, [nodes]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale * scaleAdjust, 0.2), 5) }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="info">{error}</Alert>;

  const legendTypes = Object.entries(TYPE_COLORS);

  const renderGraph = (width: string | number, height: string | number, interactive: boolean = false) => (
    <Box 
      sx={{ 
        position: 'relative', 
        width, height, 
        overflow: 'hidden', 
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        bgcolor: isDark ? '#0d1117' : '#f6f8fa'
      }}
      onWheel={interactive ? handleWheel : undefined}
      onMouseDown={interactive ? handleMouseDown : undefined}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseUp={interactive ? handleMouseUp : undefined}
      onMouseLeave={interactive ? handleMouseUp : undefined}
    >
      {interactive && (
        <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 1, bgcolor: 'background.paper', p: 0.5, borderRadius: 1, boxShadow: 1 }}>
          <IconButton size="small" onClick={() => setTransform(p => ({ ...p, scale: p.scale * 1.2 }))}><ZoomIn /></IconButton>
          <IconButton size="small" onClick={() => setTransform(p => ({ ...p, scale: p.scale * 0.8 }))}><ZoomOut /></IconButton>
          <IconButton size="small" onClick={resetView}><RestartAlt /></IconButton>
        </Box>
      )}
      
      {!interactive && (
        <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
          <IconButton size="small" onClick={() => setIsFullscreen(true)} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}><Fullscreen /></IconButton>
        </Box>
      )}

      <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
          <marker id="kg-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={isDark ? '#30363d' : '#d0d7de'} />
          </marker>
        </defs>
        
        <g transform={`translate(${interactive ? transform.x : 0},${interactive ? transform.y : 0}) scale(${interactive ? transform.scale : 1})`}>
          {/* Centering offset for non-interactive view */}
          <g transform={!interactive ? "translate(0, 0)" : `translate(${typeof width === 'number' ? width/2 - 350 : 0}, ${typeof height === 'number' ? height/2 - 240 : 0})`}>
            {/* Edges */}
            {edges.map((edge, i) => {
              const sp = layout[edge.source];
              const tp = layout[edge.target];
              if (!sp || !tp) return null;
              return (
                <line
                  key={`e${i}`}
                  x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                  stroke={isDark ? '#30363d' : '#d0d7de'}
                  strokeWidth={Math.max(0.5, Math.min(edge.weight / 5, 3))}
                  strokeOpacity={0.5}
                  markerEnd="url(#kg-arrow)"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const pos = layout[node.id];
              if (!pos) return null;
              const color  = TYPE_COLORS[node.type] ?? '#3b82d4';
              const radius = TYPE_RADII[node.type] ?? 20;
              const isSel  = selected?.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  onClick={(e) => { e.stopPropagation(); setSelected(isSel ? null : node); }}
                  style={{ cursor: 'pointer' }}
                >
                  {isSel && <circle r={radius + 6} fill={`${color}30`} stroke={color} strokeWidth={2} />}
                  <circle
                    r={radius}
                    fill={isDark ? '#161b22' : '#ffffff'}
                    stroke={color}
                    strokeWidth={isSel ? 2.5 : 1.5}
                  />
                  <text
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={node.type === 'attack' ? 9 : 8}
                    fill={isDark ? '#e6edf3' : '#1f2328'}
                    fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif"
                    fontWeight={isSel ? 700 : 400}
                    style={{ userSelect: 'none' }}
                  >
                    {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                  </text>
                  {node.count > 1 && (
                    <text
                      textAnchor="middle" y={radius + 11}
                      fontSize={8} fill={color}
                      fontFamily="monospace"
                      style={{ userSelect: 'none' }}
                    >
                      {node.count}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {legendTypes.map(([type, color]) => (
          <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
            <Typography variant="caption" color="text.secondary" textTransform="capitalize">{type}</Typography>
          </Box>
        ))}
      </Box>

      <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {/* Render standard non-interactive preview in dashboard */}
        {renderGraph("100%", 480, false)}
      </Paper>

      {selected && (
        <Paper sx={{ mt: 1.5, p: 2, border: '1px solid', borderColor: 'primary.main' }}>
          <Typography variant="caption" fontWeight={700} color="primary.main">{selected.label}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip label={selected.type} size="small" sx={{ fontSize: 10 }} />
            <Chip label={`${selected.count} incidents`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Connected to: {edges.filter(e => e.source === selected.id || e.target === selected.id)
              .map(e => nodes.find(n => n.id === (e.source === selected.id ? e.target : e.source))?.label)
              .filter(Boolean).slice(0, 5).join(', ')}
          </Typography>
        </Paper>
      )}

      {/* Fullscreen Dialog */}
      <Dialog fullScreen open={isFullscreen} onClose={() => setIsFullscreen(false)}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', p: 1 }}>
          <Typography variant="h6">Knowledge Graph</Typography>
          <IconButton onClick={() => setIsFullscreen(false)}><FullscreenExit /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          {renderGraph("100%", "100%", true)}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
