import { expect, Locator } from "@playwright/test";

import {
  test as baseTest,
  AccountPageFixtures,
  userRoles,
  LocalTestFixtures,
} from "./fixtures";
import { getInsightUid } from "./functions";
import { Insight, User } from "../app/types";

const test = baseTest.extend<
  AccountPageFixtures & LocalTestFixtures & { user: User }
>({
  userPage: [
    async ({}, use) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await use(null as any);
    },
    { scope: "test" },
  ],
  user: [
    async ({}, use) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await use(null as any);
    },
    { scope: "test" },
  ],
});

userRoles
  .filter((r) => r.name !== "Anonymous")
  .forEach((role) => {
    test.describe(`Insights page as ${role.name}`, () => {
      test.use({
        userPage: async (
          { myAccountPage, testAccountPage, anonymousPage },
          use,
        ) => {
          let page;
          if (role.name === "My Account") {
            page = myAccountPage;
          } else if (role.name === "Test User") {
            page = testAccountPage;
          } else {
            page = anonymousPage;
          }
          // eslint-disable-next-line react-hooks/rules-of-hooks
          await use(page);
        },
        user: async ({ myUser, testUser }, use) => {
          let user;
          if (role.name === "My Account") {
            user = myUser;
          } else if (role.name === "Test User") {
            user = testUser;
          }

          if (user) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            await use(user);
          }
        },
      });
      test.describe("Unselected actions", () => {
        test.describe("Save Link in Insight(s) button", () => {
          let dialog: Locator;
          let submitButton: Locator;

          test.beforeEach(async ({ page }) => {
            const saveLinkButton = page.getByRole("button", {
              name: "Save Link in Insight(s)",
            });
            await expect(saveLinkButton).toBeVisible();
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

          test("when selecting potential insights", async ({
            page,
            pool,
            user,
          }) => {
            const client = await pool.connect();
            try {
              const insight = (await client
                .query({
                  text: `insert into insights (title, user_id, uid) 
              values ('Test insight 1', $1::integer, $2::text) 
              returning *`,
                  values: [user.id, "asdf1"],
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

              await submitButton.click();

              await expect(dialog).toBeHidden();

              const tr = page
                .locator("tr")
                .filter({ hasText: potentialInsightTitle })
                .first();
              await expect(tr.locator("td").nth(3)).toHaveText(
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

          test("when creating a new insight by name", async ({ page }) => {
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

        test("Create Insight button", async ({ userPage, pool }) => {
          const NEW_INSIGHT_NAME = "Test insight 3";

          userPage.on("dialog", (dialog) => dialog.accept(NEW_INSIGHT_NAME));
          await userPage
            .getByRole("button", { name: "Create Insight" })
            .click();

          const mainTable = userPage.getByRole("table").first();

          await expect(
            mainTable
              .locator("tbody > tr")
              .filter({ hasText: NEW_INSIGHT_NAME }),
          ).toBeVisible();

          await userPage.reload();

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

        test.beforeEach(async ({ userPage, pool }) => {
          insightsTable = userPage.getByRole("table").first();
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

        test("load an insight by clicking on it", async ({ userPage }) => {
          await firstRow.locator("td").nth(2).locator("a").click();

          await expect(userPage).toHaveURL(
            `http://localhost:3000/insights/${insight.uid}`,
          );

          await expect(
            userPage.getByRole("heading", { name: insight.title }),
          ).toBeVisible();
        });

        test.describe("Selected actions", () => {
          let bodyTable: Locator;
          let testRow: Locator;

          test.beforeEach(async ({ userPage, pool, user }) => {
            const client = await pool.connect();
            try {
              await client.query({
                text: `insert into insights (title, user_id, uid) 
            values ('Test insight 4', $1::integer, $2::text) 
            returning *`,
                values: [user.id, "asdf4"],
              });
            } finally {
              client.release();
            }
            await userPage.reload();

            bodyTable = userPage.getByRole("table").first();
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
