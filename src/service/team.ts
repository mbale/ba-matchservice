import axios, { AxiosInstance } from 'axios';
import { injectable, inject } from 'inversify';
import { HTTPService } from 'ba-common';

@injectable()
class TeamHTTPService extends HTTPService {}

export default TeamHTTPService;

