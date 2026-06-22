import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getProjects, getProjectById, getProjectStats } from "./projects.service";
import { GetProjectsParams } from "../types";

export const projectsKeys = {
  all: ["projects"] as const,
  lists: () => [...projectsKeys.all, "list"] as const,
  list: (params: GetProjectsParams) => [...projectsKeys.lists(), params] as const,
  infinite: (params: Omit<GetProjectsParams, "page">) => [...projectsKeys.lists(), "infinite", params] as const,
  details: () => [...projectsKeys.all, "detail"] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
};

export function useGetProjectsQuery(params: GetProjectsParams = {}) {
  return useQuery({
    queryKey: projectsKeys.list(params),
    queryFn: () => getProjects(params),
  });
}

export function useInfiniteProjectsQuery(params: Omit<GetProjectsParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: projectsKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) => getProjects({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
  });
}

export function useGetProjectByIdQuery(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });
}

export function useGetProjectStatsQuery(id: string) {
  return useQuery({
    queryKey: [...projectsKeys.detail(id), "stats"],
    queryFn: () => getProjectStats(id),
    enabled: !!id,
  });
}
