"use client";

import { useEffect, useRef, useState } from "react";

import { useUserProfileStore } from "@/store/use-user-profile-store";
import { updateUserProfile } from "@/lib/api/user";
import { mapProfile } from "@/lib/api/mappers";
import { toApiError } from "@/lib/api/errors";
import { message } from "@/lib/message";
import { avatarFallbackChar, DEFAULT_AVATAR } from "@/lib/constants/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EMPTY_SIGNATURE = "你还没留下签名哦～";

export function ProfileCard() {
  const profile = useUserProfileStore((state) => state.profile);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [signature, setSignature] = useState(profile.intro ?? "");
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSignature(profile.intro ?? "");
  }, [profile.intro]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.92),
      { threshold: [0, 0.92, 1] },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const finishEditing = async (save: boolean) => {
    setEditing(false);
    if (!save || signature === (profile.intro ?? "")) {
      if (!save) setSignature(profile.intro ?? "");
      return;
    }
    try {
      const response = await updateUserProfile({ intro: signature });
      useUserProfileStore.getState().setProfile(mapProfile(response.data.data.user));
    } catch (error) {
      setSignature(profile.intro ?? "");
      message.error(toApiError(error).message);
    }
  };

  return (
    <section ref={sectionRef} id="profile-card" className="grid min-h-screen snap-start place-items-center px-5 py-24 sm:px-8">
      <article
        aria-label="个人名片"
        className={`grid w-full max-w-[760px] border border-hairline bg-background/78 backdrop-blur-md transition-[opacity,transform] duration-500 ease-out md:grid-cols-[230px_minmax(0,1fr)] ${visible ? "translate-y-0 opacity-100" : "translate-y-[18px] opacity-0"}`}
      >
        <div className="flex min-h-[380px] flex-col justify-between border-b border-hairline p-7 md:border-b-0 md:border-r md:p-9">
          <div data-cursor-target>
            <Avatar className="size-28 border border-foreground sm:size-[132px]">
              <AvatarImage src={profile.avatar ?? DEFAULT_AVATAR} alt={profile.nickname} />
              <AvatarFallback className="text-3xl">{avatarFallbackChar(profile)}</AvatarFallback>
            </Avatar>
            <div className="mt-5 text-2xl font-semibold tracking-tight">{profile.nickname}</div>
          </div>

          <div data-cursor-target onDoubleClick={() => setEditing(true)}>
            <div className="type-tech mb-2 text-tertiary">签名</div>
            {editing ? (
              <input
                ref={inputRef}
                aria-label="签名"
                value={signature}
                maxLength={255}
                onChange={(event) => setSignature(event.target.value)}
                onBlur={() => void finishEditing(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void finishEditing(true);
                  if (event.key === "Escape") void finishEditing(false);
                }}
                className="w-full border-0 border-b border-foreground bg-transparent pb-1 text-[13px] leading-7 outline-none"
              />
            ) : (
              <p className="text-[13px] leading-7 text-muted-foreground">
                {signature.trim() || EMPTY_SIGNATURE}
              </p>
            )}
          </div>
        </div>

        <dl className="flex flex-col justify-center px-7 py-4 md:px-10 md:py-9">
          {[
            ["姓名", profile.name],
            ["学院", profile.college],
            ["专业", profile.major],
          ].map(([label, value], index) => (
            <div
              key={label}
              data-cursor-target
              className={`grid grid-cols-[88px_minmax(0,1fr)] gap-5 border-b border-hairline py-4 ${index === 0 ? "border-t" : ""}`}
            >
              <dt className="type-tech text-tertiary">{label}</dt>
              <dd className="text-sm leading-6">{value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </section>
  );
}
