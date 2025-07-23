import React, { useState, useCallback, useRef } from 'react';
import { 
  Box, Paper, Typography, Button, TextField, Chip, 
  Switch, FormControlLabel, Alert, Slider 
} from '@mui/material';
import { useUAVStore } from '../store/uavStore';
import { useClickControlStore } from '../store/clickControlStore';

const CommandDashboard = () => {
  const { 
    position, rotation, speed, altitude, lateralMovement, 
    setSpeed, setAltitude, setLateralMovement, setRotation,
    setTargetPosition, isThermalVision, setThermalVision, targets,
    isCrashed, crashMessage, setPosition, targetPosition
  } = useUAVStore();
  
  const { clickMode, toggleMoveMode } = useClickControlStore();
  
  const [coordinates, setCoordinates] = useState({ x: '', y: '', z: '' });
  const [altitudeSlider, setAltitudeSlider] = useState(position[1]);
  const isUpdatingFromSlider = useRef(false);
  const lastPositionY = useRef(position[1]);

  // Check if UAV is currently moving
  const isMoving = targetPosition && Array.isArray(targetPosition);

  // Update slider when position changes (but not when we're updating from slider)
  React.useEffect(() => {
    if (!isUpdatingFromSlider.current) {
      const positionDiff = Math.abs(position[1] - lastPositionY.current);
      if (positionDiff > 0.1) {
        setAltitudeSlider(position[1]);
        lastPositionY.current = position[1];
      }
    }
  }, [position[1]]);

  const handleMovement = useCallback(() => {
    if (isCrashed) {
      alert('UAV is permanently crashed! Mission terminated.');
      return;
    }
    
    const x = parseFloat(coordinates.x) || position[0];
    const y = parseFloat(coordinates.y) || position[1];
    const z = parseFloat(coordinates.z) || position[2];
    
    const limitedY = Math.min(Math.max(y, 10), 50);
    
    const targetPos = [x, limitedY, z];
    console.log('UAV moving to position:', targetPos);
    
    setCoordinates({ x: '', y: '', z: '' });
    setTargetPosition(targetPos);
  }, [coordinates, position, setTargetPosition, isCrashed]);

  const handleCoordinateChange = useCallback((axis, value) => {
    setCoordinates(prev => ({ ...prev, [axis]: value }));
  }, []);

  const handleAltitudeChange = (event, newValue) => {
    isUpdatingFromSlider.current = true;
    setAltitudeSlider(newValue);
    lastPositionY.current = newValue;
    
    const newPosition = [position[0], newValue, position[2]];
    setPosition(newPosition);
    
    if (isMoving && targetPosition) {
      const newTarget = [targetPosition[0], newValue, targetPosition[2]];
      setTargetPosition(newTarget);
    }
  };

  const handleAltitudeChangeCommitted = (event, newValue) => {
    isUpdatingFromSlider.current = false;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Crash Alert */}
      {isCrashed && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>
            🚁💥 UAV CRASHED - MISSION TERMINATED
          </Typography>
          <Typography variant="body2">
            {crashMessage}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'orange' }}>
            UAV is permanently disabled. Mission failed.
          </Typography>
        </Alert>
      )}

      {/* ADD CLICK CONTROL PANEL HERE */}

      {/* Click-to-Move Toggle Button */}
      <Paper elevation={3} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          onClick={toggleMoveMode}
          color={clickMode === 'move' ? 'success' : 'primary'}
          size="large"
          sx={{ 
            px: 4, 
            py: 2, 
            fontSize: '1rem', 
            fontWeight: 'bold',
            borderRadius: 2,
            width: '100%'
          }}
        >
          {clickMode === 'move' ? '✅ Click-to-Move ENABLED' : '❌ Click-to-Move DISABLED'}
        </Button>
      </Paper>

      {/* UAV Status */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          🛸 UAV Status
        </Typography>
        <Typography variant="body2" color={isCrashed ? 'error' : 'inherit'}>
          Status: {isCrashed ? '💥 CRASHED - TERMINATED' : (isMoving ? '🚁 Moving to Target' : '✅ Stationary')}
        </Typography>
        <Typography variant="body2">Position: {position.map(p => p.toFixed(1)).join(', ')}</Typography>
        <Typography variant="body2">Altitude: {position[1].toFixed(1)}m</Typography>
        <Typography variant="body2">Speed: {isCrashed ? '0.0' : (isMoving ? '35.0' : '0.0')} km/h</Typography>
        <Typography variant="body2" color={isMoving ? 'warning.main' : 'success.main'}>
          Collision Detection: {isMoving ? '🔴 ACTIVE' : '🟢 STANDBY'}
        </Typography>
      </Paper>

      {/* Real-time Altitude Control Slider */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          ⛰️ Real-time Altitude Control
        </Typography>
        
        <Typography variant="body2" color="white" gutterBottom>
          Current Altitude: {position[1].toFixed(1)}m
        </Typography>
        
        {isMoving && (
          <Typography variant="body2" color="success" gutterBottom sx={{ fontStyle: 'italic' }}>
            🚁 UAV moving - altitude adjusts in real-time
          </Typography>
        )}
        
        <Box sx={{ px: 1, py: 2 }}>
          <Slider
            value={altitudeSlider}
            onChange={handleAltitudeChange}
            onChangeCommitted={handleAltitudeChangeCommitted}
            min={10}
            max={50}
            step={0.5}
            marks={[
              { value: 10, label: '10m' },
              { value: 20, label: '20m' },
              { value: 30, label: '30m' },
              { value: 40, label: '40m' },
              { value: 50, label: '50m' }
            ]}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => `${value}m`}
            sx={{
              color: isCrashed ? 'error.main' : (isMoving ? 'success.main' : 'primary.main'),
              '& .MuiSlider-thumb': {
                backgroundColor: isCrashed ? 'error.main' : (isMoving ? 'success.main' : 'primary.main')
              },
              '& .MuiSlider-track': {
                backgroundColor: isCrashed ? 'error.main' : (isMoving ? 'success.main' : 'primary.main')
              }
            }}
            disabled={isCrashed}
          />
        </Box>
        
        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'grey.400' }}>
          Drag slider to instantly adjust UAV altitude (10-50m)
        </Typography>
      </Paper>

      {/* Movement Controls */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          🎮 UAV Controls
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <TextField
            label="X Coordinate"
            type="number"
            value={coordinates.x}
            onChange={(e) => handleCoordinateChange('x', e.target.value)}
            size="small"
            disabled={isCrashed}
            helperText="East/West position"
          />
          <TextField
            label="Y (Altitude)"
            type="number"
            value={coordinates.y}
            onChange={(e) => handleCoordinateChange('y', e.target.value)}
            size="small"
            disabled={isCrashed}
            inputProps={{ max: 50, min: 10 }}
            helperText="Height above ground (10-50m)"
          />
          <TextField
            label="Z Coordinate"
            type="number"
            value={coordinates.z}
            onChange={(e) => handleCoordinateChange('z', e.target.value)}
            size="small"
            disabled={isCrashed}
            helperText="North/South position"
          />
          <Button 
            variant="contained" 
            onClick={handleMovement}
            sx={{ mt: 1 }}
            disabled={isCrashed}
            color="primary"
          >
            🚁 SET TARGET POSITION
          </Button>
        </Box>

        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>UAV Current Position:</Typography>
        <Typography variant="body2">X: {position[0].toFixed(2)} Y: {position[1].toFixed(2)} Z: {position[2].toFixed(2)}</Typography>
        
        {isMoving && targetPosition && (
          <>
            <Typography variant="h6" sx={{ mt: 1, mb: 1, color: 'primary.main' }}>📍 Target Position:</Typography>
            <Typography variant="body2" color="primary.main">X: {targetPosition[0].toFixed(2)} Y: {targetPosition[1].toFixed(2)} Z: {targetPosition[2].toFixed(2)}</Typography>
            <Typography variant="caption" color="primary.main" display="block">
              Distance to target: {Math.sqrt(
                Math.pow(targetPosition[0] - position[0], 2) +
                Math.pow(targetPosition[1] - position[1], 2) +
                Math.pow(targetPosition[2] - position[2], 2)
              ).toFixed(1)} units
            </Typography>
          </>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>Ground Speed: {isCrashed ? '0' : (isMoving ? '35' : '0')} km/h</Typography>
          <Typography variant="body2" gutterBottom>Flight Speed: {isCrashed ? '0' : (isMoving ? '15' : '0')} km/h</Typography>
          <Typography variant="body2" gutterBottom color="success.main">
            ✨ Use click-to-move or slider above for control
          </Typography>
        </Box>
      </Paper>

      {/* Vision Controls */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          👁️ Vision Controls
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isThermalVision}
              onChange={(e) => setThermalVision(e.target.checked)}
              disabled={isCrashed}
            />
          }
          label="Enable Thermal Vision"
        />
      </Paper>

      {/* Detected Targets */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          🎯 Detected Targets <Chip label={targets?.length || 0} color="error" size="small" />
        </Typography>
        
        <Typography variant="body2" gutterBottom>Target Summary:</Typography>
        <Typography variant="body2">Tank: {targets?.filter(t => t.type === 'tank').length || 0}</Typography>
        <Typography variant="body2">Jeep: {targets?.filter(t => t.type === 'jeep').length || 0}</Typography>
        <Typography variant="body2">Warehouse: {targets?.filter(t => t.type === 'warehouse').length || 0}</Typography>
        <Typography variant="body2">Soldier: {targets?.filter(t => t.type === 'soldier').length || 0}</Typography>

        <Box sx={{ mt: 2 }}>
          {(targets && targets.length > 0) ? targets.map((target) => (
            <Paper key={target.id} sx={{ 
              p: 1, 
              mb: 1, 
              bgcolor: 
                target.type === 'tank' ? '#ffebee' : 
                target.type === 'jeep' ? '#e8f5e9' : 
                target.type === 'warehouse' ? '#fff3e0' : 
                target.type === 'soldier' ? '#f3e5f5' : '#e3f2fd',
              color: '#000'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000' }}>
                  {target.type.charAt(0).toUpperCase() + target.type.slice(1)}
                </Typography>
                <Chip 
                  label={target.type === 'tank' || target.type === 'jeep' ? 'Vehicle' : 
                        target.type === 'warehouse' ? 'Structure' : 
                        target.type === 'soldier' ? 'Personnel' : 'Unknown'} 
                  size="small" 
                  sx={{ color: '#000', borderColor: '#000' }}
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Position: ({target.position[0].toFixed(1)}, {target.position[1].toFixed(1)}, {target.position[2].toFixed(1)})
              </Typography>
              <br />
              <Typography variant="caption" sx={{ color: '#666' }}>
                Distance: {Math.sqrt(
                  Math.pow(target.position[0] - position[0], 2) +
                  Math.pow(target.position[1] - position[1], 2) +
                  Math.pow(target.position[2] - position[2], 2)
                ).toFixed(2)} units
              </Typography>
            </Paper>
          )) : (
            <Typography variant="body2" color="text.secondary">
              {isCrashed ? 'UAV crashed - mission terminated' : 'No targets detected. Fly closer to objects to detect them.'}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CommandDashboard;