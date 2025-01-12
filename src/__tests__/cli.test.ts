import { Message, MessageParam, ToolUseBlock } from '@anthropic-ai/sdk';
import { handleMessageContent, processMessages } from '../cli';

describe('CLI Module', () => {
  describe('processMessages', () => {
    it('should return unchanged messages and continue=false when no tool use block is present', () => {
      const messages: MessageParam[] = [
        { role: 'user', content: 'test message' }
      ];
      const toolUseBlock: ToolUseBlock | undefined = undefined;

      const result = processMessages(messages, toolUseBlock);

      expect(result.updatedMessages).toEqual(messages);
      expect(result.continue).toBe(false);
    });
  });

  describe('handleMessageContent', () => {
    it('should process text content correctly', async () => {
      const message: Message = {
        id: 'test-id',
        content: [
          { type: 'text', text: 'Hello world' }
        ],
        role: 'assistant',
        model: 'test-model',
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0 }
      };
      const messages: MessageParam[] = [];

      const result = await handleMessageContent(message, messages);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual({
        role: 'assistant',
        content: 'Hello world'
      });
      expect(result.toolUseBlock).toBeUndefined();
    });

    it('should handle tool use blocks correctly', async () => {
      const toolUseBlock: ToolUseBlock = {
        type: 'tool_use',
        name: 'test_tool',
        input: { test: 'value' }
      };
      const message: Message = {
        id: 'test-id',
        content: [toolUseBlock],
        role: 'assistant',
        model: 'test-model',
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 0, output_tokens: 0 }
      };
      const messages: MessageParam[] = [];

      const result = await handleMessageContent(message, messages);

      expect(result.messages).toHaveLength(0);
      expect(result.toolUseBlock).toEqual(toolUseBlock);
    });
  });
});