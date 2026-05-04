import { Message } from '../models/message';
import { MessageRepository } from '../repositories/messageRepository';
import { SimulatedResponseService } from './simulatedResponseService';

type ChannelState = {
  active: boolean;
  nextAutoAt: number;
  lastHandledMessageId?: string;
};

export class SimulatedConversationService {
  private readonly channelState = new Map<string, ChannelState>();
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly simulatedResponseService: SimulatedResponseService,
  ) {}

  setChannelActive(channelId: string, active: boolean) {
    const current = this.channelState.get(channelId);
    const state: ChannelState = {
      active,
      nextAutoAt: active
        ? (current?.nextAutoAt ?? Date.now() + this.getNextDelayMs())
        : 0,
      lastHandledMessageId: current?.lastHandledMessageId,
    };
    this.channelState.set(channelId, state);
  }

  startAutoReplies(intervalMs = 6000) {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      void this.tick();
    }, intervalMs);
  }

  private async tick() {
    const now = Date.now();
    const entries = Array.from(this.channelState.entries());

    await Promise.all(entries.map(async ([channelId, state]) => {
      if (!state.active) {
        return;
      }

      if (state.nextAutoAt > now) {
        return;
      }

      const messages = await this.messageRepository.listByChannel(channelId);
      if (messages.length === 0) {
        return;
      }

      const lastMessage = messages[messages.length - 1];

      const responses = await this.simulatedResponseService.generateResponsesForMessage(
        lastMessage,
        { allowConversation: true },
      );

      if (responses.length === 0) {
        state.nextAutoAt = now + this.getNextDelayMs();
        this.channelState.set(channelId, state);
        return;
      }

      for (const response of responses) {
        await this.messageRepository.save(response);
      }

      const lastResponse = responses[responses.length - 1];
      state.nextAutoAt = now + this.getNextDelayMs();
      state.lastHandledMessageId = lastResponse.id;
      this.channelState.set(channelId, state);
    }));
  }

  private getNextDelayMs() {
    const minDelay = 2500;
    const maxDelay = 7500;
    return minDelay + Math.floor(Math.random() * (maxDelay - minDelay + 1));
  }
}