'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { C4Model } from '@/app/utils/githubAnalyzer';
import { Handle, Position, NodeProps } from 'reactflow';

// Custom node types for C4 Model diagrams
export const SystemNode = ({ data }: NodeProps) => {
  return (
    <div className={`p-4 rounded-lg shadow-lg border-2 w-48 h-32 flex flex-col ${data.isExternal ? 'bg-gray-800 border-gray-600' : 'bg-blue-800 border-blue-600'}`}>
      <div className="text-xs text-gray-300 mb-1">[System]</div>
      <div className="font-bold text-white mb-1 truncate">{data.name}</div>
      <div className="text-xs text-gray-300 flex-grow overflow-y-auto">
        {data.description}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
};

export const PersonNode = ({ data }: NodeProps) => {
  return (
    <div className="p-4 rounded-lg shadow-lg border-2 bg-yellow-700 border-yellow-600 w-48 h-32 flex flex-col">
      <div className="text-xs text-gray-200 mb-1">[Person]</div>
      <div className="font-bold text-white mb-1 truncate">{data.name}</div>
      <div className="text-xs text-gray-200 flex-grow overflow-y-auto">
        {data.description}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500" />
    </div>
  );
};

export const ContainerNode = ({ data }: NodeProps) => {
  return (
    <div className={`p-4 rounded-lg shadow-lg border-2 w-48 h-40 flex flex-col ${data.isExternal ? 'bg-gray-800 border-gray-600' : 'bg-green-800 border-green-600'}`}>
      <div className="text-xs text-gray-300 mb-1">[Container]</div>
      <div className="font-bold text-white mb-1 truncate">{data.name}</div>
      <div className="text-xs text-gray-300 mb-1 flex-grow overflow-y-auto">
        {data.description}
      </div>
      <div className="text-xs italic text-gray-300">{data.technology}</div>
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
};

export const ComponentNode = ({ data }: NodeProps) => {
  return (
    <div className="p-4 rounded-lg shadow-lg border-2 bg-purple-800 border-purple-600 w-48 h-40 flex flex-col">
      <div className="text-xs text-gray-300 mb-1">[Component]</div>
      <div className="font-bold text-white mb-1 truncate">{data.name}</div>
      <div className="text-xs text-gray-300 mb-1 flex-grow overflow-y-auto">
        {data.description}
      </div>
      <div className="text-xs italic text-gray-300">{data.technology}</div>
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
    </div>
  );
};

export const CodeElementNode = ({ data }: NodeProps) => {
  return (
    <div className="p-4 rounded-lg shadow-lg border-2 bg-indigo-800 border-indigo-600 w-48 min-h-40 flex flex-col">
      <div className="text-xs text-gray-300 mb-1">[{data.type}]</div>
      <div className="font-bold text-white mb-1 truncate">{data.name}</div>
      {data.properties && data.properties.length > 0 && (
        <div className="bg-indigo-900 rounded p-2 mt-1 mb-1 text-xs text-gray-300">
          {data.properties.map((prop: any, index: number) => (
            <div key={index} className="mb-1">
              <span className="opacity-70">- {prop.visibility || ''} </span>
              <span className="text-blue-300">{prop.name}</span>
              <span className="opacity-70">: {prop.type}</span>
            </div>
          ))}
        </div>
      )}
      {data.methods && data.methods.length > 0 && (
        <div className="bg-indigo-900 rounded p-2 text-xs text-gray-300">
          {data.methods.map((method: any, index: number) => (
            <div key={index} className="mb-1">
              <span className="opacity-70">+ {method.visibility || ''} </span>
              <span className="text-green-300">{method.name}</span>
              <span className="opacity-70">({method.params || ''}): {method.returnType}</span>
            </div>
          ))}
        </div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-indigo-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500" />
    </div>
  );
};
