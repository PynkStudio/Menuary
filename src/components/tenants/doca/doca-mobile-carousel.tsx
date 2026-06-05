"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function DocaMobileCarousel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const items = Children.toArray(children);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = containerRef.current;
    if (!el) return;

    const getSetWidth = () => el.scrollWidth / 3;

    let pending = false;
    const recenter = () => {
      el.scrollLeft = getSetWidth();
    };

    requestAnimationFrame(recenter);

    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const sw = getSetWidth();
        if (sw <= 0) return;
        if (el.scrollLeft < sw * 0.5) {
          el.scrollLeft += sw;
        } else if (el.scrollLeft > sw * 1.5) {
          el.scrollLeft -= sw;
        }
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(recenter);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [isMobile, items.length]);

  const cloneWithKey = (node: ReactNode, key: string) =>
    isValidElement(node) ? cloneElement(node, { key }) : node;

  return (
    <div ref={containerRef} className={className}>
      {items}
      {isMobile
        ? items.map((c, i) => cloneWithKey(c, `clone-a-${i}`))
        : null}
      {isMobile
        ? items.map((c, i) => cloneWithKey(c, `clone-b-${i}`))
        : null}
    </div>
  );
}
