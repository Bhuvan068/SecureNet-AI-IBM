import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Chip, Tooltip,
  CircularProgress, Alert, useTheme,
} from '@mui/material';
import type { ExecutionTimeline } from '../api/enterprise';

const AGENT_NODES = [
  { id: 'input',   label: 'Network Event',     type: 'input',   x: 50,  y: 20  },
  { id: 'obs',     label: 'Observer Agent',    type: 'agent',   x: 50,  y: 120 },
  { id: 'det',     label: 'Detection Agent',   type: 'agent',   x: 50,  y: 220 },
  { id: 'reason',  label: 'Threat Reasoning',  type: 'agent',   x: 50,  y: 320 },
  { id: 'mem',     label: 'Memory Agent',      type: 'agent',   x: 50,  y: 420 },
  { id: 'cmp',     label: 'Comparison Engine', type: 'engine',  x: 50,  y: 520 },
  { id: 'mitig',   label: 'Mitigation Agent',  type: 'agent',   x: 50,  y: 620 },
  { id: 'report',  label: 'Report Agent',      type: 'agent',   x: 50,  y: 720 },
  { id: 'audit',   label: 'Audit Log Agent',   type: 'agent',   x: 50,  y: 820 },
];

const AGENT_NAME_MAP: Record<string, string> = {
  input:   '',
  obs:     'ObserverAgent',
  det:     'DetectionAgent',
  reason:  'ThreatReasoningAgent',
  mem:     'HistoricalMemoryAgent',
  cmp:     'ComparisonEngine',
  mitig:   'MitigationAgent',
  report:  'ReportAgent',
  audit:   'AuditLogAgent',
};

const TYPE_COLORS: Record<string, string> = {
  input:  '#3b82d4',
  agent:  '#7c5cd8',
  engine: '#d29922',
};

interface Props {
  timeline?: ExecutionTimeline | null;
  loading?: boolean;
  selectedAgent?: string;
  onSelectAgent?: (agentName: string) => void;
}

export default function WorkflowGraph({ timeline, loading, selectedAgent, onSelectAgent }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const stepMap: Record<string, { status: string; execution_time_ms: number; confidence: number; decision?: string }> = {};
  if (timeline) {
    for (const step of timeline.steps) {
      stepMap[step.agent_name] = step;
    }
  }

  const nodeW = 200;
  const nodeH = 44;
  const svgW  = 320;
  const svgH  = 920;

  const getNodeColor = (node: typeof AGENT_NODES[0]) => {
    const agentName = AGENT_NAME_MAP[node.id];
    const step = stepMap[agentName];
    if (!step) return TYPE_COLORS[node.type] ?? '#3b82d4';
    if (step.status === 'SUCCESS') return '#3fb950';
    if (step.status === 'FAILED')  return '#f85149';
    return '#d29922';
  };

  const isActive = (node: typeof AGENT_NODES[0]) => {
    const agentName = AGENT_NAME_MAP[node.id];
    return selectedAgent === agentName;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      <svg width={svgW} height={svgH} style={{ display: 'block', margin: '0 auto' }}>
        {/* Connector lines */}
        {AGENT_NODES.slice(0, -1).map((node, i) => {
          const next = AGENT_NODES[i + 1];
          const cx   = svgW / 2;
          return (
            <line
              key={`line-${i}`}
              x1={cx} y1={node.y + nodeH}
              x2={cx} y2={next.y}
              stroke={isDark ? '#30363d' : '#d0d7de'}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          );
        })}

        {/* Arrow heads */}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={isDark ? '#30363d' : '#d0d7de'} />
          </marker>
        </defs>

        {/* Nodes */}
        {AGENT_NODES.map(node => {
          const cx        = svgW / 2;
          const nx        = cx - nodeW / 2;
          const color     = getNodeColor(node);
          const agentName = AGENT_NAME_MAP[node.id];
          const step      = stepMap[agentName];
          const active    = isActive(node);

          return (
            <g
              key={node.id}
              onClick={() => agentName && onSelectAgent?.(agentName)}
              style={{ cursor: agentName ? 'pointer' : 'default' }}
            >
              {/* Glow ring for active */}
              {active && (
                <rect
                  x={nx - 3} y={node.y - 3}
                  width={nodeW + 6} height={nodeH + 6}
                  rx={9} fill="none"
                  stroke={color} strokeWidth={2.5}
                  opacity={0.6}
                />
              )}
              {/* Node box */}
              <rect
                x={nx} y={node.y}
                width={nodeW} height={nodeH}
                rx={7}
                fill={isDark ? '#161b22' : '#ffffff'}
                stroke={color}
                strokeWidth={active ? 2 : 1.5}
              />
              {/* Left accent */}
              <rect x={nx} y={node.y} width={5} height={nodeH} rx={4} fill={color} />

              {/* Label */}
              <text
                x={nx + 14} y={node.y + 16}
                fontSize="11" fontWeight="600"
                fill={isDark ? '#e6edf3' : '#1f2328'}
                fontFamily="-apple-system,'Segoe UI',system-ui,sans-serif"
              >
                {node.label}
              </text>

              {/* Step info */}
              {step && (
                <>
                  <text
                    x={nx + 14} y={node.y + 31}
                    fontSize="9"
                    fill={isDark ? '#8b949e' : '#57606a'}
                    fontFamily="monospace"
                  >
                    {`${step.execution_time_ms.toFixed(0)}ms · ${(step.confidence * 100).toFixed(0)}% conf`}
                  </text>
                  <circle
                    cx={nx + nodeW - 14} cy={node.y + nodeH / 2} r={5}
                    fill={step.status === 'SUCCESS' ? '#3fb950' : '#f85149'}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
}
