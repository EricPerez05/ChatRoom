import { env } from '../config/env';
import { Member } from '../data/mockData';
import { Message } from '../models/message';
import { QuestionDetectionService } from './questionDetectionService';
import {
  questionResponses,
  responseRules,
  statementResponses,
  topicRules,
} from './simulatedResponseData';
import { MemberPresenceService } from './memberPresenceService';

let simulatedCounter = 1;
const FOLLOW_UP_CHANCE = 0.7;
const MAX_FOLLOW_UPS = 6;
const MIN_RESPONSE_DELAY_MS = 900;
const MAX_RESPONSE_DELAY_MS = 2600;

const TIME_PATTERNS: Array<{ pattern: RegExp; format: (match: RegExpMatchArray) => { text: string; useBy: boolean } }> = [
  { pattern: /\b(eod|end of day)\b/i, format: () => ({ text: 'EOD', useBy: true }) },
  { pattern: /\b(today|tonight|tomorrow|this week|next week)\b/i, format: (match) => ({ text: match[0].toLowerCase(), useBy: false }) },
  { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, format: (match) => ({ text: capitalize(match[0]), useBy: true }) },
  { pattern: /\b(\d{1,2}:\d{2}\s?(?:am|pm)?)\b/i, format: (match) => ({ text: match[0].toLowerCase(), useBy: true }) },
  { pattern: /\b(\d{1,2}\s?(?:am|pm))\b/i, format: (match) => ({ text: match[0].toLowerCase(), useBy: true }) },
];

const ACTION_RULES: Array<{ key: string; patterns: RegExp[] }> = [
  { key: 'review', patterns: [/\breview\b/i, /\bfeedback\b/i, /\bcheck\b/i, /\blook\b/i] },
  { key: 'release', patterns: [/\bdeploy\b/i, /\brelease\b/i, /\bpipeline\b/i, /\bship\b/i] },
  { key: 'planning', patterns: [/\bplan\b/i, /\broadmap\b/i, /\bscope\b/i, /\bmilestone\b/i] },
  { key: 'investigate', patterns: [/\bbug\b/i, /\bissue\b/i, /\berror\b/i, /\bfail\b/i, /\bbroken\b/i] },
  { key: 'meeting', patterns: [/\bmeeting\b/i, /\bsync\b/i, /\bstandup\b/i, /\bcall\b/i] },
  { key: 'update', patterns: [/\bupdate\b/i, /\bstatus\b/i, /\bprogress\b/i] },
];

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const pickDeterministic = <T>(items: T[], seed: string): T => {
  const hash = hashString(seed);
  return items[hash % items.length];
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const detectTopic = (content: string): string | undefined => {
  for (const rule of topicRules) {
    if (rule.patterns.some((pattern) => pattern.test(content))) {
      return rule.topic;
    }
  }
  return undefined;
};

const detectActionKey = (content: string): string | undefined => {
  for (const rule of ACTION_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(content))) {
      return rule.key;
    }
  }
  return undefined;
};

const extractTimeHint = (content: string): { text: string; useBy: boolean } | undefined => {
  for (const rule of TIME_PATTERNS) {
    const match = content.match(rule.pattern);
    if (match) {
      return rule.format(match);
    }
  }
  return undefined;
};

const formatTimeClause = (hint?: { text: string; useBy: boolean }) => {
  if (!hint) {
    return '';
  }
  return hint.useBy ? ` by ${hint.text}` : ` ${hint.text}`;
};

const topicToNoun = (topic?: string) => {
  switch (topic) {
    case 'planning':
      return 'plan';
    case 'release':
      return 'release';
    case 'design':
      return 'design';
    case 'meeting':
      return 'meeting';
    case 'review':
      return 'review';
    default:
      return undefined;
  }
};

