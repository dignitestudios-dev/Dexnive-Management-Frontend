import api from "@/lib/axios";
import { CreateHolidayPayload, GetHolidaysParams, HolidaysResponse, MultiHolidayResponse, SingleHolidayResponse } from "../types";

export const getHolidays = async (params: GetHolidaysParams): Promise<HolidaysResponse> => {
  const response = await api.get("/holidays", { params });
  return response.data;
};

export const createHoliday = async (data: CreateHolidayPayload): Promise<SingleHolidayResponse | MultiHolidayResponse> => {
  const response = await api.post("/holidays", data);
  return response.data;
};

export const deleteHoliday = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/holidays/${id}`);
  return response.data;
};
