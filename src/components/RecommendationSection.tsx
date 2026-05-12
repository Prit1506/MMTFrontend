import React, { useEffect, useState, useRef } from "react";
import {
  Plane,
  Building2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { getRecommendations, submitRecommendationFeedback } from "@/api";
import { setUser } from "@/store";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Recommendation {
  id: string;
  type: "FLIGHT" | "HOTEL";
  name: string;
  description: string;
  location?: string;
  from?: string;
  to?: string;
  price: number;
  reason: string;
  reasonCategory:
    | "past_destination"
    | "collaborative"
    | "price_match"
    | "preference_inferred"
    | "trending";
  matchScore: number;
  amenities?: string;
}

// ── Category pill config ──────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  string,
  { label: string; Icon: React.ElementType; color: string }
> = {
  past_destination: {
    label: "Revisit favourite",
    Icon: MapPin,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  collaborative: {
    label: "Similar travellers loved this",
    Icon: Users,
    color: "bg-violet-100 text-violet-700 border-violet-200",
  },
  price_match: {
    label: "Matches your budget",
    Icon: TrendingUp,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  preference_inferred: {
    label: "Fits your travel style",
    Icon: Sparkles,
    color: "bg-pink-100 text-pink-700 border-pink-200",
  },
  trending: {
    label: "Trending this week",
    Icon: TrendingUp,
    color: "bg-sky-100 text-sky-700 border-sky-200",
  },
};

// ── Destination images (Unsplash, keyed by partial location match) ────────────
const DESTINATION_IMAGES: Record<string, string> = {
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600",
  mumbai:
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600",
  delhi:
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600",
  bangalore:
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600",
  jaipur:
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600",
  shimla:
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600",
  kerala:
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600",
  default_flight:
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600",
  default_hotel:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600",
};

function getDestinationImage(rec: Recommendation): string {
  const haystack = (
    (rec.location || rec.to || rec.description || "") + " " + (rec.name || "")
  ).toLowerCase();
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (key.startsWith("default_")) continue;
    if (haystack.includes(key)) return url;
  }
  return rec.type === "FLIGHT"
    ? DESTINATION_IMAGES.default_flight
    : DESTINATION_IMAGES.default_hotel;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function WhyTooltip({ reason }: { reason: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setVisible(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
        onClick={() => setVisible((v) => !v)}
        aria-label="Why this recommendation?"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>Why this?</span>
      </button>

      {visible && (
        <div
          className="absolute z-[200] bottom-full mb-3 left-0 w-64
                        bg-gray-900 text-white text-xs rounded-xl p-4 shadow-2xl
                        after:content-[''] after:absolute after:top-full after:left-5
                        after:border-8 after:border-transparent
                        after:border-t-gray-900"
        >
          <p className="font-semibold text-blue-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Why we recommend this
          </p>
          <p className="leading-relaxed text-gray-200 text-[11px]">{reason}</p>
        </div>
      )}
    </div>
  );
}

// ── Single recommendation card ────────────────────────────────────────────────
function RecommendationCard({
  rec,
  feedbackState,
  onFeedback,
  onBook,
}: {
  rec: Recommendation;
  feedbackState: "helpful" | "irrelevant" | null;
  onFeedback: (helpful: boolean) => void;
  onBook: () => void;
}) {
  const catConf =
    CATEGORY_CONFIG[rec.reasonCategory] || CATEGORY_CONFIG.trending;
  const CatIcon = catConf.Icon;
  const imgUrl = getDestinationImage(rec);

  return (
    <div
      className={`group relative flex-shrink-0 w-72 rounded-2xl bg-white
                    shadow-md hover:shadow-xl border border-gray-100
                    transition-all duration-300 hover:-translate-y-1
                    ${feedbackState === "irrelevant" ? "opacity-40 pointer-events-none" : ""}`}
    >
      {/* Image — overflow-hidden is scoped here only, not the outer card */}
      <div className="relative h-44 overflow-hidden rounded-t-2xl">
        <img
          src={imgUrl}
          alt={rec.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
          {rec.type === "FLIGHT" ? (
            <Plane className="w-3 h-3 text-blue-600" />
          ) : (
            <Building2 className="w-3 h-3 text-green-600" />
          )}
          <span className={rec.type === "FLIGHT" ? "text-blue-700" : "text-green-700"}>
            {rec.type === "FLIGHT" ? "Flight" : "Hotel"}
          </span>
        </div>

        {/* Price */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur rounded-xl px-3 py-1 text-right shadow-sm">
          <span className="font-black text-lg text-gray-900">
            ₹{rec.price.toLocaleString("en-IN")}
          </span>
          {rec.type === "HOTEL" && (
            <span className="text-[10px] text-gray-500 block -mt-0.5">/ night</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Category pill */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mb-2 ${catConf.color}`}
        >
          <CatIcon className="w-2.5 h-2.5" />
          {catConf.label}
        </span>

        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 mb-0.5">
          {rec.name}
        </h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3 line-clamp-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {rec.description}
        </p>

        {/* Why tooltip + feedback */}
        <div className="border-t border-gray-100 pt-3 mt-1">
          <div className="flex items-center justify-between gap-2">
            <WhyTooltip reason={rec.reason} />
            <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onFeedback(true)}
              aria-label="Mark as helpful"
              title="Helpful"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                feedbackState === "helpful"
                  ? "bg-green-500 text-white shadow-md scale-105"
                  : "bg-green-100 text-green-700 hover:bg-green-500 hover:text-white"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Helpful</span>
            </button>
            <button
              onClick={() => onFeedback(false)}
              aria-label="Mark as not relevant"
              title="Not relevant"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                feedbackState === "irrelevant"
                  ? "bg-red-500 text-white shadow-md scale-105"
                  : "bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>No</span>
            </button>
            </div>
          </div>
        </div>

        {/* Book CTA */}
        <button
          onClick={onBook}
          className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          {rec.type === "FLIGHT" ? "View Flight" : "View Hotel"}
        </button>
      </div>

      {/* "Helpful" checkmark overlay */}
      {feedbackState === "helpful" && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
          ✓ Saved
        </div>
      )}
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function RecommendationSection() {
  const user = useSelector((state: any) => state.user.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<
    Record<string, "helpful" | "irrelevant">
  >({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const data = await getRecommendations(user?.id || null);
        if (data) setRecs(data);
      } catch (e) {
        console.error("Failed to fetch recommendations", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [user?.id]);

  const handleFeedback = async (
    rec: Recommendation,
    helpful: boolean
  ) => {
    const next = helpful ? "helpful" : "irrelevant";
    setFeedback((prev) => ({ ...prev, [rec.id]: next }));

    if (!user) return; // anonymous users can't persist feedback

    try {
      const updated = await submitRecommendationFeedback(
        user.id,
        rec.id,
        rec.type,
        helpful
      );
      if (updated) dispatch(setUser(updated));

      // After marking irrelevant, refresh recommendations after a short pause
      if (!helpful) {
        setTimeout(async () => {
          const fresh = await getRecommendations(user.id);
          if (fresh) setRecs(fresh);
          setFeedback((prev) => {
            const copy = { ...prev };
            delete copy[rec.id];
            return copy;
          });
        }, 800);
      }
    } catch (e) {
      console.error("Feedback submission failed", e);
    }
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const handleBook = (rec: Recommendation) => {
    if (rec.type === "FLIGHT") router.push(`/book-flight/${rec.id}`);
    else router.push(`/book-hotel/${rec.id}`);
  };

  return (
    <section className="my-16 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {user ? "Personalised for you" : "Trending picks"}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight">
            {user
              ? `Hi ${user.firstName}, here's what we picked for you`
              : "Top picks from MakeMyTour"}
          </h2>
          {user && (
            <p className="text-blue-200 text-sm mt-1">
              Based on your travel history · Refreshes as you explore
            </p>
          )}
        </div>

        {/* Scroll buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white/5 rounded-2xl backdrop-blur">
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Finding your perfect matches…</p>
          </div>
        </div>
      ) : recs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white/5 rounded-2xl text-white/50">
          <Sparkles className="w-8 h-8 mb-2" />
          <p>No recommendations available right now. Check back soon!</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth
                       [-webkit-overflow-scrolling:touch]
                       [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {recs.map((rec) => (
            <div key={rec.id} className="snap-start">
              <RecommendationCard
                rec={rec}
                feedbackState={feedback[rec.id] ?? null}
                onFeedback={(helpful) => handleFeedback(rec, helpful)}
                onBook={() => handleBook(rec)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}