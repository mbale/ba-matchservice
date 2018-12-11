import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import {
  IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString, ValidateIf,
} from 'class-validator';
import { compareAsc } from 'date-fns';

export enum MatchSource {
  Abios = 'abios', Pinnacle = 'pinnacle', OneHash = 'onehash',
}

@Entity('matches')
export default class Match {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar', { unique: true })
  urlId: string;

  @Column('int')
  gameId: number;

  @Column('int')
  leagueId: number;

  @Column('int')
  homeTeamId: number;

  @Column('int')
  awayTeamId: number;

  @Column('timestamp', { nullable: true })
  startDate: Date;

  @Column('timestamp', { nullable: true })
  endDate: Date;

  @Column('int', { array: true })
  oddsIds: number[];

  @Column('int', { array: true })
  scoreIds: number[];

  @Column('enum', { enum: MatchSource })
  source: MatchSource;
}

export class MatchFragment {
  // if match is long gone
  @ValidateIf(o => compareAsc(o.date, new Date()) === -1)
  @IsNotEmpty()
  homeTeam: string;

  @ValidateIf(o => compareAsc(o.date, new Date()) === -1)
  @IsNotEmpty()
  awayTeam: string;

  @ValidateIf(o => compareAsc(o.date, new Date()) === -1)
  @IsNotEmpty()
  league: string;

  @IsDateString()
  @IsNotEmpty()
  date: Date;

  @IsDateString()
  @IsNotEmpty()
  addedDate: Date;

  @IsNumber()
  @IsOptional()
  homeTeamScore: number;

  @IsNumber()
  @IsOptional()
  awayTeamScore: number;

  @IsEnum(MatchSource)
  @IsNotEmpty()
  source: MatchSource;
}
