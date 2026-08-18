/** A department-owned category. Names are uppercased server-side. */
export interface Category {
  _id: string;
  name: string;
  department: string | { _id: string; name: string };
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Populated shape returned on a worklog read. */
export interface CategoryRef {
  _id: string;
  name: string;
}

export interface GetCategoriesParams {
  /**
   * Optional. Omit on the logging screen — the API then resolves the caller's
   * own department. Non-Admins may not query another department's list.
   */
  department?: string;
}

export interface CreateCategoryPayload {
  name: string;
  department: string;
}

export interface UpdateCategoryPayload {
  id: string;
  name: string;
}

export interface CategoriesResponse {
  message: string;
  data: Category[];
}

export interface SingleCategoryResponse {
  message: string;
  data: Category;
}
