// src/pages/CallUploadPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Tooltip from '@mui/material/Tooltip';

// Services and types
import { agentService } from '../services/agentService';
import type { Agent } from '../services/agentService';
import { fileUploadService, generateGUID } from '../services/fileUploadService';
import { transcriptService } from '../services/transcriptService'; // Assuming this service exists

export interface UploadingFile {
  id: string;
  file: File;
  agentId: string;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'analyzing' | 'analysis_failed' | 'analysis_complete';
  progress: number;
  errorMessage?: string;
  statusMessage?: string;
  uploadId?: string;
  analysisJobId?: string;
  fileId?: number; // Assuming this is the ID from your backend after upload
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
      style={{ height: '100%', overflowY: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 1.5, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CallUploadPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoadingAgents, setIsLoadingAgents] = useState<boolean>(true);
  const [agentFetchError, setAgentFetchError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeUploadTab, setActiveUploadTab] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [analysisPollingIntervals, setAnalysisPollingIntervals] = useState<{ [key: string]: number }>({});
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      setAgentFetchError(null);
      try {
        const fetchedAgents = await agentService.getAgents();
        setAgents(fetchedAgents);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setAgentFetchError(error.message || 'Could not load agents.');
        } else {
          setAgentFetchError('Could not load agents.');
        }
      } finally {
        setIsLoadingAgents(false);
      }
    };
    fetchAgents();
  }, []);

  const handleAgentChange = (event: SelectChangeEvent<string>) => {
    setSelectedAgentId(event.target.value as string);
  };

  const handleUploadTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveUploadTab(newValue);
  };

  const updateFileState = (
    fileId: string,
    updates: Partial<UploadingFile>
  ) => {
    setUploadingFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
      )
    );
  };

  const processFileUpload = async (fileToUpload: UploadingFile) => {
    const uniqueUploadId = generateGUID();
    updateFileState(fileToUpload.id, {
      status: 'uploading',
      progress: 0,
      uploadId: uniqueUploadId,
      errorMessage: undefined,
      statusMessage: 'Initiating upload...',
    });

    try {
      const finalChunkResponse = await fileUploadService.uploadFileInChunks(
        fileToUpload.file,
        uniqueUploadId,
        (percent, statusMsg) => {
          updateFileState(fileToUpload.id, { progress: percent, statusMessage: statusMsg });
        }
      );

      // Use unknown and type guard for response
      let serverFileId: number | undefined = undefined;
      if (typeof finalChunkResponse === 'object' && finalChunkResponse !== null) {
        const resp = finalChunkResponse as unknown as Record<string, unknown>;
        if (typeof resp.data === 'object' && resp.data !== null && 'FileId' in resp.data) {
          serverFileId = Number((resp.data as Record<string, unknown>).FileId);
        } else if ('FileId' in resp) {
          serverFileId = Number(resp.FileId);
        }
      }

      updateFileState(fileToUpload.id, { 
        progress: 100, 
        status: 'completed', 
        statusMessage: 'Upload successful!',
        fileId: serverFileId,
      });

    } catch (error: unknown) {
      let message = 'Upload failed';
      if (error instanceof Error) message = error.message;
      updateFileState(fileToUpload.id, {
        status: 'error',
        errorMessage: message,
        statusMessage: 'Upload failed',
      });
    }
  };

  const handleFileSelectAndUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAgentId) {
      alert("Please select an agent first.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files);
      let newFilesQueued = false;
      selectedFiles.forEach(file => {
        const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'video/mp4'];
        if (!allowedTypes.includes(file.type)) {
          alert(`File type ${file.type} for "${file.name}" not allowed. It will be skipped.`);
          return;
        }
        if (uploadingFiles.some(f => f.file.name === file.name && f.agentId === selectedAgentId && f.status !== 'error')) {
          alert(`File "${file.name}" for this agent is already being processed or has been uploaded. It will be skipped.`);
          return;
        }
        const newFileToUpload: UploadingFile = {
          id: `${file.name}-${selectedAgentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file: file,
          agentId: selectedAgentId,
          status: 'pending',
          progress: 0,
        };
        setUploadingFiles(prevFiles => [newFileToUpload, ...prevFiles]);
        processFileUpload(newFileToUpload);
        newFilesQueued = true;
      });

      if (newFilesQueued) setActiveUploadTab(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const startAnalysisPolling = (fileId: string, jobId: string) => {
    console.log(`[Polling] Starting for fileId: ${fileId}, jobId: ${jobId}`);

    setAnalysisPollingIntervals(prevIntervals => {
      if (prevIntervals[fileId]) {
        console.log(`[Polling] Clearing pre-existing interval for fileId: ${fileId}`);
        clearInterval(prevIntervals[fileId]);
      }
      const newIntervals = { ...prevIntervals };
      delete newIntervals[fileId]; 
      return newIntervals;
    });

    const poll = async () => {
      console.log(`[Polling] Executing poll for fileId: ${fileId}, jobId: ${jobId}`);
      try {
        const statusResponse = await transcriptService.checkTranscriptionStatus(jobId);
        const currentFileStatus = statusResponse.data.PROCESSINGSTATUS;
        const errorMessageFromServer = statusResponse.data.ERRORMESSAGE;
        console.log(`[Polling] Server status for ${jobId} (${fileId}): ${currentFileStatus}`);

        if (currentFileStatus === 'completed' || currentFileStatus === 'failed') {
          console.log(`[Polling] Terminal status ${currentFileStatus} for ${jobId} (${fileId}). Clearing interval.`);
          updateFileState(fileId, {
            status: currentFileStatus === 'completed' ? 'analysis_complete' : 'analysis_failed',
            statusMessage: currentFileStatus === 'completed' ? 'Analysis complete!' : 'Analysis failed.',
            errorMessage: currentFileStatus === 'failed' ? (errorMessageFromServer || 'Analysis process failed') : undefined,
          });
          setAnalysisPollingIntervals(prevIntervals => {
            if (prevIntervals[fileId]) clearInterval(prevIntervals[fileId]);
            const newIntervals = { ...prevIntervals };
            delete newIntervals[fileId];
            console.log(`[Polling] Intervals remaining after ${fileId}:`, Object.keys(newIntervals));
            return newIntervals;
          });

          // Check if all files have finished analyzing
          const remainingAnalyzingFiles = uploadingFiles.filter(f => f.status === 'analyzing').length;
          if (remainingAnalyzingFiles === 0) {
            console.log('[Polling] All files have finished analyzing, switching to Results tab');
            setActiveUploadTab(2); // Switch to Results tab
          }
        } else {
          updateFileState(fileId, { statusMessage: `Analyzing... (status: ${currentFileStatus})` });
        }
      } catch (error) {
        console.error(`[Polling] Error during poll for ${jobId} (${fileId}):`, error);
        updateFileState(fileId, {
          status: 'analysis_failed',
          statusMessage: 'Polling error.',
          errorMessage: error instanceof Error ? error.message : 'Failed to check analysis status',
        });
        setAnalysisPollingIntervals(prevIntervals => {
          if (prevIntervals[fileId]) clearInterval(prevIntervals[fileId]);
          const newIntervals = { ...prevIntervals };
          delete newIntervals[fileId];
          return newIntervals;
        });

        // Check if all files have finished analyzing
        const remainingAnalyzingFiles = uploadingFiles.filter(f => f.status === 'analyzing').length;
        if (remainingAnalyzingFiles === 0) {
          console.log('[Polling] All files have finished analyzing, switching to Results tab');
          setActiveUploadTab(2); // Switch to Results tab
        }
      }
    };

    poll(); // Initial poll
    const intervalId = setInterval(poll, 5000);
    setAnalysisPollingIntervals(prevIntervals => {
      if (prevIntervals[fileId]) clearInterval(prevIntervals[fileId]);
      console.log(`[Polling] Setting intervalId ${intervalId} for fileId: ${fileId}`);
      return { ...prevIntervals, [fileId]: intervalId };
    });
  };

  const handleStartAnalysisForAllCompleted = async () => {
    const filesToAnalyze = uploadingFiles.filter(f => f.status === 'completed' && f.fileId);
    if (filesToAnalyze.length === 0) {
      alert("No successfully uploaded files available to analyze.");
      return;
    }
    setIsStartingAnalysis(true);
    
    //Before moving to the next step, update the status of the files to analyzing
    filesToAnalyze.map((fileToAnalyze) => {
      updateFileState(fileToAnalyze.id, {
        status: 'analyzing',
        statusMessage: 'Analysis initiated...',
      });
    })
    setActiveUploadTab(1);

    const results = await Promise.allSettled(
      filesToAnalyze.map(async (fileToAnalyze) => {
        try {
          console.log(`[AnalysisStart] Attempting for fileId: ${fileToAnalyze.id}, serverFileId: ${fileToAnalyze.fileId}`);
          // Ensure fileId is not undefined before calling startTranscription
          if (typeof fileToAnalyze.fileId !== 'number') {
              throw new Error("Server File ID is missing for analysis.");
          }
          const response = await transcriptService.startTranscription(fileToAnalyze.fileId);
          const jobId = response.data.JobId; // Assuming JobId is returned
          console.log(`[AnalysisStart] Started for ${fileToAnalyze.id}, jobId: ${jobId}`);
          updateFileState(fileToAnalyze.id, {
            status: 'analyzing',
            statusMessage: 'Analysis initiated...',
            analysisJobId: jobId,
          });
          startAnalysisPolling(fileToAnalyze.id, jobId);
          return { success: true, fileId: fileToAnalyze.id };
        } catch (error) {
          console.error(`[AnalysisStart] Failed for ${fileToAnalyze.file.name}:`, error);
          updateFileState(fileToAnalyze.id, {
            status: 'analysis_failed',
            statusMessage: 'Failed to start analysis.',
            errorMessage: error instanceof Error ? error.message : 'Unknown error starting analysis',
          });
          return { success: false, fileId: fileToAnalyze.id, error };
        }
      })
    );
    const successfulStarts = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    if (successfulStarts > 0) {
    //   alert(`Analysis initiated for ${successfulStarts} file(s).`); // Maybe remove alert for better UX
    }
    if (successfulStarts < filesToAnalyze.length) {
      alert(`${filesToAnalyze.length - successfulStarts} file(s) failed to start analysis.`);
    }
    setIsStartingAnalysis(false);
  };

  const filesReadyForAnalysisCount = uploadingFiles.filter(f => f.status === 'completed').length;
  const uploadingCount = uploadingFiles.filter(f => ['pending', 'uploading', 'error', 'completed'].includes(f.status)).length;
  const analyzingCount = uploadingFiles.filter(f => f.status === 'analyzing').length;
  const completedAnalysisCount = uploadingFiles.filter(f => ['analysis_complete', 'analysis_failed'].includes(f.status)).length;

  const renderFileListItem = (upFile: UploadingFile) => (
    <ListItem 
        key={upFile.id}
        divider
        sx={{py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}
    >
        <Box sx={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5}}>
            <ListItemText
                primary={upFile.file.name}
                secondary={`Agent: ${agents.find(a => String(a.ID) === upFile.agentId)?.NAME || 'N/A' } | Size: ${(upFile.file.size / (1024*1024)).toFixed(2)} MB`}
                primaryTypographyProps={{fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr:1}}
                secondaryTypographyProps={{fontSize: '0.8rem'}}
            />
            <Box sx={{minWidth: '120px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1}}>
                {upFile.status === 'uploading' && <Tooltip title="Uploading"><CircularProgress size={20} /></Tooltip>}
                {upFile.status === 'pending' && <Tooltip title="Queued for Upload"><PendingActionsIcon fontSize="small" color="action"/></Tooltip>}
                {upFile.status === 'completed' && <Tooltip title="Upload Complete, Ready for Analysis"><CheckCircleOutlineIcon color="success" /></Tooltip>}
                {upFile.status === 'analyzing' && <Tooltip title="Analyzing"><CircularProgress size={20} color="secondary" /></Tooltip>}
                {upFile.status === 'analysis_complete' && <Tooltip title="Analysis Complete"><CheckCircleIcon color="primary" /></Tooltip>}
                {upFile.status === 'analysis_failed' && <Tooltip title="Analysis Failed"><ErrorOutlineIcon color="error" /></Tooltip>}
                {upFile.status === 'error' && <Tooltip title="Upload Failed"><ErrorOutlineIcon color="error" /></Tooltip>}
                {upFile.status === 'error' && (
                    <Button size="small" variant="text" color="primary" onClick={() => processFileUpload(upFile)} sx={{ml:1, textTransform: 'none'}}>Retry Upload</Button>
                )}
            </Box>
        </Box>
        {(upFile.status === 'uploading') && (
          <Box sx={{ width: '100%', mt: 0.5 }}>
              {upFile.statusMessage && <Typography variant="caption" color="text.secondary" sx={{mb:0.5, display:'block'}}>{upFile.statusMessage}</Typography>}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress variant="determinate" value={upFile.progress} sx={{ flexGrow: 1, height: '8px', borderRadius: '4px' }} />
                <Typography variant="caption" sx={{minWidth: '35px'}}>{`${Math.round(upFile.progress)}%`}</Typography>
              </Box>
          </Box>
        )}
        {(['completed', 'analyzing', 'analysis_complete', 'analysis_failed'].includes(upFile.status)) && upFile.statusMessage && (
            <Typography variant="caption" color={upFile.status === 'analysis_failed' ? "error" : "text.secondary"} sx={{mt:0.5, display:'block', width: '100%'}}>
               {upFile.statusMessage}
            </Typography>
        )}
        {(upFile.status === 'error' || upFile.status === 'analysis_failed') && upFile.errorMessage && (
            <Alert severity="error" sx={{width: '100%', fontSize: '0.8rem', py:0.5, mt:1}}>
                {upFile.errorMessage}
            </Alert>
        )}
    </ListItem>
  );

  useEffect(() => {
    uploadingFiles.forEach(file => {
      if (file.status === 'analyzing' && file.analysisJobId && !analysisPollingIntervals[file.id]) {
        console.warn(`[PollingRecovery] Found analyzing file ${file.id} without active interval. Restarting polling.`);
        startAnalysisPolling(file.id, file.analysisJobId);
      }
    });
  }, [uploadingFiles]); // Only depends on uploadingFiles to check for recovery needs

  useEffect(() => {
    // Store the current intervals object in a ref so the cleanup function closes over the correct version
    const intervalsRef = analysisPollingIntervals; // Capture the current intervals
    return () => {
      console.log("[Cleanup] Component truly unmounting, clearing all polling intervals:", Object.keys(intervalsRef));
      Object.values(intervalsRef).forEach(intervalId => {
        if (intervalId) clearInterval(intervalId);
      });
      // DO NOT call setAnalysisPollingIntervals({}) here if this effect is only for unmount.
      // If you need to reset state during other scenarios, do it elsewhere.
    };
  }, []); // <-- EMPTY dependency array for unmount cleanup ONLY

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}> {/* Ensured outer box allows flex column */}
      <Box 
        sx={{ 
          display: 'flex', gap: 2, p: 2, 
          flex: 1, // Allow this Box to grow and fill vertical space
          width: '100%',
          minHeight: 0, // Important for nested flex containers to shrink correctly
        }}
      > 
        {/* Left Section */}
        <Box sx={{ flexGrow: 3, flexShrink: 1, flexBasis: '0%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>Upload Options</Typography>
              <FormControl fullWidth variant="outlined" disabled={isLoadingAgents || !!agentFetchError}>
                <InputLabel id="agent-select-label">Select Agent</InputLabel>
                <Select
                  labelId="agent-select-label"
                  id="agent-select"
                  value={selectedAgentId}
                  label="Select Agent"
                  onChange={handleAgentChange}
                >
                  {isLoadingAgents && <MenuItem value=""><CircularProgress size={20} sx={{mx:1}}/> Loading...</MenuItem>}
                  {!isLoadingAgents && agents.length === 0 && !agentFetchError && (<MenuItem value="" disabled>No agents found</MenuItem>)}
                  {agents.map((agent) => (<MenuItem key={agent.ID} value={String(agent.ID)}>{agent.NAME}</MenuItem>))}
                </Select>
              </FormControl>
              {agentFetchError && <Alert severity="error" sx={{mt:1}}>{agentFetchError}</Alert>}
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
                disabled={isLoadingAgents || !selectedAgentId}
              >
                Select Files & Auto-Upload
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept=".mp3,.mp4,.wav,audio/mpeg,audio/wav,video/mp4"
                  onChange={handleFileSelectAndUpload}
                  multiple
                />
              </Button>
              <Button 
                  variant="contained"
                  sx={{ mt: 2, pt:1, pb:1, backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c'}}} 
                  disabled={filesReadyForAnalysisCount === 0 || isStartingAnalysis}
                  onClick={handleStartAnalysisForAllCompleted}
              >
                  {isStartingAnalysis ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                      Starting Analysis...
                    </>
                  ) : (
                    `Analyze ${filesReadyForAnalysisCount > 0 ? `(${filesReadyForAnalysisCount}) Uploaded` : 'Uploaded Files'}`
                  )}
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Right Section - Upload Progress */}
        <Box sx={{ flexGrow: 7, flexShrink: 1, flexBasis: '0%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeUploadTab} onChange={handleUploadTabChange} aria-label="upload status tabs" variant="fullWidth">
                <Tab label={`Uploading (${uploadingCount})`} id="upload-tab-0" aria-controls="upload-tabpanel-0" />
                <Tab label={`Analyzing (${analyzingCount})`} id="upload-tab-1" aria-controls="upload-tabpanel-1" />
                <Tab label={`Results (${completedAnalysisCount})`} id="upload-tab-2" aria-controls="upload-tabpanel-2" />
              </Tabs>
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 0, overflow: 'hidden' }}>
              <TabPanel value={activeUploadTab} index={0}>
                <List dense sx={{width: '100%'}}>
                  {uploadingFiles.filter(f => ['pending', 'uploading', 'error', 'completed'].includes(f.status)).map(renderFileListItem)}
                  {uploadingFiles.filter(f => ['pending', 'uploading', 'error', 'completed'].includes(f.status)).length === 0 && (
                      <Typography sx={{p:2, textAlign: 'center', color: 'text.secondary'}}>No files currently uploading or pending upload.</Typography>
                   )}
                </List>
              </TabPanel>
              <TabPanel value={activeUploadTab} index={1}>
                  <List dense sx={{width: '100%'}}>
                      {uploadingFiles.filter(f => f.status === 'analyzing').map(renderFileListItem)}
                      {uploadingFiles.filter(f => f.status === 'analyzing').length === 0 && (
                          <Typography sx={{p:2, textAlign: 'center', color: 'text.secondary'}}>No files currently being analyzed.</Typography>
                      )}
                  </List>
              </TabPanel>
              <TabPanel value={activeUploadTab} index={2}>
                  <List dense sx={{width: '100%'}}>
                      {uploadingFiles.filter(f => ['analysis_complete', 'analysis_failed'].includes(f.status)).map(renderFileListItem)}
                      {uploadingFiles.filter(f => ['analysis_complete', 'analysis_failed'].includes(f.status)).length === 0 && (
                          <Typography sx={{p:2, textAlign: 'center', color: 'text.secondary'}}>No files have completed analysis yet.</Typography>
                      )}
                  </List>
              </TabPanel>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CallUploadPage;