import Image from "next/image";
import {
  MAX_COMBINATION_CHARACTERS,
  MAX_COMBINATION_SKILLS,
  type PostCombinationData,
} from "@/lib/post-combination";

type PostCombinationDisplayProps = {
  data: PostCombinationData;
};

export function PostCombinationDisplay({ data }: PostCombinationDisplayProps) {
  const hasCharacters = data.characters.length > 0;
  const hasSkills = data.skills.length > 0;

  if (!hasCharacters && !hasSkills) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cyan-100">등록된 조합</p>
          <p className="text-xs text-zinc-300">작성자가 지정한 캐릭터 구성과 스킬 순서입니다.</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Character</p>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: MAX_COMBINATION_CHARACTERS }).map((_, index) => {
              const item = data.characters[index];

              return (
                <div
                  key={`post-character-${index}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/25"
                >
                  {item ? (
                    <Image
                      src={item.portraitUrl}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl font-black text-zinc-500">
                      ?
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Skill Order</p>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: MAX_COMBINATION_SKILLS }).map((_, index) => {
              const item = data.skills[index];

              return (
                <div
                  key={`post-skill-${index}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/25"
                >
                  {item ? (
                    <>
                      <Image
                        src={item.skillImageUrl}
                        alt={item.skillName}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 px-2 py-1">
                        <p className="truncate text-[11px] font-semibold text-white">{item.skillName}</p>
                        <p className="truncate text-[10px] text-zinc-300">{item.characterName}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl font-black text-zinc-500">
                      ?
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
