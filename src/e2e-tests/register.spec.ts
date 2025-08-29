import { expect, Page } from "@playwright/test";
import pg from "pg";

import { test as testBase } from "./fixtures";

const test = testBase.extend<{ anonymousPage: Page }>({
  anonymousPage: [
    async ({ anonymousContext }, use) => {
      const page = await anonymousContext.newPage();
      await use(page);
    },
    { scope: "test" },
  ],
});

test.afterAll(async ({ pool }) => {
  const client = await pool.connect();
  try {
    await client.query("delete from users where username = 'Test3'");
  } finally {
    client.release();
  }
});

test("click on register link", async ({ anonymousPage }) => {
  await anonymousPage.goto("http://localhost:3000");

  await expect(anonymousPage).toHaveURL("http://localhost:3000/insights");

  await expect(
    anonymousPage.getByRole("link", { name: "Register" }),
  ).toBeVisible();
  await anonymousPage.getByRole("link", { name: "Register" }).click();

  await expect(anonymousPage).toHaveURL(
    "http://localhost:3000/register?return=/insights",
  );
});

test("do registration", async ({ anonymousPage }) => {
  await anonymousPage.goto("http://localhost:3000/register?return=/insights");

  await expect(
    anonymousPage.getByRole("heading", {
      name: "Register for Inspect by Datagotchi Labs",
    }),
  ).toBeVisible();

  const registerButton = anonymousPage.getByRole("button", {
    name: "Register",
  });
  await expect(registerButton).toBeVisible();
  await expect(registerButton).toBeDisabled();

  const emailLabel = anonymousPage
    .locator("label")
    .filter({ hasText: "Email:" });
  await expect(emailLabel).toHaveText("Email:");
  const emailField = emailLabel.locator("input");
  await expect(emailField).toBeEmpty();
  await emailField.fill("test@test.com");
  await expect(emailField).toHaveValue("test@test.com");

  await expect(registerButton).toBeDisabled();

  const usernameLabel = anonymousPage
    .locator("label")
    .filter({ hasText: "Username:" });
  await expect(usernameLabel).toHaveText("Username:");
  const usernameField = usernameLabel.locator("input");
  await expect(usernameField).toBeEmpty();
  await usernameField.fill("Test3");
  await expect(usernameField).toHaveValue("Test3");

  await expect(registerButton).toBeDisabled();

  const passwordLabel = anonymousPage
    .locator("label")
    .filter({ hasText: "Password:" });
  await expect(passwordLabel).toHaveText("Password:");
  const passwordField = passwordLabel.locator("input");
  await expect(passwordField).toBeEmpty();
  await passwordField.fill("asdf");
  await expect(passwordField).toHaveValue("asdf");

  await expect(registerButton).toBeEnabled();
  await registerButton.click();

  await expect(anonymousPage).toHaveURL("http://localhost:3000/insights", {
    timeout: 30000,
  });
});
