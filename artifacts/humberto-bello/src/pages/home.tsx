import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import headshot from "@assets/headshot-corp_1776959044728.png";

const teal = "#56B5A3";

const skillCategories = [
  {
    icon: Brain,
    title: "AI & Emerging Tech",
    items: [
      "Generative AI & Agentic Patterns",
      "RAG Engines (LangChain, Azure OpenAI, Bedrock)",
      "LLM Integration & Prompt Engineering",
      "Event-Driven Architectures",
    ],
  },
  {
    icon: Cloud,
    title: "Cloud & Infrastructure",
    items: [
      "AWS (Lambda, Bedrock, OpenSearch, S3, ECS)",
      "GCP & Azure (OpenAI, Zilliz)",
      "Kubernetes, Istio, Apigee",
      "Serverless & Microservices",
    ],
  },
  {
    icon: Code2,
    title: "Engineering & Architecture",
    items: [
      "Solution & Enterprise Architecture",
      "API Management & Design",
      "Legacy Platform Modernization",
      "Spring Boot, Kafka, React, Python",
    ],
  },
  {
    icon: Lock,
    title: "Security & Compliance",
    items: ["GDPR", "HIPAA", "SOX", "SOC", "Security Guardrails", "InfoSec Governance"],
  },
  {
    icon: Users,
    title: "Leadership & Delivery",
    items: [
      "15+ Years Global Team Leadership",
      "Agile / SAFe PI Planning",
      "End-to-End Delivery Accountability",
      "Stakeholder & Roadmap Management",
    ],
  },
  {
    icon: Globe,
    title: "Digital Experiences",
    items: [
      "Customer-Facing Digital Products",
      "Mobile & Web Platform Engineering",
      "UI/UX Standards & Implementation",
      "Integration Architecture",
    ],
  },
];

const experiences = [
  {
    company: "Equifax (EFX)",
    highlight: "Engineering Scaling & Governance",
    description:
      "Scaled engineering teams from 8 to 20 across 3 countries; ran 34 sprints and 3 PI Plannings. Led product roadmap and governance partnering with Architecture, InfoSec, and Engineering stakeholders.",
    tags: ["Team Scaling", "SAFe / PI Planning", "Governance", "Global Teams"],
  },
  {
    company: "Medical Device Company",
    highlight: "API Security for Surgical Devices",
    description:
      "Implemented API management and produced security guardrails for microservices controlling surgical devices.",
    tags: ["K8s", "Istio", "Apigee", "Spring Boot", "Kafka"],
  },
  {
    company: "Leasing / Real Estate Platform",
    highlight: "RAG Engine for Contract Management",
    description:
      "Built a RAG engine for Leasing Contract Management productivity. Produced a serverless version for AWS.",
    tags: ["LangChain", "Python", "React", "Azure OpenAI", "Zilliz", "AWS Bedrock"],
  },
  {
    company: "TracFone / Largest MVNO in USA",
    highlight: "Mobile Wireless Platform Modernization",
    description:
      "Modernized, rebuilt, and standardized the middleware and portal for Mobile Wireless service provisioning, scaling from 6M to 19M subscribers across 8 brands.",
    tags: ["Middleware", "Portal", "Modernization", "8 Brands"],
  },
  {
    company: "FISERV",
    highlight: "Real-Time Payment Network",
    description:
      "Provided solution architecture and design for event processing requirements for a real-time payment network, integrating with OpenBanking Customer APIs.",
    tags: ["OpenBanking", "Event Processing", "Payments", "Solution Architecture"],
  },
  {
    company: "Fifth Third Bank",
    highlight: "Mobile Banking Wallet",
    description:
      "Technical leader — designed and implemented integration and service layer to support personal Banking Mobile Wallet for 2.4 million monthly mobile banking users.",
    tags: ["AWS", "Microservices", "Event Streaming", "2.4M Users"],
  },
];

