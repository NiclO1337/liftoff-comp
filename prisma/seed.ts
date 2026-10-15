import { createAccount } from "@/server/accounts";
import { db } from "@/server/db";

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");
  }

  const existing = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (existing) {
    console.log(`Admin ${existing.email} already exists, nothing to do`);
    return;
  }

  const result = await createAccount({
    name: "Admin",
    email,
    password,
    role: "ADMIN",
  });
  if (!result.ok) throw new Error(result.error);
  console.log(`Created admin ${email.trim().toLowerCase()}`);
}

seedAdmin()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
