import { NextRequest, NextResponse } from "next/server";
import { FieldValueModel } from "../../models/field_values";
import { getAuthUser } from "../../../../functions";
import { NoteModel } from "../../models/notes";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(() => Promise.resolve(req.headers));
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const changes = await req.json();

    // We only allow patching the 'text' and 'datetime' fields for now.
    const allowedUpdates: { text?: string; datetime?: string } = {};
    if (changes.text) allowedUpdates.text = changes.text;
    if (changes.datetime) allowedUpdates.datetime = changes.datetime;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update." },
        { status: 400 },
      );
    }

    const updatedNote = await NoteModel.query()
      .patch(allowedUpdates)
      .where({ id: parseInt(id, 10), user_id: authUser.id })
      .first()
      .returning("*");

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(updatedNote);
  } catch (err) {
    console.error("Error in PATCH /api/fieldnotes/notes/[note_id]:", err);
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
    const user = await getAuthUser(() => Promise.resolve(req.headers));
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // We might add a check here in the future to ensure the user owns the note
    // associated with this field value before allowing deletion.

    await FieldValueModel.query().deleteById((await context.params).id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Error in DELETE /api/fieldnotes/field_values/[id]:", err);
    return NextResponse.json(
      { statusText: "Internal server error" },
      { status: 500 },
    );
  }
}
