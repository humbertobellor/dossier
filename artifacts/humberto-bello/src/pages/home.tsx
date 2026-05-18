import { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/i18n";
import {
  MapPin,
  Shield,
  Cloud,
  Brain,
  Users,
  Code2,
  Lock,
  Globe,
  ChevronDown,
  Building2,
  ArrowRight,
  BarChart2,
  Landmark,
  CreditCard,
  Smartphone,
  Activity,
  ShoppingCart,
  Zap,
} from "lucide-react";
import headshotPng from "@assets/headshot-corp_1776959044728.png";
import headshotWebp from "@assets/headshot-corp_1776959044728.webp";
import headshotAvif from "@assets/headshot-corp_1776959044728.avif";
import headshotWebp1x from "@assets/headshot-corp_1776959044728@1x.webp";
import headshotAvif1x from "@assets/headshot-corp_1776959044728@1x.avif";
import { ContactForm } from "../components/ContactForm";
import { Changelog } from "../components/Changelog";

/* ---- Wolknitive palette constants ---- */
const INK      = "#14110B";
const TEAL     = "#1B4E4A";
const TEAL_6   = "#103A37";
const V50      = "#FAF6EC";
const V100     = "#F3ECD9";
const V200     = "#E7DCC0";
const V300     = "#CFBE96";
const V400     = "#9C8A64";
const V500     = "#6B5C3E";
const V700     = "#2E261A";

const clientIcons = [BarChart2, Landmark, CreditCard, Smartphone, Activity, ShoppingCart];
const clientKeys  = ["financialServices", "banking", "fintech", "telecom", "healthtech", "retail"] as const;
const clientNames = ["Equifax", "Fifth Third Bank", "FISERV", "Verizon / MVNO", "J&J — Medical Devices", "Dollar General"];

const expTags = [
  ["Team Scaling", "SAFe / PI Planning", "Governance", "Global Teams"],
  ["K8s", "Istio", "Apigee", "Spring Boot", "Kafka"],
  ["LangChain", "Python", "React", "Azure OpenAI", "Zilliz", "AWS Bedrock", "Claude Code", "QWEN", "Opus", "Sonnet"],
  ["Middleware", "Portal", "Modernization", "8 Brands"],
  ["OpenBanking", "Event Processing", "Payments", "Solution Architecture"],
  ["AWS", "Microservices", "Event Streaming", "2.4M Users"],
];

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "de", label: "DE" },
];

/* ---- Lazy below-fold animations (Framer Motion loaded after initial render) ---- */

const LazyFadeIn = lazy(() =>
  import("../components/FadeIn").then((m) => ({ default: m.FadeInSection })),
);

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <LazyFadeIn delay={delay}>{children}</LazyFadeIn>
    </Suspense>
  );
}

/* ---- Shared primitives ---- */

/** Editorial double-rule section separator */
function WkRule() {
  return <hr className="wk-rule" />;
}

/** Section header with editorial double-rule, eyebrow label, and Bogart heading */
function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <FadeInSection>
      <div className="mb-14">
        <WkRule />
        <div className="mt-5">
          <span className="wk-label block mb-3">{label}</span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: INK,
              marginBottom: subtitle ? "0.6rem" : 0,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--fs-md)",
                color: V500,
                maxWidth: "42rem",
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </FadeInSection>
  );
}

/** Hairline pill tag */
function Tag({
  label,
  accent = false,
}: {
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "var(--fs-xs)",
        fontWeight: 500,
        letterSpacing: "0.04em",
        padding: "3px 10px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${accent ? TEAL : V300}`,
        color: accent ? TEAL : V500,
        background: accent ? "rgba(27,78,74,0.05)" : "transparent",
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </span>
  );
}

/* ============================================================
   Main page component
   ============================================================ */
