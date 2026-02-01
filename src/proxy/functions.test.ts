import { getEncryptedToken } from "./functions";

describe("getEncryptedToken", () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, TOKEN_KEY: "testkey" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should encrypt user object into a token", async () => {
    const user = { id: 1, email: "test@example.com", username: "testuser" };
    const token = await getEncryptedToken(user);
    expect(typeof token).toBe("string");
    expect(token).not.toBe("");
  });
});
