import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { validatePostImage, writePostImage } from "@/lib/post-image-storage";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const formData = await request.formData();
  const fileValue = formData.get("image");

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ message: "Image file is required." }, { status: 400 });
  }

  const validationError = validatePostImage(fileValue);
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const uploaded = await writePostImage(fileValue);
  return NextResponse.json({ url: uploaded.publicUrl }, { status: 201 });
}
