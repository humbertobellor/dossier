import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

const INK    = "#14110B";
const TEAL   = "#1B4E4A";
const TEAL_6 = "#103A37";
const V50    = "#FAF6EC";
const V100   = "#F3ECD9";
const V200   = "#E7DCC0";
const V300   = "#CFBE96";
const V500   = "#6B5C3E";

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const { t } = useTranslation();

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState<Status>("idle");
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setMessage("");
        setTimeout(() => setStatus("idle"), 6000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "9px 12px",
    fontFamily: "var(--font-body)",
    fontSize: "var(--fs-sm)",
    color: INK,
    background: V100,
    border: `1px solid ${focused === field ? TEAL : V200}`,
    borderRadius: "var(--radius-sm)",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--fs-xs)",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: V500,
    marginBottom: "5px",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        textAlign: "left",
        maxWidth: "32rem",
        margin: "2rem auto 0",
      }}
      data-testid="contact-form"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={labelStyle}>{t("cta.form.name")}</label>
          <input
            type="text"
            value={name}
            placeholder={t("cta.form.namePlaceholder")}
            required
            maxLength={200}
            onChange={e => setName(e.target.value)}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            style={inputStyle("name")}
            data-testid="contact-name"
          />
        </div>
        <div>
          <label style={labelStyle}>{t("cta.form.email")}</label>
          <input
            type="email"
            value={email}
            placeholder={t("cta.form.emailPlaceholder")}
            required
            maxLength={320}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused(null)}
            style={inputStyle("email")}
            data-testid="contact-email"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>{t("cta.form.message")}</label>
        <textarea
          value={message}
          placeholder={t("cta.form.messagePlaceholder")}
          required
          maxLength={5000}
          rows={4}
          onChange={e => setMessage(e.target.value)}
          onFocus={() => setFocused("message")}
          onBlur={() => setFocused(null)}
          style={{ ...inputStyle("message"), resize: "vertical" }}
          data-testid="contact-message"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--fs-sm)",
          fontWeight: 600,
          padding: "10px 22px",
          borderRadius: "var(--radius-sm)",
          background: status === "submitting" ? V300 : TEAL,
          color: V50,
          border: "none",
          cursor: status === "submitting" ? "not-allowed" : "pointer",
          boxShadow: "var(--shadow-2)",
          transition: "background 0.15s",
          alignSelf: "flex-start",
        }}
        onMouseEnter={e => {
          if (status !== "submitting")
            (e.currentTarget as HTMLButtonElement).style.background = TEAL_6;
        }}
        onMouseLeave={e => {
          if (status !== "submitting")
            (e.currentTarget as HTMLButtonElement).style.background = TEAL;
        }}
        data-testid="contact-submit"
      >
        <Send size={14} />
        {status === "submitting" ? t("cta.form.submitting") : t("cta.form.submit")}
      </button>

      {status === "success" && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            background: "rgba(27,78,74,0.06)",
            border: "1px solid rgba(27,78,74,0.2)",
            borderRadius: "var(--radius-sm)",
          }}
          data-testid="contact-success"
        >
          <CheckCircle2 size={15} style={{ color: TEAL, flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-xs)", fontWeight: 700, color: TEAL, margin: 0 }}>
              {t("cta.form.successTitle")}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: V500, margin: "2px 0 0" }}>
              {t("cta.form.successBody")}
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            background: "rgba(178,34,34,0.06)",
            border: "1px solid rgba(178,34,34,0.2)",
            borderRadius: "var(--radius-sm)",
          }}
          data-testid="contact-error"
        >
          <AlertCircle size={15} style={{ color: "#b22222", flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-xs)", fontWeight: 700, color: "#b22222", margin: 0 }}>
              {t("cta.form.errorTitle")}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-xs)", color: V500, margin: "2px 0 0" }}>
              {t("cta.form.errorBody")}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
