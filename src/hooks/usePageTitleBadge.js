import { useEffect, useRef } from 'react';

const usePageTitleBadge = (unreadCount = 0) => {
    const originalTitle = useRef(document.title);

    useEffect(() => {
        // Save original title once
        if (!originalTitle.current) {
            originalTitle.current = document.title;
        }

        const handleVisibilityChange = () => {
            updateTitle();
        };

        const updateTitle = () => {
            const isHidden = document.hidden || !document.hasFocus();

            // Badge Logic: 
            // Show if unread > 0 AND (Hidden OR Not Focused)
            if (unreadCount > 0 && isHidden) {
                document.title = `(${unreadCount}) ${originalTitle.current}`;
            } else {
                document.title = originalTitle.current;
            }
        };

        // Listen for visibility and focus changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', updateTitle);
        window.addEventListener('blur', updateTitle);

        // Immediate update on mount/change
        updateTitle();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', updateTitle);
            window.removeEventListener('blur', updateTitle);
            // Restore title on unmount
            document.title = originalTitle.current;
        };
    }, [unreadCount]);
};

export default usePageTitleBadge;
