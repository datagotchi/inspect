import React from "react";
import { notFound } from "next/navigation";
import { NoteModel, FieldModel } from "@/app/api/models/fieldnotes";
import ClientSidePage from "./ClientSidePage";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FieldnoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const noteId = Number(id);

  if (isNaN(noteId)) {
    notFound();
  }

  const [rawNote, rawFields] = await Promise.all([
    NoteModel.query().findById(noteId).withGraphFetched("field_values.field"),
    FieldModel.query().select("id", "name"),
  ]);

  if (!rawNote) {
    notFound();
  }

  const note = JSON.parse(JSON.stringify(rawNote));
  const availableFields = JSON.parse(JSON.stringify(rawFields));

  return <ClientSidePage note={note} availableFields={availableFields} />;
}
