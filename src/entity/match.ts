import { MatchOdds, MatchUpdate, Match, MatchSource } from 'ba-common';
import {
  Entity,
  ObjectIdColumn,
  Column,
  ObjectID,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';

@Entity('matches')
export class MatchEntity implements Match {
  @ObjectIdColumn()
  _id : ObjectID;

  @Column()
  gameId: ObjectID;

  @Column()
  leagueId: ObjectID;

  @Column()
  homeTeamId: ObjectID;

  @Column()
  awayTeamId: ObjectID;

  @Column()
  date: Date;

  @Column()
  odds: MatchOdds[] = []; // it gets later

  @Column()
  updates: MatchUpdate[] = []; // it gets later

  @Column()
  _source: MatchSource; // doesn't need initializer - during the parsing it gets
}

export default MatchEntity​​;
