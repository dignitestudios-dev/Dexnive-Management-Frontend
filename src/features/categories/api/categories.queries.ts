import { useQuery } from "@tanstack/react-query";
import { getCategories } from "./categories.service";
import { GetCategoriesParams } from "../types";

export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  list: (params?: GetCategoriesParams) => [...categoriesKeys.lists(), params ?? {}] as const,
};

/**
 * Categories for the given department, or the caller's own when omitted.
 *
 * The worklog screen calls this with no argument; only an Admin browsing
 * another department passes one.
 */
export function useGetCategoriesQuery(params?: GetCategoriesParams) {
  return useQuery({
    queryKey: categoriesKeys.list(params),
    queryFn: () => getCategories(params),
    staleTime: 5 * 60 * 1000,
  });
}
