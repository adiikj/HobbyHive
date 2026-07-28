export class ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  success: boolean;

  constructor(status: number, data: T, message = "Success") {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success = status < 400;
  }
}
