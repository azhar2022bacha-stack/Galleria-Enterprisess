'use client';

import { useEffect, useId, useRef } from 'react';

const MENU_ATTRIBUTE = 'data-click-away-menu';

export function useDismissMenusOnOutsideClick(isOpen: boolean, onDismiss: () => void) {
  const menuId = useId();
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!isOpen) return;

    const dismissOutside = (event: Event) => {
      if (event.composedPath().some((node) =>
        node instanceof Element && node.getAttribute(MENU_ATTRIBUTE) === menuId
      )) return;
      onDismissRef.current();
    };
    const onKeyboardClick = (event: MouseEvent) => {
      if (event.detail === 0) dismissOutside(event);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onDismissRef.current();
    };

    document.addEventListener('pointerdown', dismissOutside, true);
    document.addEventListener('click', onKeyboardClick, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside, true);
      document.removeEventListener('click', onKeyboardClick, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, menuId]);

  return menuId;
}
