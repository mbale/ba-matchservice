import { ObjectID, ObjectIdColumn, Column, Entity } from 'typeorm';
import { RawMatch, MatchParsingResult } from '../service/parser';

@Entity('parsing-logs')
class ParsingLogEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  taskId: string | number;

  @Column()
  connections: {
    rawMatch: RawMatch;
    hash: string;
    result: MatchParsingResult,
  }[] = [];
}

export default ParsingLogEntity;
