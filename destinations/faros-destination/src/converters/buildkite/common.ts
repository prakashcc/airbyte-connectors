import {AirbyteRecord} from 'faros-airbyte-cdk';

import {Converter, StreamContext} from '../converter';

export type ApplicationMapping = Record<
  string,
  {name: string; platform?: string}
>;

interface BuildkiteConfig {
  application_mapping?: ApplicationMapping;
}

export interface Organization {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly web_url: string;
}
export interface Build {
  readonly uuid: string;
  readonly number: number;
  readonly createdAt?: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly state: string;
  readonly url: string;
  readonly commit: string;
  readonly jobs: Array<Job>;
  readonly pipeline?: {
    uuid?: string;
  };
}
export interface Job {
  readonly type: string;
  readonly uuid: string;
  readonly label?: string;
  readonly state: string;

  readonly createdAt?: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;

  readonly triggered?: {
    startedAt?: string;
    createdAt?: string;
    finishedAt?: string;
  };
  readonly unblockedAt?: string;

  readonly url?: string;
  readonly command: string;
  readonly build?: {
    uuid?: string;
  };
}

export interface Pipeline {
  readonly id: string;
  readonly uuid: string;
  readonly slug: string;
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  readonly repository?: Repo;
  readonly createdAt?: string;
  readonly organization?: {
    uuid?: string;
  };
}
export enum RepoSource {
  BITBUCKET = 'Bitbucket',
  GITHUB = 'GitHub',
  GITLAB = 'GitLab',
  VCS = 'VCS',
}
export interface Repo {
  readonly provider: Provider;
  readonly url: string;
}
export interface Provider {
  readonly name: RepoSource;
}

export class BuildkiteCommon {
  // Max length for free-form description text fields such as issue body
  static readonly MAX_DESCRIPTION_LENGTH = 1000;
}

/** Buildkite converter base */
export abstract class BuildkiteConverter extends Converter {
  /** Almost every Buildkite record have id property */
  id(record: AirbyteRecord): any {
    return record?.record?.data?.id;
  }

  protected BuildkiteConfig(ctx: StreamContext): BuildkiteConfig {
    return ctx.config.source_specific_configs?.Buildkite ?? {};
  }

  protected applicationMapping(ctx: StreamContext): ApplicationMapping {
    return this.BuildkiteConfig(ctx).application_mapping ?? {};
  }
}
