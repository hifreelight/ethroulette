import { Web3Service } from './web3.service';
import { Injectable } from '@angular/core';
import { StatusService } from '../shared/status.service';

declare let require: any;
const roscoin_artifacts = require('../../../build/contracts/Roscoin.json');
const roulette_artifacts = require('../../../build/contracts/Roulette.json');
const bt_roulette_artifacts = require('../../../build/contracts/BTRoulette.json');

@Injectable()
export class ContractService {
  public contracts = {
    'Roscoin': {
      artifacts: null,
      deployed: null
    },
    'Roulette': {
      artifacts: null,
      deployed: null
    }
  };

  private _ready: Promise<void>;

  constructor(
    private web3Service: Web3Service
  ) {
    console.log(this);

    this._ready = (async () => {
      await web3Service.ready();
      const deployingRoscoin = this.storeDeployedContract('Roscoin', roscoin_artifacts);
      const deployingRoulette = this.storeDeployedContract('Roulette', roulette_artifacts);
      // const deployingBTRoulette = this.storeDeployedContract('BTRoulette', bt_roulette_artifacts);
      await deployingRoscoin;
      await deployingRoulette;
      // await deployingBTRoulette;
    })();
  }

  private async storeDeployedContract(name: string, artifacts: any) {
    this.contracts[name].artifacts = await this.web3Service.artifactsToContract(artifacts);
    this.contracts[name].deployed = await this.contracts[name].artifacts.deployed();
  }

  ready(): Promise<any> {
    return this._ready;
  }

  getDeployedContract(contract: string) {
    return this.contracts[contract].deployed;
  }

  newEvent(contract: string, event: string, filter: object = {}) {
    return this.contracts[contract].deployed[event](filter, {fromBlock: 0, toBlock: 'latest'});
  }
}
