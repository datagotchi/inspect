import React from "react";
import { NoteModel, FieldModel } from "@/app/api/models/fieldnotes";
import ClientSidePage from "./ClientSidePage";

export const revalidate = 0;

export default async function FieldnotesPage() {
  const [rawNotes, rawFields] = await Promise.all([
    NoteModel.query()
      .select("id", "text", "created_at", "updated_at", "user_id")
      .withGraphFetched("field_values.field")
      .orderBy("created_at", "desc"),
    FieldModel.query().select("id", "name"),
  ]);

  const notes = JSON.parse(JSON.stringify(rawNotes));
  const fields = JSON.parse(JSON.stringify(rawFields));

  return <ClientSidePage initialNotes={notes} availableFields={fields} />;
}
