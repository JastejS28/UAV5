import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Slider,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Visibility as SurveillanceIcon,
  RocketLaunch as AttackIcon,
  Schedule as TimeIcon,
  LocationOn as LocationIcon,
  Inventory as PayloadIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useMissionStore } from '../../store/missionStore';

const MissionPlanningScreen = ({ onStartMission }) => {
  const {
    missionType,
    missionDuration,
    targetArea,
    selectedPayload,
    travelTime,
    operationalTime,
    objectives,
    setMissionType,
    setMissionDuration,
    setTargetArea,
    setPayload,
    isMissionValid
  } = useMissionStore();

  const [targetCoords, setTargetCoords] = useState({ x: 40, y: 25, z: 35 });

  // Update target area when coordinates change
  useEffect(() => {
    setTargetArea([targetCoords.x, targetCoords.y, targetCoords.z]);
  }, [targetCoords, setTargetArea]);

  const handlePayloadChange = (type, delta) => {
    const newPayload = {
      ...selectedPayload,
      [type]: Math.max(0, Math.min(6, selectedPayload[type] + delta))
    };
    setPayload(newPayload);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMissionDescription = () => {
    switch (missionType) {
      case 'surveillance':
        return 'Conduct covert surveillance of the target area. Avoid detection while gathering intelligence for the specified duration.';
      case 'surveillance-attack':
        return 'First conduct surveillance to identify targets, then engage and destroy specified objectives. Mission requires both stealth and precision.';
      default:
        return 'Select a mission type to see objectives.';
    }
  };

  const getTimeValidation = () => {
    if (operationalTime <= 0) {
      return {
        valid: false,
        message: 'Mission duration too short for travel time. Increase duration or choose closer target.'
      };
    }
    
    const requiredTime = missionType === 'surveillance' ? 120 : 90; // Surveillance needs more time
    if (operationalTime < requiredTime) {
      return {
        valid: false,
        message: `Insufficient operational time. Need at least ${formatTime(requiredTime)} for mission objectives.`
      };
    }
    
    return {
      valid: true,
      message: `${formatTime(operationalTime)} available for operations.`
    };
  };

  const timeValidation = getTimeValidation();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0a0a0a', 
      color: 'white',
      p: 3,
      backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}>
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Mission Planning & Setup
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Configure your UAV mission parameters and objectives
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {/* Mission Type Selection */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SurveillanceIcon sx={{ mr: 1, color: '#2196F3' }} />
                  <Typography variant="h6">Mission Objective</Typography>
                </Box>
                
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={missionType || ''}
                    onChange={(e) => setMissionType(e.target.value)}
                  >
                    <FormControlLabel
                      value="surveillance"
                      control={<Radio sx={{ color: '#2196F3' }} />}
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            Surveillance Mission
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Stealth reconnaissance - avoid detection while gathering intel
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 2, alignItems: 'flex-start' }}
                    />
                    <FormControlLabel
                      value="surveillance-attack"
                      control={<Radio sx={{ color: '#f44336' }} />}
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            Surveillance & Attack
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Recon followed by precision strikes on identified targets
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start' }}
                    />
                  </RadioGroup>
                </FormControl>

                {missionType && (
                  <Alert 
                    severity="info" 
                    sx={{ mt: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196F3' }}
                  >
                    {getMissionDescription()}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Time & Resource Management */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimeIcon sx={{ mr: 1, color: '#ff9800' }} />
                  <Typography variant="h6">Time Management</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Mission Duration (minutes)
                  </Typography>
                  <Slider
                    value={missionDuration / 60}
                    onChange={(e, value) => setMissionDuration(value * 60)}
                    min={3}
                    max={20}
                    step={0.5}
                    marks={[
                      { value: 3, label: '3m' },
                      { value: 10, label: '10m' },
                      { value: 20, label: '20m' }
                    ]}
                    valueLabelDisplay="on"
                    valueLabelFormat={(value) => `${value}m`}
                    sx={{ color: '#ff9800' }}
                  />
                </Box>

                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Travel Time
                      </Typography>
                      <Typography variant="h6" color="#ff9800">
                        {formatTime(travelTime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Operational Time
                      </Typography>
                      <Typography variant="h6" color={timeValidation.valid ? '#4caf50' : '#f44336'}>
                        {formatTime(operationalTime)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Alert 
                    severity={timeValidation.valid ? 'success' : 'warning'}
                    sx={{ mt: 2 }}
                  >
                    {timeValidation.message}
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Target Area Selection */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon sx={{ mr: 1, color: '#4caf50' }} />
                  <Typography variant="h6">Target Area</Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      label="X Coordinate"
                      type="number"
                      value={targetCoords.x}
                      onChange={(e) => setTargetCoords(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                      fullWidth
                      size="small"
                      inputProps={{ min: -50, max: 50 }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Y Altitude"
                      type="number"
                      value={targetCoords.y}
                      onChange={(e) => setTargetCoords(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                      fullWidth
                      size="small"
                      inputProps={{ min: 15, max: 100 }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Z Coordinate"
                      type="number"
                      value={targetCoords.z}
                      onChange={(e) => setTargetCoords(prev => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
                      fullWidth
                      size="small"
                      inputProps={{ min: -50, max: 50 }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Preset Locations:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="Warehouse District"
                      onClick={() => setTargetCoords({ x: 40, y: 25, z: 35 })}
                      sx={{ cursor: 'pointer' }}
                    />
                    <Chip
                      label="Army Base"
                      onClick={() => setTargetCoords({ x: -45, y: 30, z: -40 })}
                      sx={{ cursor: 'pointer' }}
                    />
                    <Chip
                      label="Central Valley"
                      onClick={() => setTargetCoords({ x: 0, y: 20, z: 0 })}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Payload Configuration */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PayloadIcon sx={{ mr: 1, color: '#f44336' }} />
                  <Typography variant="h6">Payload Configuration</Typography>
                </Box>

                {missionType === 'surveillance' ? (
                  <Alert severity="info">
                    Surveillance missions use stealth configuration - no weapons payload required.
                  </Alert>
                ) : missionType === 'surveillance-attack' ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Select your armament for the attack phase:
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">Unguided Bombs</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            onClick={() => handlePayloadChange('bombs', -1)}
                            disabled={selectedPayload.bombs === 0}
                            size="small"
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography variant="h6" sx={{ mx: 2, minWidth: 30, textAlign: 'center' }}>
                            {selectedPayload.bombs}
                          </Typography>
                          <IconButton
                            onClick={() => handlePayloadChange('bombs', 1)}
                            disabled={selectedPayload.bombs === 6}
                            size="small"
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        High damage, area effect, less precise
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1">Guided Missiles</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton
                            onClick={() => handlePayloadChange('missiles', -1)}
                            disabled={selectedPayload.missiles === 0}
                            size="small"
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography variant="h6" sx={{ mx: 2, minWidth: 30, textAlign: 'center' }}>
                            {selectedPayload.missiles}
                          </Typography>
                          <IconButton
                            onClick={() => handlePayloadChange('missiles', 1)}
                            disabled={selectedPayload.missiles === 6}
                            size="small"
                          >
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Precision strikes, target-specific, lower collateral damage
                      </Typography>
                    </Box>

                    {(selectedPayload.bombs === 0 && selectedPayload.missiles === 0) && (
                      <Alert severity="warning">
                        Attack missions require at least one weapon system.
                      </Alert>
                    )}
                  </Box>
                ) : (
                  <Alert severity="info">
                    Select a mission type to configure payload options.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Mission Summary & Start */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mission Summary
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {missionType && (
                        <Chip
                          icon={missionType === 'surveillance' ? <SurveillanceIcon /> : <AttackIcon />}
                          label={missionType === 'surveillance' ? 'Surveillance Mission' : 'Surveillance & Attack'}
                          color="primary"
                        />
                      )}
                      <Chip
                        icon={<TimeIcon />}
                        label={`${formatTime(missionDuration)} total`}
                        color="secondary"
                      />
                      {targetArea && (
                        <Chip
                          icon={<LocationIcon />}
                          label={`Target: [${targetArea.map(n => Math.round(n)).join(', ')}]`}
                          color="success"
                        />
                      )}
                    </Box>

                    {missionType && (
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Mission Objectives:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {missionType === 'surveillance' && (
                            <Typography variant="body2">
                              • Complete {formatTime(objectives.requiredSurveillanceTime)} of surveillance
                            </Typography>
                          )}
                          {missionType === 'surveillance-attack' && (
                            <>
                              <Typography variant="body2">
                                • Complete {formatTime(objectives.requiredSurveillanceTime)} of surveillance
                              </Typography>
                              <Typography variant="body2">
                                • Destroy {objectives.requiredTargetsDestroyed} enemy targets
                              </Typography>
                            </>
                          )}
                          <Typography variant="body2">
                            • Avoid detection (max {objectives.maxAllowedDetections} detection events)
                          </Typography>
                          <Typography variant="body2">
                            • Return to base safely
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', justifyContent: 'center' }}>
                      {!isMissionValid() && (
                        <Alert severity="error" icon={<WarningIcon />}>
                          Complete all mission parameters to start
                        </Alert>
                      )}
                      
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={isMissionValid() ? <StartIcon /> : <WarningIcon />}
                        onClick={onStartMission}
                        disabled={!isMissionValid()}
                        sx={{
                          py: 2,
                          fontSize: '1.1rem',
                          bgcolor: isMissionValid() ? '#4caf50' : '#666',
                          '&:hover': {
                            bgcolor: isMissionValid() ? '#45a049' : '#666'
                          }
                        }}
                      >
                        {isMissionValid() ? 'Start Mission' : 'Configure Mission'}
                      </Button>
                      
                      {isMissionValid() && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckIcon sx={{ color: '#4caf50', mr: 1 }} />
                          <Typography variant="body2" color="#4caf50">
                            Mission Ready
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MissionPlanningScreen;