import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('games')
export default class Game {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  abbreviation: string;
}
