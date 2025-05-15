# C4 Model Generator

A dynamic Next.js application that generates interactive C4 model visualizations from GitHub repositories. This tool helps you understand software architecture through different levels of abstraction.

## Features

- **GitHub Repository Analysis**: Enter any public GitHub repository URL, and the application will analyze its structure and generate a C4 model.
- **Interactive Visualization**: Navigate through different levels of the C4 model by clicking on elements.
- **Multi-level Visualization**: 
  - **Context Level**: Shows the system and its interaction with users and external systems.
  - **Container Level**: Shows the high-level technical components of a system.
  - **Component Level**: Shows the internal components within a container.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd 4cmodel
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. Enter a public GitHub repository URL in the input field.
2. Click "Generate C4 Model" to analyze the repository.
3. Explore the generated C4 model by clicking on elements to drill down:
   - Click on a System to see its Containers
   - Click on a Container to see its Components
4. Use the navigation controls to zoom, pan, and navigate through the diagram.
5. Use the "Back" button to return to previous levels of abstraction.

## About the C4 Model

The C4 model was created by Simon Brown and stands for Context, Containers, Components, and Code. It provides a way to create maps of your code, at different levels of detail, in the same way that you would use something like Google Maps to zoom in and out of an area.

- **System Context**: A big picture view showing how the software system in scope fits into the wider IT environment
- **Container**: A high-level view showing the technical architecture of a single software system - applications, data stores, microservices, etc.
- **Component**: A more detailed view showing how a container is composed of multiple "components", what each of those components are, their responsibilities, and their technology/implementation details.
- **Code**: A low-level view showing how a component is implemented, typically using UML class diagrams, entity relationship diagrams, etc.

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- ReactFlow
- Three.js
- D3.js
- Octokit (GitHub API client)

## License

MIT
