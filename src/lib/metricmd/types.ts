export type Tier = "CONFIDENT" | "AMBIGUOUS" | "UNKNOWN";

export interface PersonaDef {
  name: string;
  scope: { region?: string };
  depth: string;
  levers: string[];
}

export interface Fingerprint {
  shape: string;
  playbook: string;
  owner: string;
  recovery_days: number;
}

export interface Scorecard {
  runs: number;
  detection_recall: number;
  diagnosis_accuracy: number;
  false_alarm_rate: number;
  correct_unknown_rate: number;
  wrong_confident: string;
}

export interface HarnessCase {
  case: string;
  expected: string;
  got: string;
  ok: boolean;
  tier: string;
  conf: number | null;
}

export interface TelemetryStage {
  stage: string;
  ms: number;
  tokens: number;
  cost_inr: number;
}

export interface Telemetry {
  total_ms: number;
  llm_tokens: number;
  cost_inr: number;
  stages: TelemetryStage[];
}

export interface Evidence {
  id: string;
  fact: string;
  method: string;
  source: string;
}

export interface Candidate {
  mechanism: string;
  score: number;
}

export interface LocalizationRow {
  dim: string;
  value: string;
  delta: number;
  share_pct: number;
}

export interface Verification {
  recheck_window: [string, string];
  mean_z_after: number;
  healed: boolean;
  verdict: string;
}

export interface SeriesPoint {
  day: string;
  value: number;
}

export interface DiagnosisCase {
  case_id: string;
  title: string;
  kpi: string;
  region: string;
  category: string;
  window: [string, string];
  pct: number;
  delta_inr: number;
  mean_z: number;
  tier: Tier;
  confidence: number;
  shape: string;
  diagnosis: string;
  candidates: Candidate[];
  evidence: Evidence[];
  localization: LocalizationRow[];
  control: [string, number][];
  separating_test: string | null;
  human_ask: string | null;
  playbook: { action: string; owner: string; recheck_days: number } | null;
  verification: Verification | null;
  series: SeriesPoint[];
  window_start_index: number;
}

export interface EngineState {
  generated_at: string;
  business: string;
  personas: Record<string, PersonaDef>;
  fingerprints: Record<string, Fingerprint>;
  scorecard: Scorecard;
  harness_cases: HarnessCase[];
  telemetry: Telemetry;
  cases: DiagnosisCase[];
}

export type PersonaKey = "regional_head" | "central_analyst";

export interface FeedbackEvent {
  id: string;
  case_id: string;
  verdict: "accept" | "flag";
  note?: string | undefined;
  persona: PersonaKey;
  personaName: string;
  at: string;
  priorKey: string;
  priorDelta: number;
}

export interface DraftFingerprint {
  id: string;
  label: string;
  source_case: string;
  note: string;
  status: string;
}
