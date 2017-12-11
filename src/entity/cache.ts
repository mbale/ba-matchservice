import { ServiceEntity } from 'ba-common';
import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';

@Entity('caches')
class CacheEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column('last')
  last: string;

  @Column('taskname')
  taskName: string;
}

export default CacheEntity;
