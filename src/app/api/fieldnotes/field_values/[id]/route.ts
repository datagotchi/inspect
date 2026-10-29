import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { NoteModel, FieldValueModel } from "@/app/api/models/fieldnotes";
import { getAuthUser } from "@/app/functions";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser || !authUser.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const noteId = parseInt(id, 10);
    const body = await req.json();
    const { text, field_values } = body;

    // 1. Update text if provided (updated_at is handled via $beforeUpdate hook)
    if (text !== undefined) {
      await NoteModel.query()
        .patch({ text } as Partial<NoteModel>)
        .where({ id: noteId, user_id: authUser.id });
    }

    // 2. Update field values if provided
    if (Array.isArray(field_values)) {
      // Remove existing field values and re-insert
      await FieldValueModel.query().delete().where({ note_id: noteId });

      for (const fv of field_values) {
        if (fv.field_id && fv.value) {
          await FieldValueModel.query().insert({
            note_id: noteId,
            field_id: fv.field_id,
            value: fv.value,
            user_id: authUser.id,
          } as Partial<FieldValueModel>);
        }
      }
    }

    // 3. Return updated note graph
    const updatedNote = await NoteModel.query()
      .findById(noteId)
      .withGraphFetched("field_values.field");

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(updatedNote);
  } catch (err) {
    console.error("Error in PATCH /api/fieldnotes/notes/[id]:", err);
    return NextResponse.json(
      { statusText: "Internal server error while updating note" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser || !authUser.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const noteId = parseInt(id, 10);

    // Delete associated field values first
    await FieldValueModel.query().delete().where({ note_id: noteId });
    // Delete note
    await NoteModel.query().deleteById(noteId).where("user_id", authUser.id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Error in DELETE /api/fieldnotes/notes/[id]:", err);
    return NextResponse.json(
      { statusText: "Internal server error while deleting note" },
      { status: 500 },
    );
  }
}