const clients = [
  { name: "Equifax", category: "Financial Services" },
  { name: "Fifth Third Bank", category: "Banking" },
  { name: "FISERV", category: "Fintech" },
  { name: "TracFone / MVNO", category: "Telecom" },
  { name: "Medical Device Leader", category: "HealthTech" },
  { name: "Major Leasing Platform", category: "Real Estate" },
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
  const [activeSection, setActiveSection] = useState("hero");
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -40]);

  useEffect(() => {
    const sections = ["hero", "skills", "experience", "clients"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
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
    { id: "hero", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
    { id: "clients", label: "Clients" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

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
                style={{
                  color: activeSection === link.id ? teal : "rgba(210,220,225,0.75)",
                }}
                data-testid={`nav-${link.id}`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <a
            href="mailto:humberto.bello@protonmail.com"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
            style={{ background: teal, color: "#fff" }}
            data-testid="nav-contact"
          >
            Get in Touch
          </a>
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
        {/* Decorative glows */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
          style={{ background: teal }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
          style={{ background: "#2a7ecb" }}
        />

        {/* LEFT — Full-bleed photo (half the slide) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 w-1/2 hidden md:block"
          data-testid="hero-photo-col"
        >
          <img
            src={headshot}
            alt="Humberto Bert Bello"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center top" }}
            data-testid="hero-headshot"
          />
          {/* Gradient fade to the right so it blends into the dark bg */}
          <div
            className="absolute inset-y-0 right-0 w-32"
            style={{
              background: "linear-gradient(to right, transparent, #0d1821)",
            }}
          />
          {/* Subtle teal tint overlay at bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-32"
            style={{
              background: `linear-gradient(to top, rgba(13,24,33,0.7), transparent)`,
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 w-full flex items-center min-h-screen"
        >
          <div className="w-full md:w-1/2 md:ml-auto px-8 md:px-12 py-28 md:py-0">

            {/* RIGHT — Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              data-testid="hero-content-col"
            >
              <h1
                className="font-serif font-bold leading-tight mb-3"
                style={{ color: "#fff", fontSize: "clamp(2.4rem, 5vw, 3.8rem)" }}
                data-testid="hero-name"
              >
                Humberto{" "}
                <span style={{ color: teal }}>&ldquo;Bert&rdquo;</span>{" "}
                Bello
              </h1>

              <p
                className="text-lg font-light mb-8 leading-relaxed"
                style={{ color: "rgba(210,225,230,0.75)" }}
                data-testid="hero-title"
              >
                Principal Architect &amp; Engineering Leader
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { value: "20+", label: "Years in Architecture" },
                  { value: "15+", label: "Years Leading Teams" },
                  { value: "3", label: "Continents" },
                  { value: "19M+", label: "Subscribers Scaled" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.08, duration: 0.5 }}
                    className="rounded-xl p-3.5 border"
                    style={{
                      background: "rgba(86,181,163,0.06)",
                      borderColor: "rgba(86,181,163,0.18)",
                    }}
                    data-testid={`stat-${stat.label}`}
                  >
                    <div className="text-xl font-bold font-serif" style={{ color: teal }}>
                      {stat.value}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(210,225,230,0.55)" }}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary bullets */}
              <div className="flex flex-col gap-2.5 mb-8">
                {[
                  "20+ years delivering customer-facing digital experiences, integration, security and enterprise-scale modernization.",
                  "15+ years leading global engineering teams with end-to-end delivery accountability.",
                  "Hands-on in Gen AI, agentic patterns, event-driven architectures and cloud-native engineering (AWS, GCP, Azure).",
                ].map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.12, duration: 0.5 }}
                    className="flex items-start gap-2.5"
                    data-testid={`hero-bullet-${i}`}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                      style={{ background: teal }}
                    />
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(210,225,230,0.70)" }}>
                      {point}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Compliance Tags */}
              <div className="flex flex-wrap gap-1.5 mb-9">
                {["GDPR", "HIPAA", "SOX", "SOC", "FHIR", "AWS", "GCP", "Azure", "Gen AI"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      background: "rgba(86,181,163,0.07)",
                      borderColor: "rgba(86,181,163,0.22)",
                      color: teal,
                    }}
                    data-testid={`tag-${tag}`}
                  >
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
                Explore Profile <ChevronDown size={15} />
              </motion.button>
            </motion.div>

          </div>

          {/* Hero footer — credential badge */}
          <div className="absolute bottom-0 inset-x-0 flex justify-center pb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-semibold"
              style={{
                background: "rgba(13,24,33,0.70)",
                borderColor: "rgba(86,181,163,0.25)",
                color: "rgba(210,225,230,0.60)",
                backdropFilter: "blur(8px)",
              }}
              data-testid="hero-credential-badge"
            >
              <Shield size={12} style={{ color: teal }} />
              US Citizen &mdash; No Sponsorship Required
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
                Expertise
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                Professional Skills
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Two decades of hands-on experience spanning architecture, cloud, AI, security, and global engineering leadership.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillCategories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <FadeInSection key={cat.title} delay={i * 0.08}>
                  <div
                    className="rounded-2xl p-6 border h-full transition-all duration-300 hover:shadow-lg group"
                    style={{
                      background: "hsl(var(--card))",
                      borderColor: "hsl(var(--card-border))",
                    }}
                    data-testid={`skill-card-${i}`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300"
                      style={{ background: "rgba(86,181,163,0.12)" }}
                    >
                      <Icon size={20} style={{ color: teal }} />
                    </div>
                    <h3 className="font-semibold text-base mb-4">{cat.title}</h3>
                    <ul className="space-y-2">
                      {cat.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: teal }}
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

      {/* Experience Section */}
      <section
        id="experience"
        className="py-24 px-6"
        style={{ background: "hsl(var(--muted))" }}
        data-testid="section-experience"
      >
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: teal }}>
                Track Record
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                Selected Experience
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                High-impact engagements across finance, healthcare, telecom, and emerging technology sectors.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiences.map((exp, i) => (
              <FadeInSection key={exp.company} delay={i * 0.07}>
                <div
                  className="rounded-2xl p-7 border h-full transition-all duration-300 hover:shadow-md"
                  style={{
                    background: "hsl(var(--card))",
                    borderColor: "hsl(var(--card-border))",
                  }}
                  data-testid={`exp-card-${i}`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(86,181,163,0.12)" }}
                    >
                      <Building2 size={16} style={{ color: teal }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                        {exp.company}
                      </p>
                      <h3 className="font-semibold text-base leading-snug">{exp.highlight}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {exp.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-xs font-medium border"
                        style={{
                          background: "rgba(86,181,163,0.08)",
                          borderColor: "rgba(86,181,163,0.20)",
                          color: teal,
                        }}
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
                Portfolio
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
                Selected Clients &amp; Employers
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A track record built with industry leaders across financial services, healthcare, telecom, and beyond.
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-20">
            {clients.map((client, i) => (
              <FadeInSection key={client.name} delay={i * 0.06}>
                <div
                  className="rounded-2xl p-6 border text-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    background: "hsl(var(--card))",
                    borderColor: "hsl(var(--card-border))",
                  }}
                  data-testid={`client-card-${i}`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(86,181,163,0.10)" }}
                  >
                    <Award size={22} style={{ color: teal }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{client.name}</h3>
                  <p className="text-xs text-muted-foreground">{client.category}</p>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* CTA Banner */}
          <FadeInSection>
            <div
              className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0d2520 0%, #0f3028 100%)",
                border: "1px solid rgba(86,181,163,0.20)",
              }}
              data-testid="cta-banner"
            >
              <div
                className="absolute inset-0 opacity-5 blur-2xl"
                style={{ background: teal }}
              />
              <div className="relative z-10">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium border"
                  style={{
                    background: "rgba(86,181,163,0.12)",
                    borderColor: "rgba(86,181,163,0.30)",
                    color: teal,
                  }}
                >
                  <Zap size={14} />
                  Available for Opportunities
                </div>
                <h3
                  className="font-serif text-3xl md:text-4xl font-bold mb-4"
                  style={{ color: "#fff" }}
                >
                  Let&rsquo;s Build Something Remarkable
                </h3>
                <p className="max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: "rgba(210,225,230,0.70)" }}>
                  Authorized to work in the United States without sponsorship. Open to senior architecture, engineering leadership, and consulting engagements.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <a
                    href="mailto:humberto.bello@protonmail.com"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90"
                    style={{ background: teal, color: "#fff" }}
                    data-testid="cta-email"
                  >
                    Send a Message <ArrowRight size={16} />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm border transition-all duration-200 hover:opacity-80"
                    style={{
                      borderColor: "rgba(86,181,163,0.40)",
                      color: teal,
                      background: "rgba(86,181,163,0.06)",
                    }}
                    data-testid="cta-linkedin"
                  >
                    LinkedIn Profile
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
            <span className="text-muted-foreground text-sm">Principal Architect &amp; Engineering Leader</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} style={{ color: teal }} />
            United States &mdash; US Citizen, No Sponsorship Required
          </div>
        </div>
      </footer>
    </div>
  );
}
