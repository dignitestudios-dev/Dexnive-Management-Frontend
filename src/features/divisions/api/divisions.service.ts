import axiosInstance from "@/lib/axios";
import { Division, GetDivisionsParams, CreateDivisionPayload, UpdateDivisionPayload } from "../types";

export async function getDivisions(params?: GetDivisionsParams): Promise<{ message: string; data: Division[] }> {
  const { data } = await axiosInstance.get<{ message: string; data: Division[] }>("/divisions", { params });
  return data;
}

export async function getDivisionById(divisionId: string): Promise<{ message: string; data: Division }> {
  const { data } = await axiosInstance.get<{ message: string; data: Division }>(`/divisions/${divisionId}`);
  return data;
}

export async function createDivision(payload: CreateDivisionPayload): Promise<{ message: string; data: Division }> {
  const { data } = await axiosInstance.post<{ message: string; data: Division }>("/divisions", payload);
  return data;
}

export async function updateDivision(payload: UpdateDivisionPayload): Promise<{ message: string; data: Division }> {
  const { divisionId, ...rest } = payload;
  const { data } = await axiosInstance.patch<{ message: string; data: Division }>(`/divisions/${divisionId}`, rest);
  return data;
}

export async function deleteDivision(divisionId: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.delete<{ message: string }>(`/divisions/${divisionId}`);
  return data;
}
