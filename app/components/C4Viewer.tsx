'use client';

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Node,
  Edge,
  ConnectionLineType,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { C4Model, Relationship } from '@/app/utils/githubAnalyzer';
import { SystemNode, PersonNode, ContainerNode, ComponentNode, CodeElementNode } from './C4Nodes';
import { generateCodeElements } from '@/app/utils/codeElementsGenerator';
import dagre from 'dagre';

// Define node types
const nodeTypes = {
  system: SystemNode,
  person: PersonNode,
  container: ContainerNode,
  component: ComponentNode,
  code: CodeElementNode
};

// Default node width and height for layout
const NODE_WIDTH = 200;
const NODE_HEIGHT = 150;

interface C4ViewerProps {
  model: C4Model;
}

// Function to calculate layout using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: NODE_WIDTH, 
      height: node.type === 'person' ? NODE_HEIGHT - 20 : NODE_HEIGHT 
    });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply layout to nodes
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
      };
    }),
    edges,
  };
};

// Helper function to get edge color based on relationship
const getEdgeColor = (relationship: Relationship): string => {
  if (relationship.description.toLowerCase().includes('api') || 
      relationship.technology?.toLowerCase().includes('api') ||
      relationship.description.toLowerCase().includes('calls')) {
    return '#3b82f6'; // blue
  } else if (relationship.description.toLowerCase().includes('contains')) {
    return '#6b7280'; // gray
  } else if (relationship.description.toLowerCase().includes('reads') || 
             relationship.description.toLowerCase().includes('writes') ||
             relationship.description.toLowerCase().includes('data')) {
    return '#10b981'; // green
  } else {
    return '#64748b'; // slate
  }
};

