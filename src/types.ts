import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import Anthropic from '@anthropic-ai/sdk';

export type MCPServersConfig = {
    mcpServers: Record<string, { 
        command: string; 
        args: string[]; 
        env?: Record<string, string> 
    }>;
};

export type ToolsAndClients = {
    allTools: Anthropic.Tool[],
    toolServerMap: Map<string, Client>,
};