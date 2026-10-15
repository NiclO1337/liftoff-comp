"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/server/auth";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// A successful login redirects, so the only result that comes back is a failure.
// The email is returned so the form can keep it (the password is cleared).
export type LoginFailure = { ok: false; error: string; email: string };

// One message for every kind of wrong input: it must not reveal whether the
// email exists.
const WRONG_CREDENTIALS = "Wrong email or password";
const TOO_MANY_ATTEMPTS = "Too many attempts. Try again in a minute.";

export async function login(
  _previous: LoginFailure | null,
  formData: FormData,
): Promise<LoginFailure> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail : "";
  const fail = (error: string): LoginFailure => ({ ok: false, error, email });

  const credentials = credentialsSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!credentials.success) return fail(WRONG_CREDENTIALS);

  try {
    await auth.api.signInEmail({
      body: credentials.data,
      headers: await headers(),
    });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    return fail(
      error.statusCode === 429 ? TOO_MANY_ATTEMPTS : WRONG_CREDENTIALS,
    );
  }

  // redirect() throws, so it stays outside the try block.
  redirect("/");
}

// The admin's active-club cookie is left alone on purpose (context doc §7).
export async function logout(): Promise<never> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
