import axios, {AxiosInstance} from 'axios';
import {AirbyteLogger, wrapApiError} from 'faros-airbyte-cdk/lib';
import {VError} from 'verror';

import {Channel, Deployment, Project, ProjectResponse, Release} from './models';

export interface OctopusConfig {
  readonly apiKey: string;
  readonly apiUri: string;
}

export class Octopus {
  private static octopus: Octopus = null;

  constructor(
    private readonly httpClient: AxiosInstance,
    private readonly logger: AirbyteLogger
  ) {}

  static async instance(
    config: OctopusConfig,
    logger: AirbyteLogger
  ): Promise<Octopus> {
    if (Octopus.octopus) return Octopus.octopus;

    if (!config.apiKey) {
      throw new VError('api key must be a not empty string');
    }

    if (!config.apiUri) {
      throw new VError('server apiUrl must be a not empty string');
    }

    const httpClient = axios.create({
      baseURL: config.apiUri.concat('/api'),
      timeout: 0, // default is `0` (no timeout)
      maxContentLength: 9999999999, //default is 2000 bytes
      headers: {
        'X-Octopus-ApiKey': config.apiKey,
      },
    });

    Octopus.octopus = new Octopus(httpClient, logger);
    return Octopus.octopus;
  }

  private createError(error: any, errorMessage: string) {
    const err = error?.message ?? JSON.stringify(error);
    throw new VError(`${errorMessage} Error: ${err}`);
  }

  async checkConnection(): Promise<void> {
    try {
      const iter = this.getReleases();
      await iter.next();
    } catch (err: any) {
      this.createError(err, 'apiKey and apiUri must be a not empty string.');
    }
  }

  private async *paginate<T>(path: string, param = {}): AsyncGenerator<T> {
    try {
      let totalPages = 5;
      for (let totalcalls = 1; totalcalls <= totalPages; totalcalls++) {
        const res = await this.httpClient.get<T[]>(path, param);
        for (const item of res.data['Items']) {
          yield item;
        }
        totalPages = res.data['NumberOfPages'];
        param['params']['skip'] = param['params']['take'] * totalcalls;
      }
    } catch (err: any) {
      const errorMessage = wrapApiError(err).message;
      this.logger.error(
        `Failed requesting '${path}' with params ${JSON.stringify(
          param
        )}. Error: ${errorMessage}`
      );
      throw new VError(errorMessage);
    }
  }

  async *getProjects(maxResults = 500): AsyncGenerator<Project> {
    for await (const projects of this.paginate<Project>('/projects', {
      params: {
        take: maxResults,
      },
    })) {
      yield projects;
    }
  }

  async *getChannels(maxResults = 500): AsyncGenerator<Channel> {
    for await (const channels of this.paginate<Channel>('/channels', {
      params: {
        take: maxResults,
      },
    })) {
      yield channels;
    }
  }

  async *getDeployments(maxResults = 500): AsyncGenerator<Deployment> {
    for await (const deployments of this.paginate<Deployment>('/deployments', {
      params: {
        take: maxResults,
      },
    })) {
      yield deployments;
    }
  }

  async *getReleases(maxResults = 500): AsyncGenerator<Release> {
    for await (const release of this.paginate<Release>('/releases', {
      params: {
        take: maxResults,
      },
    })) {
      yield release;
    }
  }
}
