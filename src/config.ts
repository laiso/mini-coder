export type MCPServersConfig = {
    mcpServers: Record<string, { 
        command: string; 
        args: string[]; 
        env?: Record<string, string> 
    }>;
};

export const defaultConfig: MCPServersConfig = {
    mcpServers: {
        filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
        },
    },
};