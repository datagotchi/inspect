import { NextRequest, NextResponse } from "next/server";
import { FieldModel } from "@/app/api/models/fieldnotes";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const fieldId = Number(id);

    if (isNaN(fieldId)) {
      return NextResponse.json(
        { message: "Invalid field ID provided" },
        { status: 400 },
      );
    }

    // TODO: Implement user authentication to get user_id
    const user_id = 1;

    // Optional: Clean up associated field values prior to deleting the field definition
    // await FieldValueModel.query()
    //   .delete()
    //   .where("field_id", fieldId)
    //   .andWhere("user_id", user_id);

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
    console.error("Error in DELETE /api/fieldnotes/fields/[id]:", err);
    return NextResponse.json(
      { message: "Internal server error while deleting field" },
      { status: 500 },
    );
  }
}
