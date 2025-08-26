import { join } from "path";
import dotenv from "dotenv";

async function globalSetup() {
  // Use process.cwd() to get the path to the project root
  const envPath = join(process.cwd(), ".env");

  // Configure dotenv with the absolute path
  dotenv.config({ path: envPath, quiet: true });
}

export default globalSetup;
