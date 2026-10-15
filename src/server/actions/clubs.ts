"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAccount } from "@/server/accounts";
import { db } from "@/server/db";
import { createClubSchema } from "@/server/validation/club";
import type { CreateClubField } from "@/server/validation/club";
import { requireAdmin } from "@/server/session";

// A successful create redirects, so the only result that comes back is a
// failure. `values` lets the form keep what was typed (never the password).
export type CreateClubFailure = {
  ok: false;
  error: string;
  fieldErrors: Partial<Record<CreateClubField, string>>;
  values: { name: string; coachName: string; coachEmail: string };
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function failure(
  fieldErrors: CreateClubFailure["fieldErrors"],
  values: CreateClubFailure["values"],
): CreateClubFailure {
  const count = Object.keys(fieldErrors).length;
  return {
    ok: false,
    error: `Fix ${count} ${count === 1 ? "field" : "fields"} to create the club`,
    fieldErrors,
    values,
  };
}

export async function createClub(
  _previous: CreateClubFailure | null,
  formData: FormData,
): Promise<CreateClubFailure> {
  await requireAdmin();

  const input = {
    name: text(formData, "name"),
    coachName: text(formData, "coachName"),
    coachEmail: text(formData, "coachEmail"),
    coachPassword: text(formData, "coachPassword"),
  };
  const values = {
    name: input.name,
    coachName: input.coachName,
    coachEmail: input.coachEmail,
  };

  const parsed = createClubSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: CreateClubFailure["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as CreateClubField;
      fieldErrors[field] ??= issue.message;
    }
    return failure(fieldErrors, values);
  }

  const { name, coach } = parsed.data;
  const club = await db.club.create({ data: { name }, select: { id: true } });

  if (coach) {
    // The club and its first coach are created together or not at all.
    const undoClub = () => db.club.delete({ where: { id: club.id } });
    const result = await createAccount({
      name: coach.name,
      email: coach.email,
      password: coach.password,
      role: "COACH",
      clubId: club.id,
    }).catch(async (error) => {
      await undoClub();
      throw error;
    });

    // The schema already checked the password length, so what is left is an
    // email that is taken.
    if (!result.ok) {
      await undoClub();
      return failure({ coachEmail: result.error }, values);
    }
  }

  revalidatePath("/admin/clubs");
  redirect("/admin/clubs");
}
