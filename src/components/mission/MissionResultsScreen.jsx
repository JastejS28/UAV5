import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as FailIcon,
  Schedule as TimeIcon,
  Visibility as SurveillanceIcon,
  RocketLaunch as AttackIcon,
  Warning as WarningIcon,
  Replay as RestartIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useMissionStore } from '../../store/missionStore';

const MissionResultsScreen = ({ onRestart, onNewMission }) => {
  const {
    missionType,
    missionStatus,
    missionStartTime,
    missionEndTime,
    missionDuration,
    objectives,
    selectedPayload
  } = useMissionStore();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMissionDuration = () => {
    if (missionStartTime && missionEndTime) {
      return (missionEndTime - missionStartTime) / 1000;
    }
    return 0;
  };

  const getSuccessRate = () => {
    let completed = 0;
    let total = 0;

    // Surveillance objective
    total++;
    if (objectives.surveillanceComplete) completed++;

    // Attack objectives (if applicable)
    if (missionType === 'surveillance-attack') {
      total++;
      if (objectives.targetsDestroyed >= objectives.requiredTargetsDestroyed) completed++;
    }

    // Detection limit
    total++;
    if (objectives.detectionEvents <= objectives.maxAllowedDetections) completed++;

    return Math.round((completed / total) * 100);
  };

  const getPerformanceRating = () => {
    const successRate = getSuccessRate();
    if (successRate >= 90) return { rating: 'Excellent', color: '#4caf50' };
    if (successRate >= 70) return { rating: 'Good', color: '#ff9800' };
    if (successRate >= 50) return { rating: 'Fair', color: '#ff5722' };
    return { rating: 'Poor', color: '#f44336' };
  };

  const performance = getPerformanceRating();
  const actualDuration = getMissionDuration();

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#0a0a0a',
      color: 'white',
      p: 3,
      backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
    }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Header */}
        <Paper sx={{ p: 4, mb: 3, bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {missionStatus === 'completed' ? (
              <SuccessIcon sx={{ fontSize: 60, color: '#4caf50' }} />
            ) : (
              <FailIcon sx={{ fontSize: 60, color: '#f44336' }} />
            )}
          </Box>
          
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            Mission {missionStatus === 'completed' ? 'Complete' : 'Failed'}
          </Typography>
          
          <Chip
            label={`${performance.rating} Performance`}
            sx={{
              fontSize: '1.1rem',
              height: 40,
              bgcolor: performance.color,
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          
          <Typography variant="h4" sx={{ mt: 2, color: performance.color }}>
            {getSuccessRate()}% Success Rate
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          {/* Mission Summary */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mission Summary
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      {missionType === 'surveillance' ? <SurveillanceIcon /> : <AttackIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary="Mission Type"
                      secondary={missionType === 'surveillance' ? 'Surveillance' : 'Surveillance & Attack'}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TimeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Duration"
                      secondary={`${formatTime(actualDuration)} / ${formatTime(missionDuration)} planned`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Detection Events"
                      secondary={`${objectives.detectionEvents} / ${objectives.maxAllowedDetections} allowed`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Objectives Status */}
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Objectives Status
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      {objectives.surveillanceComplete ? (
                        <SuccessIcon sx={{ color: '#4caf50' }} />
                      ) : (
                        <FailIcon sx={{ color: '#f44336' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="Surveillance"
                      secondary={`${formatTime(objectives.surveillanceTime)} / ${formatTime(objectives.requiredSurveillanceTime)} required`}
                    />
                  </ListItem>
                  
                  {missionType === 'surveillance-attack' && (
                    <ListItem>
                      <ListItemIcon>
                        {objectives.targetsDestroyed >= objectives.requiredTargetsDestroyed ? (
                          <SuccessIcon sx={{ color: '#4caf50' }} />
                        ) : (
                          <FailIcon sx={{ color: '#f44336' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary="Targets Destroyed"
                        secondary={`${objectives.targetsDestroyed} / ${objectives.requiredTargetsDestroyed} required`}
                      />
                    </ListItem>
                  )}
                  
                  <ListItem>
                    <ListItemIcon>
                      {objectives.detectionEvents <= objectives.maxAllowedDetections ? (
                        <SuccessIcon sx={{ color: '#4caf50' }} />
                      ) : (
                        <FailIcon sx={{ color: '#f44336' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary="Stealth Maintained"
                      secondary={objectives.detectionEvents <= objectives.maxAllowedDetections ? 'Success' : 'Failed'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Payload Usage (if applicable) */}
          {missionType === 'surveillance-attack' && (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payload Usage
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Bombs Deployed
                      </Typography>
                      <Typography variant="h6">
                        {selectedPayload.bombs} available
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Missiles Deployed
                      </Typography>
                      <Typography variant="h6">
                        {selectedPayload.missiles} available
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Actions */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<RestartIcon />}
                    onClick={onRestart}
                    sx={{ minWidth: 150 }}
                  >
                    Retry Mission
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={onNewMission}
                    sx={{ minWidth: 150 }}
                  >
                    New Mission
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default MissionResultsScreen;