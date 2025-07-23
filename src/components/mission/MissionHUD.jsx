import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, LinearProgress, Chip, Alert } from '@mui/material';
import {
  Schedule as TimeIcon,
  Visibility as SurveillanceIcon,
  RocketLaunch as AttackIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useMissionStore } from '../../store/missionStore';

const MissionHUD = () => {
  const {
    missionType,
    missionStatus,
    missionStartTime,
    missionDuration,
    objectives,
    updateSurveillanceTime
  } = useMissionStore();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [missionElapsed, setMissionElapsed] = useState(0);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate mission elapsed time
  useEffect(() => {
    if (missionStartTime && missionStatus === 'active') {
      const elapsed = (currentTime - missionStartTime) / 1000;
      setMissionElapsed(elapsed);
      
      // Auto-complete mission if time runs out
      if (elapsed >= missionDuration) {
        // Check if objectives are met
        const success = checkMissionSuccess();
        useMissionStore.getState().completeMission(success);
      }
    }
  }, [currentTime, missionStartTime, missionStatus, missionDuration]);

  const checkMissionSuccess = () => {
    const { objectives, missionType } = useMissionStore.getState();
    
    if (missionType === 'surveillance') {
      return objectives.surveillanceComplete && objectives.detectionEvents <= objectives.maxAllowedDetections;
    } else if (missionType === 'surveillance-attack') {
      return objectives.surveillanceComplete && 
             objectives.targetsDestroyed >= objectives.requiredTargetsDestroyed &&
             objectives.detectionEvents <= objectives.maxAllowedDetections;
    }
    
    return false;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    return Math.max(0, missionDuration - missionElapsed);
  };

  const getMissionProgress = () => {
    return Math.min(100, (missionElapsed / missionDuration) * 100);
  };

  const getSurveillanceProgress = () => {
    return Math.min(100, (objectives.surveillanceTime / objectives.requiredSurveillanceTime) * 100);
  };

  if (missionStatus !== 'active') {
    return null;
  }

  return (
    <Box sx={{
      position: 'fixed',
      top: 20,
      right: 20,
      width: 350,
      zIndex: 1000,
      pointerEvents: 'auto'
    }}>
      <Paper sx={{ 
        p: 2, 
        bgcolor: 'rgba(0, 0, 0, 0.9)', 
        border: '1px solid #333',
        borderRadius: 2
      }}>
        {/* Mission Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {missionType === 'surveillance' ? (
            <SurveillanceIcon sx={{ mr: 1, color: '#2196F3' }} />
          ) : (
            <AttackIcon sx={{ mr: 1, color: '#f44336' }} />
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {missionType === 'surveillance' ? 'Surveillance Mission' : 'Attack Mission'}
          </Typography>
          <Chip
            label={missionStatus.toUpperCase()}
            color={missionStatus === 'active' ? 'success' : 'default'}
            size="small"
          />
        </Box>

        {/* Mission Timer */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Mission Time
            </Typography>
            <Typography variant="body2" color={getTimeRemaining() < 60 ? 'error.main' : 'text.primary'}>
              {formatTime(getTimeRemaining())} remaining
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getMissionProgress()}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: getTimeRemaining() < 60 ? '#f44336' : '#4caf50'
              }
            }}
          />
        </Box>

        {/* Objectives */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Mission Objectives
          </Typography>
          
          {/* Surveillance Objective */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2">
                Surveillance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {objectives.surveillanceComplete ? (
                  <CheckIcon sx={{ color: '#4caf50', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(objectives.surveillanceTime)} / {formatTime(objectives.requiredSurveillanceTime)}
                  </Typography>
                )}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getSurveillanceProgress()}
              sx={{
                height: 4,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: objectives.surveillanceComplete ? '#4caf50' : '#2196F3'
                }
              }}
            />
          </Box>

          {/* Attack Objective (if applicable) */}
          {missionType === 'surveillance-attack' && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2">
                  Targets Destroyed
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {objectives.targetsDestroyed} / {objectives.requiredTargetsDestroyed}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(objectives.targetsDestroyed / objectives.requiredTargetsDestroyed) * 100}
                sx={{
                  height: 4,
                  borderRadius: 1,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: objectives.targetsDestroyed >= objectives.requiredTargetsDestroyed ? '#4caf50' : '#f44336'
                  }
                }}
              />
            </Box>
          )}

          {/* Detection Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              Detection Events
            </Typography>
            <Chip
              label={`${objectives.detectionEvents} / ${objectives.maxAllowedDetections}`}
              size="small"
              color={objectives.detectionEvents > objectives.maxAllowedDetections ? 'error' : 'default'}
              sx={{ height: 20 }}
            />
          </Box>
        </Box>

        {/* Warnings */}
        {getTimeRemaining() < 60 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <Typography variant="body2">
              Mission time critical - return to base immediately!
            </Typography>
          </Alert>
        )}

        {objectives.detectionEvents >= objectives.maxAllowedDetections && (
          <Alert severity="error">
            <Typography variant="body2">
              Maximum detections exceeded - mission compromised!
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default MissionHUD;