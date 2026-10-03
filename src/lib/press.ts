import type { MouseEvent, PointerEvent } from "react";

type PressEvent<T extends Element> = PointerEvent<T> | MouseEvent<T>;

export function pressProps<T extends Element>(
  action: (event: PressEvent<T>) => void,
) {
  return {
    onPointerDown: (event: PointerEvent<T>) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      event.currentTarget.setAttribute("data-press-armed", "1");
      action(event);
    },
    onClick: (event: MouseEvent<T>) => {
      if (event.currentTarget.getAttribute("data-press-armed") === "1") {
        event.currentTarget.removeAttribute("data-press-armed");
        event.preventDefault();
        return;
      }
      action(event);
    },
  };
}
