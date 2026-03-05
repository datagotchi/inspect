import { NextRequest, NextResponse } from "next/server";
import { FieldValueModel } from "../models/field_values";

export async function POST(req: NextRequest) {
  try {
    const { note_id, field_id, value } = await req.json();

    if (!note_id || !field_id || value === undefined) {
      return NextResponse.json(
        { message: "Missing required fields: note_id, field_id, value" },
        { status: 400 },
      );
    }

    const body = {
      note_id,
      field_id,
      value,
    };
    const newFieldValue = await FieldValueModel.query().insertAndFetch(body);

    return NextResponse.json(newFieldValue, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/fieldnotes/field_values:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while creating field value",
      },
      { status: 500 },
    );
  }
}
