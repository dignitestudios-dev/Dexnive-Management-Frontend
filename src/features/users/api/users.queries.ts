import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getUsers, getUserById, getMyUser } from "./users.service";
import { GetUsersParams } from "../types";

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: GetUsersParams) => [...usersKeys.lists(), params] as const,
  infinite: (params: Omit<GetUsersParams, "page">) => [...usersKeys.lists(), "infinite", params] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  me: () => [...usersKeys.all, "me"] as const,
};

export function useGetUsersQuery(params: GetUsersParams = {}) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => getUsers(params),
  });
}

export function useInfiniteUsersQuery(params: Omit<GetUsersParams, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: usersKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) => getUsers({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
  });
}

export function useGetUserByIdQuery(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

export function useGetMyUserQuery() {
  return useQuery({
    queryKey: usersKeys.me(),
    queryFn: () => getMyUser(),
  });
}
