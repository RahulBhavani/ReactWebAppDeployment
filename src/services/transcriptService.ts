import apiClient from './apiClient';

interface TranscriptJobResponse {
  success: boolean;
  message: string;
  data: {
    JobId: string;
  };
}

interface TranscriptStatusResponse {
  success: boolean;
  message: string;
  data: {
    JOBID: string;
    PROCESSINGSTATUS: 'transcribing' | 'completed' | 'failed';
    ERRORMESSAGE?: string;
  };
}

export const transcriptService = {
  startTranscription: async (fileId: number): Promise<TranscriptJobResponse> => {
    try {
      const response = await apiClient.post<TranscriptJobResponse>('/api/v1/transcript', {
        id: fileId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to start transcription');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error starting transcription:', error);
      throw error;
    }
  },

  checkTranscriptionStatus: async (jobId: string): Promise<TranscriptStatusResponse> => {
    try {
      const response = await apiClient.get<TranscriptStatusResponse>(`/api/v1/transcript/status?jobid=${jobId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check transcription status');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error checking transcription status:', error);
      throw error;
    }
  }
}; 