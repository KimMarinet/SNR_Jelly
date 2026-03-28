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

function parseId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "유효한 캐릭터 ID가 아닙니다." }, { status: 400 });
  }

  const existing = await prisma.character.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ message: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
  }

  const formData = await request.formData();

  try {
    const payload = parseCharacterFormData(formData);
    const portraitFile = readImageFile(formData, "portraitFile", false);
    const skillOneImageFile = readImageFile(formData, "skillOneImageFile", false);
    const skillTwoImageFile = readImageFile(formData, "skillTwoImageFile", false);
    const passiveImageFile = readImageFile(formData, "passiveImageFile", false);

    const newFiles = [
      { kind: "portrait", file: portraitFile },
      { kind: "skillOne", file: skillOneImageFile },
      { kind: "skillTwo", file: skillTwoImageFile },
      { kind: "passive", file: passiveImageFile },
    ].filter((item): item is { kind: string; file: File } => Boolean(item.file));

    for (const item of newFiles) {
      const validationError = validateAssetFile(item.file);
      if (validationError) {
        return NextResponse.json({ message: validationError }, { status: 400 });
      }
    }

    const uploadedFiles: Record<
      string,
      { storedName: string; diskPath: string; publicUrl: string; file: File }
    > = {};

    try {
      for (const item of newFiles) {
        uploadedFiles[item.kind] = {
          ...(await writeAssetFile(item.file)),
          file: item.file,
        };
      }

      const character = await prisma.character.update({
        where: { id },
        data: {
          ...payload,
          ...(uploadedFiles.portrait
            ? {
                portraitOriginalName: normalizeOriginalFileName(
                  uploadedFiles.portrait.file.name || "portrait",
                ),
                portraitStoredName: uploadedFiles.portrait.storedName,
                portraitMimeType: uploadedFiles.portrait.file.type,
                portraitSize: uploadedFiles.portrait.file.size,
                portraitFilePath: uploadedFiles.portrait.diskPath,
                portraitUrl: uploadedFiles.portrait.publicUrl,
              }
            : {}),
          ...(uploadedFiles.skillOne
            ? {
                skillOneImageOriginalName: normalizeOriginalFileName(
                  uploadedFiles.skillOne.file.name || "skill-one",
                ),
                skillOneImageStoredName: uploadedFiles.skillOne.storedName,
                skillOneImageMimeType: uploadedFiles.skillOne.file.type,
                skillOneImageSize: uploadedFiles.skillOne.file.size,
                skillOneImageFilePath: uploadedFiles.skillOne.diskPath,
                skillOneImageUrl: uploadedFiles.skillOne.publicUrl,
              }
            : {}),
          ...(uploadedFiles.skillTwo
            ? {
                skillTwoImageOriginalName: normalizeOriginalFileName(
                  uploadedFiles.skillTwo.file.name || "skill-two",
                ),
                skillTwoImageStoredName: uploadedFiles.skillTwo.storedName,
                skillTwoImageMimeType: uploadedFiles.skillTwo.file.type,
                skillTwoImageSize: uploadedFiles.skillTwo.file.size,
                skillTwoImageFilePath: uploadedFiles.skillTwo.diskPath,
                skillTwoImageUrl: uploadedFiles.skillTwo.publicUrl,
              }
            : {}),
          ...(uploadedFiles.passive
            ? {
                passiveImageOriginalName: normalizeOriginalFileName(
                  uploadedFiles.passive.file.name || "passive",
                ),
                passiveImageStoredName: uploadedFiles.passive.storedName,
                passiveImageMimeType: uploadedFiles.passive.file.type,
                passiveImageSize: uploadedFiles.passive.file.size,
                passiveImageFilePath: uploadedFiles.passive.diskPath,
                passiveImageUrl: uploadedFiles.passive.publicUrl,
              }
            : {}),
        },
        select: characterSelect,
      });

      await Promise.all([
        uploadedFiles.portrait ? removeAssetFile(existing.portraitStoredName) : Promise.resolve(),
        uploadedFiles.skillOne
          ? removeAssetFile(existing.skillOneImageStoredName)
          : Promise.resolve(),
        uploadedFiles.skillTwo
          ? removeAssetFile(existing.skillTwoImageStoredName)
          : Promise.resolve(),
        uploadedFiles.passive
          ? removeAssetFile(existing.passiveImageStoredName)
          : Promise.resolve(),
      ]);

      return NextResponse.json({
        character: toAdminCharacter(character),
        message: `${character.name} 캐릭터 정보를 저장했습니다.`,
      });
    } catch (error) {
      await Promise.all(
        Object.values(uploadedFiles).map((item) => removeAssetFile(item.storedName)),
      );
      throw error;
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "캐릭터 수정에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession();
  if (!admin) {
    return unauthorizedResponse();
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ message: "유효한 캐릭터 ID가 아닙니다." }, { status: 400 });
  }

  const character = await prisma.character.findUnique({
    where: { id },
  });

  if (!character) {
    return NextResponse.json({ message: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.character.delete({ where: { id } });
  await Promise.all([
    removeAssetFile(character.portraitStoredName),
    removeAssetFile(character.skillOneImageStoredName),
    removeAssetFile(character.skillTwoImageStoredName),
    removeAssetFile(character.passiveImageStoredName),
  ]);

  return NextResponse.json({ message: `${character.name} 캐릭터를 삭제했습니다.` });
}
