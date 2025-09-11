/* eslint-disable react-hooks/rules-of-hooks */
import { expect, Locator, Page } from "@playwright/test";
import pg from "pg";

import { test as baseTest, userRoles, LocalTestFixtures } from "./fixtures";
import { Insight, Link } from "../app/types";
import {
  addReactionFromFeedbackInputElement,
  // getInsightUid,
  getLinkUid,
  // insightPageHasCitation,
  selectCitationToRemove,
  // selectFirstEnabledPotentialInsight,
  selectTableRow,
  verifyNewInsightExists,
} from "./functions";

type InsightPageFixtures = {
  insight: Insight;
  insertEvidence: void;
  populatedPage: Page;
  citationsTable: Locator;
  citationsTableFirstRow: Locator;
  citationLink: Link;
};

const NEW_INSIGHT_NAME = "Test Insight";

const test = baseTest.extend<LocalTestFixtures & InsightPageFixtures>({
  insight: async ({ pool }, use) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    const uid = `${timestamp}-${random}`;

    const client = await pool.connect();
    try {
      const insight = await client
        .query({
          text: `insert into insights
            (user_id, uid, title, created_at, updated_at)
            values ($1::integer, $2::text, $3::text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            returning *`,
          values: [2, uid, NEW_INSIGHT_NAME],
        })
        .then((result: pg.QueryResult<Insight>) => result.rows[0]);

      await use(insight);

      await client.query("DELETE FROM insights WHERE id = $1", [insight.id]);
    } finally {
      client.release();
    }
  },
  roleName: ["Anonymous", { option: true }], // Anonymous is the default without test.use()
  insertEvidence: async ({ pool, insight }, use) => {
    const client = await pool.connect();
    try {
      await client.query({
        text: `insert into evidence
          (summary_id, insight_id) 
          values ((
            select s.id from summaries s where not exists (
              select id from evidence where insight_id = $1::integer and summary_id = s.id
            ) limit 1
          ), $1::integer)`,
        values: [insight!.id],
      });
      await use();
    } finally {
      client.release();
    }
  },
  page: async (
    {
      myAccountContext,
      testAccountContext,
      anonymousContext,
      roleName,
      insight,
    },
    use,
  ) => {
    let context;
    if (roleName === "My Account") context = myAccountContext;
    else if (roleName === "Test User") context = testAccountContext;
    else context = anonymousContext;

    const page = await context.newPage();
    await Promise.all([
      page.goto(`http://localhost:3000/insights/${insight.uid}`),
      expect(page.getByRole("heading", { name: insight.title })).toBeVisible(),
    ]);
    await use(page);
    await page.close();
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  populatedPage: async ({ page, insertEvidence }, use) => {
    // await page.waitForResponse(/\/api\/insights\/[a-z0-9-]+/);
    // eslint-disable-next-line playwright/no-wait-for-selector
    await page.waitForSelector("table > tbody > tr");
    await expect(page.locator("table > tbody > tr")).toHaveCount(1, {
      timeout: 10000,
    });

    await use(page);
  },
  citationsTable: async ({ populatedPage }, use) => {
    const table = populatedPage.getByRole("table").nth(0);
    await table.waitFor({ state: "visible" });
    await use(table);
  },
  citationsTableFirstRow: async ({ citationsTable }, use) => {
    const firstRow = citationsTable.locator("tbody > tr").first();
    await firstRow.waitFor({ state: "visible" });
    await use(firstRow);
  },
  citationLink: async ({ pool, citationsTableFirstRow }, use) => {
    const linkUid = await getLinkUid(citationsTableFirstRow);
    const client = await pool.connect();
    let link: Link;
    try {
      link = await client
        .query({
          text: "select * from summaries where uid = $1::text",
          values: [linkUid],
        })
        .then((result: pg.QueryResult<Link>) => result.rows[0]);
    } finally {
      client.release();
    }

    await use(link);
  },
});

