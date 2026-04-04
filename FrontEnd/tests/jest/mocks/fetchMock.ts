import { jest } from '@jest/globals';

type MockResponseInit = {
  ok?: boolean;
  status?: number;
};

export const installFetchMock = () => {
  Object.defineProperty(globalThis, 'fetch', {
    writable: true,
    value: jest.fn<() => Promise<Response>>(),
  });

  return globalThis.fetch as jest.MockedFunction<typeof fetch>;
};

export const mockFetchJson = <T>(
  data: T,
  init: MockResponseInit = {},
) => {
  const { ok = true, status = 200 } = init;
  const response = {
    ok,
    status,
    json: async () => data,
  } as Response;

  const fetchMock = globalThis.fetch as jest.MockedFunction<typeof fetch>;
  fetchMock.mockResolvedValue(response);
};
