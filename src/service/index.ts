import InvestApiServerService from './InvestApiServerService';
import InvestApiClientService from './client/InvestApiClientService';

const isClient = true;
const InvestApiServiceClient = isClient
  ? InvestApiClientService
  : InvestApiServerService;

// eslint-disable-next-line import/prefer-default-export
export {InvestApiServiceClient as InvestApiService};
