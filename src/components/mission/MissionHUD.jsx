import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, LinearProgress, Chip, Alert } from '@mui/material';
import {
  Schedule as TimeIcon,
  Visibility as SurveillanceIcon,
  RocketLaunch as AttackIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useMissionStore } from '../../store/missionStore';

const MissionHUD = () => {
  const {
    missionType,
    missionStatus,
    missionTimeRemaining,
    objectives,
    isHovering,
    currentTarget
  } = useMissionStore();


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getHoverProgress = () => {
    return Math.min(100, (objectives.hoverTime / objectives.requiredSurveillanceTime) * 100);
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
            <Typography variant="body2" color={missionTimeRemaining < 60 ? 'error.main' : 'text.primary'}>
              {formatTime(missionTimeRemaining)} remaining
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={100 - (missionTimeRemaining / 300) * 100} // Assuming max 5 minutes
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: missionTimeRemaining < 30 ? '#f44336' : '#4caf50'
              }
            }}
          />
        </Box>

        {/* Current Status */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Status
          </Typography>
          
          {isHovering && currentTarget ? (
            <Alert severity="success" sx={{ py: 0.5 }}>
              <Typography variant="body2">
                🎯 Hovering above {currentTarget.type} - Gathering intelligence
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" sx={{ py: 0.5 }}>
              <Typography variant="body2">
                🔍 Exploring terrain - Fly over objects to discover targets
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Objectives */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Mission Objectives
          </Typography>
          
          {/* Hover Objective */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2">
                Target Surveillance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {objectives.surveillanceComplete ? (
                  <CheckIcon sx={{ color: '#4caf50', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(objectives.hoverTime)} / {formatTime(objectives.requiredSurveillanceTime)}
                  </Typography>
                )}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getHoverProgress()}
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
        {missionTimeRemaining < 30 && (
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