for (const role of userRoles) {
  test.describe(`Insight page as ${role.name}`, () => {
    test.use({ roleName: role.name });
    const newInsightName = "Test Child Insight";
    test.describe("At the top of the insight", () => {
      test("user should see all of the content", async ({ page, insight }) => {
        // parent insights alert
        const alert = page.locator(".alert").first();
        await expect(alert).toBeVisible();
        const possibleTextValuesRegex = /This insight is important because:/;
        await expect(alert).toContainText(possibleTextValuesRegex);
        const addParentButton = page.getByRole("button", {
          name: "Add a Parent Insight",
        });
        await expect(addParentButton).toBeVisible();

        // emoji && Created|Updated && "Insight 💭"
        const sourceDiv = page.locator("#source");
        const emojiDiv = sourceDiv.locator("div").nth(0);
        await expect(emojiDiv).toBeVisible();
        await expect(emojiDiv).toHaveText("😲 (no reactions)");
        const createdDiv = sourceDiv.locator("div").nth(1);
        await expect(createdDiv).toBeVisible();
        await expect(createdDiv).toHaveText(
          /^Created|Updated [0-9] weeks|months|years ago/,
        );
        const logoDiv = sourceDiv.locator("div").nth(2);
        await expect(logoDiv).toBeVisible();
        await expect(logoDiv).toHaveText("💭 Insight");

        // {title}
        const titleHeader = page.getByText(insight!.title!).first();
        await expect(titleHeader).toBeVisible();

        // Children Insights (none)

        // 📄 51
        const titleFooter = page
          .getByRole("heading", { name: /📄 [0-9]+/ })
          .first();
        await expect(titleFooter).toBeVisible();

        // 😲 React
        const reactLink = page.getByText("😲 React").first();
        await expect(reactLink).toBeVisible();
        const reactLinkTagName = await reactLink.evaluate((el) => el.tagName);
        expect(reactLinkTagName.toLowerCase()).toBe("a");

        // 💬 Comment
        const commentLink = page.getByText("💬 Comment").first();
        await expect(commentLink).toBeVisible();
        const commentLinkTagName = await commentLink.evaluate(
          (el) => el.tagName,
        );
        expect(commentLinkTagName.toLowerCase()).toBe("a");

        // Comments (none)

        //  Evidence
        const evidenceHeader = page.getByText(/📄 Evidence \([0-9]+/);
        await expect(evidenceHeader).toBeVisible();
        const addEvidenceButton = page.getByRole("button", {
          name: "Add Evidence",
        });
        await expect(addEvidenceButton).toBeVisible();
        await expect(addEvidenceButton).toBeEnabled();
      });

      test("user can add a reaction", async ({ page }) => {
        const reactLink = page.getByText(/😲 React/).first();
        await expect(reactLink).toBeVisible();
        await reactLink.click();

        await addReactionFromFeedbackInputElement(page);

        const reactionsDiv = page.locator("div#source").locator("div").first();
        await expect(reactionsDiv).toHaveText(/😀$/);
      });

      test("user can add/remove a comment", async ({ page }) => {
        const commentLink = page.getByText(/💬 Comment/).first();
        await expect(commentLink).toBeVisible();
        await commentLink.click();

        // TODO: get the addRemoveComment function working
        // addRemoveComment(page);

        const COMMENT_TEXT = "Test comment for add/remove comment";
        const directionsP = page.getByText("Enter a text comment");
        expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
        await expect(directionsP).toBeVisible();
        const commentInput = page.getByRole("textbox", {
          name: "Comment Text Div",
        });
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();
        await expect(commentInput).toBeEditable();
        await commentInput.fill(COMMENT_TEXT);
        await expect(commentInput).toHaveText(COMMENT_TEXT);

        const submitButton = page.getByRole("button", {
          name: "Submit Comment",
        });
        await expect(submitButton).toBeVisible();
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        const comments = page
          .locator(".comments")
          .locator(".comment")
          .filter({ hasText: COMMENT_TEXT, visible: true });
        await expect(comments).toHaveCount(1);

        await page.reload();

        const comments2 = page
          .locator(".comments")
          .locator(".comment")
          .filter({ hasText: COMMENT_TEXT, visible: true });
        await expect(comments2).toHaveCount(1);

        const deleteButtonLocator = comments2
          .first()
          .locator("button[aria-label='Delete Comment']");
        await expect(deleteButtonLocator).toHaveCount(1);
        const deleteButton = deleteButtonLocator.first();
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await expect(
          page
            .locator(".comments")
            .locator(".comment")
            .filter({ hasText: COMMENT_TEXT, visible: true }),
        ).toHaveCount(0);
      });

      test("user can publish the insight", async ({ page, insight }) => {
        const publishButton = page.getByRole("button", {
          name: "Publish Insight",
        });
        await expect(publishButton).toBeVisible();
        await expect(publishButton).toBeEnabled();
        page.on("dialog", (dialog) => dialog.accept());
        const publishResponsePromise = page.waitForResponse((response) =>
          response.url().includes(`/api/insights/${insight!.uid}`),
        );
        await publishButton.click();

        await publishResponsePromise;

        const logoDiv = page.locator("#source").locator("div").nth(2);
        await expect(logoDiv).toBeVisible();
        // await expect(logoDiv).toHaveText(/🌎$/);

        await page.reload();
        await expect(logoDiv).toHaveText(/🌎$/);
      });

      test("user can delete the insight", async ({ page }) => {
        const deleteButton = page.getByRole("button", {
          name: "Delete Insight",
        });
        await expect(deleteButton).toBeVisible();
        await expect(deleteButton).toBeEnabled();
        page.on("dialog", (dialog) => dialog.accept());
        await deleteButton.click();

        await expect(page).toHaveURL(/(\/$|\/insights$)/);
      });

      test("user can add child insights", async ({ page }) => {
        const addChildButton = page.getByRole("button", {
          name: "Add Child Insight",
        });
        await expect(addChildButton).toBeVisible();

        const dialog = page.locator("#addChildInsightsDialog");
        await expect(dialog).toBeHidden();

        await addChildButton.click();
        await expect(dialog).toBeVisible();

        const dialogSubmitButton = dialog.getByRole("button", {
          name: "Add child insights",
        });
        await expect(dialogSubmitButton).toBeVisible();
        await expect(dialogSubmitButton).toBeDisabled();

        const existingInsightsTab = dialog.getByRole("tab", {
          name: "Existing insights",
        });
        await existingInsightsTab.click();
        await expect(existingInsightsTab).toHaveClass(/active/);

        const existingInsightsTabContent = dialog.locator("#existing-insights");
        await expect(existingInsightsTabContent).toBeVisible();
        const existingInsightsTable =
          existingInsightsTabContent.getByRole("table");
        await expect(existingInsightsTable).toBeVisible();
        const firstRow = existingInsightsTable.locator("tbody > tr").first();
        await expect(firstRow).toBeVisible();
        await expect(firstRow.locator("td")).toHaveCount(4); // checkbox > date > title > citations
        const firstRowCheckbox = firstRow
          .locator("td")
          .first()
          .locator("input");
        const selectedInsightTitle = await firstRow
          .locator("td")
          .nth(2)
          .innerText();
        await firstRowCheckbox.click();

        await expect(dialogSubmitButton).toBeEnabled();

        const newInsightTab = dialog.getByRole("tab", {
          name: "New insight",
        });
        await newInsightTab.click();
        await expect(newInsightTab).toHaveClass(/active/);

        const newInsightTabContent = dialog.locator("#new-insight");
        const newInsightInput =
          newInsightTabContent.getByPlaceholder("New insight name");
        await expect(newInsightInput).toBeVisible();
        await expect(newInsightInput).toBeEnabled();
        await expect(newInsightInput).toBeEditable();
        await newInsightInput.fill(newInsightName);

        await expect(dialogSubmitButton).toBeEnabled();
        // const publishResponsePromise = page.waitForResponse((response) =>
        //   response.url().includes(`/api/children`),
        // );

        await dialogSubmitButton.click();
        await expect(dialog).toBeHidden();

        // await publishResponsePromise;

        const childrenSection = page.locator("#childInsights");
        await expect(childrenSection).toBeVisible();
        const childrenTable = childrenSection.locator("table");
        await expect(childrenTable).toBeVisible();

        // FIXME: react state update is not happening when this test is run with others
        // eslint-disable-next-line playwright/no-wait-for-selector
        await page.waitForSelector("table > tbody > tr");
        await expect(childrenTable.locator("tbody > tr")).toHaveCount(2);

        const foundSelectedListItem =
          childrenTable.getByText(selectedInsightTitle);
        await expect(foundSelectedListItem).toBeVisible();

        await page.reload();
        await expect(foundSelectedListItem).toBeVisible();
      });
    });

    test.afterEach(async ({ pool }) => {
      const client = await pool.connect();
      try {
        await client.query({
          text: "delete from insights where title = $1::text",
          values: [newInsightName],
        });
      } finally {
        client.release();
      }
    });

    test("citationsTable fixture loads correctly", async ({
      page,
      citationsTable,
    }) => {
      // Assert the initial page load is successful. This confirms the page fixture ran.
      await expect(
        page.getByRole("heading", { name: NEW_INSIGHT_NAME }),
      ).toBeVisible();

      // Assert that the citationsTable fixture was successfully set up.
      await expect(citationsTable).toBeVisible();
    });

    test("citationsTableFirstRow fixture loads correctly", async ({
      page,
      citationsTableFirstRow,
    }) => {
      await expect(
        page.getByRole("heading", { name: NEW_INSIGHT_NAME }),
      ).toBeVisible();

      // Get the count of cells in the first row.
      const cellCount = await citationsTableFirstRow.locator("td").count();

      // Assert that the count is greater than or equal to 1.
      expect(cellCount).toBeGreaterThanOrEqual(1);

      // Assert that the citationsTableFirstRow fixture was successfully set up.
      await expect(citationsTableFirstRow).toBeVisible();
    });

    test.describe("In the citations table", () => {
      test("load a link by clicking on it", async ({
        page,
        citationsTableFirstRow,
        citationLink,
      }) => {
        await expect(citationsTableFirstRow.locator("td")).toHaveCount(4); // checkbox > date > title > citations
        await citationsTableFirstRow.locator("td").nth(2).click();

        await page.waitForURL(
          `https://inspect.datagotchi.net/links/${citationLink.uid}`,
        );
        await expect(page).toHaveURL(
          `https://inspect.datagotchi.net/links/${citationLink.uid}`,
        );

        await expect(
          page.getByRole("heading", { name: citationLink.title }),
        ).toBeVisible();
      });

      test.describe("Unselected actions", () => {
        test(`user can add evidence`, async ({ page }) => {
          const addEvidenceButton = page.getByRole("button", {
            name: "Add Evidence",
          });
          await expect(addEvidenceButton).toBeVisible();

          const dialog = page.locator("#addLinksAsEvidenceDialog");
          await expect(dialog).toBeHidden();

          await expect(addEvidenceButton).toBeEnabled();
          await addEvidenceButton.click();
          await expect(dialog).toBeVisible();

          const dialogSubmitButton = dialog.getByRole("button", {
            name: "Add evidence links",
          });
          await expect(dialogSubmitButton).toBeVisible();
          await expect(dialogSubmitButton).toHaveText("Add");
          await expect(dialogSubmitButton).toBeDisabled();

          const existingLinksTab = dialog.getByRole("tab", {
            name: "Existing links",
          });
          await existingLinksTab.click();
          await expect(existingLinksTab).toHaveClass(/active/);
          const existingLinksTabContent = dialog.locator("#existing-links");
          await expect(existingLinksTabContent).toBeVisible();
          const existingLinksTable = existingLinksTabContent.getByRole("table");
          await expect(existingLinksTable).toBeVisible();
          const firstRow = existingLinksTable.locator("tbody > tr").first();
          await expect(firstRow).toBeVisible();
          await expect(firstRow.locator("td")).toHaveCount(3); // checkbox > date > title
          const firstRowCheckbox = firstRow
            .locator("td")
            .first()
            .locator("input");
          const selectedInsightTitle = await firstRow
            .locator("td")
            .nth(2)
            .innerText();
          await firstRowCheckbox.click();

          const saveLinkTab = dialog.getByRole("tab", {
            name: "Save link",
          });
          await saveLinkTab.click();
          await expect(saveLinkTab).toHaveClass(/active/);
          const saveLinkTabContent = dialog.locator("#save-link");
          await expect(saveLinkTabContent).toBeVisible();
          const newLinkInput =
            saveLinkTabContent.getByPlaceholder("New link URL");
          await expect(newLinkInput).toBeVisible();
          await expect(newLinkInput).toBeEnabled();
          await expect(newLinkInput).toBeEditable();
          const newLinkUrl = "https://www.google.com";
          await newLinkInput.fill(newLinkUrl);

          await expect(dialogSubmitButton).toBeEnabled();
          await dialogSubmitButton.click();
          await expect(dialog).toBeHidden();

          const evidenceTable = page.locator("table").first();
          await expect(evidenceTable).toBeVisible();
          const foundNewRow = evidenceTable
            .locator("tbody > tr a")
            .filter({ hasText: /^Google$/ });
          await expect(foundNewRow).toBeVisible();

          await expect(evidenceTable).toBeVisible();
          const foundRow = evidenceTable
            .locator("tbody > tr")
            .filter({ hasText: selectedInsightTitle });
          await expect(foundRow).toBeVisible();

          await page.reload();
          await expect(foundRow).toBeVisible();
        });
      });

      test.describe("Selected actions", () => {
        let selectedCitationTitle: string;

        test.beforeEach(async ({ citationsTableFirstRow }) => {
          selectedCitationTitle = await selectTableRow(citationsTableFirstRow);
        });

        test.describe("Add to Other Insight(s) button", () => {
          let dialog: Locator;

          test.beforeEach(async ({ page }) => {
            const addToOtherInsightsButton = page.getByRole("button", {
              name: "Add to Other Insight(s)",
            });
            await expect(addToOtherInsightsButton).toBeVisible();
            dialog = page.locator("#addCitationsToOtherInsightsDialog");
            await expect(dialog).toBeHidden();

            await addToOtherInsightsButton.click();

            await expect(dialog).toBeVisible();

            const submitDialogButton = dialog.getByRole("button", {
              name: "Submit Dialog",
            });
            await expect(submitDialogButton).toBeVisible();
            await expect(submitDialogButton).toBeDisabled();
          });

          test.describe("Selecting from potential insights", () => {
            test.beforeEach(async () => {
              await expect(dialog.getByRole("table")).toHaveCount(2);
            });
          });

          test.describe("Creating a new insight by name", () => {
            const NEW_INSIGHT_NAME = "New Insight";

            test.beforeEach(async () => {
              await dialog
                .getByPlaceholder("New insight name")
                .fill(NEW_INSIGHT_NAME);

              await expect(
                dialog.getByRole("button", {
                  name: "Submit Dialog",
                }),
              ).toBeEnabled();
            });

            test.afterEach(async ({ pool }) => {
              const client = await pool.connect();
              try {
                await client.query({
                  text: "delete from insights where title = $1::text",
                  values: [NEW_INSIGHT_NAME],
                });
              } finally {
                client.release();
              }
            });

            test("when selecting the citation to be removed", async ({
              page,
              citationsTable,
            }) => {
              await selectCitationToRemove(dialog, selectedCitationTitle);

              await dialog
                .getByRole("button", {
                  name: "Submit Dialog",
                })
                .click();

              await expect(
                citationsTable
                  .locator("tbody > tr")
                  .filter({ hasText: selectedCitationTitle }),
              ).toHaveCount(0);

              await verifyNewInsightExists(page, NEW_INSIGHT_NAME);
            });

            test("when NOT selecting the citation to be removed", async ({
              page,
              citationsTable,
            }) => {
              await dialog
                .getByRole("button", {
                  name: "Submit Dialog",
                })
                .click();

              await expect(
                citationsTable
                  .locator("tr")
                  .filter({ hasText: selectedCitationTitle }),
              ).toHaveCount(1);

              await verifyNewInsightExists(page, NEW_INSIGHT_NAME);
            });
          });
        });

        test("user can remove citations from the insight", async ({
          page,
          citationsTable,
        }) => {
          page.on("dialog", (dialog) => dialog.accept());

          await page.locator("button").filter({ hasText: "Remove" }).click();

          await expect(
            citationsTable
              .locator("tr")
              .filter({ hasText: selectedCitationTitle }),
          ).toHaveCount(0);

          await page.reload();

          await expect(
            citationsTable
              .locator("tr")
              .filter({ hasText: selectedCitationTitle }),
          ).toHaveCount(0);
        });
      });

      test.describe("Table rows below fact for feedback", () => {
        let firstFeedbackRow: Locator;
        let link: Link;

        test.beforeEach(async ({ pool, citationsTableFirstRow }) => {
          firstFeedbackRow = citationsTableFirstRow.locator(
            "//following-sibling::tr",
          );
          const client = await pool.connect();
          try {
            link = await client
              .query({
                text: "select * from summaries where uid = $1::text",
                values: [await getLinkUid(citationsTableFirstRow)],
              })
              .then((result) => result.rows[0]);
          } finally {
            client.release();
          }
        });

        test("add reaction", async ({ page, pool, citationsTableFirstRow }) => {
          const reactLink = firstFeedbackRow.getByText(/😲 React/).first();
          await expect(reactLink).toBeVisible();
          await reactLink.click();

          await addReactionFromFeedbackInputElement(page);

          const citationTitle = citationsTableFirstRow.locator("td").nth(2);
          await expect(citationTitle).toHaveText(/😀$/);

          const client = await pool.connect();
          try {
            await client.query({
              text: "delete from reactions where summary_id = $1::integer",
              values: [link.id],
            });
          } finally {
            client.release();
          }
        });

        test("add/remove comment", async ({ page }) => {
          const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
          await expect(commentLink).toBeVisible();
          await commentLink.click();

          // TODO: get the addRemoveComment function working
          // addRemoveComment(page);

          const COMMENT_TEXT = "Test comment";
          const directionsP = page.getByText("Enter a text comment");
          expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
          await expect(directionsP).toBeVisible();
          await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
          const commentInput = page.getByRole("textbox").last();
          expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
          await expect(commentInput).toBeVisible();
          await expect(commentInput).toBeEnabled();
          await expect(commentInput).toBeEditable();
          await commentInput.fill(COMMENT_TEXT);

          const submitButton = page.getByRole("button", {
            name: "Submit Comment",
          });
          await expect(submitButton).toBeVisible();
          await expect(submitButton).toBeEnabled();
          await submitButton.click();

          const secondFeedbackRow = firstFeedbackRow.locator(
            "//following-sibling::tr",
          );

          const comments = secondFeedbackRow
            .locator(".comment")
            .filter({ hasText: COMMENT_TEXT });
          await expect(comments).toHaveCount(1);
          await page.reload();
          expect(await comments.count()).toBe(1);

          const deleteButtonLocator = comments.locator(
            "button[aria-label='Delete Comment']",
          );
          await expect(deleteButtonLocator).toHaveCount(1);
          const deleteButton = deleteButtonLocator.first();
          await expect(deleteButton).toBeVisible();
          await expect(deleteButton).toBeEnabled();
          page.on("dialog", (dialog) => dialog.accept());
          await deleteButton.click();

          await expect(comments).toHaveCount(0);
          await page.reload();
          await expect(comments).toHaveCount(0);
        });

        test("add/remove comment by inserting external link from the toolbar", async ({
          page,
        }) => {
          const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
          await expect(commentLink).toBeVisible();
          await commentLink.click();

          const COMMENT_TEXT = "Comment with external links and insights";
          const directionsP = page.getByText("Enter a text comment");
          expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
          await expect(directionsP).toBeVisible();
          await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
          const commentInput = page.getByRole("textbox").last();
          expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
          await expect(commentInput).toBeVisible();
          await expect(commentInput).toBeEnabled();
          await expect(commentInput).toBeEditable();
          await commentInput.fill(COMMENT_TEXT);

          // Use toolbar & dialog to insert an external link, then an existing insight, then an existing link
          const linkButton = page.getByRole("button", {
            name: "Insert Link",
          });
          await expect(linkButton).toBeVisible();
          await linkButton.click();
          const dialog = page.locator("#insertLinkDialog");
          await expect(dialog).toBeVisible();
          const linkInput = dialog.getByPlaceholder("Paste URL");
          await expect(linkInput).toBeVisible();
          await linkInput.fill("http://google.com");
          const linkSubmitButton = dialog.getByRole("button", {
            name: "Submit Dialog",
          });
          await expect(linkSubmitButton).toBeVisible();
          await linkSubmitButton.click();
          await expect(dialog).toBeHidden();

          const pageSubmitButton = page.getByRole("button", {
            name: "Submit Comment",
          });
          await expect(pageSubmitButton).toBeVisible();
          await expect(pageSubmitButton).toBeEnabled();
          await pageSubmitButton.click();

          const secondFeedbackRow = firstFeedbackRow.locator(
            "//following-sibling::tr",
          );

          const comments = secondFeedbackRow
            .locator(".comment")
            .filter({ hasText: COMMENT_TEXT });
          await expect(comments).toHaveCount(1);
          await page.reload();
          expect(await comments.count()).toBe(1);

          const deleteButtonLocator = comments.locator(
            "button[aria-label='Delete Comment']",
          );
          await expect(deleteButtonLocator).toHaveCount(1);
          const deleteButton = deleteButtonLocator.first();
          await expect(deleteButton).toBeVisible();
          await expect(deleteButton).toBeEnabled();
          page.on("dialog", (dialog) => dialog.accept());
          await deleteButton.click();

          await expect(comments).toHaveCount(0);
          await page.reload();
          await expect(comments).toHaveCount(0);
        });

        test("add/remove comment by inserting existing insight from the toolbar", async ({
          page,
        }) => {
          const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
          await expect(commentLink).toBeVisible();
          await commentLink.click();

          const COMMENT_TEXT = "Comment with existing insight";
          const directionsP = page.getByText("Enter a text comment");
          expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
          await expect(directionsP).toBeVisible();
          await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
          const commentInput = page.getByRole("textbox").last();
          expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
          await expect(commentInput).toBeVisible();
          await expect(commentInput).toBeEnabled();
          await expect(commentInput).toBeEditable();
          await commentInput.fill(COMMENT_TEXT);

          // Use toolbar & dialog to insert an existing insight
          const insightButton = page.getByRole("button", {
            name: "Insert Link",
          });
          await expect(insightButton).toBeVisible();
          await insightButton.click();
          const dialog = page.locator("#insertLinkDialog");
          await expect(dialog).toBeVisible();
          const insightRadioButton = dialog.getByRole("radio", {
            name: "insight",
          });
          await expect(insightRadioButton).toBeVisible();
          await insightRadioButton.click();
          const loadingText = dialog.getByText("Loading insights...");
          await expect(loadingText).toBeVisible();

          const insightsTable = dialog.locator("#factsTable-insight");
          await expect(insightsTable).toBeVisible();
          await expect(insightsTable).toHaveCount(1);
          const firstInsight = insightsTable.locator("tbody > tr").first();
          await expect(firstInsight).toBeVisible();
          const insightTitle = await firstInsight
            .locator("td")
            .nth(2)
            .locator("a")
            .innerText();
          await firstInsight.locator("td input[type='checkbox']").click();

          const dialogSubmitButton = dialog.getByRole("button", {
            name: "Submit Dialog",
          });
          await expect(dialogSubmitButton).toBeVisible();
          await expect(dialogSubmitButton).toBeEnabled();
          await dialogSubmitButton.click();
          await expect(dialog).toBeHidden();

          const pageSubmitButton = page.getByRole("button", {
            name: "Submit Comment",
          });
          await expect(pageSubmitButton).toBeVisible();
          await expect(pageSubmitButton).toBeEnabled();
          await pageSubmitButton.click();

          const secondFeedbackRow = firstFeedbackRow.locator(
            "//following-sibling::tr",
          );

          const comments = secondFeedbackRow
            .locator(".comments")
            .locator(".comment")
            .filter({ hasText: `Insight: ${insightTitle}` });
          await expect(comments).toHaveCount(1);
          await page.reload();
          expect(await comments.count()).toBe(1);

          const deleteButtonLocator = comments.locator(
            "button[aria-label='Delete Comment']",
          );
          await expect(deleteButtonLocator).toHaveCount(1);
          const deleteButton = deleteButtonLocator.first();
          await expect(deleteButton).toBeVisible();
          await expect(deleteButton).toBeEnabled();
          page.on("dialog", (dialog) => dialog.accept());
          await deleteButton.click();

          await expect(comments).toHaveCount(0);
          await page.reload();
          await expect(comments).toHaveCount(0);
        });

        test("add/remove comment by inserting existing link from the toolbar", async ({
          page,
        }) => {
          const commentLink = firstFeedbackRow.getByText(/💬 Comment/).first();
          await expect(commentLink).toBeVisible();
          await commentLink.click();

          const COMMENT_TEXT = "Comment with existing link";
          const directionsP = page.getByText("Enter a text comment");
          expect(await directionsP.evaluate((el) => el.tagName)).toBe("P");
          await expect(directionsP).toBeVisible();
          await expect(page.getByRole("textbox")).toHaveCount(2); // the search input and the comment input
          const commentInput = page.getByRole("textbox").last();
          expect(await commentInput.evaluate((el) => el.tagName)).toBe("DIV");
          await expect(commentInput).toBeVisible();
          await expect(commentInput).toBeEnabled();
          await expect(commentInput).toBeEditable();
          await commentInput.fill(COMMENT_TEXT);

          // Use toolbar & dialog to insert an existing link
          const linkButton = page.getByRole("button", {
            name: "Insert Link",
          });
          await expect(linkButton).toBeVisible();
          await linkButton.click();
          const dialog = page.locator("#insertLinkDialog");
          await expect(dialog).toBeVisible();
          const linkRadioButton = dialog.getByRole("radio", { name: "link" });
          await expect(linkRadioButton).toBeVisible();
          await linkRadioButton.click();
          const loadingText = dialog.getByText("Loading links...");
          await expect(loadingText).toBeVisible();

          const linksTable = dialog.locator("#factsTable-link");
          await expect(linksTable).toBeVisible();
          await expect(linksTable).toHaveCount(1);
          const firstLink = linksTable.locator("tbody > tr").first();
          await expect(firstLink).toBeVisible();
          const linkTitle = await firstLink
            .locator("td")
            .nth(2)
            .locator("a")
            .innerText();
          await firstLink.locator("td input[type='checkbox']").click();

          const dialogSubmitButton = dialog.getByRole("button", {
            name: "Submit Dialog",
          });
          await expect(dialogSubmitButton).toBeVisible();
          await expect(dialogSubmitButton).toBeEnabled();
          await dialogSubmitButton.click();
          await expect(dialog).toBeHidden();

          const pageSubmitButton = page.getByRole("button", {
            name: "Submit Comment",
          });
          await expect(pageSubmitButton).toBeVisible();
          await expect(pageSubmitButton).toBeEnabled();
          await pageSubmitButton.click();

          const secondFeedbackRow = firstFeedbackRow.locator(
            "//following-sibling::tr",
          );

          const comments = secondFeedbackRow
            .locator(".comments")
            .locator(".comment")
            .filter({ hasText: `Link: ${linkTitle}` });
          await expect(comments).toHaveCount(1);
          await page.reload();
          expect(await comments.count()).toBe(1);

          const deleteButtonLocator = comments.locator(
            "button[aria-label='Delete Comment']",
          );
          await expect(deleteButtonLocator).toHaveCount(1);
          const deleteButton = deleteButtonLocator.first();
          await expect(deleteButton).toBeVisible();
          await expect(deleteButton).toBeEnabled();
          page.on("dialog", (dialog) => dialog.accept());
          await deleteButton.click();

          await expect(comments).toHaveCount(0);
          await page.reload();
          await expect(comments).toHaveCount(0);
        });
      });
    });
  });
}
