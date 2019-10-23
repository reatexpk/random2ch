import axios from 'axios';

import { corsProxy } from './constants';

export default class HttpClient {
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  public async get<T>(): Promise<T> {
    const response = await axios.get<T>(`${corsProxy}${this.url}`);
    return response.data;
  }
}
