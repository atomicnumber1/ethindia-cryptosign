pragma solidity ^0.4.0;
contract Signer {

    struct Signdetails {
        string documentId;
        string initHash;
        string email;
        string signedHash;
        bool isSigned;
        string timestamp;
    }

    address deployer;
    string accountId;
    string documentId;
    string email;
    string initHash;

    mapping(string => Signdetails) signDetailsMap;
    mapping(string => string) hashDocumentMap;

    function Signer(string _accountId) public {
        deployer = msg.sender;
        accountId = _accountId;
    }

    function initSign(string _documentId, string _initHash) public {
       signDetailsMap[_documentId] = Signdetails(_documentId,_initHash,'','',false,'');
    }
    //onlyOwner

    function finishSign(string _documentId, string _signedHash, string _timestamp, string _email) public{
         hashDocumentMap[_signedHash] = _documentId;
         Signdetails storage currentSignDetail = signDetailsMap[_documentId];
         currentSignDetail.signedHash = _signedHash;
         currentSignDetail.email = _email;
         currentSignDetail.timestamp = _timestamp;
         currentSignDetail.isSigned = true;
    }

    function verifySign(string _documentId) public constant returns(bool _isSigned){
        Signdetails storage currentSignDetail2 = signDetailsMap[_documentId];
        _isSigned =  currentSignDetail2.isSigned;
    }


    function getDetails(string _documentId)  public constant returns(string,string,string,string,bool,string){
        Signdetails storage currentSignDetail3 = signDetailsMap[_documentId];
        return (currentSignDetail3.documentId,currentSignDetail3.initHash,currentSignDetail3.email,currentSignDetail3.signedHash,currentSignDetail3.isSigned,currentSignDetail3.timestamp);
    }

    function getDetailsFromHash(string _signedHash)  public constant returns(string,string,string,string,bool,string){
        string storage _documentId = hashDocumentMap[_signedHash];
        Signdetails storage currentSignDetail3 = signDetailsMap[_documentId];
        return (currentSignDetail3.documentId,currentSignDetail3.initHash,currentSignDetail3.email,currentSignDetail3.signedHash,currentSignDetail3.isSigned,currentSignDetail3.timestamp);
    }


}

