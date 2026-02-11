import { NextRequest, NextResponse } from "next/server.js";
import { FieldValueModel } from "../models/field_values";

export async function POST(req: NextRequest) {
  try {
    const { note_id, field_id, value } = await req.json();
    if (note_id && field_id && value) {
      const body = {
        note_id,
        field_id,
        value,
      };
      const newFieldValue = await FieldValueModel.query().insertAndFetch(body);
      NextResponse.json(newFieldValue, { status: 201 });
    } else {
      return NextResponse.json(
        { statusText: "note_id, field_id, and value are required" },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("Error in POST /syndicates/fieldnotes/field_values:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while creating field_value",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const note_id = searchParams.get("note_id");
    const field_id = searchParams.get("field_id");
    const { value } = await req.json();
    if (note_id && field_id && value) {
      const updatedFieldValue = await FieldValueModel.query()
        .patch({ value })
        .where({ note_id, field_id })
        .returning("*");
      return NextResponse.json(updatedFieldValue);
    } else {
      return NextResponse.json(
        { statusText: "note_id, field_id, and value are required" },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("Error in PATCH /api/fieldnotes/field_values:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while patching field_values",
      },
      {
        status: 500,
      },
    );
  }
}
