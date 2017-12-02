import * as dotenv from 'dotenv';
import LeagueEntity from '../entity/league';
import MatchEntity from '../entity/match';
import { Connection } from 'typeorm/connection/Connection';
import {
  ConnectionOptions,
  createConnection,
  getConnection,
  getConnectionManager,
  } from 'typeorm';
import { Container, Inject, Service } from 'typedi';
import {
  Ctx,
  Get,
  JsonController,
  QueryParam,
  QueryParams,
  Res,
  } from 'routing-controllers';
import { dIConnection, MatchStatusType, GetMatchesQueryParams } from 'ba-common';
import { ObjectId, ObjectID } from 'bson';
import { Request } from 'express';
import { Response } from 'express-serve-static-core';

dotenv.config();

const MONGODB_URL = process.env.MATCH_SERVICE_MONGODB_URL;

@Service()
@JsonController('/api')
class MatchController {
  constructor(
    @dIConnection(MONGODB_URL, [MatchEntity, LeagueEntity], Container) 
    private connection : Connection) {}

  /**
   * Health check
   * 
   * @param {Context} ctx 
   * @returns 
   * @memberof TeamController
   */
  @Get('/')
  public async ping(@Res() response : Response) {
    return response.send('OK');
  }

  /**
   * Query or fetch all matches
   * 
   * @param {*} query 
   * @param {Response} response 
   * @returns 
   * @memberof MatchController
   */
  @Get('/matches')
  public async fetchMatches(
    @QueryParams() query : GetMatchesQueryParams,
    @Res() response : Response,
  ) {
    const connection = await this.connection;      
    const matchRepository = connection.getMongoRepository<MatchEntity>(MatchEntity);

    /*
      List all mode
    */
    let ids : ObjectId[] = [];

    if (query.ids) {
      if (query.ids instanceof Array) {
        // remove duplicate
        const set = new Set(query.ids.map(id => new ObjectId(id)));
        // convert back to array
        ids = [...set];
      } else {
        ids.push(new ObjectId(query.ids));
      }
    }

    let matches : MatchEntity[] = [];

    if (ids.length !== 0) {
      matches = await matchRepository.findByIds(ids);
      return response.send(matches);
    }

    /*
      Query mode
    */

    interface Query {
      updates?: {
        $elemMatch: {
          statusType?: MatchStatusType,
        },
      };
    }

    const dbQuery : Query = {};

    if (query.statusType) {
      dbQuery.updates.$elemMatch.statusType = query.statusType;
    }

    let skip = Number.parseInt(query.limit) * (Number.parseInt(query.page) - 1);

    if (skip < 0) {
      skip = 0;
    }

    const cursor = await matchRepository
      .createEntityCursor(dbQuery)
      .skip(skip)
      .limit(Number.parseInt(query.limit, 10));

    while (await cursor.hasNext()) {
      matches.push(await cursor.next());
    }

    return response.send(matches);
  }

  /**
   * Query of fetch all leagues
   * 
   * @param {*} query 
   * @param {Response} response 
   * @memberof MatchController
   */
  @Get('/leagues')
  public async fetchLeagues(
    @QueryParams() query : any,
    @Res() response : Response,
  ) {
    const connection = await this.connection;
    
    const leagueRepository = connection.getMongoRepository<LeagueEntity>(LeagueEntity);

    let ids : ObjectId[] = [];

    if (query.id) {
      if (query.id instanceof Array) {
        ids = query.id.map(id => new ObjectId(id));
      } else {
        ids.push(new ObjectId(query.id));
      }
    }

    let leagues : LeagueEntity[] = [];

    if (ids.length !== 0) {
      leagues = await leagueRepository.findByIds(ids);
    } else {
      leagues = await leagueRepository.find();
    }
    
    return response.send(leagues);
  }
}

export default MatchController;
