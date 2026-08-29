export interface MetricMDConfig {
  mode: "mock" | "live";
  baseUrl: string;
}

export const metricMDConfig: MetricMDConfig = {
  mode: "live",
  baseUrl: "https://business-crystal.onrender.com",
};
