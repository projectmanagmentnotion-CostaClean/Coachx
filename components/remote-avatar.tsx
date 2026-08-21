"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function buildInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "AF";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function RemoteAvatar({
  name,
  avatarPath,
  size = 52,
  className = "",
  alt
}: {
  name: string;
  avatarPath?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const initials = useMemo(() => buildInitials(name), [name]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!avatarPath) {
        setSrc(null);
        return;
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        setSrc(null);
        return;
      }

      const { data, error } = await client.storage.from("profile-avatars").createSignedUrl(avatarPath, 60 * 60);
      if (!active) {
        return;
      }

      if (error || !data?.signedUrl) {
        setSrc(null);
        return;
      }

      setSrc(data.signedUrl);
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [avatarPath]);

  const dimensionStyle = { width: size, height: size };

  return (
    <div className={`remote-avatar ${className}`.trim()} style={dimensionStyle} role={src ? undefined : "img"} aria-label={src ? undefined : alt ?? `${name} avatar`}>
      {src ? (
        <img className="remote-avatar__img" src={src} alt={alt ?? `${name} avatar`} width={size} height={size} />
      ) : (
        <div className="remote-avatar__fallback" aria-hidden="true">
          {initials}
        </div>
      )}
    </div>
  );
}
