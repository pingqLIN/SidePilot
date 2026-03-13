declare module 'archiver' {
  interface ArchiverEntryData {
    name: string;
  }

  interface ArchiverInstance {
    on(event: string, listener: (...args: any[]) => void): this;
    pipe(destination: NodeJS.WritableStream): this;
    directory(
      dirpath: string,
      destpath: string,
      data?: (entry: ArchiverEntryData) => boolean,
    ): this;
    append(source: string | Buffer, data: { name: string }): this;
    finalize(): Promise<void>;
  }

  export default function archiver(
    format: string,
    options?: Record<string, unknown>,
  ): ArchiverInstance;
}

declare module 'node-schedule' {
  export interface Job {
    cancel(): boolean;
    nextInvocation(): Date | null;
  }

  interface ScheduleModule {
    scheduleJob(
      rule: string,
      callback: () => void | Promise<void>,
    ): Job;
    scheduleJob(
      name: string,
      rule: string,
      callback: () => void | Promise<void>,
    ): Job;
  }

  const schedule: ScheduleModule;
  export default schedule;
}
