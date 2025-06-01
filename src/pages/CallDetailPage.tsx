import React from 'react';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom'; // To get call ID from URL

const CallDetailPage: React.FC = () => {
  const { callId } = useParams(); // Example of getting a route parameter
  return <Typography variant="h5">Call Detail View - Analysis for Call ID: {callId || 'N/A'}</Typography>;
};
export default CallDetailPage;