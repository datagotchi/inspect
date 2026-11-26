import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { FieldValueModel, NoteModel } from "@/app/api/models/fieldnotes";
import { getAuthUser } from "../../../functions";

export async function GET() {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notes = await NoteModel.query()
      .where("user_id", authUser.id!)
      .withGraphFetched("field_values");

    return NextResponse.json(notes);
  } catch (err) {
    console.error("Error in GET /api/fieldnotes/notes:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while fetching notes",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser || !authUser.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, field_values } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { message: "Text field is required" },
        { status: 400 },
      );
    }

    // 1. Create the note record with an explicit insert cast/type
    const newNote = await NoteModel.query().insert({
      text,
      user_id: authUser.id,
    } as Partial<NoteModel>);

    // 2. Insert associated field values if present
    if (Array.isArray(field_values) && field_values.length > 0) {
      for (const fv of field_values) {
        if (fv.field_id && fv.value) {
          await FieldValueModel.query().insert({
            note_id: newNote.id,
            field_id: fv.field_id,
            value: fv.value,
            user_id: authUser.id,
          } as Partial<FieldValueModel>);
        }
      }
    }

    // 3. Fetch full created note graph
    const createdNote = await NoteModel.query()
      .findById(newNote.id)
      .withGraphFetched("field_values.field");

    return NextResponse.json(createdNote, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/fieldnotes/notes:", err);
    return NextResponse.json(
      { statusText: "Internal server error while creating note" },
      { status: 500 },
    );
  }
}
