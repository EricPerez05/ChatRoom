import { describe, expect, it } from 'vitest';
import { getGroups, getMembers, getServers } from '../../src/app/services/api';

const runDeployedIntegration = process.env.RUN_DEPLOYED_INTEGRATION === 'true';
const describeIf = runDeployedIntegration ? describe : describe.skip;

describeIf('Deployed environment integration smoke tests', () => {
  it('loads deployed catalog endpoints', async () => {
    const [servers, groups, members] = await Promise.all([
      getServers(),
      getGroups(),
      getMembers(),
    ]);

    expect(servers.length).toBeGreaterThan(0);
    expect(groups.length).toBeGreaterThan(0);
    expect(members.length).toBeGreaterThan(0);
  });
});
