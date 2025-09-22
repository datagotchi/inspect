/* eslint-disable react-hooks/rules-of-hooks */
import { expect, Locator } from "@playwright/test";

import {
  test as baseTest,
  ContextFixtures,
  userRoles,
  LocalTestFixtures,
} from "./fixtures";
import { getInsightUid } from "./functions";
import { Insight, User } from "../app/types";

const test = baseTest.extend<
  ContextFixtures &
    LocalTestFixtures & {
      user: User | null;
      saveLinkButton: Locator;
    }
>({
  roleName: ["Anonymous", { option: true }], // Anonymous is the default without test.use()
  page: async (
    { myAccountContext, testAccountContext, anonymousContext, roleName },
    use,
  ) => {
    let context;
    if (roleName === "My Account") context = myAccountContext;
    else if (roleName === "Test User") context = testAccountContext;
    else context = anonymousContext;

    const page = await context.newPage();
    await Promise.all([
      await page.goto(`http://localhost:3000/insights/`),
      await expect(
        page.getByRole("heading", { name: "My Insights" }),
      ).toBeVisible(),
    ]);
    await use(page);
    await page.close();
  },
  saveLinkButton: async ({ page }, use) => {
    const saveLinkButton = page.getByRole("button", {
      name: "Save Link",
    });
    await expect(saveLinkButton).toBeVisible();
    await use(saveLinkButton);
  },
});

