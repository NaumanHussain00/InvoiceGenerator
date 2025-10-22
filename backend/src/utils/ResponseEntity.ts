class ResponseEntity<T> {
  constructor(
    public data: T,
    public message: string,
    public statusCode: number
  ) {
    this.data = data;
    this.message = message;
    this.statusCode = statusCode;
  }
}

export default ResponseEntity;
