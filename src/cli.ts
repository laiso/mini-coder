import Anthropic from '@anthropic-ai/sdk';
import { CallToolResultSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Command } from 'commander';
import { initializeToolsAndClients } from './client-manager.js';
import { MCPServersConfig } from './types.js';
import path from 'path';
import fs from 'fs';

const MODEL_NAME = 'claude-3-5-sonnet-latest';

function processMessages(
    messages: Anthropic.MessageParam[],
    currentToolUseBlock: Anthropic.ToolUseBlock | undefined
): { updatedMessages: Anthropic.MessageParam[]; continue: boolean } {
    if (!currentToolUseBlock) {
        return { updatedMessages: messages, continue: false };
    }
    const updatedMessages = [...messages];
    return { updatedMessages, continue: true };
}

async function handleMessageContent(
    message: Anthropic.Message,
    messages: Anthropic.MessageParam[]
): Promise<{ toolUseBlock: Anthropic.ToolUseBlock | undefined; messages: Anthropic.MessageParam[] }> {
    let currentToolUseBlock: Anthropic.ToolUseBlock | undefined;
    const updatedMessages = [...messages]; // Create new array to avoid mutation

    for (const contentBlock of message.content) {
        if (contentBlock.type === 'text') {
            updatedMessages.push({
                role: 'assistant',
                content: contentBlock.text,
            });
            console.log('Assistant:', contentBlock.text);
        } else if (contentBlock.type === 'tool_use') {
            currentToolUseBlock = contentBlock;
        }
    }

    return {
        toolUseBlock: currentToolUseBlock,
        messages: updatedMessages
    };
}

async function main(userQuestion: string, projectDirectory: string, serverConfig: MCPServersConfig, maxIterations = 10) {
    const anthropicClient = new Anthropic(); // gets API Key from environment variable ANTHROPIC_API_KEY

    const { allTools, toolServerMap } = await initializeToolsAndClients(serverConfig);

    let conversationMessages: Anthropic.MessageParam[] = [];

    const userMessage: Anthropic.MessageParam = {
        role: 'user',
        content: userQuestion,
    };

    conversationMessages.push(userMessage);

    const systemMessage = `You are Mini Coder, a highly skilled software engineer with extensive knowledge in various programming languages, frameworks, design patterns, and best practices.
Current Working Directory: ${projectDirectory}
For more information about tasks, you can read the documentation in the docs/ directory.
`;

    let message = await anthropicClient.messages.create({
        model: MODEL_NAME,
        max_tokens: 2024,
        temperature: 0.0,
        system: systemMessage,
        messages: conversationMessages,
        tools: allTools,
    });

    let { toolUseBlock, messages } = await handleMessageContent(message, conversationMessages);
    conversationMessages = messages;
    let currentToolUseBlock = toolUseBlock;

    let iterationCount = 0;
    while (currentToolUseBlock && iterationCount < maxIterations) {
        if (currentToolUseBlock) {
            console.log({ currentToolUseBlock });
        }
        const { updatedMessages, continue: shouldContinue } = processMessages(conversationMessages, currentToolUseBlock);
        conversationMessages = updatedMessages;
        if (!shouldContinue) break;

        const mcpClient = toolServerMap.get(currentToolUseBlock.name);
        if (!mcpClient) {
            throw new Error(`Tool server not found for tool ${currentToolUseBlock.name}`);
        }

        let toolResult;
        try {
            toolResult = await mcpClient.callTool(
                {
                    name: currentToolUseBlock.name,
                    arguments: currentToolUseBlock.input as { [x: string]: unknown },
                },
                CallToolResultSchema,
            );
        } catch (error) {
            const mcpError = new McpError((error as any).code, (error as any).message, (error as any).data);
            conversationMessages.push({
                role: 'user',
                content: `ToolUser: ${JSON.stringify(currentToolUseBlock)}, Error: ${mcpError.message}`,
            });
            continue;
        }

        for (const resultContent of toolResult.content as any[]) {
            console.log('Tool Result:', resultContent.text.slice(0, 255));
            const userMessage: Anthropic.MessageParam = {
                role: 'user',
                content: resultContent.text,
            };
            conversationMessages.push(userMessage);
        }

        message = await anthropicClient.messages.create({
            model: MODEL_NAME,
            max_tokens: 2024,
            temperature: 0.0,
            system: systemMessage,
            messages: conversationMessages,
            tools: allTools,
        });

        currentToolUseBlock = await handleMessageContent(message, conversationMessages).then(result => {
            conversationMessages = result.messages;
            return result.toolUseBlock;
        });

        iterationCount++;
    }

    const mcpClients = new Set(toolServerMap.values());
    for (const client of mcpClients) {
        await client.close();
        console.log('Closed.');
    }
}

const program = new Command();
program
    .option('-p, --path <directory>', 'project root directory path', process.cwd())
    .option('-i, --instruction <file>', 'path to instruction file')
    .option('-e, --entry <file>', 'entry point file path')
    .parse(process.argv);

const options = program.opts();
const projectRootDirectory = path.resolve(options.path);

// Verify directory exists
if (!fs.existsSync(projectRootDirectory) || !fs.statSync(projectRootDirectory).isDirectory()) {
    console.error(`Error: ${projectRootDirectory} is not a valid directory`);
    process.exit(1);
}

if (!options.instruction) {
    console.error('Error: Instruction file path is required');
    process.exit(1);
}

let instruction = '';
if (fs.existsSync(options.instruction) && fs.statSync(options.instruction).isFile()) {
    const instructionFilePath = path.resolve(options.instruction);
    instruction = fs.readFileSync(instructionFilePath, 'utf-8');
} else {
    instruction = options.instruction.trim();
}
console.log('Instruction:', instruction.slice(0, 255));

// Verify entry point file exists if provided
const entryPoint = options.entry ? path.resolve(options.entry) : undefined;
if (entryPoint && (!fs.existsSync(entryPoint) || !fs.statSync(entryPoint).isFile())) {
    console.error(`Error: ${entryPoint} is not a valid file`);
    process.exit(1);
}

const serverConfiguration = {
    mcpServers: {
        filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', projectRootDirectory],
        },
        github: {
            command: 'docker',
            args: [
                'run',
                '-i',
                '--rm',
                '-e',
                'GITHUB_PERSONAL_ACCESS_TOKEN',
                'mcp/github'
            ],
            env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
            },
        }
    },
};

let initialInstruction = '';
try {
    initialInstruction = `
        entry point: ${entryPoint || 'N/A'}
        ===
        ${instruction}
        `;
} catch (error) {
    console.error(`Error reading instruction file: ${(error as Error).message}`);
    process.exit(1);
}

export default main(initialInstruction, projectRootDirectory, serverConfiguration, 10);
