"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

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
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25, rootMargin: "-64px 0px 0px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const savingRef = useRef(false);
  const finishEditing = async (save: boolean) => {
    // Enter and blur both fire this; guard so a second call during the first
    // in-flight save doesn't trigger a duplicate updateUserProfile request.
    if (savingRef.current) return;
    setEditing(false);
    if (!save || signature === (profile.intro ?? "")) {
      if (!save) setSignature(profile.intro ?? "");
      return;
    }
    savingRef.current = true;
    try {
      const response = await updateUserProfile({ intro: signature });
      useUserProfileStore.getState().setProfile(mapProfile(response.data.data.user));
    } catch (error) {
      setSignature(profile.intro ?? "");
      message.error(toApiError(error).message);
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <section ref={sectionRef} id="profile-card" className="grid min-h-dvh snap-start scroll-mt-16 place-items-center px-5 py-24 sm:px-8">
      <article
        aria-label="个人名片"
        className={`grid w-full max-w-[760px] border border-hairline bg-background/78 backdrop-blur-md transition-[opacity,transform] duration-500 ease-out md:grid-cols-[230px_minmax(0,1fr)] ${visible ? "translate-y-0 opacity-100" : "translate-y-[18px] opacity-0"}`}
      >
        <div className="flex min-h-[340px] min-w-0 flex-col justify-between border-b border-hairline p-7 md:border-b-0 md:border-r md:p-9">
          <div data-cursor-target>
            <Avatar className="size-28 border border-foreground sm:size-[132px]">
              <AvatarImage src={profile.avatar ?? DEFAULT_AVATAR} alt={profile.nickname} />
              <AvatarFallback className="text-3xl">{avatarFallbackChar(profile)}</AvatarFallback>
            </Avatar>
            <div className="mt-5 text-2xl font-semibold tracking-tight">{profile.nickname}</div>
          </div>

          <div
            data-cursor-target
            tabIndex={0}
            onDoubleClick={() => setEditing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !editing) {
                event.preventDefault();
                setEditing(true);
              }
            }}
            className="group cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          >
            <div className="mb-2 flex items-center gap-1.5">
              <span className="type-tech text-tertiary">签名</span>
              {!editing && (
                <span className="flex items-center gap-1 text-[11px] text-tertiary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Pencil size={11} />
                  双击编辑
                </span>
              )}
            </div>
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
              <p className="break-words text-[13px] leading-7 text-muted-foreground">
                {signature.trim() || EMPTY_SIGNATURE}
              </p>
            )}
          </div>
        </div>

        <dl className="flex flex-col justify-center px-7 py-4 md:px-10 md:py-9">
          {[
            ["真实姓名", profile.name],
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