// Convert C4 model to nodes and edges for ReactFlow
const createNodesAndEdges = (model: C4Model, viewLevel: 'context' | 'container' | 'component' | 'code', focusId?: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Context level: show persons and systems
  if (viewLevel === 'context') {
    // Add persons
    model.persons.forEach(person => {
      nodes.push({
        id: person.id,
        type: 'person',
        data: { ...person },
        position: { x: 0, y: 0 }
      });
    });
    
    // Add systems
    model.systems.forEach(system => {
      nodes.push({
        id: system.id,
        type: 'system',
        data: { ...system },
        position: { x: 0, y: 0 }
      });
    });
    
    // Add relationships
    model.relationships.forEach(rel => {
      // Only add relationships between persons and systems
      const sourceIsPersonOrSystem = 
        model.persons.some(p => p.id === rel.sourceId) || 
        model.systems.some(s => s.id === rel.sourceId);
      
      const targetIsPersonOrSystem = 
        model.persons.some(p => p.id === rel.targetId) || 
        model.systems.some(s => s.id === rel.targetId);
      
      if (sourceIsPersonOrSystem && targetIsPersonOrSystem) {
        edges.push({
          id: rel.id,
          source: rel.sourceId,
          target: rel.targetId,
          label: rel.description,
          type: 'smoothstep',
          animated: rel.technology?.includes('API') || false,
          style: { stroke: getEdgeColor(rel) }
        });
      }
    });
  }
  
  // Container level: show containers for a specific system
  else if (viewLevel === 'container' && focusId) {
    // Find focused system
    const focusedSystem = model.systems.find(s => s.id === focusId);
    if (!focusedSystem) return { nodes, edges };
    
    // Add the system
    nodes.push({
      id: focusedSystem.id,
      type: 'system',
      data: { ...focusedSystem },
      position: { x: 0, y: 0 }
    });
    
    // Add containers for the system
    const systemContainers = model.containers.filter(c => c.systemId === focusId);
    
    systemContainers.forEach(container => {
      nodes.push({
        id: container.id,
        type: 'container',
        data: { ...container },
        position: { x: 0, y: 0 }
      });
    });
    
    // Add relationships between containers
    model.relationships.forEach(rel => {
      const sourceIsSystemOrContainer = 
        rel.sourceId === focusId || 
        systemContainers.some(c => c.id === rel.sourceId);
      
      const targetIsSystemOrContainer = 
        rel.targetId === focusId || 
        systemContainers.some(c => c.id === rel.targetId);
      
      if (sourceIsSystemOrContainer && targetIsSystemOrContainer) {
        edges.push({
          id: rel.id,
          source: rel.sourceId,
          target: rel.targetId,
          label: rel.description,
          type: 'smoothstep',
          animated: rel.technology?.includes('API') || false,
          style: { stroke: getEdgeColor(rel) }
        });
      }
    });
    
    // Add external systems that interact with containers
    const containerIds = systemContainers.map(c => c.id);
    const relevantRelationships = model.relationships.filter(rel => 
      containerIds.includes(rel.sourceId) || containerIds.includes(rel.targetId)
    );
    
    // Get external systems from these relationships
    const externalSystemIds = new Set<string>();
    
    relevantRelationships.forEach(rel => {
      const sourceIsExternalSystem = 
        model.systems.some(s => s.id === rel.sourceId && s.id !== focusId && s.isExternal);
      
      const targetIsExternalSystem = 
        model.systems.some(s => s.id === rel.targetId && s.id !== focusId && s.isExternal);
      
      if (sourceIsExternalSystem) externalSystemIds.add(rel.sourceId);
      if (targetIsExternalSystem) externalSystemIds.add(rel.targetId);
    });
    
    // Add external systems to nodes
    externalSystemIds.forEach(id => {
      const system = model.systems.find(s => s.id === id);
      if (system) {
        nodes.push({
          id: system.id,
          type: 'system',
          data: { ...system },
          position: { x: 0, y: 0 }
        });
      }
    });
    
    // Add relationships with external systems
    externalSystemIds.forEach(externalId => {
      model.relationships.forEach(rel => {
        if ((rel.sourceId === externalId && containerIds.includes(rel.targetId)) ||
            (rel.targetId === externalId && containerIds.includes(rel.sourceId))) {
          edges.push({
            id: rel.id,
            source: rel.sourceId,
            target: rel.targetId,
            label: rel.description,
            type: 'smoothstep',
            animated: rel.technology?.includes('API') || false,
            style: { stroke: getEdgeColor(rel) }
          });
        }
      });
    });

    // Add user (person) if they interact with this system
    model.persons.forEach(person => {
      // Check if person interacts with the system or any container
      const interactsWithSystemOrContainer = model.relationships.some(rel => 
        (rel.sourceId === person.id && (rel.targetId === focusId || containerIds.includes(rel.targetId))) ||
        (rel.targetId === person.id && (rel.sourceId === focusId || containerIds.includes(rel.sourceId)))
      );
      
      if (interactsWithSystemOrContainer) {
        nodes.push({
          id: person.id,
          type: 'person',
          data: { ...person },
          position: { x: 0, y: 0 }
        });
        
        // Add those relationships
        model.relationships.forEach(rel => {
          if ((rel.sourceId === person.id && (rel.targetId === focusId || containerIds.includes(rel.targetId))) ||
              (rel.targetId === person.id && (rel.sourceId === focusId || containerIds.includes(rel.sourceId)))) {
            edges.push({
              id: rel.id,
              source: rel.sourceId,
              target: rel.targetId,
              label: rel.description,
              type: 'smoothstep',
              style: { stroke: getEdgeColor(rel) }
            });
          }
        });
      }
    });
  }
  
  // Component level: show components for a specific container
  else if (viewLevel === 'component' && focusId) {
    // Find focused container
    const focusedContainer = model.containers.find(c => c.id === focusId);
    if (!focusedContainer) return { nodes, edges };
    
    // Add the container
    nodes.push({
      id: focusedContainer.id,
      type: 'container',
      data: { ...focusedContainer },
      position: { x: 0, y: 0 }
    });
    
    // Add components for the container
    const containerComponents = model.components.filter(c => c.containerId === focusId);
    
    containerComponents.forEach(component => {
      nodes.push({
        id: component.id,
        type: 'component',
        data: { ...component },
        position: { x: 0, y: 0 }
      });
    });
    
    // Add relationships between components
    model.relationships.forEach(rel => {
      const sourceIsContainerOrComponent = 
        rel.sourceId === focusId || 
        containerComponents.some(c => c.id === rel.sourceId);
      
      const targetIsContainerOrComponent = 
        rel.targetId === focusId || 
        containerComponents.some(c => c.id === rel.targetId);
      
      if (sourceIsContainerOrComponent && targetIsContainerOrComponent) {
        edges.push({
          id: rel.id,
          source: rel.sourceId,
          target: rel.targetId,
          label: rel.description,
          type: 'smoothstep',
          style: { stroke: getEdgeColor(rel) }
        });
      }
    });
    
    // Add related containers that interact with this container's components
    const componentIds = containerComponents.map(c => c.id);
    const interactingContainerIds = new Set<string>();
    
    model.relationships.forEach(rel => {
      // Find containers that interact with this container's components
      if (componentIds.includes(rel.sourceId)) {
        const targetContainer = model.containers.find(c => c.id !== focusId && c.id === model.components.find(comp => comp.id === rel.targetId)?.containerId);
        if (targetContainer) interactingContainerIds.add(targetContainer.id);
      } else if (componentIds.includes(rel.targetId)) {
        const sourceContainer = model.containers.find(c => c.id !== focusId && c.id === model.components.find(comp => comp.id === rel.sourceId)?.containerId);
        if (sourceContainer) interactingContainerIds.add(sourceContainer.id);
      }
    });
    
    // Add interacting containers
    interactingContainerIds.forEach(id => {
      const container = model.containers.find(c => c.id === id);
      if (container) {
        nodes.push({
          id: container.id,
          type: 'container',
          data: { ...container, isExternal: true },
          position: { x: 0, y: 0 }
        });
      }
    });
    
    // Add relationships with interacting containers
    model.relationships.forEach(rel => {
      const sourceComponent = model.components.find(c => c.id === rel.sourceId);
      const targetComponent = model.components.find(c => c.id === rel.targetId);
      
      if (sourceComponent && targetComponent) {
        if (sourceComponent.containerId === focusId && interactingContainerIds.has(targetComponent.containerId)) {
          edges.push({
            id: `rel-${sourceComponent.id}-${targetComponent.containerId}`,
            source: sourceComponent.id,
            target: targetComponent.containerId,
            label: rel.description,
            type: 'smoothstep',
            style: { stroke: getEdgeColor(rel) }
          });
        } else if (targetComponent.containerId === focusId && interactingContainerIds.has(sourceComponent.containerId)) {
          edges.push({
            id: `rel-${sourceComponent.containerId}-${targetComponent.id}`,
            source: sourceComponent.containerId,
            target: targetComponent.id,
            label: rel.description,
            type: 'smoothstep',
            style: { stroke: getEdgeColor(rel) }
          });
        }
      }
    });
  }
  
  // Code level: show code elements for a specific component
  else if (viewLevel === 'code' && focusId) {
    // Find focused component
    const focusedComponent = model.components.find(c => c.id === focusId);
    if (!focusedComponent) return { nodes, edges };
    
    // Add the component
    nodes.push({
      id: focusedComponent.id,
      type: 'component',
      data: { ...focusedComponent },
      position: { x: 350, y: 80 }
    });
    
    // Generate some realistic code elements based on the component's name and technology
    // In a real implementation, this would come from analyzing the actual code
    const codeElements = generateCodeElements(focusedComponent);
    
    // Add the code elements
    codeElements.forEach((element, index) => {
      const angle = (2 * Math.PI * index) / codeElements.length;
      const radius = 250; // Distance from center
      const x = 350 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);
      
      nodes.push({
        id: `code-${element.name}`,
        type: 'code',
        data: element,
        position: { x, y }
      });
      
      // Add relationship between component and code element
      edges.push({
        id: `rel-${focusedComponent.id}-${element.name}`,
        source: focusedComponent.id,
        target: `code-${element.name}`,
        label: 'Implements',
        type: 'smoothstep',
        style: { stroke: '#8b5cf6' } // purple
      });
    });
    
    // Add relationships between code elements
    for (let i = 0; i < codeElements.length; i++) {
      for (let j = i + 1; j < codeElements.length; j++) {
        const sourceElement = codeElements[i];
        const targetElement = codeElements[j];
        
        // Add relationship based on dependency patterns in the names
        if (
          targetElement.name.includes(sourceElement.name.replace('Controller', '').replace('Service', '').replace('Repository', '')) ||
          sourceElement.name.includes(targetElement.name.replace('Controller', '').replace('Service', '').replace('Repository', ''))
        ) {
          edges.push({
            id: `rel-${sourceElement.name}-${targetElement.name}`,
            source: `code-${sourceElement.name}`,
            target: `code-${targetElement.name}`,
            label: 'Uses',
            type: 'smoothstep',
            style: { stroke: '#6b7280' } // gray
          });
        }
      }
    }
    
    // In this case, we'll skip the automatic layout to keep the radial pattern
    return { nodes, edges };
  }
  
  // Apply layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
  
  return { nodes: layoutedNodes, edges: layoutedEdges };
};

