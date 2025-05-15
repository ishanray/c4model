'use client';

// Helper function to generate realistic code elements based on a component
export const generateCodeElements = (component: any) => {
  const codeElements = [];
  const baseName = component.name.replace(/\.tsx$/, '').replace(/\.jsx$/, '').replace(/\.ts$/, '').replace(/\.js$/, '');
  const technology = component.technology.toLowerCase();
  
  // Generate classes based on component name and technology
  if (component.name.includes('Controller') || component.name.toLowerCase().includes('controller')) {
    // Controller class
    codeElements.push({
      name: `${baseName}Controller`,
      type: 'Class',
      properties: [
        { visibility: 'private', name: 'service', type: `${baseName.replace('Controller', '')}Service` }
      ],
      methods: [
        { visibility: 'public', name: 'constructor', params: `${baseName.replace('Controller', '')}Service service`, returnType: 'void' },
        { visibility: 'public', name: 'getAll', params: '', returnType: 'List<Entity>' },
        { visibility: 'public', name: 'getById', params: 'string id', returnType: 'Entity' },
        { visibility: 'public', name: 'create', params: 'Entity data', returnType: 'Entity' },
        { visibility: 'public', name: 'update', params: 'string id, Entity data', returnType: 'Entity' },
        { visibility: 'public', name: 'delete', params: 'string id', returnType: 'void' }
      ]
    });
    
    // Service class
    codeElements.push({
      name: `${baseName.replace('Controller', '')}Service`,
      type: 'Class',
      properties: [
        { visibility: 'private', name: 'repository', type: `${baseName.replace('Controller', '')}Repository` }
      ],
      methods: [
        { visibility: 'public', name: 'constructor', params: `${baseName.replace('Controller', '')}Repository repository`, returnType: 'void' },
        { visibility: 'public', name: 'findAll', params: '', returnType: 'List<Entity>' },
        { visibility: 'public', name: 'findById', params: 'string id', returnType: 'Entity' },
        { visibility: 'public', name: 'create', params: 'Entity data', returnType: 'Entity' },
        { visibility: 'public', name: 'update', params: 'string id, Entity data', returnType: 'Entity' },
        { visibility: 'public', name: 'remove', params: 'string id', returnType: 'void' }
      ]
    });
    
    // Repository class
    codeElements.push({
      name: `${baseName.replace('Controller', '')}Repository`,
      type: 'Interface',
      methods: [
        { visibility: 'public', name: 'findAll', params: '', returnType: 'List<Entity>' },
        { visibility: 'public', name: 'findById', params: 'string id', returnType: 'Entity' },
        { visibility: 'public', name: 'save', params: 'Entity data', returnType: 'Entity' },
        { visibility: 'public', name: 'delete', params: 'string id', returnType: 'void' }
      ]
    });
    
    // Entity class
    codeElements.push({
      name: `${baseName.replace('Controller', '')}`,
      type: 'Class',
      properties: [
        { visibility: 'private', name: 'id', type: 'string' },
        { visibility: 'private', name: 'name', type: 'string' },
        { visibility: 'private', name: 'createdAt', type: 'Date' },
        { visibility: 'private', name: 'updatedAt', type: 'Date' }
      ],
      methods: [
        { visibility: 'public', name: 'constructor', params: 'string name', returnType: 'void' },
        { visibility: 'public', name: 'getId', params: '', returnType: 'string' },
        { visibility: 'public', name: 'getName', params: '', returnType: 'string' },
        { visibility: 'public', name: 'setName', params: 'string name', returnType: 'void' }
      ]
    });
  } else if (component.name.includes('Service') || component.name.toLowerCase().includes('service')) {
    // Service class
    codeElements.push({
      name: `${baseName}`,
      type: 'Class',
      properties: [
        { visibility: 'private', name: 'repository', type: `${baseName.replace('Service', '')}Repository` }
      ],
      methods: [
        { visibility: 'public', name: 'constructor', params: `${baseName.replace('Service', '')}Repository repository`, returnType: 'void' },
        { visibility: 'public', name: 'processData', params: 'Data data', returnType: 'Result' },
        { visibility: 'public', name: 'validateInput', params: 'Input input', returnType: 'boolean' },
        { visibility: 'public', name: 'transformOutput', params: 'Output output', returnType: 'TransformedOutput' }
      ]
    });
    
    // Repository interface
    codeElements.push({
      name: `${baseName.replace('Service', '')}Repository`,
      type: 'Interface',
      methods: [
        { visibility: 'public', name: 'save', params: 'Entity entity', returnType: 'Entity' },
        { visibility: 'public', name: 'find', params: 'Criteria criteria', returnType: 'List<Entity>' },
        { visibility: 'public', name: 'delete', params: 'string id', returnType: 'void' }
      ]
    });
    
    // Data class
    codeElements.push({
      name: `${baseName.replace('Service', '')}Data`,
      type: 'Class',
      properties: [
        { visibility: 'private', name: 'id', type: 'string' },
        { visibility: 'private', name: 'content', type: 'string' },
        { visibility: 'private', name: 'metadata', type: 'Map<string, string>' }
      ],
      methods: [
        { visibility: 'public', name: 'constructor', params: 'string content', returnType: 'void' },
        { visibility: 'public', name: 'getContent', params: '', returnType: 'string' },
        { visibility: 'public', name: 'getMetadata', params: '', returnType: 'Map<string, string>' }
      ]
    });
  } else if (technology.includes('react') || technology.includes('jsx') || technology.includes('tsx')) {
    // React component
    codeElements.push({
      name: `${baseName}Component`,
      type: 'Component',
      properties: [
        { visibility: 'private', name: 'props', type: `${baseName}Props` },
        { visibility: 'private', name: 'state', type: `${baseName}State` }
      ],
      methods: [
        { visibility: 'public', name: 'constructor', params: 'props', returnType: 'void' },
        { visibility: 'public', name: 'componentDidMount', params: '', returnType: 'void' },
        { visibility: 'public', name: 'render', params: '', returnType: 'ReactNode' },
        { visibility: 'private', name: 'handleChange', params: 'Event event', returnType: 'void' }
      ]
    });
    
    // Props interface
    codeElements.push({
      name: `${baseName}Props`,
      type: 'Interface',
      properties: [
        { visibility: 'public', name: 'data', type: 'any[]' },
        { visibility: 'public', name: 'onSubmit', type: 'Function' },
        { visibility: 'public', name: 'isLoading', type: 'boolean' }
      ]
    });
    
    // State interface
    codeElements.push({
      name: `${baseName}State`,
      type: 'Interface',
      properties: [
        { visibility: 'public', name: 'value', type: 'string' },
        { visibility: 'public', name: 'isValid', type: 'boolean' },
        { visibility: 'public', name: 'errors', type: 'string[]' }
      ]
    });
    
    // Service
    codeElements.push({
      name: `${baseName}Service`,
      type: 'Class',
      methods: [
        { visibility: 'public', name: 'fetchData', params: '', returnType: 'Promise<any[]>' },
        { visibility: 'public', name: 'submitForm', params: 'FormData data', returnType: 'Promise<Response>' },
        { visibility: 'public', name: 'validate', params: 'any data', returnType: 'ValidationResult' }
      ]
    });
  } else {
    // Generic class
    codeElements.push({
      name: `${baseName}`,
      type: 'Class',
      properties: [
        { visibility: 'private', name: 'id', type: 'string' },
        { visibility: 'private', name: 'name', type: 'string' },
        { visibility: 'private', name: 'description', type: 'string' }
      ],
      methods: [
        { visibility: 'public', name: 'constructor', params: 'string name, string description', returnType: 'void' },
        { visibility: 'public', name: 'getId', params: '', returnType: 'string' },
        { visibility: 'public', name: 'getName', params: '', returnType: 'string' },
        { visibility: 'public', name: 'getDescription', params: '', returnType: 'string' },
        { visibility: 'public', name: 'setName', params: 'string name', returnType: 'void' },
        { visibility: 'public', name: 'setDescription', params: 'string description', returnType: 'void' }
      ]
    });
    
    // Helper class
    codeElements.push({
      name: `${baseName}Helper`,
      type: 'Class',
      methods: [
        { visibility: 'public', name: 'validate', params: `${baseName} entity`, returnType: 'boolean' },
        { visibility: 'public', name: 'format', params: `${baseName} entity`, returnType: 'string' }
      ]
    });
    
    // Factory class
    codeElements.push({
      name: `${baseName}Factory`,
      type: 'Class',
      methods: [
        { visibility: 'public', name: 'create', params: 'Map<string, any> data', returnType: `${baseName}` },
        { visibility: 'public', name: 'createDefault', params: '', returnType: `${baseName}` }
      ]
    });
  }
  
  return codeElements;
};
