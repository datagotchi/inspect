import { test as baseTest, BrowserContext } from "@playwright/test";
import { Pool } from "pg";

import { myAccount, testAccount } from "./constants";
import { encodeStringURI } from "../app/hooks/functions";

type ContextFixtures = {
  myAccountContext: BrowserContext;
  testAccountContext: BrowserContext;
  anonymousContext: BrowserContext;
};
type WorkerFixtures = {
  pool: Pool;
};

export const test = baseTest.extend<ContextFixtures, WorkerFixtures>({
  pool: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const pool = new Pool({
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        database: "inspect",
      });

      await use(pool);

      await pool.end();
    },
    { scope: "worker" },
  ],
  myAccountContext: [
    async ({ request, browser }, use) => {
      const response = await request.post("http://localhost:3000/api/login", {
        data: { email: myAccount.email, password: myAccount.password },
      });
      const json = await response.json();
      const token = json.token;

      const context = await browser.newContext();
      await context.addCookies([
        {
          name: "token",
          value: encodeStringURI(token),
          url: "http://localhost:3000",
        },
      ]);

      await use(context);

      await context.clearCookies();
      await context.close();
    },
    { scope: "test" },
  ],
  testAccountContext: [
    async ({ request, browser }, use) => {
      const response = await request.post("http://localhost:3000/api/login", {
        data: { email: testAccount.email, password: testAccount.password },
      });
      const json = await response.json();
      const token = json.token;

      const context = await browser.newContext();
      await context.addCookies([
        {
          name: "token",
          value: encodeStringURI(token),
          url: "http://localhost:3000",
        },
      ]);

      await use(context);

      await context.clearCookies();
      await context.close();
    },
    { scope: "test" },
  ],
  anonymousContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();

      await use(context);

      await context.close();
    },
    { scope: "test" },
  ],
});
