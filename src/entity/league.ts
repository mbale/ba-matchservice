import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('leagues')
export default class League {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('varchar')
  name: string;
}