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
    selectedPayload,
    objectives,
    setMissionType,
    setMissionDuration,
    setPayload,
    isMissionValid
  } = useMissionStore();


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
        return 'Fly over the terrain to discover targets, then hover above them to gather intelligence. Avoid detection while completing surveillance objectives.';
      case 'surveillance-attack':
        return 'Discover and hover above targets for surveillance, then engage and destroy them. Mission requires both stealth and precision.';
      default:
        return 'Select a mission type to see objectives.';
    }
  };


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
            Configure your UAV mission - discover targets by flying over terrain and hover above them for surveillance
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {/* Mission Type Selection */}
          <Grid item xs={12} md={8}>
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
                            Discover targets and hover above them to gather intelligence
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
                            Hover for surveillance, then destroy identified targets
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
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimeIcon sx={{ mr: 1, color: '#ff9800' }} />
                  <Typography variant="h6">Time Management</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mission Duration (seconds)
                  </Typography>
                  <Slider
                    value={missionDuration}
                    onChange={(e, value) => setMissionDuration(value)}
                    min={30}
                    max={300}
                    step={10}
                    marks={[
                      { value: 30, label: '30s' },
                      { value: 60, label: '1m' },
                      { value: 120, label: '2m' },
                      { value: 300, label: '5m' }
                    ]}
                    valueLabelDisplay="on"
                    valueLabelFormat={(value) => `${value}s`}
                    sx={{ color: '#ff9800' }}
                  />
                </Box>

                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Mission Time
                  </Typography>
                  <Typography variant="h6" color="#ff9800">
                    {formatTime(missionDuration)}
                  </Typography>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Time includes travel to targets, hovering for surveillance, and return to base
                  </Alert>
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

          {/* Mission Instructions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Mission Instructions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="info">
                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      How to Complete Your Mission:
                    </Typography>
                    <Typography variant="body2" component="div">
                      1. <strong>Spawn UAV:</strong> Click on terrain to deploy your drone<br/>
                      2. <strong>Explore:</strong> Fly over the terrain to discover targets<br/>
                      3. <strong>Hover:</strong> UAV will automatically hover above detected targets<br/>
                      4. <strong>Return:</strong> Mission ends when time expires or objectives complete
                    </Typography>
                  </Alert>
                  
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Time Management:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Total time includes travel, hovering, and return to base<br/>
                      • Base location: [-45, 30, -45]<br/>
                      • UAV automatically calculates optimal time allocation
                    </Typography>
                  </Box>
                </Box>
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
                      <Chip
                        label="Discover targets by flying"
                        color="success"
                      />
                    </Box>

                    {missionType && (
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Mission Objectives:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {missionType === 'surveillance' && (
                            <Typography variant="body2">
                              • Hover above targets for {formatTime(objectives.requiredSurveillanceTime)} total
                            </Typography>
                          )}
                          {missionType === 'surveillance-attack' && (
                            <>
                              <Typography variant="body2">
                                • Hover above targets for {formatTime(objectives.requiredSurveillanceTime)} total
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