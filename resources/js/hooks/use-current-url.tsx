import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

function toPathnameWithSearch(urlOrPath: string) {
    if (!urlOrPath) return '';

    if (/^https?:\/\//i.test(urlOrPath)) {
        try {
            const u = new URL(urlOrPath);
            return `${u.pathname}${u.search}`;
        } catch {
            return urlOrPath;
        }
    }

    return urlOrPath;
}

function stripTrailingSlash(path: string) {
    if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
    return path;
}

export function useCurrentUrl() {
    const page = usePage();
    const inertiaUrl = (page as any)?.url as string | undefined;

    const currentPath = useMemo(() => {
        if (typeof inertiaUrl === 'string' && inertiaUrl.length > 0) {
            return stripTrailingSlash(toPathnameWithSearch(inertiaUrl));
        }

        if (typeof window !== 'undefined') {
            return stripTrailingSlash(`${window.location.pathname}${window.location.search}`);
        }

        return '';
    }, [inertiaUrl]);

    const isExactCurrentUrl = useMemo(() => {
        return (href: string) => {
            const target = stripTrailingSlash(toPathnameWithSearch(href));
            return Boolean(target) && currentPath === target;
        };
    }, [currentPath]);

    const isCurrentUrl = useMemo(() => {
        return (href: string) => {
            const target = stripTrailingSlash(toPathnameWithSearch(href));
            if (!target) return false;
            if (currentPath === target) return true;
            if (target === '/') return currentPath === '/';
            return currentPath.startsWith(`${target}/`);
        };
    }, [currentPath]);

    const whenCurrentUrl = useMemo(() => {
        return (href: string, value: string) => (isCurrentUrl(href) ? value : undefined);
    }, [isCurrentUrl]);

    const isCurrentOrParentUrl = isCurrentUrl;

    return {
        currentPath,
        isCurrentUrl,
        isCurrentOrParentUrl,
        isExactCurrentUrl,
        whenCurrentUrl,
    };
}
