export default class NotImplementedError extends Error {
  constructor(message?: string) {
    super(message ?? "This function has not yet been implemented.");
  }
}
