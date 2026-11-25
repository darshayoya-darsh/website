import React from 'react';
import { Icon } from './Icon';
import { useAuth, fetchAvatarUrl } from './auth';

/* Circular profile avatar: the student's photo when set (fetched with the
   session token — the bucket is private), otherwise the placeholder icon. */
export function Avatar({ size = 20, className = '' }: { size?: number; className?: string }) {
    const session = useAuth();
    const path = session?.user.avatarPath || null;
    const [url, setUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        let alive = true;
        setUrl(null);
        if (path) fetchAvatarUrl(path).then((u) => { if (alive) setUrl(u); });
        return () => { alive = false; };
    }, [path]);

    if (path && url) {
        return <img src={url} alt="" className={`azu-avatar-img ${className}`} style={{ width: size, height: size }} />;
    }
    return <span className={`azu-avatar-ph ${className}`} style={{ width: size, height: size }}><Icon name="user" size={Math.round(size * 0.55)} /></span>;
}

/* Downscale any normal photo to a 256px WebP square in the browser before
   upload: keeps storage tiny and strips camera metadata. */
export async function downscaleAvatar(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-canvas');
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 256, 256);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.85));
    if (!blob) throw new Error('no-encode');
    return blob;
}
