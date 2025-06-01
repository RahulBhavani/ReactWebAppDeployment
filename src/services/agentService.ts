// src/services/agentService.ts
import apiClient from './apiClient'; // Our configured axios instance

export interface Agent {
  ID: number;
  NAME: string;
}

interface AgentListResponse {
  success: boolean;
  message: string;
  totalCount: number;
  data: Agent[];
}

const AGENT_LIST_ENDPOINT = '/api/v1/agent'; // Your endpoint for fetching agents

export const agentService = {
  getAgents: async (): Promise<Agent[]> => {
    try {
      const response = await apiClient.get<AgentListResponse>(AGENT_LIST_ENDPOINT);
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Consider how to propagate this error to the UI
      // For now, re-throwing to be caught by the component
      throw error; 
    }
  },
};