const buildActionPhrase = (actionKey: string | undefined, topic?: string) => {
  const topicNoun = topicToNoun(topic);
  switch (actionKey) {
    case 'review':
      return topicNoun ? `review the ${topicNoun}` : 'review it';
    case 'release':
      return topicNoun ? `check the ${topicNoun}` : 'check the release';
    case 'planning':
      return topicNoun ? `outline the ${topicNoun}` : 'draft a plan';
    case 'investigate':
      return topicNoun ? `investigate the ${topicNoun}` : 'investigate the issue';
    case 'meeting':
      return topicNoun ? `join the ${topicNoun}` : 'join the meeting';
    case 'update':
      return topicNoun ? `post an update on the ${topicNoun}` : 'post an update';
    default:
      return topicNoun ? `dig into the ${topicNoun}` : 'take a look';
  }
};

const fillTemplate = (template: string, values: Record<string, string>) => {
  const filled = Object.entries(values).reduce(
    (current, [key, value]) => current.split(`{${key}}`).join(value),
    template,
  );
  return filled.replace(/\s+/g, ' ').trim();
};

const getResponseDelayMs = (content: string) => {
  const lengthFactor = Math.min(content.length * 25, 1200);
  const base = MIN_RESPONSE_DELAY_MS + lengthFactor;
  const jitter = Math.floor(Math.random() * 500);
  return Math.min(base + jitter, MAX_RESPONSE_DELAY_MS);
};

export class SimulatedResponseService {
  private lastResponderId: string | null = null;

  constructor(
    private readonly members: Member[],
    private readonly questionDetectionService: QuestionDetectionService,
    private readonly memberPresenceService: MemberPresenceService,
  ) {}

  async generateResponsesForMessage(
    message: Message,
    options: { allowConversation?: boolean } = {},
  ): Promise<Message[]> {
    const mentioned = this.findMentionedMember(
      this.members.filter((member) => member.id !== message.userId),
      message.content,
    );

    if (mentioned) {
      const responseContent = await this.buildResponseContent(message, mentioned);
      const responseMessage: Message = {
        id: `m-sim-${simulatedCounter++}`,
        channelId: message.channelId,
        userId: mentioned.id,
        userName: mentioned.name,
        userAvatar: mentioned.avatar,
        content: responseContent,
        timestamp: new Date(message.timestamp.getTime() + 1000),
      };

      return [responseMessage];
    }

    const initial = await this.createSimulatedResponse(message);
    if (!initial) {
      return [];
    }

    if (!options.allowConversation) {
      return [initial];
    }

    const responses: Message[] = [initial];
    let lastMessage = initial;

    for (let index = 0; index < MAX_FOLLOW_UPS; index += 1) {
      if (Math.random() > FOLLOW_UP_CHANCE) {
        break;
      }

      const followUp = await this.createSimulatedResponse(lastMessage);
      if (!followUp) {
        break;
      }

      responses.push(followUp);
      lastMessage = followUp;
    }

    return responses;
  }

  private async createSimulatedResponse(message: Message): Promise<Message | undefined> {
    const eligibleMembers = this.members.filter(
      (member) => member.status !== 'offline' && member.id !== message.userId,
    );

    if (eligibleMembers.length === 0) {
      return undefined;
    }

    const responder = this.selectResponder(eligibleMembers, message.content);
    const responseContent = await this.buildResponseContent(message, responder);

    return {
      id: `m-sim-${simulatedCounter++}`,
      channelId: message.channelId,
      userId: responder.id,
      userName: responder.name,
      userAvatar: responder.avatar,
      content: responseContent,
      timestamp: new Date(message.timestamp.getTime() + getResponseDelayMs(responseContent)),
    };
  }

  private selectResponder(eligibleMembers: Member[], content: string): Member {
    const mentioned = this.findMentionedMember(eligibleMembers, content);
    if (mentioned) {
      this.lastResponderId = mentioned.id;
      return mentioned;
    }

    const filtered = eligibleMembers.filter((member) => member.id !== this.lastResponderId);
    const pool = filtered.length > 0 ? filtered : eligibleMembers;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    this.lastResponderId = selected.id;
    return selected;
  }

