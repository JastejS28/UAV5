# UAV Simulation

A realistic UAV (drone) simulation featuring multiple drone types, environments, and capabilities.

## Features

- Multiple drone types: Surveillance, Attack, Swarm (planned)
- Realistic 3D environments with day, night, and rain settings
- Thermal vision capabilities
- Target detection and tracking
- Attack capabilities with missile systems
- Anti-drone defense systems
- Realistic terrain using Cesium ION with global coverage

## New: Cesium Integration

This project now uses Cesium ION for realistic, global 3D terrain visualization. The integration provides:

- Photorealistic 3D tiles from Google Maps
- Global terrain coverage 
- High-detail satellite imagery
- Seamless integration with existing UAV simulation features
- Automatic fallback to original terrain if Cesium fails to load

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Access the application at [http://localhost:5173](http://localhost:5173)

## Environment Variables

- `CESIUM_ION_TOKEN`: Your Cesium ION access token (currently hardcoded, but should be moved to environment variables)

## Technologies Used

- React with Vite
- Three.js with React Three Fiber
- Cesium for realistic terrain visualization
- Material UI for interface components
- Zustand for state management

## License

This project is licensed under the MIT License.
#   U A V 2  
 