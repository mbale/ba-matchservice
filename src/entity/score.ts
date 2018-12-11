import { PrimaryGeneratedColumn, ManyToOne, Entity, Column } from 'typeorm';
import Match from './match';

export enum ScoreType {
  Settled, Cancelled, Deleted, Unknown,
}

@Entity('scores')
export default class Score {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ enum: ScoreType })
  type: ScoreType;

  @Column()
  matchId: number;

  @Column({ nullable: true })
  homeTeamScore: number;

  @Column({ nullable: true })
  awayTeamScore: number;

  @Column({ nullable: true })
  date: Date;

  @Column()
  addedDate: Date;
}
