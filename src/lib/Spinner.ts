import ora from 'ora';

export default class Spinner {
  spinner: ora.Ora;
  async promise<T>(promise: Promise<T>, message: string): Promise<T> {
    this.spinner = ora.promise(promise, message);
    return promise;
  }

  succeed(message: string): void {
    if (this.spinner != null) {
      this.spinner.succeed(message);
      return;
    }
    ora(message).succeed(message);
  }
  set text(text: string) {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }
}
