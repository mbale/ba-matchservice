import { MatchOdds, MatchUpdate, Match } from 'ba-common';
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
  odds: MatchOdds[];

  @Column()
  updates: MatchUpdate[];
}

export default MatchEntity​​;
