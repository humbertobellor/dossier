import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/i18n";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  MapPin,
  Shield,
  Cloud,
  Brain,
  Users,
  Code2,
  Zap,
  Lock,
  Globe,
  ChevronDown,
  Building2,
  Award,
  ArrowRight,
  BarChart2,
  Landmark,
  CreditCard,
  Smartphone,
  Activity,
  ShoppingCart,
} from "lucide-react";
import headshot from "@assets/headshot-corp_1776959044728.png";

const teal = "#56B5A3";

const clientIcons = [BarChart2, Landmark, CreditCard, Smartphone, Activity, ShoppingCart];
const clientKeys = ["financialServices", "banking", "fintech", "telecom", "healthtech", "retail"] as const;
const clientNames = ["Equifax", "Fifth Third Bank", "FISERV", "TracFone / MVNO", "J&J - Medical Devices", "Dollar General"];

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

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("hero");
  const [currentLang, setCurrentLang] = useState(i18n.language.split("-")[0] || "en");
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -40]);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
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
      { threshold: 0.4 }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { id: "hero", label: t("nav.about") },
    { id: "skills", label: t("nav.skills") },
    { id: "experience", label: t("nav.experience") },
    { id: "clients", label: t("nav.clients") },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const skillCategories = [
    { icon: Brain, key: "ai" },
    { icon: Cloud, key: "cloud" },
    { icon: Code2, key: "engineering" },
    { icon: Lock, key: "security" },
    { icon: Users, key: "leadership" },
    { icon: Globe, key: "digital" },
  ];

  const heroBullets: string[] = t("hero.bullets", { returnObjects: true }) as string[];
  const experienceEntries: { company: string; highlight: string; description: string }[] =
    t("experience.entries", { returnObjects: true }) as { company: string; highlight: string; description: string }[];
  const skillItems = (key: string): string[] =>
    t(`skills.categories.${key}.items`, { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Nav */}
      <nav
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b"
        style={{ background: "hsla(215,28%,8%,0.88)", borderColor: "rgba(86,181,163,0.15)" }}
        data-testid="nav"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => scrollTo("hero")}
            className="font-serif text-lg font-bold tracking-tight"
            style={{ color: teal }}
            data-testid="nav-logo"
          >
            Bert Bello
          </button>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: activeSection === link.id ? teal : "rgba(210,220,225,0.75)" }}
                data-testid={`nav-${link.id}`}
              >
                {link.label}
              </button>
            ))}
            <a
              href="/Humberto_Bello_Resume.pdf"
              download="Humberto_Bello_Resume.pdf"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
              style={{ color: "rgba(210,220,225,0.75)" }}
              onMouseEnter={e => (e.currentTarget.style.color = teal)}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(210,220,225,0.75)")}
              data-testid="nav-resume"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t("nav.resume")}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: "rgba(86,181,163,0.25)" }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="px-2.5 py-1 text-xs font-semibold transition-all duration-150"
                  style={{
                    background: currentLang === lang.code ? teal : "transparent",
                    color: currentLang === lang.code ? "#fff" : "rgba(210,220,225,0.60)",
                  }}
                  data-testid={`lang-${lang.code}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <a
              href="mailto:humberto.bello@protonmail.com"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
              style={{ background: teal, color: "#fff" }}
              data-testid="nav-contact"
            >
              {t("nav.getInTouch")}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1821 0%, #1a2a38 55%, #0f2220 100%)" }}
        data-testid="section-hero"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl pointer-events-none" style={{ background: teal }} />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full opacity-[0.06] blur-3xl pointer-events-none" style={{ background: "#2a7ecb" }} />

        {/* LEFT — Full-bleed photo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 w-1/2 hidden md:block"
          data-testid="hero-photo-col"
        >
          <img src={headshot} alt="Humberto Bert Bello" className="w-full h-full object-cover" style={{ objectPosition: "center top" }} data-testid="hero-headshot" />
          <div className="absolute inset-y-0 right-0 w-32" style={{ background: "linear-gradient(to right, transparent, #0d1821)" }} />
          <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: "linear-gradient(to top, rgba(13,24,33,0.7), transparent)" }} />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 w-full flex items-center min-h-screen">
          <div className="w-full md:w-1/2 md:ml-auto px-8 md:px-12 py-28 md:py-0">

            {/* Mobile headshot */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center mb-8 md:hidden"
              data-testid="hero-photo-mobile"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-xl scale-110 opacity-40" style={{ background: `linear-gradient(135deg, ${teal}, #2a7ecb)` }} />
                <div className="absolute -inset-1 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(86,181,163,0.45) 0%, rgba(42,126,203,0.25) 100%)" }} />
                <img src={headshot} alt="Humberto Bert Bello" className="relative w-48 h-48 object-cover rounded-2xl" style={{ objectPosition: "center top" }} />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} data-testid="hero-content-col">
              <h1
                className="font-serif font-bold leading-tight mb-3"
                style={{ color: "#fff", fontSize: "clamp(2.4rem, 5vw, 3.8rem)" }}
                data-testid="hero-name"
              >
                Humberto <span style={{ color: teal }}>&ldquo;Bert&rdquo;</span> Bello
              </h1>

              <p className="text-lg font-light mb-8 leading-relaxed" style={{ color: "rgba(210,225,230,0.75)" }} data-testid="hero-title">
                {t("hero.title")}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { value: "20+", key: "architecture" },
                  { value: "15+", key: "teams" },
                  { value: "3", key: "continents" },
                  { value: "19M+", key: "subscribers" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.08, duration: 0.5 }}
                    className="rounded-xl p-3.5 border"
                    style={{ background: "rgba(86,181,163,0.06)", borderColor: "rgba(86,181,163,0.18)" }}
                    data-testid={`stat-${stat.key}`}
                  >
                    <div className="text-xl font-bold font-serif" style={{ color: teal }}>{stat.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(210,225,230,0.55)" }}>{t(`hero.stats.${stat.key}`)}</div>
                  </motion.div>
                ))}
              </div>

              {/* Bullets */}
              <div className="flex flex-col gap-2.5 mb-8">
                {heroBullets.map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.12, duration: 0.5 }}
                    className="flex items-start gap-2.5"
                    data-testid={`hero-bullet-${i}`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: teal }} />
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(210,225,230,0.70)" }}>{point}</p>
                  </motion.div>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-9">
                {["GDPR", "HIPAA", "SOX", "SOC", "FHIR", "AWS", "GCP", "Azure", "Gen AI"].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ background: "rgba(86,181,163,0.07)", borderColor: "rgba(86,181,163,0.22)", color: teal }} data-testid={`tag-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>

              <motion.button
                onClick={() => scrollTo("skills")}
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: "rgba(210,225,230,0.45)" }}
                data-testid="hero-scroll-hint"
              >
                {t("hero.scrollHint")} <ChevronDown size={15} />
              </motion.button>
            </motion.div>
          </div>

          {/* Hero footer badge */}
          <div className="absolute bottom-0 inset-x-0 flex justify-center pb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-semibold"
              style={{ background: "rgba(13,24,33,0.70)", borderColor: "rgba(86,181,163,0.25)", color: "rgba(210,225,230,0.60)", backdropFilter: "blur(8px)" }}
              data-testid="hero-credential-badge"
            >
              <Shield size={12} style={{ color: teal }} />
              {t("hero.badge")}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-24 px-6" data-testid="section-skills">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: teal }}>
                {t("skills.label")}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("skills.title")}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t("skills.subtitle")}</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillCategories.map((cat, i) => {
              const Icon = cat.icon;
              const items = skillItems(cat.key);
              return (
                <FadeInSection key={cat.key} delay={i * 0.08}>
                  <div
                    className="rounded-2xl p-6 border h-full"
                    style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
                    data-testid={`skill-card-${cat.key}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(86,181,163,0.12)" }}>
                        <Icon size={20} style={{ color: teal }} />
                      </div>
                      <h3 className="font-semibold text-base">{t(`skills.categories.${cat.key}.title`)}</h3>
                    </div>
                    <ul className="space-y-2">
                      {items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: teal }} />
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

      {/* Experience Section */}
      <section
        id="experience"
        className="py-24 px-6"
        style={{ background: "linear-gradient(180deg, transparent 0%, hsl(215,30%,9%) 100%)" }}
        data-testid="section-experience"
      >
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: teal }}>
                {t("experience.label")}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("experience.title")}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t("experience.subtitle")}</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experienceEntries.map((exp, i) => (
              <FadeInSection key={i} delay={i * 0.08}>
                <div
                  className="rounded-2xl p-6 border h-full flex flex-col"
                  style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
                  data-testid={`exp-card-${i}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(86,181,163,0.10)" }}>
                      <Building2 size={16} style={{ color: teal }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">{exp.company}</p>
                      <h3 className="font-semibold text-base leading-snug">{exp.highlight}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{exp.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {expTags[i].map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-xs font-medium border"
                        style={{ background: "rgba(86,181,163,0.08)", borderColor: "rgba(86,181,163,0.20)", color: teal }}
                        data-testid={`exp-tag-${tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section id="clients" className="py-24 px-6" data-testid="section-clients">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: teal }}>
                {t("clients.label")}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">{t("clients.title")}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t("clients.subtitle")}</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20">
            {clientNames.map((name, i) => {
              const Icon = clientIcons[i];
              const catKey = clientKeys[i];
              return (
                <FadeInSection key={name} delay={i * 0.06}>
                  <div
                    className="rounded-2xl p-6 border text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                    style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
                    data-testid={`client-card-${i}`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(86,181,163,0.10)" }}>
                      <Icon size={22} style={{ color: teal }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{name}</h3>
                    <p className="text-xs text-muted-foreground">{t(`clients.categories.${catKey}`)}</p>
                  </div>
                </FadeInSection>
              );
            })}
          </div>

          {/* CTA Banner */}
          <FadeInSection>
            <div
              className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0d2520 0%, #0f3028 100%)", border: "1px solid rgba(86,181,163,0.20)" }}
              data-testid="cta-banner"
            >
              <div className="absolute inset-0 opacity-5 blur-2xl" style={{ background: teal }} />
              <div className="relative z-10">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium border"
                  style={{ background: "rgba(86,181,163,0.12)", borderColor: "rgba(86,181,163,0.30)", color: teal }}
                >
                  <Zap size={14} />
                  {t("cta.badge")}
                </div>
                <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4" style={{ color: "#fff" }}>
                  {t("cta.title")}
                </h3>
                <p className="max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: "rgba(210,225,230,0.70)" }}>
                  {t("cta.subtitle")}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <a
                    href="mailto:humberto.bello@protonmail.com"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90"
                    style={{ background: teal, color: "#fff" }}
                    data-testid="cta-email"
                  >
                    {t("cta.email")} <ArrowRight size={16} />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-all duration-200 hover:opacity-80"
                    style={{ borderColor: "rgba(86,181,163,0.40)", color: teal, background: "rgba(86,181,163,0.06)" }}
                    data-testid="cta-linkedin"
                  >
                    {t("cta.linkedin")}
                  </a>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6"
        style={{ borderColor: "rgba(86,181,163,0.12)", background: "hsl(215,30%,9%)" }}
        data-testid="footer"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-lg" style={{ color: teal }}>
              Humberto &ldquo;Bert&rdquo; Bello
            </span>
            <span className="text-muted-foreground text-sm">|</span>
            <span className="text-muted-foreground text-sm">{t("footer.role")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} style={{ color: teal }} />
            {t("footer.location")}
          </div>
        </div>
      </footer>
    </div>
  );
}
