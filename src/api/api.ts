import HttpClient from './httpClient';

import { GetThreadsResponse } from '../typings/server';

interface ApiInterface {
  getThreads: () => Promise<GetThreadsResponse>;
}

export default class Api implements ApiInterface {
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  public getThreads = () => {
    return new HttpClient(this.url).get<GetThreadsResponse>();
  };
}
