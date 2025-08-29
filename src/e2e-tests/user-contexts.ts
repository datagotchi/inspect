import { Page } from "@playwright/test";

export type LocalPageFixtures = {
  myAccountPage: Page;
  testAccountPage: Page;
  anonymousPage: Page;
};

export type MetaPageFixture = {
  userPage: Page;
};

export type TestFixtures = keyof LocalPageFixtures;

type UserRole = {
  name: string;
  pageFixture: TestFixtures;
};

export const userRoles: UserRole[] = [
  { name: "My Account", pageFixture: "myAccountPage" },
  { name: "Test User", pageFixture: "testAccountPage" },
  { name: "Anonymous", pageFixture: "anonymousPage" },
];
