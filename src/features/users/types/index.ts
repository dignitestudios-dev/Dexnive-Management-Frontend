export interface Role {
  _id: string;
  name: string;
  permissions?: string[];
}

export interface Department {
  _id: string;
  name: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role | string;
  department: Department;
  isLead: boolean;
  employeeCode: string;
  joiningDate: string;
  deactivateDate?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string | string[];
  departmentId?: string | string[];
  startDate?: string;
  endDate?: string;
  isLead?: boolean;
  isDeleted?: boolean;
}

export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  role: string;
  department: string;
  employeeCode: string;
  joiningDate: string;
  isLead: boolean;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {
  userId: string;
}
