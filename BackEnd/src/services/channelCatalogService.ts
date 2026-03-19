import { Channel, Server } from '../data/mockData';

interface CreateChannelInput {
  name: string;
  category?: string;
  type?: Channel['type'];
}

let dynamicChannelCounter = 1;

const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

export class ChannelCatalogService {
  constructor(
    private readonly servers: Server[],
    private readonly groups: Server[],
    private readonly channelNameMap: Map<string, string>,
  ) {}

  addServerChannel(serverId: string, input: CreateChannelInput): Channel | undefined {
    const server = this.servers.find((entry) => entry.id === serverId);
    if (!server) {
      return undefined;
    }

    return this.addChannelToContainer(server, 'c', input);
  }

  addGroupChannel(groupId: string, input: CreateChannelInput): Channel | undefined {
    const group = this.groups.find((entry) => entry.id === groupId);
    if (!group) {
      return undefined;
    }

    return this.addChannelToContainer(group, 'gch', input);
  }

  private addChannelToContainer(container: Server, prefix: string, input: CreateChannelInput): Channel {
    const normalizedName = normalizeName(input.name);

    const existing = container.channels.find((channel) => channel.name === normalizedName);
    if (existing) {
      return existing;
    }

    const created: Channel = {
      id: `${prefix}-live-${dynamicChannelCounter++}`,
      name: normalizedName,
      type: input.type || 'text',
      category: input.category || 'TEXT CHANNELS',
    };

    container.channels = [...container.channels, created];
    this.channelNameMap.set(created.id, created.name);

    return created;
  }
}
