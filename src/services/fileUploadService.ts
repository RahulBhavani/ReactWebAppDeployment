// src/services/fileUploadService.ts
import apiClient from './apiClient'; // Our configured axios instance
import { v4 as uuidv4 } from 'uuid'; // For generating GUIDs

const UPLOAD_ENDPOINT = '/api/v1/file/upload/chunks'; // Your chunk upload endpoint
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunk size

export const generateGUID = (): string => {
  return uuidv4();
};

interface UploadChunkParams {
  fileChunk: Blob;
  originalFilename: string;
  uploadId: string;
  partNumber: number; // 0-indexed
  totalParts: number;
}

// Interface for the expected response from the chunk upload endpoint
// Adjust this based on what your server actually returns after each chunk
interface ChunkUploadResponse {
  success: boolean;
  message: string;
  data?: {
    FileId?: number;
  };
}

export const fileUploadService = {
  uploadChunk: async (params: UploadChunkParams): Promise<ChunkUploadResponse> => {
    const formData = new FormData();
    formData.append('file', params.fileChunk, params.originalFilename);
    formData.append('filename', params.originalFilename);
    formData.append('upload_id', params.uploadId);
    formData.append('part_number', String(params.partNumber));
    formData.append('part_count', String(params.totalParts));

    try {
      const response = await apiClient.post<ChunkUploadResponse>(UPLOAD_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data || !response.data.success) {
          throw new Error(response.data.message || `Chunk ${params.partNumber + 1} failed to upload.`);
      }
      return response.data;

    } catch (error) {
      console.error(`Error uploading chunk ${params.partNumber + 1}:`, error);
      throw error;
    }
  },

  uploadFileInChunks: async (
    file: File,
    uploadId: string,
    onProgress: (percent: number, statusMessage?: string) => void,
  ): Promise<ChunkUploadResponse> => {
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);
    onProgress(0, `Preparing to upload ${totalParts} parts...`);

    let lastResponse: ChunkUploadResponse | null = null;

    for (let partNumber = 0; partNumber < totalParts; partNumber++) {
      const start = partNumber * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      try {
        onProgress(
          Math.round(((partNumber) / totalParts) * 100),
          `Uploading part ${partNumber + 1} of ${totalParts}...`
        );
        
        const response = await fileUploadService.uploadChunk({
          fileChunk: chunk,
          originalFilename: file.name,
          uploadId: uploadId,
          partNumber: partNumber,
          totalParts: totalParts,
        });
        
        lastResponse = response;
        
        // After successful chunk upload, update progress
        const overallProgress = Math.round(((partNumber + 1) / totalParts) * 100);
        onProgress(
            overallProgress, 
            partNumber + 1 === totalParts ? 'Upload complete!' : `Part ${partNumber + 1} uploaded.`
        );

      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || `Failed to upload part ${partNumber + 1}.`;
        console.error(`Upload failed for file ${file.name}, part ${partNumber + 1}:`, errorMessage);
        throw new Error(errorMessage);
      }
    }

    if (!lastResponse) {
      throw new Error('No response received from server after upload completion');
    }

    return lastResponse;
  }
};