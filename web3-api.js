
/*
web3Config
{providerUrl}

*/
var web3ApiModule = function(web3Config){
    var self = this;

    var Web3 = require('web3');
    var Transaction =  require('ethereumjs-tx');

    let providerUrl = web3Config.providerUrl;

     if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
    }

    var eth = web3.eth;
    self.eth = eth;
    self.web3 = web3;

     self.commonCallback = function(error,result){
        console.info('error:',error);
        console.info('result:',result);
    }

    self.checkCallbackFn = function(callbackFn){
        if(callbackFn)
            return callbackFn;
        else
            return self.commonCallback;
    }

    self.getBalance = function(account,callbackFn){
        web3.eth.getBalance(account,self.checkCallbackFn(callbackFn));
    }

    self.getBalanceSync = function(address,unit){
        let weiBal;
        try{
            weiBal= web3.eth.getBalance(address);
        }
        catch(e){
            return parseFloat('0');
        }

        let bal;
        if(!unit || unit!='wei'){
            if(weiBal){
                weiBal = web3.fromWei(weiBal,unit);
            }

        }
        let floatBal = parseFloat(weiBal);
        return floatBal;
    }

    self.loadContract = function(abi){
        return self.eth.contract(abi);
    }


    self.parseParamArr = function(paramArr){
        var _argsArr = [];
        if(paramArr!=null && paramArr.length>0){
            for(var i=0;i<paramArr.length;i++){
                _argsArr.push(paramArr[i]);
            }
        }

        if(arguments.length>1){
            for(var j=1;j<arguments.length;j++){
                _argsArr.push(arguments[j]);
            }
        }
        return _argsArr;
    }

    /*
    web3Api.createContractNew(
        abi,
        { data : byteData,from: fromAddress},
        privateKey,
        function(error, transactionHash){},
        function(contractAddress,contractInstance,transactionObj){}),
        paramArr : [{value : '8', type : 'uint8'}]

    */

    self.createContractNew = function(abi,contractNewData,privateKey,callbackImpl,callBackFnWithContractInstance,paramArr){
        var contractDef = self.loadContract(abi);
        var sendTransactionNewData;
        if(!paramArr){
            sendTransactionNewData = contractDef.new.getData(contractNewData);
        }
        else{
            var _argsArr = self.parseParamArr(paramArr,contractNewData);
            console.log("###create contract new: _argsArr : ", _argsArr);
            sendTransactionNewData = contractDef.new.getData.apply(contractDef.new,_argsArr);
        }
        console.log('***contractDef.new.getData***',contractDef.new.getData);
        //console.log('***contractNewData***',contractNewData);
        //console.log('***sendTransactionNewData***',sendTransactionNewData);
        self.sendRawTransaction({data : sendTransactionNewData, from : contractNewData.from},privateKey,function(error,transactionHash){
            if(error){
                console.log('***create error***',error);
            }
            console.log('Transaction created with transaction hash:', transactionHash);
            console.log('waiting to be mined...');

            //getTransactionReceipt(transactionHash, function(error, initTransactionObj){
            callbackImpl(error,transactionHash);
            //});

            var completionCallbackFnImpl = function(error,transactionObj){
                if(!error){
                    var contractAddress = transactionObj.contractAddress;
                    console.log('Contract Created at Address: ',contractAddress);
                    var contractInstance = self.getContract(contractDef,contractAddress);

                    if(callBackFnWithContractInstance)
                        callBackFnWithContractInstance(contractAddress,contractInstance,transactionObj);
                }
                else{
                    console.error("**afterContractFn:error***",error);
                }
            }
            if(transactionHash){
                self.checkTransaction(transactionHash,{
                    isRecursive : true,
                    interval : 1000,
                    completionCallbackFn : completionCallbackFnImpl
                });
            }

        });
    }


    self.call = function(inputParams){
        var _abi = inputParams.abi;
        var _paramArr = inputParams.args;
        //console.log('_paramArr:',_paramArr);
        //var _transactionObj = inputParams.transactionObj;
        var _callback = self.checkCallbackFn(inputParams.callbackFn);
        var _blockNumber = inputParams.blockNumber ? inputParams.blockNumber : 'latest';
        var _address = inputParams.address;
        var _methodName = inputParams.methodName;
        var _from = inputParams.from;
        var _data  = inputParams.data;
        var _transactionObj = {from : _from, data : _data};

        var _contractDef = self.loadContract(_abi);
        var _contractInstance = _contractDef.at(_address);
        var _methodInstance = _contractInstance[_methodName];
        var _argsArr = self.parseParamArr(_paramArr,_transactionObj,_callback);
        //console.log('_argsArr in call@@:'+_argsArr);
        _methodInstance.call.apply(_methodInstance,_argsArr);
    };

    self.transfer = function(inputParams,callbakcImpl,completionCallbackFnImpl){
    var _from = inputParams.from;
    var _to = inputParams.to;
    var _value  = inputParams.value;
    var _privateKey = inputParams.privateKey;

    var sendTransactionObj = {
        value : _value,
        to : _to,
        from : _from
     };

     self.sendRawTransaction(sendTransactionObj,_privateKey,function(error,transactionHash){
        if(callbakcImpl){
            callbakcImpl(error,transactionHash);
        }

        if(!transactionHash) console.error(error);

        console.log('Transaction created with transaction ID:',transactionHash);
        console.log('waiting to be mined...');
        self.checkTransaction(transactionHash,{
            isRecursive : true,
            interval : 1000,
            completionCallbackFn :completionCallbackFnImpl
            });
     });
    }
    /*
    Get contract at specific address
    {contractDef} - Contract definition loaded using ABI, Use method loadContract(abi)
    {contractAddress} - Address of deployed contract
    return contract instance.
    */
    self.getContract = function(contractDef,contractAddr){
        return contractDef.at(contractAddr);
    }

    /*
    Estimate amount of gas required
    {transactionObj} - {
            data : [Contract Data]
        }
    {callbackFn}
    */
    self.estimateGas = function(transactionObj,callbakcFn){
        web3.eth.estimateGas(transactionObj,callbakcFn);
    }


    /*
    To get individual transaction
    {transactionId}  - Transaction Id hash
    {callbackFn}
    ****getTransaction*** { blockHash: '0x066363ddb741d88859de31bb786a4e3e210ff3d2493736c29a72a04b80a1e9a9',
      blockNumber: 46990,
      contractAddress: '0xee3c3e7ad11aa602d6f48b4ccd40392809a62104',
      cumulativeGasUsed: 132763,
      from: '0x2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab',
      gasUsed: 132763,
      logs: [],
      logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      root: '0x07dfddeaa4d6330fbd5dcff9e04ca34b26a9622edc625a202bf3e45635c81992',
      to: null,
      transactionHash: '0xc81355f8c486382698cc011f71d911bcca90d30fdc0658d478807d5071598530',
      transactionIndex: 0 }
    ****getTransaction2*** { blockHash: '0x066363ddb741d88859de31bb786a4e3e210ff3d2493736c29a72a04b80a1e9a9',
      blockNumber: 46990,
      from: '0x2dccf5d9c5cc6ea6a50034529e3d0b613fedd3ab',
      gas: 3000000,
      gasPrice: { [String: '20000000000'] s: 1, e: 10, c: [ 20000000000 ] },
      hash: '0xc81355f8c486382698cc011f71d911bcca90d30fdc0658d478807d5071598530',
      input: '0x6060604052604051602080610113833981016040528080519060200190919050505b806000600050819055505b5060d98061003a6000396000f360606040526000357c010000000000000000000000000000000000000000000000000000000090048063271f88b414604d578063aa8c217c146067578063d321fe2914608c576049565b6002565b346002576065600480803590602001909190505060b1565b005b346002576076600480505060bf565b6040518082815260200191505060405180910390f35b34600257609b600480505060c8565b6040518082815260200191505060405180910390f35b806000600050819055505b50565b60006000505481565b6000600060005054905060d6565b90560000000000000000000000000000000000000000000000000000000000000003',
      nonce: 108,
      to: null,
      transactionIndex: 0,
      value: { [String: '0'] s: 1, e: 0, c: [ 0 ] },
      v: '0x1c',
      r: '0xd8a20821e1d6d972eaac6f7dd47e21ec62df63687ba412ed0e4ea1caa4bdbf6e',
      s: '0x345a7744f09bdb5972c1a57e7df9d9b70d5137e0945b4c2daf22ab542ea66d57' }

    */

    self.getTransactionFull = function(transactionId,callbackFn){
        transactionId = ''+transactionId;
        web3.eth.getTransactionReceipt(transactionId, function(error1, transactionObj1){
            if(error1){
                callbackFn(error1,undefined);
            }
            else{

                if(!(transactionObj1.contractAddress))
                    transactionObj1.contractAddress = transactionObj1.to;
                web3.eth.getTransaction(transactionId, function(error2, transactionObj2){
                if(error2){
                    callbackFn(error2,undefined);
                }
                else{
                    transactionObj1.gas = transactionObj2.gas;
                    transactionObj1.gasPrice = transactionObj2.gasPrice;
                    transactionObj1.input = transactionObj2.input;
                    transactionObj1.nonce = transactionObj2.nonce;
                    transactionObj1.value = transactionObj2.value;
                    transactionObj1.v = transactionObj2.v;
                    transactionObj1.r = transactionObj2.r;
                    transactionObj1.s = transactionObj2.s;

                    callbackFn(undefined,transactionObj1);
                }
            });
            }
        });

    }
    self.getTransaction = function(transactionId,callbackFn){
        web3.eth.getTransactionReceipt(transactionId,self.checkCallbackFn(callbackFn));
    }
    /*
    To check transaction is mined or not
    {transactionId} - Transaction Id hash
    {isRecursive} - Flag which indicate call this method till block is mined
    {interval} - interval time for recursive call in miliseconds
    {completionCallbackFn} - Callback when transaction is mined
    {callbackFn}
    */
    self.checkTransaction = function(transactionId,params){
        var isRecursive = params.isRecursive;
        var interval = params.interval;
        var callbackFn = params.callbackFn;
        var completionCallbackFn = params.completionCallbackFn;

        var _callbackFn = function(error,result){
            //console.log('checkTransaction with transactionId:%s, result:%s, error:%s',transactionId,result,error);
            if(isRecursive){
                if(!result || !result.blockNumber){
                     setTimeout(function(){
                        self.checkTransaction(transactionId,params);},
                    interval);
                }
                else{
                    if(completionCallbackFn){
                        self.getTransactionFull(transactionId, function(errorC, resultC){
                            completionCallbackFn(errorC,resultC);
                        });
                    }
                }

            }
            else{
                if(callbackFn){
                    callbackFn(error,result);
                }
            }

        };

       // console.info('checkTransaction with transactionId:%s, isRecursive: %s,interval:%s',transactionId,isRecursive,interval);
        self.getTransaction(transactionId,_callbackFn);
    }


