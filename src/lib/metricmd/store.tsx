import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import engineJson from "@/data/engine.json";
import { metricMDConfig } from "./config";
import type {
  DiagnosisCase,
  DraftFingerprint,
  EngineState,
  FeedbackEvent,
  PersonaKey,
} from "./types";

const engine = engineJson as unknown as EngineState;

interface MetricMDValue {
  loading: boolean;
  data: EngineState;
  persona: PersonaKey;
  personaName: string;
  setPersona: (p: PersonaKey) => void;
  togglePersona: () => void;
  isRestricted: boolean;
  visibleCases: DiagnosisCase[];
  blockedCases: DiagnosisCase[];
  maskedEvidenceCount: (c: DiagnosisCase) => number;
  visibleEvidence: (c: DiagnosisCase) => DiagnosisCase["evidence"];
  visibleCandidates: (c: DiagnosisCase) => DiagnosisCase["candidates"];
  feedback: FeedbackEvent[];
  priors: Record<string, number>;
  drafts: DraftFingerprint[];
  verdictFor: (case_id: string) => "accept" | "flag" | null;
  submitFeedback: (case_id: string, verdict: "accept" | "flag", note?: string) => void;
  addDraft: (case_id: string, note: string) => DraftFingerprint;
}

const MetricMDContext = createContext<MetricMDValue | null>(null);

const VISIBLE_EVIDENCE_FOR_EXEC = 2;

async function fetchLive(persona: PersonaKey): Promise<EngineState> {
  const { baseUrl } = metricMDConfig;
  const [state, harness, telemetry] = await Promise.all([
    fetch(`${baseUrl}/api/state?persona=${persona}`).then((r) => r.json()),
    fetch(`${baseUrl}/api/harness`).then((r) => r.json()),
    fetch(`${baseUrl}/api/telemetry`).then((r) => r.json()),
  ]);
  return {
    ...engine,
    ...state,
    harness_cases: harness.harness_cases ?? harness,
    telemetry: telemetry.telemetry ?? telemetry,
  } as EngineState;
}

export function MetricMDProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EngineState>(engine);
  const [persona, setPersona] = useState<PersonaKey>("central_analyst");
  const [feedback, setFeedback] = useState<FeedbackEvent[]>([]);
  const [priors, setPriors] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<DraftFingerprint[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    if (metricMDConfig.mode === "live") {
      fetchLive(persona)
        .then((d) => alive && setData(d))
        .catch(() => alive && setData(engine))
        .finally(() => alive && setLoading(false));
    } else {
      const t = setTimeout(() => alive && setLoading(false), 700);
      return () => {
        alive = false;
        clearTimeout(t);
      };
    }
    return () => {
      alive = false;
    };
  }, [persona]);

  const personaDef = data.personas[persona];
  const scopeRegion = personaDef?.scope?.region;
  const isRestricted = Boolean(scopeRegion);

  const visibleCases = useMemo(
    () => (scopeRegion ? data.cases.filter((c) => c.region === scopeRegion) : data.cases),
    [data.cases, scopeRegion],
  );
  const blockedCases = useMemo(
    () => (scopeRegion ? data.cases.filter((c) => c.region !== scopeRegion) : []),
    [data.cases, scopeRegion],
  );

  const visibleEvidence = useCallback(
    (c: DiagnosisCase) => (isRestricted ? c.evidence.slice(0, VISIBLE_EVIDENCE_FOR_EXEC) : c.evidence),
    [isRestricted],
  );
  const maskedEvidenceCount = useCallback(
    (c: DiagnosisCase) => (isRestricted ? Math.max(0, c.evidence.length - VISIBLE_EVIDENCE_FOR_EXEC) : 0),
    [isRestricted],
  );
  const visibleCandidates = useCallback(
    (c: DiagnosisCase) => (isRestricted ? c.candidates.slice(0, 1) : c.candidates),
    [isRestricted],
  );

  const verdictFor = useCallback(
    (case_id: string) => {
      const last = [...feedback].reverse().find((f) => f.case_id === case_id);
      return last ? last.verdict : null;
    },
    [feedback],
  );

  const submitFeedback = useCallback(
    (case_id: string, verdict: "accept" | "flag", note?: string) => {
      const kase = data.cases.find((c) => c.case_id === case_id);
      if (!kase) return;
      const priorKey = `${kase.region}:${kase.diagnosis}`;
      const priorDelta = verdict === "accept" ? 0.05 : -0.1;
      const event: FeedbackEvent = {
        id: `${case_id}-${Date.now()}`,
        case_id,
        verdict,
        note,
        persona,
        personaName: personaDef?.name ?? persona,
        at: new Date().toISOString(),
        priorKey,
        priorDelta,
      };
      setFeedback((f) => [event, ...f]);
      setPriors((p) => ({ ...p, [priorKey]: Number(((p[priorKey] ?? 0) + priorDelta).toFixed(2)) }));
      if (metricMDConfig.mode === "live") {
        void fetch(`${metricMDConfig.baseUrl}/api/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case_id, verdict, note: note ?? "" }),
        }).catch(() => undefined);
      }
      if (verdict === "flag") {
        setDrafts((d) => [
          ...d,
          {
            id: `draft-${d.length + 9}`,
            label: `Fingerprint #${d.length + 9}`,
            source_case: case_id,
            note: note ?? "",
            status: "draft, awaiting analyst naming",
          },
        ]);
      }
    },
    [data.cases, persona, personaDef],
  );

  const addDraft = useCallback((case_id: string, note: string) => {
    let created: DraftFingerprint = {
      id: "draft-9",
      label: "Fingerprint #9",
      source_case: case_id,
      note,
      status: "draft, awaiting analyst naming",
    };
    setDrafts((d) => {
      created = {
        id: `draft-${d.length + 9}`,
        label: `Fingerprint #${d.length + 9}`,
        source_case: case_id,
        note,
        status: "draft, awaiting analyst naming",
      };
      return [...d, created];
    });
    return created;
  }, []);

  const value: MetricMDValue = {
    loading,
    data,
    persona,
    personaName: personaDef?.name ?? "",
    setPersona,
    togglePersona: () =>
      setPersona((p) => (p === "central_analyst" ? "regional_head" : "central_analyst")),
    isRestricted,
    visibleCases,
    blockedCases,
    maskedEvidenceCount,
    visibleEvidence,
    visibleCandidates,
    feedback,
    priors,
    drafts,
    verdictFor,
    submitFeedback,
    addDraft,
  };

  return <MetricMDContext.Provider value={value}>{children}</MetricMDContext.Provider>;
}

export function useMetricMD() {
  const ctx = useContext(MetricMDContext);
  if (!ctx) throw new Error("useMetricMD must be used inside MetricMDProvider");
  return ctx;
}
