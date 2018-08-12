let web3HelperModule = require('./web3-helper.js');
let config = require('./config/config.js');
let web3Helper = new web3HelperModule({providerUrl : config.providerUrl});
let _contract = config.contracts.signer3;
let _account1 = config.account1;
let _privateKey1 = config.privateKey1;
let _contractAddress1 =_contract.address;

// var inputParams  = {
//     abi : _abi,
//     methodArgs : { count : 1, args : {"0" : {type : 'uint8', value : 32}}},
//     from : _account1,
//     data:_data,
//     address : _contractAddress1,
//     methodName : 'add',
//     privateKey : _privateKey1
// }

// let callbackImpl = function(error, transactionHash){
// 	console.log('transactionHash:',transactionHash);    
// }

// let completionCallback = function(error,transactionObj){
//  	console.log('transactionObj:',transactionObj);   
// } 

// web3Helper.sendTransaction(inputParams, callbackImpl, completionCallback);

// web3Helper.createContract(_contract.abi,{ data : _contract.data, from : _account1},_privateKey1,
// 	function(error, transactionHash){
// 		console.log('transactionHash:',transactionHash);
// 	},
//     function(contractAddress,contractInstance,transactionObj){
//     	console.log('contractAddress:',contractAddress);
//     },
//     { count : 1, args : {"0" : {type : 'string', value : 'ABC Corpotion'}}});

//web3Helper.call({abi : _contract.abi,methodArgs : { count : 1, args : {"0" : {type : 'string', value : 'document4'}}}, from : _account1,data:_contract.data,address : _contract.address,methodName : 'getDetails'}, function(error,result){ console.log('@@@@In Call',error,result);});

//web3Helper.initSign('document7','initHash7','emailsigne7','emailsender7');
//web3Helper.finishSign('document7','signedhash7',"signLocation7");

//0x9b8f299af0b5496db6ed52c5e6e1df1c1899fa44d056d49f23923c27e68e969a

// web3Helper.getSignDetails('document7').then(function(signDetails){
// 	console.log('signDetails:',signDetails);
// });

web3Helper.getSignDetailsFromHash('signedhash7').then(function(signDetails){
	console.log('signDetailsFromHash:',signDetails);
});