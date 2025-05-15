import { Octokit } from 'octokit';

// Define C4 model types
export interface Person {
  id: string;
  name: string;
  description: string;
  type: 'person';
}

export interface System {
  id: string;
  name: string;
  description: string;
  type: 'system';
  isExternal?: boolean;
}

export interface Container {
  id: string;
  systemId: string;
  name: string;
  description: string;
  technology: string;
  type: 'container';
}

export interface Component {
  id: string;
  containerId: string;
  name: string;
  description: string;
  technology: string;
  type: 'component';
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  description: string;
  technology?: string;
}

export interface C4Model {
  persons: Person[];
  systems: System[];
  containers: Container[];
  components: Component[];
  relationships: Relationship[];
}

// Extract owner and repo from GitHub URL
export function extractRepoInfo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
    if (url.hostname !== 'github.com') {
      return null;
    }
    
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) {
      return null;
    }
    
    return { owner: pathParts[0], repo: pathParts[1] };
  } catch (error) {
    return null;
  }
}

// Analyze GitHub repository and generate C4 model
export async function analyzeRepository(
  owner: string, 
  repo: string, 
  accessToken?: string
): Promise<C4Model> {
  const octokit = new Octokit({ auth: accessToken });
  
  // Initialize C4 model
  const c4Model: C4Model = {
    persons: [],
    systems: [],
    containers: [],
    components: [],
    relationships: []
  };
  
  try {
    // Get repository info
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    
    // Add main system
    const mainSystemId = `system-${repo}`;
    c4Model.systems.push({
      id: mainSystemId,
      name: repoData.name,
      description: repoData.description || `${repoData.name} system`,
      type: 'system'
    });
    
    // Add user as person
    const userId = 'user-general';
    c4Model.persons.push({
      id: userId,
      name: 'User',
      description: 'A user of the system',
      type: 'person'
    });
    
    // Add relationship between user and system
    c4Model.relationships.push({
      id: `rel-${userId}-${mainSystemId}`,
      sourceId: userId,
      targetId: mainSystemId,
      description: 'Uses'
    });
    
    // Get main directories which will be our containers
    const { data: contentsData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '',
    });
    
    if (Array.isArray(contentsData)) {
      // Find key directories that typically contain code
      const relevantDirs = contentsData.filter(
        item => item.type === 'dir' && 
        ['src', 'app', 'lib', 'packages', 'components', 'services', 'api'].includes(item.name)
      );
      
      // If we have package.json, get dependencies to identify external systems
      const packageJsonFile = contentsData.find(
        item => item.type === 'file' && item.name === 'package.json'
      );
      
      if (packageJsonFile) {
        const { data: packageJsonData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: packageJsonFile.path,
        });
        
        if ('content' in packageJsonData) {
          const packageJson = JSON.parse(
            Buffer.from(packageJsonData.content, 'base64').toString()
          );
          
          // Add major dependencies as external systems
          const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };
          
          const majorDeps = Object.keys(dependencies || {}).filter(dep => 
            !dep.startsWith('@types/') && 
            !dep.includes('eslint') && 
            !dep.includes('prettier')
          ).slice(0, 5); // Limit to 5 major dependencies
          
          majorDeps.forEach(dep => {
            const externalSystemId = `system-external-${dep}`;
            c4Model.systems.push({
              id: externalSystemId,
              name: dep,
              description: `External ${dep} system`,
              type: 'system',
              isExternal: true
            });
            
            c4Model.relationships.push({
              id: `rel-${mainSystemId}-${externalSystemId}`,
              sourceId: mainSystemId,
              targetId: externalSystemId,
              description: 'Uses',
              technology: dependencies[dep]
            });
          });
        }
      }
      
      // Process the relevant directories as containers
      for (const dir of relevantDirs) {
        const containerId = `container-${dir.name}`;
        c4Model.containers.push({
          id: containerId,
          systemId: mainSystemId,
          name: dir.name,
          description: `${dir.name} container`,
          technology: detectTechnology(dir.name, repoData.language),
          type: 'container'
        });
        
        // Relationship between system and container
        c4Model.relationships.push({
          id: `rel-${mainSystemId}-${containerId}`,
          sourceId: mainSystemId,
          targetId: containerId,
          description: 'Contains'
        });
        
        // Get subdirectories as components
        try {
          const { data: containerContents } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: dir.path,
          });
          
          if (Array.isArray(containerContents)) {
            const components = containerContents.filter(
              item => item.type === 'dir' || 
              (item.type === 'file' && 
               (item.name.endsWith('.js') || 
                item.name.endsWith('.ts') || 
                item.name.endsWith('.jsx') || 
                item.name.endsWith('.tsx'))
              )
            );
            
            for (const component of components) {
              const componentId = `component-${dir.name}-${component.name}`;
              c4Model.components.push({
                id: componentId,
                containerId: containerId,
                name: component.name,
                description: `${component.name} component`,
                technology: detectComponentTechnology(component.name),
                type: 'component'
              });
              
              // Relationship between container and component
              c4Model.relationships.push({
                id: `rel-${containerId}-${componentId}`,
                sourceId: containerId,
                targetId: componentId,
                description: 'Contains'
              });
            }
            
            // Add relationships between components in the same container
            const containerComponents = c4Model.components.filter(
              comp => comp.containerId === containerId
            );
            
            // Simple heuristic: if component names suggest a relationship, add it
            for (const comp1 of containerComponents) {
              for (const comp2 of containerComponents) {
                if (comp1.id !== comp2.id) {
                  const relation = detectComponentRelationship(comp1, comp2);
                  if (relation) {
                    c4Model.relationships.push({
                      id: `rel-${comp1.id}-${comp2.id}`,
                      sourceId: comp1.id,
                      targetId: comp2.id,
                      description: relation
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching components for ${dir.name}:`, error);
        }
      }
      
      // Add relationships between containers
      for (let i = 0; i < c4Model.containers.length; i++) {
        for (let j = 0; j < c4Model.containers.length; j++) {
          if (i !== j) {
            const container1 = c4Model.containers[i];
            const container2 = c4Model.containers[j];
            const relation = detectContainerRelationship(container1, container2);
            
            if (relation) {
              c4Model.relationships.push({
                id: `rel-${container1.id}-${container2.id}`,
                sourceId: container1.id,
                targetId: container2.id,
                description: relation
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error analyzing repository:', error);
  }
  
  return c4Model;
}

// Helper functions to detect technologies and relationships
function detectTechnology(dirName: string, repoLanguage: string): string {
  switch (dirName.toLowerCase()) {
    case 'api':
      return 'REST API';
    case 'components':
      return 'UI Components';
    case 'app':
      return 'Application';
    case 'lib':
      return 'Library';
    case 'services':
      return 'Services';
    default:
      return repoLanguage || 'Unknown';
  }
}

function detectComponentTechnology(componentName: string): string {
  if (componentName.endsWith('.jsx') || componentName.endsWith('.tsx')) {
    return 'React';
  } else if (componentName.endsWith('.vue')) {
    return 'Vue';
  } else if (componentName.endsWith('.ts')) {
    return 'TypeScript';
  } else if (componentName.endsWith('.js')) {
    return 'JavaScript';
  } else if (componentName.includes('Service') || componentName.includes('service')) {
    return 'Service';
  } else if (componentName.includes('Controller') || componentName.includes('controller')) {
    return 'Controller';
  } else if (componentName.includes('Repository') || componentName.includes('repository')) {
    return 'Repository';
  } else if (componentName.includes('Model') || componentName.includes('model')) {
    return 'Model';
  } else {
    return 'Component';
  }
}

function detectComponentRelationship(comp1: Component, comp2: Component): string | null {
  const name1 = comp1.name.toLowerCase();
  const name2 = comp2.name.toLowerCase();
  
  // Controller uses Service
  if ((name1.includes('controller') && name2.includes('service')) ||
      (name1.includes('controller') && name2.includes('provider'))) {
    return 'Uses';
  }
  
  // Service uses Repository
  if ((name1.includes('service') && name2.includes('repository')) ||
      (name1.includes('service') && name2.includes('dao'))) {
    return 'Uses';
  }
  
  // Repository uses Model
  if ((name1.includes('repository') && name2.includes('model')) ||
      (name1.includes('dao') && name2.includes('model'))) {
    return 'Uses';
  }
  
  // UI component relationships
  if (name1.includes('page') && name2.includes('component')) {
    return 'Includes';
  }
  
  // Default: no detected relationship
  return null;
}

function detectContainerRelationship(container1: Container, container2: Container): string | null {
  const name1 = container1.name.toLowerCase();
  const name2 = container2.name.toLowerCase();
  
  // API uses Services
  if (name1 === 'api' && name2 === 'services') {
    return 'Uses';
  }
  
  // App uses API
  if (name1 === 'app' && name2 === 'api') {
    return 'Calls';
  }
  
  // Front-end uses Backend
  if ((name1 === 'frontend' || name1 === 'client' || name1 === 'app') && 
      (name2 === 'backend' || name2 === 'server' || name2 === 'api')) {
    return 'Uses';
  }
  
  // Services use Database
  if (name1 === 'services' && (name2 === 'database' || name2 === 'db')) {
    return 'Reads from and writes to';
  }
  
  // Default: no detected relationship
  return null;
}
