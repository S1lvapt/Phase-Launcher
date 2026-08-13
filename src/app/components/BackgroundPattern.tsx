import { useMemo } from "react";
import { useConfigStore } from "../../stores/settings";

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function CubesPattern() {
  const cubes = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 7 }).map((_, i) => ({
      id: i,
      size: 140 + rand() * 220,
      top: rand() * 100,
      left: rand() * 100,
      duration: 16 + rand() * 12,
      delay: rand() * -18,
      variant: (i % 3) + 1,
    }));
  }, []);

  return (
    <div className="bg-cubes">
      {cubes.map((cube) => (
        <span
          key={cube.id}
          className={`bg-cube bg-cube-v${cube.variant}`}
          style={{
            width: cube.size,
            height: cube.size,
            top: `${cube.top}%`,
            left: `${cube.left}%`,
            animationDuration: `${cube.duration}s`,
            animationDelay: `${cube.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function WavesPattern() {
  const blobs = useMemo(() => {
    const rand = seededRandom(19);
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      size: 380 + i * 120 + rand() * 60,
      top: 10 + rand() * 70,
      left: 10 + rand() * 70,
      duration: 22 + i * 8 + rand() * 6,
      delay: rand() * -20,
      variant: (i % 3) + 1,
    }));
  }, []);

  return (
    <div className="bg-waves">
      {blobs.map((blob) => (
        <span
          key={blob.id}
          className={`bg-wave bg-wave-v${blob.variant}`}
          style={{
            width: blob.size,
            height: blob.size,
            top: `${blob.top}%`,
            left: `${blob.left}%`,
            animationDuration: `${blob.duration}s`,
            animationDelay: `${blob.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function BackgroundPattern() {
  const pattern = useConfigStore((s) => s.backgroundPattern);

  if (pattern === "cubes") return <CubesPattern />;
  if (pattern === "waves") return <WavesPattern />;

  return null;
}
