import { test as baseTest, BrowserContext, Page } from "@playwright/test";
import { Pool } from "pg";

import { myAccount, testAccount } from "./constants";
import { encodeStringURI } from "../app/hooks/functions";
import { User } from "../app/types";

export type ContextFixtures = {
  myAccountContext: BrowserContext;
  testAccountContext: BrowserContext;
  anonymousContext: BrowserContext;
};

type WorkerFixtures = {
  pool: Pool;
};

export type LocalTestFixtures = {
  page: Page;
  roleName: string;
};

type UserRole = {
  name: string;
};

export const userRoles: UserRole[] = [
  { name: "My Account" },
  { name: "Test User" },
  { name: "Anonymous" },
];

export const test = baseTest.extend<
  { myUser: User; testUser: User } & ContextFixtures,
  WorkerFixtures
>({
  pool: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      // FIXME: Error: SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
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
  myUser: [
    async ({ request }, use) => {
      const response = await request.post("http://localhost:3000/api/login", {
        data: { email: myAccount.email, password: myAccount.password },
      });
      const user = await response.json();

      await use(user);
    },
    { scope: "test" },
  ],
  myAccountContext: [
    async ({ myUser, browser }, use) => {
      const token = myUser.token!;

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
  testUser: [
    async ({ request }, use) => {
      const response = await request.post("http://localhost:3000/api/login", {
        data: { email: testAccount.email, password: testAccount.password },
      });
      const user = await response.json();

      await use(user);
    },
    { scope: "test" },
  ],
  testAccountContext: [
    async ({ testUser, browser }, use) => {
      const token = testUser.token!;

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
