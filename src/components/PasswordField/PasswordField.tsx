"use client";

import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
import type { FieldProps } from "@/components/Field/Field";

// A password input with a Show / Hide button, so it can be checked on a phone.
export function PasswordField(props: Omit<FieldProps, "type" | "action">) {
  const [shown, setShown] = useState(false);

  return (
    <Field
      {...props}
      type={shown ? "text" : "password"}
      action={
        <Button
          variant="secondary"
          aria-label={shown ? "Hide password" : "Show password"}
          onClick={() => setShown(!shown)}
        >
          {shown ? "Hide" : "Show"}
        </Button>
      }
    />
  );
}
