export interface MetricMDConfig {
  mode: "mock" | "live";
  baseUrl: string;
}

export const metricMDConfig: MetricMDConfig = {
  mode: "live",
  baseUrl: "http://localhost:8000",
};
