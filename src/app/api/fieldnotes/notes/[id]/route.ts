/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { NoteModel, FieldValueModel } from "@/app/api/models/fieldnotes";
import { getAuthUser } from "@/app/functions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser || !authUser.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const noteId = parseInt(id, 10);

    // Clean up associated field values first
    // await FieldValueModel.query()
    //   .delete()
    //   .where({ note_id: noteId, user_id: authUser.id });

    // Delete the note record
    const deletedCount = await NoteModel.query()
      .deleteById(noteId)
      .where("user_id", authUser.id);

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "Note not found or unauthorized" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Error in DELETE /api/fieldnotes/notes/[id]:", err);
    return NextResponse.json(
      { statusText: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser || !authUser.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const noteId = parseInt(id, 10);
    const changes = await req.json();

    // 1. Filter allowed note field updates (text only; updated_at is handled automatically by $beforeUpdate hook)
    const allowedUpdates: { text?: string } = {};
    if (changes.text !== undefined) allowedUpdates.text = changes.text;

    // 2. Perform patch on the note record if text was updated
    if (Object.keys(allowedUpdates).length > 0) {
      await NoteModel.query()
        .patch(allowedUpdates as Partial<NoteModel>)
        .where({ id: noteId, user_id: authUser.id });
    }

    // 3. Sync field values if passed in payload
    if (Array.isArray(changes.field_values)) {
      // Remove existing values for this note
      await FieldValueModel.query()
        .delete()
        .where({ note_id: noteId, user_id: authUser.id });

      // Re-insert new or modified field values
      for (const fv of changes.field_values) {
        if (fv.value && fv.field_id) {
          await FieldValueModel.query().insert({
            note_id: noteId,
            field_id: fv.field_id,
            value: fv.value,
            user_id: authUser.id,
          } as Partial<FieldValueModel>);
        }
      }
    }

    // Fetch and return the updated note with graph-fetched relations
    const updatedNote = await NoteModel.query()
      .findById(noteId)
      .where("user_id", authUser.id)
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
