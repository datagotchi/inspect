import { expect, Page } from "@playwright/test";

import { test as testBase } from "./fixtures";
import { testAccount } from "./constants";

const { email, password } = testAccount;

const test = testBase.extend<{ anonymousPage: Page }>({
  anonymousPage: [
    async ({ anonymousContext }, use) => {
      const page = await anonymousContext.newPage();
      await use(page);
    },
    { scope: "test" },
  ],
});

test("click on login link", async ({ anonymousPage }) => {
  await anonymousPage.goto("http://localhost:3000");
  await anonymousPage.waitForURL("http://localhost:3000/insights");
  await expect(anonymousPage).toHaveURL("http://localhost:3000/insights");

  await expect(
    anonymousPage.getByRole("link", { name: "Login" }),
  ).toBeVisible();
  await anonymousPage.getByRole("link", { name: "Login" }).click();

  await expect(anonymousPage).toHaveURL(
    "http://localhost:3000/login?return=/insights",
  );
});

test("do login", async ({ anonymousPage }) => {
  await anonymousPage.goto("http://localhost:3000/login?return=/insights");

  await expect(
    anonymousPage.getByRole("heading", { name: "Login to Inspect" }),
  ).toBeVisible();

  const loginButton = anonymousPage.getByRole("button", { name: "Login" });
  await expect(loginButton).toBeVisible();
  await expect(loginButton).toBeDisabled();

  await expect(
    anonymousPage.getByRole("textbox", { name: "Email:" }),
  ).toBeVisible();
  await anonymousPage.getByRole("textbox", { name: "Email:" }).fill(email);

  await expect(loginButton).toBeDisabled();

  await expect(
    anonymousPage.getByRole("textbox", { name: "Password:" }),
  ).toBeVisible();
  await anonymousPage
    .getByRole("textbox", { name: "Password:" })
    .fill(`${password}-wrong`);

  await expect(loginButton).toBeEnabled();
  await loginButton.click();

  await expect(anonymousPage.getByText("Invalid credentials")).toBeVisible();

  await anonymousPage
    .getByRole("textbox", { name: "Password:" })
    .fill(password);

  await loginButton.click();

  await anonymousPage.waitForURL("http://localhost:3000/insights");

  await expect(anonymousPage).toHaveURL("http://localhost:3000/insights");
});
