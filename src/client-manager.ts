import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { GitHubMCPServer } from './github-mcp-server.js';

export class ClientManager {
  private clients: Client[] = [];

  async initialize() {
    // GitHub MCPサーバーは GITHUB_PERSONAL_ACCESS_TOKEN が定義されている場合のみ追加
    if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      const githubMCPServer = new GitHubMCPServer();
      await githubMCPServer.initialize();
      this.clients.push(githubMCPServer);
    }
  }

  getClients(): Client[] {
    return this.clients;
  }
}
