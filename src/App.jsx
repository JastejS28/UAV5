import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
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

function App() {
  const [droneType, setDroneType] = useState('surveillance');

  const initialSetThermalVision = useUAVStore.getState().setThermalVision;
  const initialIsThermalVision = useUAVStore.getState().isThermalVision;

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
            <LiveCameraView width={320} height={180} />
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
            <Scene droneType={droneType} />
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