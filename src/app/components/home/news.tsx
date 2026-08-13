import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";

import { Config } from "../../../util/config";
import { SeasonInfo } from "../../../util/seasonInfo";

type NewsMessage = {
  image: string;
  title: string;
  body: string;
  action?: "library" | "discord";
};

function SlideImage({ src, proxiedSrc }: { src: string; proxiedSrc: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
  }, [src]);

  return (
    <div className="absolute inset-0">
      {status !== "loaded" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-soft)]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
            className="text-white/60"
          >
            <RefreshCw size={26} />
          </motion.div>
        </div>
      )}

      {status !== "error" && (
        <motion.img
          key={src}
          src={proxiedSrc}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          initial={{ scale: 1, x: 0, y: 0, opacity: 0 }}
          animate={
            status === "loaded"
              ? { scale: 1.15, x: -12, y: -8, opacity: 1 }
              : { opacity: 0 }
          }
          transition={
            status === "loaded"
              ? { opacity: { duration: 0.25 }, scale: { duration: 9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }, x: { duration: 9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }, y: { duration: 9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" } }
              : { duration: 0.2 }
          }
        />
      )}
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    setDisplayed("");
    setPhase("typing");
  }, [text]);

  useEffect(() => {
    if (phase === "typing") {
      if (displayed.length < text.length) {
        const timeout = setTimeout(() => {
          setDisplayed(text.slice(0, displayed.length + 1));
        }, 35);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => setPhase("pausing"), 2200);
      return () => clearTimeout(timeout);
    }

    if (phase === "pausing") {
      const timeout = setTimeout(() => setPhase("deleting"), 1600);
      return () => clearTimeout(timeout);
    }

    if (phase === "deleting") {
      if (displayed.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayed(text.slice(0, displayed.length - 1));
        }, 18);
        return () => clearTimeout(timeout);
      }
      const timeout = setTimeout(() => setPhase("typing"), 400);
      return () => clearTimeout(timeout);
    }
  }, [displayed, phase, text]);

  return (
    <span>
      {displayed}
      <span className="typewriter-cursor">|</span>
    </span>
  );
}

export function News() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const { readableSeason, description } = SeasonInfo(
    Config.CURRENT_SEASON.toString(),
  );

  const getProxiedUrl = (url: string) => url;

  const seasonSlide: NewsMessage = {
    image: "/season-hero-1.png",
    title: readableSeason,
    body: description,
    action: "library",
  };

  const phaseSlides: NewsMessage[] = [
    {
      image: "/season-hero-2.png",
      title: "A New Chapter Begins",
      body: "Chapter 3 Season 1 flips the island upside down. Slide across snow-capped mountains, build new alliances and discover a brand new map full of secrets.",
      action: "library",
    },
    {
      image: "/season-hero-3.png",
      title: "The Resistance",
      body: "The IO is on the move and The Seven need your help. Join the resistance, fight back against Doctor Slone's forces and reclaim the island.",
      action: "library",
    },
    {
      image: "/season-hero-1.png",
      title: "Spider-Man Swings In",
      body: "Your friendly neighborhood Spider-Man has arrived on the island. Find his Web-Shooters scattered across the map and swing across the battlefield.",
      action: "library",
    },
    {
      image: "/season-discord.png",
      title: "Join Our Discord",
      body: "Stay up to date with the latest news, events and updates. Connect with the community and be the first to know what's coming next.",
      action: "discord",
    },
  ];

  const carouselItems = [seasonSlide, ...phaseSlides];

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function restartInterval() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (carouselItems.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % carouselItems.length);
    }, 6000);
  }

  useEffect(() => {
    restartInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [carouselItems.length]);

  function goNext() {
    setIndex((i) => (i + 1) % carouselItems.length);
    restartInterval();
  }

  function goPrev() {
    setIndex((i) => (i - 1 + carouselItems.length) % carouselItems.length);
    restartInterval();
  }

  const current = carouselItems[index];

  return (
    <div className="group relative h-full overflow-hidden rounded-xl shadow-2xl shadow-black/30">
      {/* Slides */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {current.image && (
            <SlideImage src={current.image} proxiedSrc={getProxiedUrl(current.image)} />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${index}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="absolute bottom-0 left-0 right-0 p-5"
        >
          <h3 className="text-xl font-extrabold text-white drop-shadow">
            {current.title}
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-snug text-gray-200 line-clamp-2">
            <TypewriterText text={current.body} />
          </p>

          {/* Play Now / Discord button */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            onClick={() => {
              if (current.action === "discord") {
                open(Config.DISCORD_LINK);
                return;
              }
              navigate("/library");
            }}
            whileHover={{ scale: 1.05, transition: { duration: 0.15, delay: 0 } }}
            whileTap={{ scale: 0.94, transition: { duration: 0.1, delay: 0 } }}
            className={`play-now-button mt-3 rounded-md px-5 py-2 text-sm font-bold shadow-lg ${current.action === "discord" ? "discord-variant" : ""}`}
          >
            {current.action === "discord" ? "Join Discord" : "Play Now"}
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      {carouselItems.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5">
          {carouselItems.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIndex(i);
                restartInterval();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Prev / Next hover arrows */}
      {carouselItems.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-black/60 hover:scale-110"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-black/60 hover:scale-110"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
