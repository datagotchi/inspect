import { NextRequest, NextResponse } from "next/server";
import { raw } from "objection";
// 1. Updated import to point to the consolidated models file
import { FieldModel } from "@/app/api/models/fieldnotes";

export type GetFieldsResponse = NextResponse<
  FieldModel[] | { statusText: string }
>;

export async function GET(req: NextRequest): Promise<GetFieldsResponse> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");

    // 2. Wrap user_id filter in a grouped condition so orWhereNull applies correctly
    const fields = await FieldModel.query()
      .select(
        "fields.id",
        "fields.name",
        "fields.user_id",
        raw("count(field_values.id) as use_count"),
      )
      .leftJoin("field_values", "fields.id", "field_values.field_id")
      .where((builder) => {
        if (user_id) {
          builder
            .where("fields.user_id", user_id)
            .orWhereNull("fields.user_id");
        } else {
          builder.whereNull("fields.user_id");
        }
      })
      .groupBy("fields.id", "fields.name", "fields.user_id")
      .orderBy("use_count", "desc")
      .orderBy("fields.name", "asc");

    return NextResponse.json(fields as unknown as FieldModel[]);
  } catch (err) {
    console.error("Error in GET /api/fieldnotes/fields:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while fetching fields",
      },
      {
        status: 500,
      },
    );
  }
}

export type PostFieldsResponse = NextResponse<
  FieldModel | { statusText: string }
>;

export async function POST(req: NextRequest): Promise<PostFieldsResponse> {
  try {
    const { name } = await req.json();
    const user_id = 1; // Placeholder for authenticated user ID

    if (name) {
      const newField = await FieldModel.query().insert({
        name,
        user_id,
      });
      return NextResponse.json(newField, { status: 201 });
    } else {
      return NextResponse.json(
        { statusText: "Name is required" },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("Error in POST /api/fieldnotes/fields:", err);
    return NextResponse.json(
      {
        statusText: "Internal server error while creating field",
      },
      {
        status: 500,
      },
    );
  }
}
