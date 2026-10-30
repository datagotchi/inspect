import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { FieldValueModel } from "@/app/api/models/fieldnotes";
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
    const fieldValueId = parseInt(id, 10);
    const body = await req.json();
    const { value, field_id } = body;

    const allowedUpdates: Partial<FieldValueModel> = {};
    if (value !== undefined) allowedUpdates.value = value;
    if (field_id !== undefined) allowedUpdates.field_id = field_id;

    if (Object.keys(allowedUpdates).length > 0) {
      await FieldValueModel.query()
        .patch(allowedUpdates)
        .where({ id: fieldValueId, user_id: authUser.id });
    }

    const updatedFieldValue = await FieldValueModel.query()
      .findById(fieldValueId)
      .where("user_id", authUser.id)
      .withGraphFetched("field");

    if (!updatedFieldValue) {
      return NextResponse.json(
        { error: "Field value not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedFieldValue);
  } catch (err) {
    console.error("Error in PATCH /api/fieldnotes/field_values/[id]:", err);
    return NextResponse.json(
      { statusText: "Internal server error while updating field value" },
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
    const fieldValueId = parseInt(id, 10);

    const deletedCount = await FieldValueModel.query()
      .deleteById(fieldValueId)
      .where("user_id", authUser.id);

    if (deletedCount === 0) {
      return NextResponse.json(
        { error: "Field value not found or unauthorized" },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Error in DELETE /api/fieldnotes/field_values/[id]:", err);
    return NextResponse.json(
      { statusText: "Internal server error while deleting field value" },
      { status: 500 },
    );
  }
}
