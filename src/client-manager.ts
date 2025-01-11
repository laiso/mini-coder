import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import Anthropic from '@anthropic-ai/sdk';
import { MCPServersConfig } from './types.js';

export async function initializeToolsAndClients(config: MCPServersConfig): Promise<{
    allTools: Anthropic.Tool[],
    toolServerMap: Map<string, Client>,
}> {
    let allTools: Anthropic.Tool[] = [];
    const toolServerMap = new Map();

    // Initialize clients
    for (const key in config.mcpServers) {
        // Skip GitHub MCP server if GITHUB_PERSONAL_ACCESS_TOKEN is not defined
        if (key === 'github' && !process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
            console.log('Skipping GitHub MCP server initialization: GITHUB_PERSONAL_ACCESS_TOKEN is not defined');
            continue;
        }

        const params = config.mcpServers[key];
        const client = new Client(
            {
                name: "mini-coder",
                version: '0.1.0',
            },
            {
                capabilities: {
                    sampling: {},
                },
            },
        );

        await client.connect(new StdioClientTransport(params));

        const toolList = await client.listTools();
        const tools = toolList.tools.map((tool) => {
            if (toolServerMap.has(tool.name)) {
                console.warn(`Warning: Tool name "${tool.name}" is already registered. Overwriting previous registration.`);
            }
            toolServerMap.set(tool.name, client);
            return {
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            };
        });

        allTools = allTools.concat(tools);
    }

    return { allTools, toolServerMap };
}