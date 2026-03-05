import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { NoteModel } from "../models/notes";
import { getAuthUser } from "../../../functions";

export async function GET() {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notes = await NoteModel.query()
      .where("user_id", authUser.user_id)
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
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    const newNote = await NoteModel.query().insertAndFetch({
      text,
      datetime: new Date().toISOString(),
      user_id: authUser.user_id,
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/fieldnotes/notes:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while creating note",
      },
      {
        status: 500,
      },
    );
  }
}
