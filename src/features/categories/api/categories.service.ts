import axiosInstance from "@/lib/axios";
import {
  CategoriesResponse,
  CreateCategoryPayload,
  GetCategoriesParams,
  SingleCategoryResponse,
  UpdateCategoryPayload,
} from "../types";

/**
 * Categories for a department.
 *
 * Called with no params on the worklog screen: the API defaults to the caller's
 * own department, which is also the only set the worklog service will accept.
 */
export async function getCategories(
  params?: GetCategoriesParams,
): Promise<CategoriesResponse> {
  const { data } = await axiosInstance.get<CategoriesResponse>("/categories", { params });
  return data;
}

/** Admin (any department) or Lead (own department only, enforced server-side). */
export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<SingleCategoryResponse> {
  const { data } = await axiosInstance.post<SingleCategoryResponse>("/categories", payload);
  return data;
}

export async function updateCategory({
  id,
  ...body
}: UpdateCategoryPayload): Promise<SingleCategoryResponse> {
  const { data } = await axiosInstance.patch<SingleCategoryResponse>(
    `/categories/${id}`,
    body,
  );
  return data;
}

/** Soft delete server-side — historical worklog entries keep resolving. */
export async function deleteCategory(id: string): Promise<{ message: string }> {
  const { data } = await axiosInstance.delete<{ message: string }>(`/categories/${id}`);
  return data;
}
