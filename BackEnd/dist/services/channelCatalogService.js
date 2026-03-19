"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelCatalogService = void 0;
let dynamicChannelCounter = 1;
const normalizeName = (name) => name.trim().toLowerCase().replace(/\s+/g, '-');
class ChannelCatalogService {
    constructor(servers, groups, channelNameMap) {
        this.servers = servers;
        this.groups = groups;
        this.channelNameMap = channelNameMap;
    }
    addServerChannel(serverId, input) {
        const server = this.servers.find((entry) => entry.id === serverId);
        if (!server) {
            return undefined;
        }
        return this.addChannelToContainer(server, 'c', input);
    }
    addGroupChannel(groupId, input) {
        const group = this.groups.find((entry) => entry.id === groupId);
        if (!group) {
            return undefined;
        }
        return this.addChannelToContainer(group, 'gch', input);
    }
    addChannelToContainer(container, prefix, input) {
        const normalizedName = normalizeName(input.name);
        const existing = container.channels.find((channel) => channel.name === normalizedName);
        if (existing) {
            return existing;
        }
        const created = {
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
exports.ChannelCatalogService = ChannelCatalogService;
