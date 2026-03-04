import { useEffect, useState } from 'react';

/**
 * Hook to detect if the viewport is mobile
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();

        const resizeListener = () => {
            checkMobile();
        };

        window.addEventListener('resize', resizeListener);
        return () => window.removeEventListener('resize', resizeListener);
    }, []);

    return isMobile;
}
