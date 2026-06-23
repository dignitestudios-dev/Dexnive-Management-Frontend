export interface RateRow {
  _id: string;
  name: string;
  defaultRate: number;
  months: {
    [key: number]: number;
  };
}

export interface GetRatesResponse {
  message: string;
  data: RateRow[];
  meta: {
    year: number;
  };
}

export interface UpdateRatesPayload {
  departmentIds: string[];
  months: number[];
  year: number;
  rate: number;
}