export default function C4Viewer({ model }: C4ViewerProps) {
  const [viewLevel, setViewLevel] = useState<'context' | 'container' | 'component' | 'code'>('context');
  const [focusId, setFocusId] = useState<string | undefined>();
  const [focusHistory, setFocusHistory] = useState<Array<{level: 'context' | 'container' | 'component' | 'code', id?: string}>>([{level: 'context'}]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Update diagram when model or view level changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = createNodesAndEdges(model, viewLevel, focusId);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [model, viewLevel, focusId, setNodes, setEdges]);
  
  // Handle node click to drill down
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // System Context -> Container
    if (viewLevel === 'context' && node.type === 'system' && !node.data.isExternal) {
      setFocusHistory(prev => [...prev, {level: 'container', id: node.id}]);
      setViewLevel('container');
      setFocusId(node.id);
    } 
    // Container -> Component
    else if (viewLevel === 'container' && node.type === 'container') {
      // Check if the container has components
      const hasComponents = model.components.some(comp => comp.containerId === node.id);
      if (hasComponents) {
        setFocusHistory(prev => [...prev, {level: 'component', id: node.id}]);
        setViewLevel('component');
        setFocusId(node.id);
      }
    }
    // Component -> Code
    else if (viewLevel === 'component' && node.type === 'component') {
      // Move to code level with this component's ID
      setFocusHistory(prev => [...prev, {level: 'code', id: node.id}]);
      setViewLevel('code');
      setFocusId(node.id);
    }
  }, [viewLevel, model.components]);
  
  // Go back to previous level based on history
  const goBack = useCallback(() => {
    if (focusHistory.length > 1) {
      // Remove current level from history
      const newHistory = [...focusHistory];
      newHistory.pop();
      
      // Get the previous level
      const previousState = newHistory[newHistory.length - 1];
      
      setFocusHistory(newHistory);
      setViewLevel(previousState.level);
      setFocusId(previousState.id);
    }
  }, [focusHistory]);

  // Jump to a specific level
  const jumpToLevel = useCallback((level: 'context' | 'container' | 'component' | 'code', id?: string) => {
    // Find the index in history if it exists
    const index = focusHistory.findIndex(item => item.level === level);
    
    if (index >= 0) {
      // If we have this level in history, trim history to this point and use the id from history
      const newHistory = focusHistory.slice(0, index + 1);
      setFocusHistory(newHistory);
      setViewLevel(level);
      setFocusId(newHistory[index].id);
    } else {
      // Otherwise just set the level (mainly for jumping to context)
      setFocusHistory([{level, id}]);
      setViewLevel(level);
      setFocusId(id);
    }
  }, [focusHistory]);

  // Get level details for the breadcrumb trail
  const getLevelInfo = useCallback(() => {
    let title = '';
    
    if (viewLevel === 'context') {
      title = 'System Context';
    } else if (viewLevel === 'container' && focusId) {
      const system = model.systems.find(s => s.id === focusId);
      title = system ? `Containers for ${system.name}` : 'Container Diagram';
    } else if (viewLevel === 'component' && focusId) {
      const container = model.containers.find(c => c.id === focusId);
      title = container ? `Components for ${container.name}` : 'Component Diagram';
    } else if (viewLevel === 'code' && focusId) {
      const component = model.components.find(c => c.id === focusId);
      title = component ? `Code for ${component.name}` : 'Code Diagram';
    }
    
    return { title };
  }, [viewLevel, focusId, model.systems, model.containers, model.components]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
        
        <Panel position="top-left" className="bg-gray-800 p-4 rounded-md text-white shadow-xl">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-xl mb-2">{getLevelInfo().title}</h3>
            
            {/* Breadcrumb navigation */}
            <div className="flex flex-wrap items-center text-sm mb-3 bg-gray-700 p-2 rounded">
              <button 
                onClick={() => jumpToLevel('context')}
                className={`${viewLevel === 'context' ? 'font-bold text-blue-400' : 'text-gray-300 hover:text-white'}`}
              >
                Context
              </button>
              
              {focusHistory.some(h => h.level === 'container') && (
                <>
                  <span className="mx-2 text-gray-500">/</span>
                  <button 
                    onClick={() => jumpToLevel('container')}
                    className={`${viewLevel === 'container' ? 'font-bold text-blue-400' : 'text-gray-300 hover:text-white'}`}
                  >
                    Containers
                  </button>
                </>
              )}
              
              {focusHistory.some(h => h.level === 'component') && (
                <>
                  <span className="mx-2 text-gray-500">/</span>
                  <button 
                    onClick={() => jumpToLevel('component')}
                    className={`${viewLevel === 'component' ? 'font-bold text-blue-400' : 'text-gray-300 hover:text-white'}`}
                  >
                    Components
                  </button>
                </>
              )}
              
              {focusHistory.some(h => h.level === 'code') && (
                <>
                  <span className="mx-2 text-gray-500">/</span>
                  <button 
                    onClick={() => jumpToLevel('code')}
                    className={`${viewLevel === 'code' ? 'font-bold text-blue-400' : 'text-gray-300 hover:text-white'}`}
                  >
                    Code
                  </button>
                </>
              )}
            </div>
            
            {viewLevel !== 'context' && (
              <button
                onClick={goBack}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to {viewLevel === 'component' ? 'Container' : 'Context'} Level
              </button>
            )}
            
            <div className="text-sm mt-4 border-t border-gray-700 pt-3">
              <div className="font-medium mb-1">Navigation Tips:</div>
              <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                <li>Click on nodes to drill down to deeper levels</li>
                <li>Use breadcrumbs to quickly navigate between levels</li>
                <li>Use controls on bottom-right to zoom and pan</li>
                <li>Hover over elements to see details</li>
              </ul>
            </div>
            
            {/* Legend */}
            <div className="mt-4 border-t border-gray-700 pt-3">
              <div className="font-medium mb-2">Legend:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-700 rounded-sm mr-1"></div>
                  <span>Person</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-700 rounded-sm mr-1"></div>
                  <span>System</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-700 rounded-sm mr-1"></div>
                  <span>Container</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-700 rounded-sm mr-1"></div>
                  <span>Component</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-700 rounded-sm mr-1"></div>
                  <span>Code Element</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
