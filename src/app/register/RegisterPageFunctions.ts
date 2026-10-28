import { User } from "../types";

type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export async function handleRegister(input: RegisterInput): Promise<User> {
  const email = input.email.trim();
  const username = input.username.trim();
  const password = input.password.trim();

  if (!(email && username && password)) {
    throw new Error("Please fill out all fields");
  }

  const payload = {
    enable_email_notifications: false,
    username,
    email,
    password,
  };

  const response = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Registration failed: ${response.status} ${response.statusText}`,
    );
  }

  return data as User;
}