  private findMentionedMember(members: Member[], content: string): Member | undefined {
    const lowered = content.toLowerCase();

    return members.find((member) => {
      const name = member.name.toLowerCase();
      const matched = lowered.includes(`@${name}`) || new RegExp(`\\b${name}\\b`, 'i').test(content);
      if (matched) {
        this.memberPresenceService.setOnline(member.id);
      }
      return matched;
    });
  }

  private async buildResponseContent(message: Message, responder: Member): Promise<string> {
    if (env.llmProvider === 'ollama') {
      const response = await this.requestOllamaResponse(message, responder.name);
      if (response) {
        return response;
      }
    }

    return this.buildTemplateResponse(message, responder.id);
  }

  private buildTemplateResponse(message: Message, seedSource: string): string {
    const trimmed = message.content.trim();

    for (const rule of responseRules) {
      if (rule.maxLength && trimmed.length > rule.maxLength) {
        continue;
      }

      if (!rule.pattern.test(trimmed)) {
        continue;
      }

      const selected = pickDeterministic(rule.responses, `${trimmed}-${seedSource}`);
      return rule.usesName
        ? fillTemplate(selected, { name: message.userName })
        : selected;
    }

    const topic = detectTopic(message.content);
    const isQuestion = this.questionDetectionService.isLikelyQuestion(message.content);
    const actionKey = detectActionKey(message.content);
    const actionPhrase = buildActionPhrase(actionKey, topic);
    const timeClause = formatTimeClause(extractTimeHint(message.content));

    const dynamicTemplates = isQuestion
      ? [
        'I can {action}{time}.',
        'Let me {action}{time}.',
        'I will {action}{time} and share an update.',
        'Got it. I can {action}{time}.',
        'Sure. I will {action}{time}.',
        'I will {action}{time} and follow up.',
        'Ok. I can {action}{time}.',
        'I can {action}{time} and let you know.',
        'I will {action}{time} and ping you.',
      ]
      : [
        'Got it. I will {action}{time}.',
        'Thanks for the update. I will {action}{time}.',
        'Sounds good. I will {action}{time}.',
        'Cool. I will {action}{time}.',
        'Ok, I will {action}{time}.',
        'Gotcha. I will {action}{time}.',
        'Ok cool. I will {action}{time}.',
        'Sounds good. I can {action}{time}.',
        'Sweet. I will {action}{time}.',
      ];

    const seed = `${message.content}-${seedSource}`;
    const dynamicTemplate = pickDeterministic(dynamicTemplates, seed);
    const dynamicResponse = fillTemplate(dynamicTemplate, {
      action: actionPhrase,
      time: timeClause,
    });
    if (dynamicResponse.length > 0) {
      return dynamicResponse;
    }

    const library = isQuestion ? questionResponses : statementResponses;
    const responses = (topic && library[topic]) ? library[topic] : library.general;

    const selected = pickDeterministic(responses, seed);
    return selected.replace('{name}', message.userName);
  }

  private buildOllamaPrompt(message: Message, responderName: string): string {
    const isQuestion = this.questionDetectionService.isLikelyQuestion(message.content);
    const topic = detectTopic(message.content);
    const topicHint = topic ? `Topic hint: ${topic}.` : '';

    return [
      `You are ${responderName} chatting in a casual group chat.`,
      'Reply like a text message: short, friendly, and natural.',
      'Keep it to 1-2 short sentences. Emojis are optional but not required.',
      isQuestion ? 'Answer the question or suggest a next step.' : 'Acknowledge and add a helpful next step.',
      topicHint,
      `Message from ${message.userName}: "${message.content}"`,
      'Reply:',
    ].filter((line) => line.length > 0).join('\n');
  }

  private async requestOllamaResponse(message: Message, responderName: string): Promise<string | undefined> {
    try {
      const prompt = this.buildOllamaPrompt(message, responderName);
      const payload = {
        model: env.ollamaModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
        },
      };

      const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json();
      const content = (data as { response?: string }).response?.trim();
      if (!content) {
        return undefined;
      }

      return content.replace(/\s+/g, ' ');
    } catch {
      return undefined;
    }
  }
}
