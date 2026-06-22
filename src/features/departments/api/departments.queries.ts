import { useQuery } from "@tanstack/react-query";
import { getDepartments, getDepartmentById } from "./departments.service";
import { GetDepartmentsParams } from "../types";

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (filters: GetDepartmentsParams) => [...departmentKeys.lists(), filters] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
};

export function useGetDepartmentsQuery(params?: GetDepartmentsParams) {
  return useQuery({
    queryKey: departmentKeys.list(params || {}),
    queryFn: () => getDepartments(params),
  });
}

export function useGetDepartmentByIdQuery(departmentId: string) {
  return useQuery({
    queryKey: departmentKeys.detail(departmentId),
    queryFn: () => getDepartmentById(departmentId),
    enabled: !!departmentId,
  });
}
