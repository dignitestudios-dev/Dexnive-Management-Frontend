/** A project's module. Referenced by worklog task lines as a real foreign key. */
export interface Module {
  _id: string;
  project: string;
  name: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Populated shape returned on a worklog read. */
export interface ModuleRef {
  _id: string;
  name: string;
}

export interface GetModulesParams {
  /** Required by the API — modules are scoped to one project. */
  project: string;
  includeInactive?: boolean;
}

export interface CreateModulePayload {
  project: string;
  name: string;
}

export interface UpdateModulePayload {
  id: string;
  name: string;
}

export interface ModulesResponse {
  message: string;
  data: Module[];
}

export interface SingleModuleResponse {
  message: string;
  data: Module;
}
