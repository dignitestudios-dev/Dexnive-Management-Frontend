import axiosInstance from "@/lib/axios";
import { Department, GetDepartmentsParams, CreateDepartmentPayload, UpdateDepartmentPayload } from "../types";

export async function getDepartments(params?: GetDepartmentsParams): Promise<{ message: string; data: Department[] }> {
  const { data } = await axiosInstance.get<{ message: string; data: Department[] }>("/departments", { params });
  return data;
}

export async function getDepartmentById(departmentId: string): Promise<{ message: string; data: Department }> {
  const { data } = await axiosInstance.get<{ message: string; data: Department }>(`/departments/${departmentId}`);
  return data;
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<{ message: string; data: Department }> {
  const { data } = await axiosInstance.post<{ message: string; data: Department }>("/departments", payload);
  return data;
}

export async function updateDepartment(payload: UpdateDepartmentPayload): Promise<{ message: string; data: Department }> {
  const { departmentId, ...rest } = payload;
  const { data } = await axiosInstance.patch<{ message: string; data: Department }>(`/departments/${departmentId}`, rest);
  return data;
}

export async function deleteDepartment(departmentId: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.delete<{ message: string }>(`/departments/${departmentId}`);
  return data;
}
