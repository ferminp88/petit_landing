import React, { useEffect, useRef, useState } from 'react';

export const DogCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [target, setTarget] = useState({ x: -100, y: -100 });
  const [angle, setAngle] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const animRef = useRef<number>(0);
  const current = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setTarget({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const animate = () => {
      const dx = target.x - current.current.x;
      const dy = target.y - current.current.y;

      current.current.x += dx * 0.12;
      current.current.y += dy * 0.12;

      const newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      setAngle(newAngle);
      setFlipped(Math.abs(newAngle) > 90);
      setPos({ x: current.current.x, y: current.current.y });

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [target]);

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) rotate(${flipped ? angle + 180 : angle}deg) scaleY(${flipped ? -1 : 1})`,
        fontSize: '28px',
        pointerEvents: 'none',
        zIndex: 9999,
        userSelect: 'none',
        transition: 'font-size 0.1s',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
      }}
    >
      🐶
    </div>
  );
};
