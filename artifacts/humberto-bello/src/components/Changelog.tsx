import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Tag, ExternalLink } from "lucide-react";

const OWNER = "humbertobellor";
const REPO  = "dossier";
const MAX_RELEASES = 5;

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  published_at: string;
  body: string | null;
  html_url: string;
}

async function fetchReleases(): Promise<GitHubRelease[]> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=${MAX_RELEASES}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`GitHub API ${res.status}`);
  }
  return (await res.json()) as GitHubRelease[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const INK   = "#14110B";
const TEAL  = "#1B4E4A";
const V50   = "#FAF6EC";
const V100  = "#F3ECD9";
const V200  = "#E7DCC0";
const V300  = "#CFBE96";
const V400  = "#9C8A64";
const V500  = "#6B5C3E";

export function Changelog() {
  const [open, setOpen] = useState(false);

  const { data: releases, status } = useQuery<GitHubRelease[]>({
    queryKey: ["github-releases", OWNER, REPO],
    queryFn: fetchReleases,
    enabled:   open,
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 30,
    retry: 1,
  });

  const latest = releases?.[0];

  return (
    <div
      style={{
        borderTop: `1px solid ${V200}`,
        paddingTop: "1.25rem",
        marginTop: "1.25rem",
        width: "100%",
      }}
      data-testid="changelog"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "var(--font-ui)",
          fontSize: "var(--fs-xs)",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: open ? TEAL : V500,
          transition: "color 0.15s",
        }}
        data-testid="changelog-toggle"
      >
        <Tag size={11} />
        Site Updates
        {status === "pending" ? (
          <span style={{ color: V400, fontWeight: 400 }}>…</span>
        ) : latest ? (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "2px 7px",
              borderRadius: "var(--radius-sm)",
              background: open ? "rgba(27,78,74,0.08)" : V100,
              color: open ? TEAL : V400,
              border: `1px solid ${open ? "rgba(27,78,74,0.2)" : V200}`,
              transition: "all 0.15s",
            }}
            data-testid="changelog-latest-tag"
          >
            {latest.tag_name}
          </span>
        ) : null}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div
          style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
          data-testid="changelog-list"
        >
          {status === "pending" && (
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-xs)", color: V400 }}>
              Loading releases…
            </p>
          )}
          {status === "error" && (
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-xs)", color: V400 }}>
              Could not load releases.
            </p>
          )}
          {status === "success" && releases.length === 0 && (
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-xs)", color: V400 }}>
              No releases yet.
            </p>
          )}
          {status === "success" &&
            releases.map((release) => (
              <ReleaseRow key={release.id} release={release} />
            ))}
          <a
            href={`https://github.com/${OWNER}/${REPO}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "var(--font-ui)",
              fontSize: "var(--fs-xs)",
              fontWeight: 500,
              color: TEAL,
              textDecoration: "none",
              marginTop: "0.25rem",
              opacity: 0.8,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            data-testid="changelog-all-releases"
          >
            View all releases on GitHub <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  );
}

function ReleaseRow({ release }: { release: GitHubRelease }) {
  const [bodyOpen, setBodyOpen] = useState(false);
  const hasBody = release.body && release.body.trim().length > 0;

  return (
    <div
      style={{
        background: V50,
        border: `1px solid ${V200}`,
        borderRadius: "var(--radius-md)",
        padding: "0.625rem 0.875rem",
        borderLeft: `3px solid ${TEAL}`,
      }}
      data-testid="changelog-release"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
        <a
          href={release.html_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--fs-xs)",
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: TEAL,
            textDecoration: "none",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          data-testid="changelog-release-tag"
        >
          {release.tag_name}
        </a>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "10px",
            fontWeight: 500,
            color: V400,
            letterSpacing: "0.03em",
            flexShrink: 0,
          }}
          data-testid="changelog-release-date"
        >
          {formatDate(release.published_at)}
        </span>
      </div>
      {hasBody && (
        <>
          {!bodyOpen ? (
            <button
              onClick={() => setBodyOpen(true)}
              style={{
                display: "block",
                marginTop: "0.25rem",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
                fontSize: "10px",
                fontWeight: 500,
                color: V400,
                letterSpacing: "0.03em",
              }}
            >
              Show notes
            </button>
          ) : (
            <>
              <p
                style={{
                  marginTop: "0.375rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--fs-xs)",
                  color: V500,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}
                data-testid="changelog-release-body"
              >
                {release.body}
              </p>
              <button
                onClick={() => setBodyOpen(false)}
                style={{
                  display: "block",
                  marginTop: "0.25rem",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: V400,
                  letterSpacing: "0.03em",
                }}
              >
                Hide notes
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
