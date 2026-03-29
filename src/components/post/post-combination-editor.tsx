"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  MAX_COMBINATION_CHARACTERS,
  MAX_COMBINATION_SKILLS,
  type CombinationSkill,
  type PostCombinationData,
  type SelectableCharacter,
} from "@/lib/post-combination";

type PostCombinationEditorProps = {
  isOpen: boolean;
  onToggle: () => void;
  characters: SelectableCharacter[];
  value: PostCombinationData;
  onChange: (value: PostCombinationData) => void;
};

type SelectableSkill = CombinationSkill;

export function PostCombinationEditor({
  isOpen,
  onToggle,
  characters,
  value,
  onChange,
}: PostCombinationEditorProps) {
  const [characterModalIndex, setCharacterModalIndex] = useState<number | null>(null);
  const [skillModalIndex, setSkillModalIndex] = useState<number | null>(null);
  const selectedCharacterIds = useMemo(
    () => new Set(value.characters.map((item) => item.characterId)),
    [value.characters],
  );
  const selectedCharacters = useMemo(
    () => characters.filter((character) => selectedCharacterIds.has(character.id)),
    [characters, selectedCharacterIds],
  );
  const selectableSkills = selectedCharacters.flatMap<SelectableSkill>((character) => [
    {
      key: `${character.id}-skill-one`,
      characterId: character.id,
      characterName: character.name,
      skillName: character.skillOneName,
      skillImageUrl: character.skillOneImageUrl,
    },
    {
      key: `${character.id}-skill-two`,
      characterId: character.id,
      characterName: character.name,
      skillName: character.skillTwoName,
      skillImageUrl: character.skillTwoImageUrl,
    },
  ]);

  function handleSelectCharacter(slotIndex: number, character: SelectableCharacter) {
    const duplicateIndex = value.characters.findIndex(
      (item) => item.characterId === character.id,
    );
    if (duplicateIndex >= 0 && duplicateIndex !== slotIndex) {
      return;
    }

    const nextCharacters = [...value.characters];
    nextCharacters[slotIndex] = {
        characterId: character.id,
        name: character.name,
        portraitUrl: character.portraitUrl,
      };

    onChange({
      ...value,
      characters: nextCharacters,
      skills: value.skills.filter((skill) =>
        nextCharacters.some((selected) => selected.characterId === skill.characterId),
      ),
    });
    setCharacterModalIndex(null);
  }

  function handleRemoveCharacter(index: number) {
    const target = value.characters[index];
    if (!target) {
      return;
    }

    onChange({
      ...value,
      characters: value.characters.filter((_, currentIndex) => currentIndex !== index),
      skills: value.skills.filter((skill) => skill.characterId !== target.characterId),
    });
  }

  function handleSelectSkill(slotIndex: number, skill: SelectableSkill) {
    const duplicateIndex = value.skills.findIndex((item) => item.key === skill.key);
    if (duplicateIndex >= 0 && duplicateIndex !== slotIndex) {
      return;
    }

    const nextSkills = [...value.skills];
    nextSkills[slotIndex] = skill;
    onChange({
      ...value,
      skills: nextSkills,
    });
    setSkillModalIndex(null);
  }

  function handleRemoveSkill(index: number) {
    onChange({
      ...value,
      skills: value.skills.filter((_, currentIndex) => currentIndex !== index),
    });
  }

  const hasSelection = value.characters.length > 0 || value.skills.length > 0;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15"
      >
        <span>조합 등록</span>
        {hasSelection ? (
          <span className="rounded-full bg-cyan-200/15 px-2 py-0.5 text-[11px] text-cyan-50">
            캐릭터 {value.characters.length}/{MAX_COMBINATION_CHARACTERS} · 스킬 {value.skills.length}/{MAX_COMBINATION_SKILLS}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="space-y-5 rounded-2xl border border-white/15 bg-white/[0.03] p-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">캐릭터 조합</p>
                <p className="text-xs text-zinc-400">최대 5명까지 등록되며, 선택 순서대로 슬롯에 배치됩니다.</p>
              </div>
              <span className="text-xs font-medium text-cyan-100">
                {value.characters.length}/{MAX_COMBINATION_CHARACTERS}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: MAX_COMBINATION_CHARACTERS }).map((_, index) => {
                const item = value.characters[index];
                const isEmpty = !item;

                return (
                  <div
                    key={`character-slot-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/15 bg-black/30"
                  >
                    {isEmpty ? (
                      <button
                        type="button"
                        onClick={() => setCharacterModalIndex(index)}
                        className="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-500 transition hover:bg-white/5 hover:text-cyan-100"
                      >
                        ?
                      </button>
                    ) : (
                      <>
                        <Image
                          src={item.portraitUrl}
                          alt={item.name}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCharacter(index)}
                          className="absolute right-1 top-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                        >
                          제거
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">스킬 순서</p>
                <p className="text-xs text-zinc-400">최대 3개까지 등록되며, 선택 순서대로 사용 순서를 표시합니다.</p>
              </div>
              <span className="text-xs font-medium text-cyan-100">
                {value.skills.length}/{MAX_COMBINATION_SKILLS}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: MAX_COMBINATION_SKILLS }).map((_, index) => {
                const item = value.skills[index];
                const isEmpty = !item;

                return (
                  <div
                    key={`skill-slot-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/15 bg-black/30"
                  >
                    {isEmpty ? (
                      <button
                        type="button"
                        onClick={() => setSkillModalIndex(index)}
                        disabled={selectableSkills.length === 0}
                        className="flex h-full w-full items-center justify-center text-2xl font-black text-zinc-500 transition hover:bg-white/5 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ?
                      </button>
                    ) : (
                      <>
                        <Image
                          src={item.skillImageUrl}
                          alt={item.skillName}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1">
                          <p className="truncate text-[11px] font-semibold text-white">{item.skillName}</p>
                          <p className="truncate text-[10px] text-zinc-300">{item.characterName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="absolute right-1 top-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                        >
                          제거
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-zinc-400">
              스킬 슬롯을 선택하면 조합에 등록된 캐릭터의 스킬1, 스킬2만 선택할 수 있습니다.
            </p>
          </section>
        </div>
      ) : null}

      {characterModalIndex !== null ? (
        <SelectionModal
          title="캐릭터 선택"
          description="초상화와 이름을 확인하고 조합 슬롯에 배치할 캐릭터를 선택하세요."
          onClose={() => setCharacterModalIndex(null)}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {characters.map((character) => {
              const selectedInOtherSlot = value.characters.some(
                (item, index) =>
                  item.characterId === character.id && index !== characterModalIndex,
              );

              return (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => handleSelectCharacter(characterModalIndex, character)}
                  disabled={selectedInOtherSlot}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <Image
                      src={character.portraitUrl}
                      alt={character.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <span className="truncate text-sm font-semibold text-white">{character.name}</span>
                </button>
              );
            })}
          </div>
        </SelectionModal>
      ) : null}

      {skillModalIndex !== null ? (
        <SelectionModal
          title="스킬 선택"
          description="조합에 등록된 캐릭터별로 스킬1, 스킬2를 선택할 수 있습니다."
          onClose={() => setSkillModalIndex(null)}
        >
          <div className="space-y-4">
            {selectedCharacters.length > 0 ? (
              selectedCharacters.map((character) => {
                const characterSkills = selectableSkills.filter(
                  (skill) => skill.characterId === character.id,
                );

                return (
                  <section key={character.id} className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        <Image
                          src={character.portraitUrl}
                          alt={character.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm font-semibold text-white">{character.name}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {characterSkills.map((skill) => {
                        const selectedInOtherSlot = value.skills.some(
                          (item, index) => item.key === skill.key && index !== skillModalIndex,
                        );

                        return (
                          <button
                            key={skill.key}
                            type="button"
                            onClick={() => handleSelectSkill(skillModalIndex, skill)}
                            disabled={selectedInOtherSlot}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                              <Image
                                src={skill.skillImageUrl}
                                alt={skill.skillName}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <span className="truncate text-sm font-semibold text-white">{skill.skillName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-4 text-sm text-zinc-300">
                먼저 캐릭터 조합을 등록해야 스킬 순서를 선택할 수 있습니다.
              </p>
            )}
          </div>
        </SelectionModal>
      ) : null}
    </div>
  );
}

type SelectionModalProps = {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
};

function SelectionModal({
  title,
  description,
  onClose,
  children,
}: SelectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-[#10141f] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            닫기
          </button>
        </div>

        <div className="max-h-[calc(80vh-88px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
