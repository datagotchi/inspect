import { expect, Page } from "@playwright/test";
import pg from "pg";

import {
  test as baseTest,
  ContextFixtures,
  userRoles,
  LocalTestFixtures,
} from "./fixtures";
import { Link } from "../app/types";

const test = baseTest.extend<
  { link: Link; userPage: Page } & ContextFixtures & LocalTestFixtures
>({
  link: [
    async ({ pool }, use) => {
      const NEW_LINK_NAME = "Test Link";
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2);
      const uid = `${timestamp}-${random}`;
      const url = `http://example.com?${random}`;

      const client = await pool.connect();
      try {
        const link = await client
          .query({
            text: `insert into summaries (uid, title, url, source_id) 
            values ($1::text, $2::text, $3::text, (select id from sources limit 1)) 
            returning *`,
            values: [uid, NEW_LINK_NAME, url],
          })
          .then((result: pg.QueryResult<Link>) => result.rows[0]);

        await use(link);

        await client.query("DELETE FROM summaries WHERE id = $1", [link.id]);
      } finally {
        client.release();
      }
    },
    { scope: "test" },
  ],
  roleName: ["Anonymous", { option: true }], // Anonymous is the default without test.use()
  userPage: async (
    { myAccountContext, testAccountContext, anonymousContext, roleName },
    use,
  ) => {
    let context;
    if (roleName === "My Account") context = myAccountContext;
    else if (roleName === "Test User") context = testAccountContext;
    else context = anonymousContext;

    const page = await context.newPage();
    await page.goto(`http://localhost:3000/insights/`);
    await expect(
      page.getByRole("heading", { name: "My Insights" }),
    ).toBeVisible();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await page.close();
  },
});