//config.contracts.signer2.abi = [{"constant":true,"inputs":[{"name":"_documentId","type":"string"}],"name":"getDetails","outputs":[{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"bool"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_documentId","type":"string"},{"name":"_initHash","type":"string"},{"name":"_email","type":"string"}],"name":"initSign","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_signedHash","type":"string"}],"name":"getDetailsFromHash","outputs":[{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"bool"},{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_documentId","type":"string"}],"name":"verifySign","outputs":[{"name":"_isSigned","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_documentId","type":"string"},{"name":"_signedHash","type":"string"},{"name":"_timestamp","type":"string"}],"name":"finishSign","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_accountId","type":"string"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];
//config.contracts.signer2.data = '606060405234156200001057600080fd5b604051620015fb380380620015fb83398101604052808051820191905050336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508060019080519060200190620000869291906200008e565b50506200013d565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10620000d157805160ff191683800117855562000102565b8280016001018555821562000102579182015b8281111562000101578251825591602001919060010190620000e4565b5b50905062000111919062000115565b5090565b6200013a91905b80821115620001365760008160009055506001016200011c565b5090565b90565b6114ae806200014d6000396000f30060606040526004361061006d576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680631328fd8f146100725780632cfe50df146103035780632d683b25146103e65780636f51302114610677578063fc7606f8146106ec575b600080fd5b341561007d57600080fd5b6100cd600480803590602001908201803590602001908080601f016020809104026020016040519081016040528093929190818152602001838380828437820191505050505050919050506107cf565b6040518080602001806020018060200180602001871515151581526020018060200186810386528c818151815260200191508051906020019080838360005b8381101561012757808201518184015260208101905061010c565b50505050905090810190601f1680156101545780820380516001836020036101000a031916815260200191505b5086810385528b818151815260200191508051906020019080838360005b8381101561018d578082015181840152602081019050610172565b50505050905090810190601f1680156101ba5780820380516001836020036101000a031916815260200191505b5086810384528a818151815260200191508051906020019080838360005b838110156101f35780820151818401526020810190506101d8565b50505050905090810190601f1680156102205780820380516001836020036101000a031916815260200191505b50868103835289818151815260200191508051906020019080838360005b8381101561025957808201518184015260208101905061023e565b50505050905090810190601f1680156102865780820380516001836020036101000a031916815260200191505b50868103825287818151815260200191508051906020019080838360005b838110156102bf5780820151818401526020810190506102a4565b50505050905090810190601f1680156102ec5780820380516001836020036101000a031916815260200191505b509b50505050505050505050505060405180910390f35b341561030e57600080fd5b6103e4600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050610bb0565b005b34156103f157600080fd5b610441600480803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050610d25565b6040518080602001806020018060200180602001871515151581526020018060200186810386528c818151815260200191508051906020019080838360005b8381101561049b578082015181840152602081019050610480565b50505050905090810190601f1680156104c85780820380516001836020036101000a031916815260200191505b5086810385528b818151815260200191508051906020019080838360005b838110156105015780820151818401526020810190506104e6565b50505050905090810190601f16801561052e5780820380516001836020036101000a031916815260200191505b5086810384528a818151815260200191508051906020019080838360005b8381101561056757808201518184015260208101905061054c565b50505050905090810190601f1680156105945780820380516001836020036101000a031916815260200191505b50868103835289818151815260200191508051906020019080838360005b838110156105cd5780820151818401526020810190506105b2565b50505050905090810190601f1680156105fa5780820380516001836020036101000a031916815260200191505b50868103825287818151815260200191508051906020019080838360005b83811015610633578082015181840152602081019050610618565b50505050905090810190601f1680156106605780820380516001836020036101000a031916815260200191505b509b50505050505050505050505060405180910390f35b341561068257600080fd5b6106d2600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190505061117b565b604051808215151515815260200191505060405180910390f35b34156106f757600080fd5b6107cd600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050611205565b005b6107d7611349565b6107df611349565b6107e7611349565b6107ef611349565b60006107f9611349565b60006005886040518082805190602001908083835b602083101515610833578051825260208201915060208101905060208303925061080e565b6001836020036101000a03801982511681845116808217855250505050505090500191505090815260200160405180910390209050806000018160010182600201836003018460040160009054906101000a900460ff1685600501858054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156109235780601f106108f857610100808354040283529160200191610923565b820191906000526020600020905b81548152906001019060200180831161090657829003601f168201915b50505050509550848054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156109bf5780601f10610994576101008083540402835291602001916109bf565b820191906000526020600020905b8154815290600101906020018083116109a257829003601f168201915b50505050509450838054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610a5b5780601f10610a3057610100808354040283529160200191610a5b565b820191906000526020600020905b815481529060010190602001808311610a3e57829003601f168201915b50505050509350828054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610af75780601f10610acc57610100808354040283529160200191610af7565b820191906000526020600020905b815481529060010190602001808311610ada57829003601f168201915b50505050509250808054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610b935780601f10610b6857610100808354040283529160200191610b93565b820191906000526020600020905b815481529060010190602001808311610b7657829003601f168201915b505050505090509650965096509650965096505091939550919395565b60c0604051908101604052808481526020018381526020018281526020016020604051908101604052806000815250815260200160001515815260200160206040519081016040528060008152508152506005846040518082805190602001908083835b602083101515610c395780518252602082019150602081019050602083039250610c14565b6001836020036101000a03801982511681845116808217855250505050505090500191505090815260200160405180910390206000820151816000019080519060200190610c8892919061135d565b506020820151816001019080519060200190610ca592919061135d565b506040820151816002019080519060200190610cc292919061135d565b506060820151816003019080519060200190610cdf92919061135d565b5060808201518160040160006101000a81548160ff02191690831515021790555060a0820151816005019080519060200190610d1c92919061135d565b50905050505050565b610d2d611349565b610d35611349565b610d3d611349565b610d45611349565b6000610d4f611349565b6000806006896040518082805190602001908083835b602083101515610d8a5780518252602082019150602081019050602083039250610d65565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902091506005826040518082805460018160011615610100020316600290048015610e1d5780601f10610dfb576101008083540402835291820191610e1d565b820191906000526020600020905b815481529060010190602001808311610e09575b505091505090815260200160405180910390209050806000018160010182600201836003018460040160009054906101000a900460ff1685600501858054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610eed5780601f10610ec257610100808354040283529160200191610eed565b820191906000526020600020905b815481529060010190602001808311610ed057829003601f168201915b50505050509550848054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610f895780601f10610f5e57610100808354040283529160200191610f89565b820191906000526020600020905b815481529060010190602001808311610f6c57829003601f168201915b50505050509450838054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156110255780601f10610ffa57610100808354040283529160200191611025565b820191906000526020600020905b81548152906001019060200180831161100857829003601f168201915b50505050509350828054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156110c15780601f10611096576101008083540402835291602001916110c1565b820191906000526020600020905b8154815290600101906020018083116110a457829003601f168201915b50505050509250808054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561115d5780601f106111325761010080835404028352916020019161115d565b820191906000526020600020905b81548152906001019060200180831161114057829003601f168201915b50505050509050975097509750975097509750505091939550919395565b6000806005836040518082805190602001908083835b6020831015156111b65780518252602082019150602081019050602083039250611191565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902090508060040160009054906101000a900460ff16915050919050565b6000836006846040518082805190602001908083835b602083101515611240578051825260208201915060208101905060208303925061121b565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902090805190602001906112869291906113dd565b506005846040518082805190602001908083835b6020831015156112bf578051825260208201915060208101905060208303925061129a565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902090508281600301908051906020019061130c9291906113dd565b50818160050190805190602001906113259291906113dd565b5060018160040160006101000a81548160ff02191690831515021790555050505050565b602060405190810160405280600081525090565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061139e57805160ff19168380011785556113cc565b828001600101855582156113cc579182015b828111156113cb5782518255916020019190600101906113b0565b5b5090506113d9919061145d565b5090565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061141e57805160ff191683800117855561144c565b8280016001018555821561144c579182015b8281111561144b578251825591602001919060010190611430565b5b509050611459919061145d565b5090565b61147f91905b8082111561147b576000816000905550600101611463565b5090565b905600a165627a7a72305820668177290d9fba14f50e0383203e21d50ab48e5a301b03c2ef0aa69ad4e5d1c40029';