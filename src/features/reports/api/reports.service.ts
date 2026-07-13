import axiosInstance from "@/lib/axios";
import { GetReportsParams, ReportsResponse } from "../types";

export async function getProjectHoursBreakdown(params?: GetReportsParams): Promise<{ message: string; data: ReportsResponse }> {
  const { data } = await axiosInstance.get<{ message: string; data: ReportsResponse }>("/reports/project-hours-breakdown", { params });
  return data;
}
