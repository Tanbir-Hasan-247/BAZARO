import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const ringX = useSpring(cursorX, { stiffness: 280, damping: 28, mass: 0.5 });
  const ringY = useSpring(cursorY, { stiffness: 280, damping: 28, mass: 0.5 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || prefersReduced) return;

    setEnabled(true);

    const handleMove = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);

      const target = e.target;
      const interactive = target?.closest?.(
        "a, button, [role='button'], input, select, textarea, .interactive-tilt"
      );
      setHovering(Boolean(interactive));
    };

    const handleLeave = () => setVisible(false);
    const handleEnter = () => setVisible(true);

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
    };
  }, [cursorX, cursorY, visible]);

  if (!enabled || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      {/* Trailing Royal Gold Ring */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: hovering ? 1.65 : 1,
          borderColor: hovering
            ? "rgba(229, 199, 122, 0.85)"
            : "rgba(197, 155, 75, 0.45)",
          backgroundColor: hovering
            ? "rgba(197, 155, 75, 0.1)"
            : "rgba(197, 155, 75, 0)",
        }}
        transition={{ duration: 0.2 }}
        className="w-8 h-8 rounded-full border-[1.5px] backdrop-blur-[1px]"
      />

      {/* Precision Center Gold Dot */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: hovering ? 0.55 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="w-2 h-2 rounded-full bg-[#E5C77A] shadow-[0_0_12px_rgba(229,199,122,0.9)]"
      />
    </div>
  );
};

export default CustomCursor;
