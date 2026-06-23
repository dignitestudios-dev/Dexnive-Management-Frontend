import axiosInstance from "@/lib/axios";
import { GetRatesResponse, UpdateRatesPayload } from "../types";

export async function getRates(year: number): Promise<GetRatesResponse> {
  const { data } = await axiosInstance.get<GetRatesResponse>(`/rates?year=${year}`);
  return data;
}

export async function updateRates(payload: UpdateRatesPayload): Promise<{ message: string }> {
  const { data } = await axiosInstance.put<{ message: string }>("/rates", payload);
  return data;
}
