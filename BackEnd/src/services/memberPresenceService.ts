import { Member } from '../data/mockData';

const STATUSES: Array<Member['status']> = ['online', 'idle', 'offline'];

export class MemberPresenceService {
  private readonly members: Member[];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(members: Member[]) {
    this.members = members;
  }

  listMembers(): Member[] {
    return this.members;
  }

  setStatus(userId: string, status: Member['status']) {
    const member = this.members.find((entry) => entry.id === userId);
    if (!member) {
      return;
    }

    member.status = status;
  }

  setOnline(userId: string) {
    this.setStatus(userId, 'online');
  }

  startAutoUpdates(intervalMs = 25000) {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.tickRandomly();
    }, intervalMs);
  }

  private tickRandomly() {
    for (const member of this.members) {
      if (Math.random() > 0.35) {
        continue;
      }

      const next = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      member.status = next;
    }

    if (!this.members.some((member) => member.status === 'online')) {
      this.members[0].status = 'online';
    }
  }
}