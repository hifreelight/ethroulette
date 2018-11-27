import { ContractService } from './../../core/contract.service';
import { StatusService } from './../../shared/status.service';
import { AccountService } from '../../core/account.service';
import { Component, OnInit} from '@angular/core';
import { Web3Service } from '../../core/web3.service';

@Component({
  selector: 'app-roulette-player',
  templateUrl: './roulette-player.component.html',
  styleUrls: ['./roulette-player.component.css']
})
export class RoulettePlayerComponent implements OnInit {

  constructor(
    private web3Service: Web3Service,
    private contractService: ContractService,
    private accountService: AccountService,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    console.log(this);
    this.init();
  }

  private async init() {
    try {
      await this.contractService.ready();
      await this.accountService.ready();
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error connecting with smart contracts; see log.');
    }
  }

  async bet(numbers: string, betSize: number) {
    const number = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    // const number = numbers.split(',');
    const deployedRoulette = this.contractService.getDeployedContract('Roulette');
    if (!deployedRoulette) {
      this.statusService.showStatus('Roulette contract is not available');
      return;
    }

    const betSizeInWei = this.web3Service.toWei(betSize, 'ether');
    console.log('Betting ' + betSize + ' on number ' + number);

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await deployedRoulette.bet(number, {from: this.accountService.account, value: betSizeInWei});

      if (!tx) {
        this.statusService.showStatus('Transaction failed, bet has not been placed');
      } else {
        this.statusService.showStatus('Transaction complete, bet has been placed');
      }
    } catch (e) {
      console.log(e);
      this.statusService.showStatus('Error placing bet; see log.');
    }
  }

  async maxBet() {
    const deployedRoulette = this.contractService.getDeployedContract('Roulette');
    if (!deployedRoulette) {
      this.statusService.showStatus('Roulette contract is not available');
      return;
    }
    try {
    const maxBet = await deployedRoulette.maxBet(18);
    if (!maxBet) {
      this.statusService.showStatus('Transaction failed, bet has not been placed');
    } else {
      //parseInt(maxBet)
      console.log('maxBet is %o', this.web3Service.fromWei(maxBet, 'ether'));;
      this.statusService.showStatus(`maxBet is ${maxBet}`);
    }
    } catch(e) {
      console.log(e);
      this.statusService.showStatus('Error placing bet; see log.');
    }
  }
  async minBet() {
    const deployedRoulette = this.contractService.getDeployedContract('Roulette');
    if (!deployedRoulette) {
      this.statusService.showStatus('Roulette contract is not available');
      return;
    }
    try {
    const minBet = await deployedRoulette.minBet();
    if (!minBet) {
      this.statusService.showStatus('Transaction failed, bet has not been placed');
    } else {
      //parseInt(minBet)
      console.log('minBet is %o', this.web3Service.fromWei(minBet, 'ether'));;
      this.statusService.showStatus(`minBet is ${minBet}`);
    }
    } catch(e) {
      console.log(e);
      this.statusService.showStatus('Error placing bet; see log.');
    }
  }
  async deposit(){
    const deployedRoulette = this.contractService.getDeployedContract('Roulette');
    if (!deployedRoulette) {
      this.statusService.showStatus('Roulette contract is not available');
      return;
    }
    let value = 10;
    const valueInWei = this.web3Service.toWei(value, 'ether');

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await deployedRoulette.deposit({from: this.accountService.account, value: valueInWei});

      if (!tx) {
        this.statusService.showStatus('Transaction failed, bet has not been placed');
      } else {
        this.statusService.showStatus('Transaction complete, bet has been placed');
      }
    } catch (e) {
      console.log(e);
      this.statusService.showStatus('Error placing bet; see log.');
    }
  }
}
