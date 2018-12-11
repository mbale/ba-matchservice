import * as rabbot from 'rabbot';
import { inject, injectable } from 'inversify';
import { Logger, LoggerInstance } from 'winston';
import { Connection } from 'typeorm';
import { MatchSource, MatchFragment } from '../entity/match';
import { validateOrReject as validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import Match from '../entity/match';

export enum RMQQueues  {
  ValidateMatchData = 'validate-match-data',
  ValidateMatchIntegrity = 'validate-match-integrity',
}

export enum RMQExchanges {
  Match = 'match', // topic
  MatchCreated = 'match.created', // fanout
}

export enum RMQActionTypes {
  MatchCmdValidateData = 'match.cmd.validate.data',
  MatchCmdValidateIntegrity = 'match.cmd.validate.integrity',
  MatchEventCreated = 'match.event.created',
}

export enum RMQExchangeTypes {
  Direct = 'direct',
  Topic = 'topic',
  Fanout = 'fanout',
}

interface IRabbotPublishOptions {
  routingKey?: string;
  type: string;
  correlationId?: string;
  contentType?: 'application/json' | 'text/plain' | 'application/octet-stream';
  body?: any;
  messageId?: string;
  expiresAfter?: number;
  timestamp?: number;
  mandatory?: boolean;
  persistent?: boolean;
  headers?: any;
  timeout?: number;
}

@injectable()
export default class BrokerService {
  constructor(
    @inject(Logger) private logger: LoggerInstance,
    @inject(rabbot) private rabbot: rabbot,
    @inject(Connection) private connection: Connection,
  ) {
    this.rabbot
      .handle(RMQActionTypes.MatchCmdValidateData, this.validateMatchData);
  }

  public publish (exchangeName: string, options: IRabbotPublishOptions, connectionName?: string) {
    return this.rabbot.publish(exchangeName, options, connectionName);
  }

  private async validateMatchData ({ body, ack }) {
    const incomingMatch = body.match;
    const transformedMatch = plainToClass(MatchFragment, incomingMatch);

    // Validating income of match
    try {
      await validate(transformedMatch);

      // await this.publish(RMQExchanges.Match, {
      //   type: RMQActionTypes.MatchCmdValidateIntegrity,
      // });
    } catch (_errors) {
      const errors: ValidationError[] = _errors;
      this.logger.error('MatchValidation failed');
      this.logger.error('Reason:');
      errors.forEach(e => console.log(e.constraints));
      this.logger.info('Sending forward to save for potential usage later:');
      // await this.publish(RMQExchanges.Match, {
      //   type: RMQActionTypes.MatchCmdValidateIntegrity,
      // });
    } finally {
      return ack();
    }
  }

  private async validateMatchIntegrity ({ body, ack }) {
    const match: MatchFragment = body.match;
    const matchRepository = this.connection.getRepository(Match);

    this.connection.getRepository(Match).createQueryBuilder().

    try {
      
    } catch (error) {
      
    }
  }
}
