import { PrimaryGeneratedColumn, ManyToOne, Entity, Column } from 'typeorm';
import Match from './match';

export enum OddsBookmaker {
  Pinnacle, GGBet, Betway,
}

export enum OddsType {
  MoneyLine,
}

@Entity('odds')
export default class Odds {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  matchId: number;
}
