import { NextRequest, NextResponse } from "next/server";
import { FieldValueModel } from "../../models/field_values";

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const note_id = searchParams.get("note_id");
    const field_id = searchParams.get("field_id");
    if (note_id && field_id) {
      await FieldValueModel.query()
        .delete()
        .where("note_id", note_id)
        .andWhere("field_id", field_id);
      return NextResponse.json({ status: 204 });
    } else {
      return NextResponse.json(
        { statusText: "note_id and field_id are required" },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("Error in DELETE /api/fieldnotes/field_values/:id:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while deleting a field_value",
      },
      {
        status: 500,
      },
    );
  }
}
