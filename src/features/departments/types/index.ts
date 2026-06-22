export interface Department {
  _id: string;
  name: string;
  defaultRate?: number;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface GetDepartmentsParams {
  search?: string;
}

export interface CreateDepartmentPayload {
  name: string;
  defaultRate?: number;
}

export interface UpdateDepartmentPayload {
  departmentId: string;
  name: string;
  defaultRate?: number;
}
