import axiosInstance from "@/lib/axios";
import { User, GetUsersParams, PaginatedResponse, CreateUserPayload, UpdateUserPayload } from "../types";

export async function getUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
  const { data } = await axiosInstance.get<PaginatedResponse<User>>("/users", { params });
  return data;
}

export async function getUserById(userId: string): Promise<{ message: string; data: User }> {
  const { data } = await axiosInstance.get<{ message: string; data: User }>(`/users/${userId}`);
  return data;
}

export async function getMyUser(): Promise<{ message: string; data: User }> {
  const { data } = await axiosInstance.get<{ message: string; data: User }>("/users/me");
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<{ message: string; data: User }> {
  const { data } = await axiosInstance.post<{ message: string; data: User }>("/users", payload);
  return data;
}

export async function updateUser(payload: UpdateUserPayload): Promise<{ message: string; data: User }> {
  const { data } = await axiosInstance.put<{ message: string; data: User }>("/users", payload);
  return data;
}
