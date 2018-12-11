import { Column, PrimaryGeneratedColumn } from 'typeorm';

export const enum StreamerPlatform {

}

export default class Streamer {
  @PrimaryGeneratedColumn('increment')
  id: number;
}
