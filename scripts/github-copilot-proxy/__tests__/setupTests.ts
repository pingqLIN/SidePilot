// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.COPILOT_TOKEN = 'test-token-12345';
process.env.PORT = '3001';

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
