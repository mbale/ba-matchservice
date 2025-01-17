import LeagueEntity from '../entity/league';
import MatchEntity from '../entity/match';
import {
  ConnectionOptions,
  createConnection,
  getConnection,
  getConnectionManager,
  } from 'typeorm';
import {
  Ctx,
  Get,
  JsonController,
  QueryParam,
  QueryParams,
  Res,
  } from 'routing-controllers';
import { MatchStatusType, GetMatchesQueryParams, HTTPController } from 'ba-common';
import { ObjectId, ObjectID } from 'bson';
import { Request } from 'express';
import { Response } from 'express-serve-static-core';
import { injectable } from 'inversify';

@injectable()
@JsonController('/api')
class MatchHTTPController extends HTTPController {
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
    const connection = this.connectionManager.get();
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
      response.setHeader('count', matches.length);
      return response.send(matches);
    }

    /*
      Query mode
    */

    interface Query {
      updates?: {
        $elemMatch?: {
          $or?: {
            statusType: MatchStatusType,
          }[],
          statusType?: MatchStatusType,
        },
      };
      date?: {
        $gte?: Date;
        $lte?: Date;
      };
      gameIds?: ObjectID[];
      homeTeamId?: ObjectID;
      awayTeamId?: ObjectID;
      leagueId?: ObjectID;
    }

    /*
      Field operators
    */

    const dbQuery : Query | any = {};

    let sortByDate = 1;

    // we list all which have updates => completed
    if (query.statusType) {
      if (query.statusType === MatchStatusType.Completed) {
        dbQuery['updates.0'] = {
          $exists: true,
        };
        sortByDate = -1;
        dbQuery.date = {
          $lte: new Date(),
        };

        dbQuery.updates = {
          $elemMatch: {
            statusType: MatchStatusType.Settled,
          },
        };
        dbQuery['updates.0'] = {
          $exists: true,
        };
      } else if (query.statusType === MatchStatusType.Upcoming) {
        dbQuery.date = {
          $gte: new Date(),
        };

        dbQuery['odds.0'] = {
          $exists: true,
        };

        dbQuery['updates.0'] = {
          $exists: false,
        };
      } else {
        dbQuery.updates = {
          $elemMatch: {},
        };

        dbQuery.updates.$elemMatch.statusType = query.statusType;
      }
    }

    if (query.gameIds) {
      if (query.gameIds instanceof Array) {
        dbQuery.gameId = {
          $in: query.gameIds.map(q => new ObjectID(q)),
        };
      } else {
        dbQuery.gameId = {
          $in: [new ObjectID(query.gameIds)],
        };
      }
    }

    if (query.homeTeamId) {
      dbQuery.homeTeamId = new ObjectID(query.homeTeamId);
    }

    if (query.awayTeamId) {
      dbQuery.awayTeamId = new ObjectID(query.awayTeamId);
    }

    if (query.leagueId) {
      dbQuery.leagueId = new ObjectID(query.leagueId);
    }

    /*
      Logical operators
    */

    let skip = Number.parseInt(query.limit) * (Number.parseInt(query.page) - 1);

    if (skip < 0) {
      skip = 0;
    }

    const cursor = await matchRepository
      .createEntityCursor(dbQuery)
      .sort('date', sortByDate)
      .skip(skip)
      .limit(Number.parseInt(query.limit, 10));

    const count = await cursor.count(false);

    while (await cursor.hasNext()) {
      matches.push(await cursor.next());
    }

    response.setHeader('count', count);
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
    const connection = this.connectionManager.get();

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

export default MatchHTTPController;
