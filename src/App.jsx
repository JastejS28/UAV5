import React, { useState, useEffect, useRef } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme, Typography, Alert } from '@mui/material';
import CommandDashboard from './components/CommandDashboard';
import AttackDashboard from './components/attack-drone/AttackDashboard';
import DroneTypeSelector from './components/drone-selector/DroneTypeSelector';
import LiveCameraView from './components/LiveCameraView';
import EnvironmentSettings from './components/EnvironmentSettings';
import { useUAVStore } from './store/uavStore';
import SoundInitializer from './components/SoundInitializer';
import Scene from './components/Scene';
import { useCameraStore } from './store/cameraStore';
import CameraControls from './components/CameraControls';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Add this SpawnMessage component at the top level
const SpawnMessage = React.memo(() => {
  const [visible, setVisible] = useState(true);
  const initialCheck = useRef(false);
  const position = useUAVStore(state => state.position);
  
  useEffect(() => {
    // Only run this check once after the initial render
    if (initialCheck.current) return;
    initialCheck.current = true;
    
    // Check if UAV has moved from default position
    const checkPosition = () => {
      const { position } = useUAVStore.getState();
      const isAtDefault = 
        Math.abs(position[0]) < 0.1 && 
        Math.abs(position[1] - 50) < 0.1 && 
        Math.abs(position[2]) < 0.1;
        
      if (!isAtDefault) {
        setVisible(false);
      } else {
        // Check again after a short delay
        setTimeout(checkPosition, 500);
      }
    };
    
    // Start checking
    checkPosition();
    
    // Also subscribe to position changes for immediate update
    const unsubscribe = useUAVStore.subscribe(
      state => state.position,
      (position) => {
        const isAtDefault = 
          Math.abs(position[0]) < 0.1 && 
          Math.abs(position[1] - 50) < 0.1 && 
          Math.abs(position[2]) < 0.1;
          
        if (!isAtDefault) {
          setVisible(false);
        }
      }
    );
    
    return () => unsubscribe();
  }, []); // Empty dependency array - only runs once
  
  if (!visible) return null;
  
  return (
    <Alert 
      severity="info" 
      variant="filled"
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        maxWidth: '500px',
        textAlign: 'center',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        padding: '20px 40px',
        boxShadow: '0 0 30px rgba(0,0,0,0.5)'
      }}
      onClose={() => setVisible(false)}
    >
      📍 Click anywhere on the terrain to spawn your UAV
    </Alert>
  );
});

function App() {
  const [droneType, setDroneType] = useState('surveillance');
  const liveViewPortalRef = useRef();
  const [isInitialSpawn, setIsInitialSpawn] = useState(true);
  
  // Use the position directly from the store
  const uavPosition = useUAVStore(state => state.position);

  // Update this effect to use the imported state directly
  useEffect(() => {
    // Check if UAV position is different from default
    if (uavPosition[0] !== 0 || uavPosition[1] !== 50 || uavPosition[2] !== 0) {
      setIsInitialSpawn(false);
    }
  }, [uavPosition]); // This will run whenever the position changes

  const initialSetThermalVision = useUAVStore.getState().setThermalVision;
  const initialIsThermalVision = useUAVStore.getState().isThermalVision;
  
  // Monitor for initial UAV position set
  useEffect(() => {
    const unsubscribe = useUAVStore.subscribe(
      (state) => state.position,
      (position) => {
        // When position changes from default, mark initial spawn as complete
        if (position[0] !== 0 || position[1] !== 50 || position[2] !== 0) {
          setIsInitialSpawn(false);
        }
      }
    );
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("[App.jsx] Initial mount check. Current isThermalVision:", initialIsThermalVision);
    if (initialIsThermalVision) {
      console.log("[App.jsx] Forcing thermal vision off on initial load.");
      initialSetThermalVision(false);
    }
  }, []);

  useEffect(() => {
    const enableAudio = () => {
      const unblockAudio = new Audio();
      unblockAudio.play().catch(() => {});
      unblockAudio.pause();
      
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
  }, []);

  const { droneType: storeDroneType, setDroneType: setStoreDroneType } = useUAVStore();
  const { cameraMode } = useCameraStore();

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        
        {/* Use the SpawnMessage component */}
        <SpawnMessage />
        
        <Box
          sx={{
            flexGrow: 1,
            position: 'relative',
            backgroundColor: '#000000',
            width: '100%',
            height: '100%',
          }}
        >
          <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 15 }}>
            <DroneTypeSelector value={droneType} onChange={setDroneType} />
          </Box>

          <EnvironmentSettings />

          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              zIndex: 10,
            }}
          >
            {/* This Box is now the portal for our live camera view */}
            <Box
              ref={liveViewPortalRef}
              sx={{
                width: 320,
                height: 180,
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.5)',
                overflow: 'hidden', // Important for rounded corners
                mb: 1,
              }}
            />
            <CameraControls />
          </Box>

          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          >
            {/* Pass the portal ref down to the Scene */}
            <Scene droneType={droneType} liveViewPortalRef={liveViewPortalRef} />
          </Box>
        </Box>

        <Box
          sx={{
            width: '400px',
            backgroundColor: '#282c34',
            padding: '15px',
            overflowY: 'auto',
            zIndex: 5,
          }}
        >
          {droneType === 'surveillance' && <CommandDashboard />}
          {droneType === 'attack' && <AttackDashboard />}
        </Box>

        <SoundInitializer />
      </Box>
    </ThemeProvider>
  );
}

export default App;