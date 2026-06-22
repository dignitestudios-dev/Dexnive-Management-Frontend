import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { Role, Department } from "../types";

export const optionKeys = {
  all: ["options"] as const,
  roles: () => [...optionKeys.all, "roles"] as const,
  departments: () => [...optionKeys.all, "departments"] as const,
};

export function useGetRolesQuery() {
  return useQuery({
    queryKey: optionKeys.roles(),
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ message: string; data: Role[] }>("/roles");
      return data;
    },
  });
}

export function useGetDepartmentsQuery() {
  return useQuery({
    queryKey: optionKeys.departments(),
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ message: string; data: Department[] }>("/departments");
      return data;
    },
  });
}
