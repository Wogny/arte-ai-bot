import { useRef, useState, ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number; // Intensidade do tilt (0-1), padrão 0.5
}

export default function TiltCard({
  children,
  className = "",
  style = {},
  intensity = 0.5,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Calcular ângulos de rotação baseado na posição do mouse
    // Limitar a 25 graus no máximo
    const rotateX = (mouseY / (rect.height / 2)) * 25 * intensity;
    const rotateY = (mouseX / (rect.width / 2)) * 25 * intensity;

    setTilt({
      x: -rotateX,
      y: rotateY,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`transition-all duration-300 ${className}`}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${
          isHovering ? "scale(1.02)" : "scale(1)"
        }`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
