import { ServiceEntity, League } from 'ba-common';
import { Entity } from 'typeorm';

@Entity('leagues')
class LeagueEntity extends ServiceEntity implements League {

}

export default LeagueEntity;
