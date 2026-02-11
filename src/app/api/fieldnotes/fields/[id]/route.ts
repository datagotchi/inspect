import { NextRequest, NextResponse } from "next/server";

import { FieldModel } from "../../models/Fields";

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fieldId = searchParams.get("id");
    // TODO: Implement user authentication to get user_id
    const user_id = 1; // Placeholder for authenticated user ID

    if (!fieldId) {
      return NextResponse.json(
        { error: "Field ID is required" },
        { status: 400 },
      );
    }

    const deletedCount = await FieldModel.query()
      .delete()
      .where("id", fieldId)
      .andWhere("user_id", user_id);

    if (deletedCount === 0) {
      return NextResponse.json(
        { message: "Field not found or not authorized" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Error in DELETE /syndicates/fieldnotes/fields:", err);
    return NextResponse.json(
      {
        message: "Internal server error while deleting field",
      },
      {
        status: 500,
      },
    );
  }
}