userRoles.forEach((role) => {
  test.describe(`Link page as ${role.name}`, () => {
    test.use({ roleName: role.name });
    test("should navigate to a valid url", async ({ userPage, link }) => {
      const heading = userPage.getByRole("heading", { name: link.title });
      await expect(heading).toBeVisible();

      const newTabPromise = userPage.waitForEvent("popup");
      await heading.click();
      const newTab = await newTabPromise;
      await expect(newTab).toHaveURL(link.url!);
    });

    test("should display 404 for an invalid link page", async ({
      userPage,
    }) => {
      await userPage.goto("http://localhost:3000/links/invalid");

      await expect(userPage.getByText("No link with this UID")).toBeVisible();
    });

    test.describe("Comments/reactions", () => {
      test("should allow adding a comment to the link", async ({
        userPage,
      }) => {
        // await page.getByRole("link", { name: "💬 Comment" }).click();
        await userPage.getByText("💬 Comment").first().click();
        await expect(userPage.getByText("Enter a text comment")).toBeVisible();
        const commentInput = userPage.getByRole("textbox");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();

        await commentInput.fill("This is a test comment.");
        await userPage.getByRole("button", { name: "Submit Comment" }).click();

        await expect(
          userPage.getByText("This is a test comment."),
        ).toBeVisible();
      });

      test("add a comment with a link", async ({ userPage }) => {
        // await page.getByRole("link", { name: "💬 Comment" }).click();
        await userPage.getByText("💬 Comment").first().click();
        await expect(userPage.getByText("Enter a text comment")).toBeVisible();
        const commentInput = userPage.getByRole("textbox");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();

        await commentInput.fill("This is a comment with an ");
        const linkImage = userPage.getByAltText("Insert Link");
        await expect(linkImage).toBeVisible();
        await linkImage.click();

        const dialog = userPage.locator("#insertLinkDialog");
        await expect(dialog).toBeVisible();
        const submitLinkButton = userPage.getByRole("button", {
          name: "Submit Dialog",
        });
        await expect(submitLinkButton).toBeVisible();
        await expect(submitLinkButton).toBeDisabled();
        const linkUrlTextbox = userPage.getByPlaceholder("Paste URL");
        await expect(linkUrlTextbox).toBeVisible();
        await expect(linkUrlTextbox).toBeEnabled();
        await linkUrlTextbox.fill("http://example.com");
        await expect(submitLinkButton).toBeEnabled();
        await submitLinkButton.scrollIntoViewIfNeeded();
        await submitLinkButton.click();
        await expect(dialog).toBeHidden();

        // can't test its actual html, so get plain text behind the rich text
        await expect(commentInput).toHaveText(
          "This is a comment with an Example Domain",
        );

        const submitCommentButton = userPage.getByRole("button", {
          name: "Submit Comment",
        });
        await expect(submitCommentButton).toBeVisible();
        await expect(submitCommentButton).toBeEnabled();
        await submitCommentButton.click();

        await expect(
          userPage.getByText("This is a comment with an Example Domain"),
        ).toBeVisible();
      });

      test("add a comment by inserting an external link", async ({
        userPage,
      }) => {
        // await page.getByRole("link", { name: "💬 Comment" }).click();
        await userPage.getByText("💬 Comment").first().click();
        await expect(userPage.getByText("Enter a text comment")).toBeVisible();
        const commentInput = userPage.getByRole("textbox");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();
        await commentInput.fill("Check this out: ");
        const linkImage = userPage.getByAltText("Insert Link");
        await expect(linkImage).toBeVisible();
        await expect(linkImage).toBeEnabled();
        const dialog = userPage.locator("#insertLinkDialog");
        await expect(dialog).toBeHidden();
        const dialogSubmitButton = dialog.getByRole("button", {
          name: "Submit Dialog",
        });
        await expect(dialogSubmitButton).toBeHidden();

        await linkImage.click();
        await expect(dialog).toBeVisible();
        const linkInput = dialog.getByPlaceholder("Paste URL");
        await linkInput.fill("https://example.com");
        await expect(dialog.getByText("Example Domain")).toBeVisible();
        await expect(dialogSubmitButton).toBeEnabled();
        await dialogSubmitButton.click();
        await expect(dialog).toBeHidden();

        // Post the comment
        await userPage.getByRole("button", { name: "Submit Comment" }).click();

        // Verify the comment contains the external link
        await expect(userPage.getByText("Check this out: ")).toBeVisible();
        // await expect(
        //   page.getByRole("link", { name: "https://example.com" }),
        // ).toBeVisible();
        await expect(
          userPage.getByText("Check this out: Example Domain"),
        ).toBeVisible();
      });

      test("add a comment by inserting a link to an existing insight", async ({
        userPage,
      }) => {
        // await page.getByRole("link", { name: "💬 Comment" }).click();
        await userPage.getByText("💬 Comment").first().click();
        await expect(userPage.getByText("Enter a text comment")).toBeVisible();
        const commentInput = userPage.getByRole("textbox");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();
        await commentInput.fill("Check this out: ");
        const linkImage = userPage.getByAltText("Insert Link");
        await expect(linkImage).toBeVisible();
        await expect(linkImage).toBeEnabled();
        const dialog = userPage.locator("#insertLinkDialog");
        await expect(dialog).toBeHidden();
        const dialogSubmitButton = dialog.getByRole("button", {
          name: "Submit Dialog",
        });
        await expect(dialogSubmitButton).toBeHidden();

        await linkImage.click();
        await expect(dialog).toBeVisible();
        const dialogTable = dialog.getByRole("table");
        await expect(dialogTable).toBeHidden();
        await userPage.getByRole("radio", { name: "Insight" }).click();
        await expect(dialogTable).toBeVisible();
        const firstTableRow = dialogTable.locator("tbody > tr").first();
        await expect(firstTableRow).toBeVisible();
        await firstTableRow.locator("td > input[type='checkbox']").click();
        await expect(dialogSubmitButton).toBeEnabled();
        await dialogSubmitButton.click();
        await expect(dialog).toBeHidden();

        const commentText = /Insight: .+/;
        await expect(commentInput).toHaveText(commentText);
        await userPage.getByRole("button", { name: "Submit Comment" }).click();

        await expect(userPage.getByText(commentText)).toBeVisible();
      });

      test("add a comment by inserting a link to an existing link", async ({
        userPage,
      }) => {
        // await page.getByRole("link", { name: "💬 Comment" }).click();
        await userPage.getByText("💬 Comment").first().click();
        await expect(userPage.getByText("Enter a text comment")).toBeVisible();
        const commentInput = userPage.getByRole("textbox");
        await expect(commentInput).toBeVisible();
        await expect(commentInput).toBeEnabled();
        await commentInput.fill("Check this out: ");
        const linkImage = userPage.getByAltText("Insert Link");
        await expect(linkImage).toBeVisible();
        await expect(linkImage).toBeEnabled();
        const dialog = userPage.locator("#insertLinkDialog");
        await expect(dialog).toBeHidden();
        const dialogSubmitButton = dialog.getByRole("button", {
          name: "Submit Dialog",
        });
        await expect(dialogSubmitButton).toBeHidden();

        await linkImage.click();
        await expect(dialog).toBeVisible();
        const dialogTable = dialog.getByRole("table");
        await expect(dialogTable).toBeHidden();
        await userPage.getByRole("radio", { name: "Link" }).click();
        await expect(dialogTable).toBeVisible();
        const firstTableRow = dialogTable.locator("tbody > tr").first();
        await expect(firstTableRow).toBeVisible();
        await firstTableRow.locator("td > input[type='checkbox']").click();
        await expect(dialogSubmitButton).toBeEnabled();
        await dialogSubmitButton.click();
        await expect(dialog).toBeHidden();

        const commentText = /Link: .+/;
        await expect(commentInput).toHaveText(commentText);
        await userPage.getByRole("button", { name: "Submit Comment" }).click();

        await expect(userPage.getByText(commentText)).toBeVisible();
      });

      test("should allow reacting to the post", async ({ userPage }) => {
        // const reactLink = page.getByRole("link", { name: "😲 React" });
        const reactLink = userPage.getByText("😲 React");
        await reactLink.click();
        await expect(
          userPage.getByText("Select an emoji character"),
        ).toBeVisible();

        // select an emoji (or keep the default smiley)
        // click submit
        await userPage.getByRole("button", { name: "Submit Reaction" }).click();
        // verify it shows in the top right of the page
        await expect(userPage.getByText("😀")).toBeVisible();
      });
    });
  });
});