export default function Home() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("hero");
  const [currentLang, setCurrentLang] = useState(i18n.language.split("-")[0] || "en");

  const changeLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    setCurrentLang(code);
  };

  useEffect(() => {
    const sections = ["hero", "skills", "experience", "clients"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.35 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { id: "hero",       label: t("nav.about") },
    { id: "skills",     label: t("nav.skills") },
    { id: "experience", label: t("nav.experience") },
    { id: "clients",    label: t("nav.clients") },
  ];

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const skillCategories = [
    { icon: Brain,  key: "ai" },
    { icon: Cloud,  key: "cloud" },
    { icon: Code2,  key: "engineering" },
    { icon: Lock,   key: "security" },
    { icon: Users,  key: "leadership" },
    { icon: Globe,  key: "digital" },
  ];

  const heroBullets: string[] = t("hero.bullets", { returnObjects: true }) as string[];
  const experienceEntries: { company: string; highlight: string; description: string }[] =
    t("experience.entries", { returnObjects: true }) as { company: string; highlight: string; description: string }[];
  const skillItems = (key: string): string[] =>
    t(`skills.categories.${key}.items`, { returnObjects: true }) as string[];

  /* ---- Nav shared styles ---- */
  const navLinkStyle = (id: string) => ({
    fontFamily: "var(--font-ui)",
    fontSize: "var(--fs-sm)",
    fontWeight: 500 as const,
    color: activeSection === id ? TEAL : V500,
    textDecoration: activeSection === id ? `underline` : "none",
    textUnderlineOffset: "3px",
    textDecorationThickness: "1px",
    transition: "color 0.15s",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  });

  return (
    <div style={{ minHeight: "100vh", background: V50, color: INK }}>

      {/* ───────────── STICKY NAV ───────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          insetInline: 0,
          zIndex: 50,
          background: "rgba(250,246,236,0.93)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          borderBottom: `1px solid ${V300}`,
        }}
        data-testid="nav"
      >
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "3.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => scrollTo("hero")}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "var(--fs-md)",
              color: INK,
              background: "none",
              border: "none",
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
            data-testid="nav-logo"
          >
            Bert Bello
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                style={navLinkStyle(link.id)}
                data-testid={`nav-${link.id}`}
              >
                {link.label}
              </button>
            ))}
            <a
              href="/Humberto_Bello_Resume.pdf"
              download="Humberto_Bello_Resume.pdf"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--fs-xs)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: V500,
                border: `1px solid ${V300}`,
                borderRadius: "var(--radius-sm)",
                padding: "4px 12px",
                textDecoration: "none",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = TEAL;
                e.currentTarget.style.color = TEAL;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = V300;
                e.currentTarget.style.color = V500;
              }}
              data-testid="nav-resume"
            >
              {t("nav.resume")}
            </a>
          </div>

          {/* Right cluster */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {/* Language switcher */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: `1px solid ${V300}`,
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
              }}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    padding: "4px 9px",
                    background: currentLang === lang.code ? TEAL : "transparent",
                    color: currentLang === lang.code ? V50 : V500,
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  data-testid={`lang-${lang.code}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Mobile resume — icon + text pill */}
            <a
              href="/Humberto_Bello_Resume.pdf"
              download="Humberto_Bello_Resume.pdf"
              className="md:hidden"
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: V500,
                border: `1px solid ${V300}`,
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              title={t("nav.resume")}
              data-testid="nav-resume-mobile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t("nav.resume")}
            </a>

            {/* CTA — filled teal button */}
            <a
              href="mailto:humberto.bello@protonmail.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontFamily: "var(--font-ui)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                background: TEAL,
                color: V50,
                textDecoration: "none",
                boxShadow: "var(--shadow-1)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = TEAL_6)}
              onMouseLeave={e => (e.currentTarget.style.background = TEAL)}
              data-testid="nav-contact"
              title={t("nav.getInTouch")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span className="hidden md:inline">{t("nav.getInTouch")}</span>
            </a>
          </div>
        </div>
      </nav>

      <main id="main-content">

      {/* ───────────── HERO ───────────── */}
      <section
        id="hero"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background: V50,
          position: "relative",
          overflow: "hidden",
        }}
        data-testid="section-hero"
      >
        {/* Left — full-bleed photo, desktop only */}
        <div
          className="wk-anim-fade-left absolute inset-y-0 left-0 w-1/2 hidden md:block"
          data-testid="hero-photo-col"
        >
          <picture>
            <source
              srcSet={`${headshotAvif1x} 350w, ${headshotAvif} 700w`}
              type="image/avif"
              media="(min-width: 768px)"
              sizes="(max-width: 1280px) 50vw, 640px"
            />
            <source
              srcSet={`${headshotWebp1x} 350w, ${headshotWebp} 700w`}
              type="image/webp"
              media="(min-width: 768px)"
              sizes="(max-width: 1280px) 50vw, 640px"
            />
            <img
              src={headshotPng}
              alt="Humberto Bert Bello"
              fetchPriority="high"
              loading="eager"
              width={700}
              height={700}
              sizes="(max-width: 1280px) 50vw, 640px"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              data-testid="hero-headshot"
            />
          </picture>
          {/* Warm vellum fade on right edge */}
          <div
            style={{
              position: "absolute",
              insetBlock: 0,
              right: 0,
              width: "10rem",
              background: `linear-gradient(to right, transparent, ${V50})`,
            }}
          />
          {/* Subtle warm overlay on photo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `${V50}`,
              opacity: 0.06,
              mixBlendMode: "multiply",
            }}
          />
        </div>

        {/* Right — content column */}
        <div
          style={{ position: "relative", zIndex: 10, width: "100%", display: "flex", alignItems: "center", minHeight: "100vh" }}
        >
          <div
            style={{ padding: "7rem 2rem 5rem" }}
            className="w-full md:w-1/2 md:ml-auto md:px-12 md:py-0"
          >
            {/* Mobile headshot */}
            <div
              className="wk-anim-fade-scale flex justify-center mb-8 md:hidden"
              data-testid="hero-photo-mobile"
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "var(--radius-lg)",
                    border: `1px solid ${V300}`,
                  }}
                />
                <picture>
                  <source
                    srcSet={`${headshotAvif1x} 350w, ${headshotAvif} 700w`}
                    type="image/avif"
                    media="(max-width: 767px)"
                    sizes="336px"
                  />
                  <source
                    srcSet={`${headshotWebp1x} 350w, ${headshotWebp} 700w`}
                    type="image/webp"
                    media="(max-width: 767px)"
                    sizes="336px"
                  />
                  <img
                    src={headshotPng}
                    alt="Humberto Bert Bello"
                    fetchPriority="high"
                    loading="eager"
                    width={700}
                    height={700}
                    sizes="336px"
                    style={{
                      width: "10.5rem",
                      height: "10.5rem",
                      objectFit: "cover",
                      objectPosition: "center top",
                      borderRadius: "var(--radius-lg)",
                      display: "block",
                    }}
                  />
                </picture>
              </div>
            </div>

            {/* Hero content */}
            <div
              className="wk-anim-fade-right"
              style={{ animationDelay: "0.1s" }}
              data-testid="hero-content-col"
            >
              {/* Name */}
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.015em",
                  color: INK,
                  marginBottom: "0.9rem",
                  textWrap: "balance",
                }}
                data-testid="hero-name"
              >
                Humberto{" "}
                <span style={{ fontStyle: "italic", color: TEAL }}>
                  &ldquo;Bert&rdquo;
                </span>{" "}
                Bello
              </h1>

              {/* Title / subtitle */}
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-md)",
                  color: V500,
                  marginBottom: "1.75rem",
                  lineHeight: 1.55,
                }}
                data-testid="hero-title"
              >
                {t("hero.title")}
              </p>

              {/* Stat cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.625rem",
                  marginBottom: "1.75rem",
                }}
              >
                {[
                  { value: "20+", key: "architecture" },
                  { value: "15+", key: "teams" },
                  { value: "3",   key: "continents" },
                  { value: "19M+",key: "subscribers" },
                ].map((stat, i) => (
                  <div
                    key={stat.key}
                    className="wk-anim-fade-up"
                    style={{
                      animationDelay: `${0.3 + i * 0.07}s`,
                      background: V100,
                      border: `1px solid ${V200}`,
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem 0.875rem",
                      boxShadow: "var(--shadow-1)",
                    }}
                    data-testid={`stat-${stat.key}`}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "var(--fs-xl)",
                        color: TEAL,
                        lineHeight: 1,
                        marginBottom: "0.2rem",
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--fs-xs)",
                        fontWeight: 500,
                        color: V500,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {t(`hero.stats.${stat.key}`)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
                {heroBullets.map((point, i) => (
                  <div
                    key={i}
                    className="wk-anim-fade-left-sm"
                    style={{ animationDelay: `${0.5 + i * 0.1}s`, display: "flex", alignItems: "flex-start", gap: "0.625rem" }}
                    data-testid={`hero-bullet-${i}`}
                  >
                    <div
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: TEAL,
                        flexShrink: 0,
                        marginTop: "0.5rem",
                      }}
                    />
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--fs-sm)",
                        color: V700,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              {/* Compliance / tech tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "2rem" }}>
                {["GDPR", "HIPAA", "SOX", "SOC", "FHIR", "AWS", "GCP", "Azure", "Gen AI"].map((tag) => (
                  <Tag key={tag} label={tag} accent />
                ))}
              </div>

              {/* Credential badge */}
              <div
                className="wk-anim-fade-up-sm"
                style={{
                  animationDelay: "0.85s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 500,
                  color: V500,
                  border: `1px solid ${V300}`,
                  borderRadius: "var(--radius-pill)",
                  padding: "5px 14px",
                  marginBottom: "2rem",
                }}
                data-testid="hero-credential-badge"
              >
                <Shield size={11} style={{ color: TEAL }} />
                {t("hero.badge")}
              </div>

              {/* Scroll hint */}
              <div style={{ display: "block" }}>
                <button
                  onClick={() => scrollTo("skills")}
                  className="wk-anim-bounce-y"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 500,
                    color: V500,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.04em",
                  }}
                  data-testid="hero-scroll-hint"
                >
                  {t("hero.scrollHint")} <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── SKILLS ───────────── */}
      <section
        id="skills"
        style={{ padding: "6rem 1.5rem", background: V50 }}
        data-testid="section-skills"
      >
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <SectionHeader
            label={t("skills.label")}
            title={t("skills.title")}
            subtitle={t("skills.subtitle")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {skillCategories.map((cat, i) => {
              const Icon = cat.icon;
              const items = skillItems(cat.key);
              return (
                <FadeInSection key={cat.key} delay={i * 0.07}>
                  <div
                    style={{
                      background: V100,
                      border: `1px solid ${V200}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "1.375rem 1.5rem",
                      height: "100%",
                      boxShadow: "var(--shadow-1)",
                    }}
                    data-testid={`skill-card-${cat.key}`}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                      <div
                        style={{
                          width: "2.25rem",
                          height: "2.25rem",
                          borderRadius: "var(--radius-md)",
                          background: "rgba(27,78,74,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={17} style={{ color: TEAL }} />
                      </div>
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "var(--fs-base)",
                          color: INK,
                          margin: 0,
                        }}
                      >
                        {t(`skills.categories.${cat.key}.title`)}
                      </h3>
                    </div>

                    {/* Items */}
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                      {items.map((item, j) => (
                        <li
                          key={j}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.5rem",
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--fs-sm)",
                            color: V500,
                            lineHeight: 1.55,
                          }}
                        >
                          <div
                            style={{
                              width: "4px",
                              height: "4px",
                              borderRadius: "50%",
                              background: V300,
                              flexShrink: 0,
                              marginTop: "0.46rem",
                            }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────── EXPERIENCE ───────────── */}
      <section
        id="experience"
        style={{ padding: "6rem 1.5rem", background: V50 }}
        data-testid="section-experience"
      >
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <SectionHeader
            label={t("experience.label")}
            title={t("experience.title")}
            subtitle={t("experience.subtitle")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {experienceEntries.map((exp, i) => (
              <FadeInSection key={i} delay={i * 0.07}>
                <div
                  style={{
                    background: V100,
                    border: `1px solid ${V200}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "1.375rem 1.5rem",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "var(--shadow-1)",
                  }}
                  data-testid={`exp-card-${i}`}
                >
                  {/* Company label + icon */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.6rem" }}>
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(27,78,74,0.07)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "1px",
                      }}
                    >
                      <Building2 size={14} style={{ color: TEAL }} />
                    </div>
                    <div>
                      {/* Company: Inter Tight uppercase label */}
                      <p
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "var(--fs-xs)",
                          fontWeight: 600,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color: V500,
                          marginBottom: "1px",
                        }}
                      >
                        {exp.company}
                      </p>
                      {/* Highlight: Bogart value */}
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "var(--fs-base)",
                          color: INK,
                          lineHeight: 1.3,
                          margin: 0,
                        }}
                      >
                        {exp.highlight}
                      </h3>
                    </div>
                  </div>

                  {/* Hairline rule */}
                  <div style={{ borderTop: `0.5px solid ${V200}`, marginBottom: "0.75rem" }} />

                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--fs-sm)",
                      color: V500,
                      lineHeight: 1.65,
                      flex: 1,
                      marginBottom: "1rem",
                    }}
                  >
                    {exp.description}
                  </p>

                  {/* Tech tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                    {expTags[i].map((tag) => (
                      <Tag key={tag} label={tag} />
                    ))}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CLIENTS ───────────── */}
      <section
        id="clients"
        style={{ padding: "6rem 1.5rem 5rem", background: V50 }}
        data-testid="section-clients"
      >
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <SectionHeader
            label={t("clients.label")}
            title={t("clients.title")}
            subtitle={t("clients.subtitle")}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
            {clientNames.map((name, i) => {
              const Icon = clientIcons[i];
              const catKey = clientKeys[i];
              return (
                <FadeInSection key={name} delay={i * 0.06}>
                  <div
                    style={{
                      background: V100,
                      border: `1px solid ${V200}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "1.375rem 1rem",
                      textAlign: "center",
                      boxShadow: "var(--shadow-1)",
                      transition: "box-shadow 0.2s, transform 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-2)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-1)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    }}
                    data-testid={`client-card-${i}`}
                  >
                    <div
                      style={{
                        width: "2.75rem",
                        height: "2.75rem",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(27,78,74,0.07)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 0.625rem",
                      }}
                    >
                      <Icon size={20} style={{ color: TEAL }} />
                    </div>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "var(--fs-sm)",
                        color: INK,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {name}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "var(--fs-xs)",
                        color: V500,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {t(`clients.categories.${catKey}`)}
                    </p>
                  </div>
                </FadeInSection>
              );
            })}
          </div>

          {/* ── CTA Banner ── */}
          <FadeInSection>
            <div
              style={{
                background: V100,
                border: `1px solid ${V200}`,
                borderRadius: "var(--radius-lg)",
                padding: "3.5rem 2rem",
                textAlign: "center",
                boxShadow: "var(--shadow-2)",
                position: "relative",
                overflow: "hidden",
              }}
              data-testid="cta-banner"
            >
              {/* Subtle teal tint top edge */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  insetInline: 0,
                  height: "3px",
                  background: TEAL,
                  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                  opacity: 0.6,
                }}
              />

              {/* Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: TEAL,
                  border: `1px solid ${V300}`,
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 12px",
                  marginBottom: "1.25rem",
                }}
              >
                <Zap size={11} />
                {t("cta.badge")}
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                  color: INK,
                  letterSpacing: "-0.01em",
                  marginBottom: "0.75rem",
                  lineHeight: 1.2,
                }}
              >
                {t("cta.title")}
              </h3>

              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-md)",
                  color: V500,
                  maxWidth: "36rem",
                  margin: "0 auto 1.75rem",
                  lineHeight: 1.6,
                }}
              >
                {t("cta.subtitle")}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", justifyContent: "center" }}>
                <a
                  href="mailto:humberto.bello@protonmail.com"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    padding: "10px 22px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: `1px solid ${V300}`,
                    color: V700,
                    textDecoration: "none",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = TEAL;
                    e.currentTarget.style.color = TEAL;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = V300;
                    e.currentTarget.style.color = V700;
                  }}
                  data-testid="cta-email"
                >
                  {t("cta.email")} <ArrowRight size={15} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    padding: "10px 22px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: `1px solid ${V300}`,
                    color: V700,
                    textDecoration: "none",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = TEAL;
                    e.currentTarget.style.color = TEAL;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = V300;
                    e.currentTarget.style.color = V700;
                  }}
                  data-testid="cta-linkedin"
                >
                  {t("cta.linkedin")}
                </a>
                <a
                  href="https://github.com/humbertobellor"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 600,
                    padding: "10px 22px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: `1px solid ${V300}`,
                    color: V700,
                    textDecoration: "none",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = TEAL;
                    e.currentTarget.style.color = TEAL;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = V300;
                    e.currentTarget.style.color = V700;
                  }}
                  data-testid="cta-github"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  {t("cta.github")}
                </a>
              </div>

              {/* Inline contact form */}
              <ContactForm />
            </div>
          </FadeInSection>
        </div>
      </section>

      </main>

      {/* ───────────── FOOTER ───────────── */}
      <footer
        style={{
          borderTop: `1px solid ${V300}`,
          padding: "2rem 1.5rem",
          background: V50,
        }}
        data-testid="footer"
      >
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.625rem",
            textAlign: "center",
          }}
          className="md:flex-row md:justify-between md:text-left"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap", justifyContent: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "var(--fs-md)",
                color: INK,
              }}
            >
              Humberto &ldquo;Bert&rdquo; Bello
            </span>
            <span style={{ color: V300, fontSize: "var(--fs-sm)" }}>|</span>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--fs-xs)",
                fontWeight: 500,
                color: V500,
                letterSpacing: "0.03em",
              }}
            >
              {t("footer.role")}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontFamily: "var(--font-ui)",
              fontSize: "var(--fs-xs)",
              fontWeight: 500,
              color: V500,
              letterSpacing: "0.03em",
            }}
          >
            <MapPin size={12} style={{ color: TEAL }} />
            {t("footer.location")}
          </div>
        </div>
        <Changelog />
      </footer>
    </div>
  );
}