userRoles
  .filter((r) => r.name !== "Anonymous")
  .forEach((role) => {
    test.describe(`Insights page as ${role.name}`, () => {
      test.use({ roleName: role.name });
      test.describe("Unselected actions", () => {
        test.describe("Save Link in Insight(s) button", () => {
          let dialog: Locator;
          let submitButton: Locator;

          // FIXME: tests are failing because the page is not loaded

          test.beforeEach(async ({ page, saveLinkButton }) => {
            await saveLinkButton.click();

            dialog = page.locator("#saveLinkDialog");
            await expect(dialog).toBeVisible();

            const input = dialog.getByPlaceholder("Link URL...");
            const NEW_URL = "https://datagotchi.net";
            await input.fill(NEW_URL);
            await expect(input).toHaveValue(NEW_URL);

            submitButton = dialog.getByRole("button", {
              name: "Submit Dialog",
            });
            await expect(submitButton).toBeDisabled();
          });

          test.afterEach(async ({ pool }) => {
            const client = await pool.connect();
            try {
              await client.query("delete from summaries where url = $1::text", [
                "https://datagotchi.net",
              ]);
              await client.query(
                "delete from insights where title like $1::text",
                ["Test insight%"],
              );
            } finally {
              client.release();
            }
          });

          test("works when selecting potential insights", async ({
            page,
            pool,
          }) => {
            const client = await pool.connect();
            try {
              const insight = (await client
                .query({
                  text: `insert into insights (title, user_id, uid) 
              values ('Test insight 1', $1::integer, $2::text) 
              returning *`,
                  values: [1, "asdf1"],
                })
                .then((result) => result.rows[0])) as Insight;
              const potentialInsightsTable = dialog.getByRole("table");
              const potentialInsightsTableTr = potentialInsightsTable
                .locator("tbody > tr")
                .first();
              const potentialInsightTitle = await potentialInsightsTableTr
                .locator("td")
                .nth(2)
                .innerText();
              const potentialInsightsTableCitationsCell =
                potentialInsightsTableTr.locator("td").nth(3);
              const originalCitationCount = parseInt(
                await potentialInsightsTableCitationsCell.innerText(),
              );

              await potentialInsightsTableTr.locator("td > input").click();

              // const apiResponse1 = page.waitForResponse((response) =>
              //   response.url().includes(`/api/links`),
              // );
              // const apiResponse2 = page.waitForResponse((response) =>
              //   response.url().includes(`/api/evidence`),
              // );
              await submitButton.click();
              await expect(dialog).toBeHidden();

              // await apiResponse1;
              // await apiResponse2;

              // await page.reload(); // FIXME: the value should update automatically & only works in debug

              const tr = page
                .locator("tr")
                .filter({ hasText: potentialInsightTitle })
                .first();
              await expect(tr.locator("td").nth(5)).toHaveText(
                String(originalCitationCount + 1),
              );

              await client.query(
                "delete from insights where id = $1::integer",
                [insight.id],
              );
            } finally {
              client.release();
            }
          });

          test("works when creating a new insight by name", async ({
            page,
          }) => {
            const input = page.getByPlaceholder("New insight name");
            const NEW_INSIGHT_NAME = "Test insight 2";
            await input.fill(NEW_INSIGHT_NAME);

            await expect(submitButton).toBeEnabled();

            await submitButton.click();

            await expect(dialog).toBeHidden();

            const tr = page
              .locator("tr")
              .filter({ hasText: NEW_INSIGHT_NAME })
              .first();
            await expect(tr).toBeVisible();
            expect(
              parseInt(await tr.locator("td").nth(3).innerText()),
            ).not.toBe(NaN);
          });
        });

        test("Create Insight button", async ({ page, pool }) => {
          const NEW_INSIGHT_NAME = "Test insight 3";

          page.on("dialog", (dialog) => dialog.accept(NEW_INSIGHT_NAME));
          await page.getByRole("button", { name: "Create Insight" }).click();

          const mainTable = page.getByRole("table").first();

          await expect(
            mainTable
              .locator("tbody > tr")
              .filter({ hasText: NEW_INSIGHT_NAME }),
          ).toBeVisible();

          await page.reload();

          await expect(
            mainTable.locator("tr").filter({ hasText: NEW_INSIGHT_NAME }),
          ).toBeVisible();

          const client = await pool.connect();
          try {
            await client.query("delete from insights where title = $1::text", [
              NEW_INSIGHT_NAME,
            ]);
          } finally {
            client.release();
          }
        });
      });

      test.describe("In the insights table", () => {
        let insightsTable: Locator;
        let firstRow: Locator;
        let insight: Insight;

        test.beforeEach(async ({ page, pool }) => {
          insightsTable = page.getByRole("table").first();
          firstRow = insightsTable.locator("tbody > tr").first();
          const uid = await getInsightUid(firstRow);
          const client = await pool.connect();
          try {
            insight = await client
              .query({
                text: "select * from insights where uid = $1::text",
                values: [uid],
              })
              .then((result) => result.rows[0]);
          } finally {
            client.release();
          }
        });

        test("load an insight by clicking on it", async ({ page }) => {
          await firstRow.locator("td").nth(2).locator("a").click();

          await expect(page).toHaveURL(
            `http://localhost:3000/insights/${insight.uid}`,
          );

          await expect(
            page.getByRole("heading", { name: insight.title }),
          ).toBeVisible();
        });

        test.describe("Selected actions", () => {
          let bodyTable: Locator;
          let testRow: Locator;

          test.beforeEach(async ({ page, pool }) => {
            const client = await pool.connect();
            try {
              await client.query({
                text: `insert into insights (title, user_id, uid) 
            values ('Test insight 4', $1::integer, $2::text) 
            returning *`,
                values: [1, "asdf4"],
              });
            } finally {
              client.release();
            }
            await page.reload();

            bodyTable = page.getByRole("table").first();
            testRow = bodyTable
              .locator("tbody > tr")
              .filter({ hasText: "Test insight 4" });
            await testRow.locator("td > input").click();
          });

          test.afterEach(async ({ pool }) => {
            const client = await pool.connect();
            try {
              await client.query({
                text: "delete from insights where title = $1::text",
                values: ["Test insight 4"],
              });
            } finally {
              client.release();
            }
          });

          test("Publish button", async ({ page }) => {
            const publishButton = page.getByRole("button", { name: "Publish" });
            page.on("dialog", (dialog) => dialog.accept());
            await publishButton.click();

            await expect(testRow.locator("td").nth(4)).toHaveText("✅");
            await page.reload();
            await expect(testRow.locator("td").nth(4)).toHaveText("✅");
          });

          test("Delete button", async ({ page }) => {
            const deleteButton = page.getByRole("button", {
              name: "Delete Insights",
            });
            await expect(deleteButton).toBeVisible();
            page.on("dialog", (dialog) => dialog.accept());
            await deleteButton.click();

            await expect(testRow).toHaveCount(0);
            await page.reload();
            await expect(testRow).toHaveCount(0);
          });
        });
      });
    });
  });
