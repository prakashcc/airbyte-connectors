import {AirbyteRecord} from 'faros-airbyte-cdk';
import {toLower} from 'lodash';

import {DestinationModel, DestinationRecord, StreamContext} from '../converter';
import {CircleCIConverter} from './common';
import {Project} from './models';

export class Projects extends CircleCIConverter {
  readonly destinationModels: ReadonlyArray<DestinationModel> = [
    'cicd_Organization',
    'cicd_Pipeline',
  ];
  async convert(
    record: AirbyteRecord,
    ctx: StreamContext
  ): Promise<ReadonlyArray<DestinationRecord>> {
    const source = this.streamName.source;
    const project = record.record.data as Project;
    const uid = toLower(project.id);
    const res: DestinationRecord[] = [];
    res.push({
      model: 'cicd_Organization',
      record: {
        uid: project.organization_slug,
        name: project.organization_name,
        source,
      },
    });
    res.push({
      model: 'cicd_Pipeline',
      record: {
        uid,
        name: project.name,
        organization: {uid: toLower(project.organization_slug), source},
      },
    });
    return res;
  }
}
