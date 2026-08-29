export interface MetricMDConfig {
  mode: "mock" | "live";
  baseUrl: string;
}

export const metricMDConfig: MetricMDConfig = {
  mode: "mock",
  baseUrl: "http://localhost:8000",
};
