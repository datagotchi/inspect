import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import pg from "pg";
const Client = pg.Client;
import { email, password } from "./constants";
import { encodeStringURI } from "../app/hooks/functions";

let client: pg.Client;
let token: string;
// let userId: number;

test.describe("Workflow Canvas & JAW Import/Export E2E Suite", () => {
  test.beforeAll(async ({ request }) => {
    dotenv.config({ path: "./.env", quiet: true });
    client = new Client({
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      database: "inspect",
    });
    await client.connect();

    // const userRes = await client.query(
    //   "SELECT id FROM users WHERE email = $1::text",
    //   [email],
    // );
    // userId = userRes.rows[0]?.id;

    const response = await request.post("http://localhost:3000/api/login", {
      data: { email, password },
    });
    const json = await response.json();
    token = json.token;
  });

  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "token",
        value: encodeStringURI(token),
        url: "http://localhost:3000",
      },
    ]);
  });

  test.afterAll(async () => {
    await client.end();
  });

  test("User can load workflow canvas and view controls", async ({ page }) => {
    await page.goto("http://localhost:3000/workflows/1"); // adjust ID or slug
    await expect(
      page.getByRole("heading", { name: "Workflow Canvas" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Export JAW/i }),
    ).toBeVisible();
    await expect(page.getByText(/Import JAW/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create New Node/i }),
    ).toBeVisible();
  });

  test("User can drag node and state persists across reload via localStorage", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/workflows/1");

    // Target node element on SVG canvas
    const node = page.locator(".d3-node, g.node, svg g").first();
    await expect(node).toBeVisible();

    const initialBox = await node.boundingBox();
    expect(initialBox).not.toBeNull();

    // Drag node to new coordinates
    await page.mouse.move(initialBox!.x + 10, initialBox!.y + 10);
    await page.mouse.down();
    await page.mouse.move(initialBox!.x - 120, initialBox!.y + 40, {
      steps: 5,
    });
    await page.mouse.up();

    // Reload page to test localStorage draft retention
    await page.reload();

    const newBox = await node.boundingBox();
    expect(newBox).not.toBeNull();
    expect(newBox!.x).not.toEqual(initialBox!.x);
  });

  test("User can export workflow to .jaw.json file", async ({ page }) => {
    await page.goto("http://localhost:3000/workflows/1");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export JAW/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.jaw\.json$/);
  });

  test("User can import .jaw.json file to update canvas state", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/workflows/1");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText(/Import JAW/i).click();
    const fileChooser = await fileChooserPromise;

    // Simulate uploading a .jaw.json file
    await fileChooser.setFiles({
      name: "test_14.jaw.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          version: "1.0",
          workflowId: 1,
          nodes: [{ id: 999, label: "E2E Test Imported Node", x: 150, y: 150 }],
          links: [],
        }),
      ),
    });

    await expect(page.getByText("E2E Test Imported Node")).toBeVisible();
  });
});
