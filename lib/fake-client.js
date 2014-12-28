/**
 * Fake bitcoin daemon/client
 * Provides same API as node-bitcoind client but doesn't communicate with real daemon
 * @param {object} opt Settings
 */
function FakeClient(opt) {
	if (!(this instanceof FakeClient)) {
		return new FakeClient(opt);
	}
	this.accounts = {};
	this.addresses = {};
	this.opt = opt;
	// create total account (by getting it's balance)
	this.getAccountBalance('total');
}

FakeClient.prototype.getPseudoAddress = function() {
	var addressLength = 34,
		base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
		address = '',
		max = base58.length-1;
	while(addressLength--) {
		address += base58[0|Math.random()*max];
	}
	return address;
}

FakeClient.prototype.createNewAccount = function(accountName) {
	var address = this.getPseudoAddress();
	this.addresses[address] = {
		address: address,
		balance: 0
	};

	this.accounts[accountName] = this.addresses[address];
	return this.accounts[accountName];
}

FakeClient.prototype.getAccountAddress = function(accountName) {
	if (!this.accounts[accountName]) {
		this.createNewAccount();
	}
	return this.accounts[accountName].address;
}

FakeClient.prototype.getAccountBalance = function(accountName) {
	if (!this.accounts[accountName]) {
		this.createNewAccount(accountName);
	}
	return this.accounts[accountName].balance;
}

FakeClient.prototype.moveCoins = function(fromAccount, toAccount, value) {
	if (this.getAccountBalance(fromAccount) >= value) {
		this.accounts[fromAccount].balance -= value;
		// touch destination to make sure it exists
		this.getAccountBalance(toAccount);
		this.accounts[toAccount].balance += value;
	} else {
		return false;
		throw new Error('Balance is not enough');
	}
	return true;
}

FakeClient.prototype.listAccounts = function() {
	return this.accounts;
}

FakeClient.prototype.validate = function(address) {
	return true;
}

// RPC

FakeClient.prototype.getMiningInfo = function(callback) {
	var miningInfo = {
		blocks: 123456,
		'PoS difficulty': 8.123,
		networkhashps: 36.6 * 1000000
	};
	callback(null, miningInfo);
}

FakeClient.prototype.getInfo = function(callback) {
	var info = {
		moneysupply: 654321.123
	};
	callback(null, info);
}

// RPC coin.getBalance
// coin.getBalance(from.toLowerCase(), settings.coin.min_confirmations, function(err, balance) {
// coin.getBalance(function(err, balance) {
FakeClient.prototype.getBalance = function(account, minConf, callback) {
	if (typeof account === 'function') {
		callback = account;
		minConf = 0;
		account = 'total'
	}
	callback(null, this.getAccountBalance(account));
}

FakeClient.prototype.send = function(method) {
	switch(method) {
		case 'getaccountaddress':
			// coin.send('getaccountaddress', nickname.toLowerCase(), function(err, address)
			var callback = arguments[2];
			callback(null, this.getAccountAddress(arguments[1]));
		break;
		case 'move':
			// coin.send('move', from.toLowerCase(), to.toLowerCase(), amount, function(err, reply) {
			var callback = arguments[4];
			if (this.moveCoins(arguments[1],arguments[2],arguments[3])) {
				callback(null, true);
			} else {
				callback(true, null);
			}
		break;
		default:
			//callback(true, null);
	}
}

FakeClient.prototype.move = function(fromAccount, toAccount, value, callback) {
	if (this.moveCoins(fromAccount, toAccount, value)) {
		callback(null, true);
	} else {
		callback(true, null);
	}
}

FakeClient.prototype.incomingTx = function(accountName, value) {
	if (!this.accounts[accountName]) {
		this.createNewAccount(accountName);
	}
	this.accounts[accountName].balance += value;
	this.accounts['total'].balance += value;
}

// coin.validateAddress(address, function(err, reply) {
FakeClient.prototype.validateAddress = function(address, callback) {
	callback(null, {isvalid: this.validate(address)});
}

// coin.sendFrom(from.toLowerCase(), address, balance - settings.coin.withdrawal_fee, function(err, reply) {
FakeClient.prototype.sendFrom = function(from, to, value, callback) {
	if (this.moveCoins(from, to, value)) {
		callback(null, true);
	} else {
		callback(true, null);
	}
}

module.exports = FakeClient;