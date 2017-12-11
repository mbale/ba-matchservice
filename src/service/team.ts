import axios, { AxiosInstance } from 'axios';
import { injectable, inject } from 'inversify';
import { HTTPService, CompareQueryParams } from 'ba-common';

@injectable()
class TeamHTTPService extends HTTPService {
  async compare(params: CompareQueryParams) {
    try {
      const { data } = await this.axiosInstance.get('compare', {
        params,
      });
      
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export default TeamHTTPService;

