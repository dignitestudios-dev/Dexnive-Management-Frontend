export interface Division {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface GetDivisionsParams {
  search?: string;
}

export interface CreateDivisionPayload {
  name: string;
}

export interface UpdateDivisionPayload {
  divisionId: string;
  name: string;
}
