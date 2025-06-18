import React from 'react';
import { useEnvironmentStore } from '../store/environmentStore';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const EnvironmentSettings = () => {
  const { 
    environmentMode, 
    setEnvironmentMode 
  } = useEnvironmentStore();

  const handleChange = (event) => {
    setEnvironmentMode(event.target.value);
  };

  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 20, 
      left: 20, 
      zIndex: 10,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 2,
      borderRadius: 1,
      width: 200
    }}>
      <FormControl fullWidth size="small">
        <InputLabel id="environment-mode-label">Environment</InputLabel>
        <Select
          labelId="environment-mode-label"
          id="environment-mode"
          value={environmentMode}
          label="Environment"
          onChange={handleChange}
        >
          <MenuItem value="day">Day</MenuItem>
          <MenuItem value="night">Night</MenuItem>
          <MenuItem value="rain">Rain</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default EnvironmentSettings;