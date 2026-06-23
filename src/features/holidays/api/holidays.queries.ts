import { useQuery } from "@tanstack/react-query";
import { getHolidays } from "./holidays.service";
import { GetHolidaysParams } from "../types";

export const holidaysKeys = {
  all: ["holidays"] as const,
  lists: () => [...holidaysKeys.all, "list"] as const,
  list: (params: GetHolidaysParams) => [...holidaysKeys.lists(), params] as const,
};

export function useGetHolidaysQuery(params: GetHolidaysParams) {
  return useQuery({
    queryKey: holidaysKeys.list(params),
    queryFn: () => getHolidays(params),
  });
}
