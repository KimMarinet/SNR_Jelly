import { NextResponse } from "next/server";
import {
  normalizeOriginalFileName,
  removeAssetFile,
  validateAssetFile,
  writeAssetFile,
} from "@/lib/asset-storage";
import {
  characterSelect,
  parseCharacterFormData,
  readImageFile,
  toAdminCharacter,
} from "@/lib/character-admin-server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/route-auth";

function unauthorizedResponse() {
  return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
}

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const characters = await prisma.character.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: characterSelect,
  });

  return NextResponse.json({
    characters: characters.map(toAdminCharacter),
  });
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const formData = await request.formData();

  try {
    const payload = parseCharacterFormData(formData);
    const portraitFile = readImageFile(formData, "portraitFile", true);
    const skillOneImageFile = readImageFile(formData, "skillOneImageFile", true);
    const skillTwoImageFile = readImageFile(formData, "skillTwoImageFile", true);
    const passiveImageFile = readImageFile(formData, "passiveImageFile", true);

    const files = [
      { key: "portrait", file: portraitFile! },
      { key: "skillOne", file: skillOneImageFile! },
      { key: "skillTwo", file: skillTwoImageFile! },
      { key: "passive", file: passiveImageFile! },
    ];

    for (const item of files) {
      const validationError = validateAssetFile(item.file);
      if (validationError) {
        return NextResponse.json({ message: validationError }, { status: 400 });
      }
    }

    const uploadedFiles: Array<{
      storedName: string;
      diskPath: string;
      publicUrl: string;
      file: File;
    }> = [];

    try {
      for (const item of files) {
        const uploaded = await writeAssetFile(item.file);
        uploadedFiles.push({ ...uploaded, file: item.file });
      }

      const [portrait, skillOne, skillTwo, passive] = uploadedFiles;

      const character = await prisma.character.create({
        data: {
          ...payload,
          portraitOriginalName: normalizeOriginalFileName(portrait.file.name || "portrait"),
          portraitStoredName: portrait.storedName,
          portraitMimeType: portrait.file.type,
          portraitSize: portrait.file.size,
          portraitFilePath: portrait.diskPath,
          portraitUrl: portrait.publicUrl,
          skillOneImageOriginalName: normalizeOriginalFileName(skillOne.file.name || "skill-one"),
          skillOneImageStoredName: skillOne.storedName,
          skillOneImageMimeType: skillOne.file.type,
          skillOneImageSize: skillOne.file.size,
          skillOneImageFilePath: skillOne.diskPath,
          skillOneImageUrl: skillOne.publicUrl,
          skillTwoImageOriginalName: normalizeOriginalFileName(skillTwo.file.name || "skill-two"),
          skillTwoImageStoredName: skillTwo.storedName,
          skillTwoImageMimeType: skillTwo.file.type,
          skillTwoImageSize: skillTwo.file.size,
          skillTwoImageFilePath: skillTwo.diskPath,
          skillTwoImageUrl: skillTwo.publicUrl,
          passiveImageOriginalName: normalizeOriginalFileName(passive.file.name || "passive"),
          passiveImageStoredName: passive.storedName,
          passiveImageMimeType: passive.file.type,
          passiveImageSize: passive.file.size,
          passiveImageFilePath: passive.diskPath,
          passiveImageUrl: passive.publicUrl,
        },
        select: characterSelect,
      });

      return NextResponse.json(
        {
          character: toAdminCharacter(character),
          message: `${character.name} 캐릭터를 등록했습니다.`,
        },
        { status: 201 },
      );
    } catch (error) {
      await Promise.all(uploadedFiles.map((item) => removeAssetFile(item.storedName)));
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "캐릭터 등록에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}