self.sendTransaction = function(inputParams,callbakcImpl,completionCallbackFnImpl){
        var _abi = inputParams.abi;
        var _paramArr = inputParams.args;
        var _from  = inputParams.from;
        var _data  = inputParams.data;
        var _callback = self.checkCallbackFn(inputParams.callbackFn);
        var _blockNumber = inputParams.blockNumber ? inputParams.blockNumber : 'latest';
        var _address = inputParams.address;
        var _methodName = inputParams.methodName;
        var _privateKey = inputParams.privateKey;

        var _contractDef = self.loadContract(_abi);
        var _contractInstance = _contractDef.at(_address);
        var _methodInstance = _contractInstance[_methodName];
        var _argsArr = self.parseParamArr(_paramArr,{data : _data, from : _from});


        //console.log('_methodInstance',_methodInstance, '_argsArr', _argsArr);

        var sendTransactionData = _methodInstance.getData.apply(_methodInstance,_argsArr);
        var sendTransactionObj = {
            data : sendTransactionData,
            to : _address,
            from : _from
        };

        self.sendRawTransaction(sendTransactionObj,_privateKey,function(error,transactionHash){
            if(callbakcImpl){
                callbakcImpl(error,transactionHash);
            }

            if(!transactionHash) console.error(error);

            completionCallbackFnImpl(error, transactionHash);

            console.log('Transaction created with transaction ID:',transactionHash);
            console.log('waiting to be mined...');
            // self.checkTransaction(transactionHash,{
            //     isRecursive : true,
            //     interval : 1000,
            //     completionCallbackFn :completionCallbackFnImpl
            //     });
        });
}


    /*
     var inputParams  = {
        abi : abi,
        args : _args,
        from : fromAddress,
        data:byteData,
        address : _address,
        methodName : _methodName,
        privateKey : newPrivateKey
    }

    */
    self.sendRawTransaction = function(params,privateKey,callbackFn){

        const gasPrice = params.gasPrice?params.gasPrice : web3.eth.gasPrice;
        console.log('gasPrice:',gasPrice);
        const gasPriceHex = web3.toHex(gasPrice);
        const gasLimit = params.gasLimit?params.gasLimit : 4000000;
        const gasLimitHex = web3.toHex(gasLimit);
        const from = params.from?params.from : web3.eth.coinbase;
        const nonce = web3.eth.getTransactionCount(from);
        const nonceHex = web3.toHex(nonce);
        const data = (params.data && params.data.startsWith('0x')?'':'0x')+params.data;
        const to = params.to ? params.to :'';
        let value = params.value;
        console.log('from in sendRawTransaction:',from, gasLimit);

        const rawTx = {
            nonce: nonceHex,
            gasPrice: gasPriceHex,
            gasLimit: gasLimitHex,
            data: data,
            from:from,
            to : to,
            value : value
        };

        const tx = new Transaction(rawTx);
        var privateKeyHex = new Buffer(privateKey, 'hex')
        tx.sign(privateKeyHex);
        var feeCost = tx.getUpfrontCost();
        //console.info('Total Amount of wei needed:' + feeCost.toString());
        const serializedTxHex = '0x'+tx.serialize().toString('hex');
        web3.eth.sendRawTransaction(serializedTxHex, callbackFn);
    }

    }

    if(module!=undefined && module.exports!=undefined){
        module.exports = web3ApiModule;
    }
    else{
        window.web3ApiModule = web3ApiModule;
    }