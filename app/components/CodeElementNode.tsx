import React from 'react';
import { NodeProps } from 'reactflow';

// Code element node for the code level visualization
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
    </div>
  );
};
