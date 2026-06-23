export interface Holiday {
  _id: string;
  shiftDate: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetHolidaysParams {
  year?: string | number;
  month?: string | number;
  startDate?: string;
  endDate?: string;
}

export interface CreateHolidayPayload {
  shiftDate?: string;
  dates?: string[];
  startDate?: string;
  endDate?: string;
  reason: string;
}

export interface HolidaysResponse {
  message: string;
  data: Holiday[];
}

export interface SingleHolidayResponse {
  message: string;
  data: Holiday;
}

export interface MultiHolidayResponse {
  message: string;
  data: Holiday[];
  meta: any;
}
