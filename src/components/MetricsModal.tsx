import React from 'react';
import { X, Activity } from 'lucide-react';
import { MetricGraphs } from './MetricGraphs';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: string;
  vmid: number;
  type: string;
  vmName: string;
}

export function MetricsModal({ isOpen, onClose, node, vmid, type, vmName }: MetricsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-slate-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-4xl max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Performance Metrics</h3>
              <p className="text-sm text-slate-500 font-medium">Instance: {vmName} <span className="font-mono text-xs">[{vmid}]</span></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <MetricGraphs node={node} vmid={vmid} type={type} />
        </div>
      </div>
    </div>
  );
}
