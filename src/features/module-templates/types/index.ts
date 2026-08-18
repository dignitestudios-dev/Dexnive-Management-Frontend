/** Seeds every new project's module list. Admin-managed. */
export interface ModuleTemplate {
  _id: string;
  name: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetModuleTemplatesParams {
  isActive?: boolean;
}

export interface CreateModuleTemplatePayload {
  name: string;
}

export interface UpdateModuleTemplatePayload {
  id: string;
  name?: string;
  isActive?: boolean;
}

export interface ModuleTemplatesResponse {
  message: string;
  data: ModuleTemplate[];
}

export interface SingleModuleTemplateResponse {
  message: string;
  data: ModuleTemplate;
}
