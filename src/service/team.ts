import axios, { AxiosInstance } from 'axios';
import { injectable, inject } from 'inversify';
import { HTTPService, CompareQueryParams } from 'ba-common';

@injectable()
class TeamHTTPService extends HTTPService {
  async compare(params: CompareQueryParams) {
    const { data } = await this.axiosInstance.get('compare', {
      params,
    });
  }
}

export default TeamHTTPService;

