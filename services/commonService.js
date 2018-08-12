const request = require('request');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config/config');
const HummusRecipe = require('hummus-recipe');
const mailer = require('../config/mail');
let web3HelperModule = require('../web3-helper.js');
let web3Helper = new web3HelperModule({providerUrl : config.providerUrl});


//hashing stuff

var getHashFromURL = function(url){

    let hasher = crypto.createHash('sha1');
    hasher.setEncoding('hex');

    request(url).pipe(hasher).on('finish', function() {
        console.log("########result ", hasher.read());
        return hasher.read();
    });
}


var getHashFromStoredFile = function(path, hashingAlgo = 'sha256'){

    supportedAlgorithms = ['sha256', 'sha512']

    // reject if hashing algorithm isn't supported
    if (!supportedAlgorithms.some((algo) => algo == hashingAlgo)) {
        return (new Promise((resolve, reject) => reject('invalid hashing algo')))
    }

    let file = fs.ReadStream(path)
    let hasher = crypto.createHash(hashingAlgo);
    hasher.setEncoding('hex');
    file.on('data', data => hasher.update(data))
    return (new Promise((resolve, reject) => {
        file.on('end', _ => resolve(hasher.digest('hex')))
    }))
}

//end of hashing stuff



/*
    sample fs.writeFileSync("10111.pdf", data, 'binary');
*/
function storeFile(path, blobData, type){
    fs.writeFileSync(path, blobData, type);
}

function getDocURLToBeSigned(attId){
    return config.WEBSITE_URL + 'forsign' + attId + '.pdf';
}



//pdf stuff
function signPdfWithImageAndText(sourcePath, outputPath, imagePath, text){
    console.log("###signPdfWithImageAndText###", sourcePath, outputPath, imagePath, text);
    return new Promise(function (resolve, reject) {
        const pdfDoc = new HummusRecipe(sourcePath, outputPath);
        //console.log("########pdfDoc@@@", pdf.metadata.pages);
        let pdf = pdfDoc.info();
        //console.log("########", pdf.metadata.pages);
        pdfDoc
            // edit 1st page
            .editPage(1)
            .text(text, 2, 2)
            .endPage()
            // edit last page
            .editPage(pdf.metadata.pages)
            .image(imagePath, 380, 270,{width: 100, keepAspectRatio: true})
            .endPage()
            // end and save
            .endPDF();
            console.log('###signPdfWithImageAndText### Completed');
            resolve(true);
    });
}

/*
let emailParams = {
    attachmentId  : attid,
    email : email,
    recordId : recordId,
    signURL : signURL,
    contractAddress : contractAddress,
    transactionHash : transactionHash,
    accountAddress : accountAddress
};
*/
function sendEmailForInitSign (parameters){
    console.log('###sendEmailForInitSign###',parameters);
    var mailOptions = {
        from: config.MAIL_FROM,
        to: parameters.email,
        subject: 'Please sign MSA document.',
        html: 'Dear User,<br/><br/>Team Dapps user has Sent You following document to sign<br/><br/>Please <a href=\''+parameters.signURL+'\'>Click here</a> to review and sign.<br/><br/>After you sign, all parties will receive a final PDF copy by email. <br/><br/>Thanks<br/>CrytpoSign team<br/>'
    }
    mailer.sendEmail(mailOptions);
}


/*
let emailParams = {
    attachmentId  : attid,
    email : email,
    recordId : recordId,
    pdfURL : signURL,
    contractAddress : contractAddress,
    transactionHash : transactionHash,
    accountAddress : accountAddress
};
*/
function sendEmailForFinishSign(parameters){
    console.log('###sendEmailForInitSign###',parameters);
     var mailOptions = {
        from: config.MAIL_FROM,
        to: parameters.email,
        attachments : [{
            path: parameters.pdfURL
        }],
        subject: 'Agreement has been signed',
        html: 'Dear User,<br/><br/>MSA between Team Dapps and Diego Francis is Signed and Filed! <br/><br/>From: Team Dapps User (Team Dapps) <br/>To: Diego Francis and Team Dapps User <br/><br/>Attached is a final copy of MSA<br/><br/>Copies have been automatically sent to all parties to the agreement.<br/><br/>Thanks<br/>CrytpoSign team<br/>'
    }
    mailer.sendEmail(mailOptions);
}
// function addSignToPDF(sourcePath, outputPath, imagePath, text){
//     const pdfDoc = new HummusRecipe('input.pdf', storagePath+'/output.pdf');
//     pdfDoc
//         // edit 1st page
//         .editPage(1)
//         .text('Add some texts to an existing pdf file', 150, 300)
//         .rectangle(20, 20, 40, 100)
//         .comment('Add 1st comment annotaion', 200, 300)
//         .endPage()
//         // edit 2nd page
//         .editPage(2)
//         .comment('Add 2nd comment annotaion', 200, 100)
//         .endPage()
//         // end and save
//         .endPDF();
// }


//document name/id, bcryptHash, email, signerDetails

function initSignatureContract(documentId, sha256Hash, email, encryptedEmail, signerDetails){
    return new Promise(function (resolve, reject) {

        //let initHash = data;
        let mine = false;
        let initSignPromise = web3Helper.initSign(documentId,sha256Hash,encryptedEmail,signerDetails, mine);

        initSignPromise.then(function(_initSignDetails){
            if(!_initSignDetails){
                console.log('###InitSIgn####_initSignDetails is undefined');
                reject('Didn\'t receive the correct data, please try again.');
            }
            else{
                let contractAddress = config.contracts.signer3.address;
                let transactionHash = _initSignDetails;
                let accountAddress = config.account1;

                console.log('initSignature : Transaction completed with Block Number :', _initSignDetails.blockNumber);

                let signURL = config.WEBSITE_URL +  '/viewdocument?documentId='+ documentId +'&email='+email+'&contractAddress='+contractAddress;
                console.log("######signURL ", signURL);
                //send email

                let emailParams = {
                    documentName  : 'Contract',
                    email : email,
                    signURL : signURL,
                    contractAddress : contractAddress,
                    transactionHash : transactionHash,
                    accountAddress : accountAddress
                };
                sendEmailForInitSign(emailParams);

                console.log('###initSignature###Completed');
                resolve('success');
                //res.json({message: 'success'});
            }
        });

    });
}


function signAndSendEmail(documentId, signedDocHash, location, signedDocumentURLToSend, email, encryptedEmail){
    return new Promise(function (resolve, reject) {
        console.log("####in signAndSendEmail ", documentId, signedDocHash, location, signedDocumentURLToSend, email, encryptedEmail);
        //create contract, store hash and send for email
        let signedHash = signedDocHash;
        let finishSignPromise = web3Helper.finishSign(documentId,signedHash,location, email, mine = false, encryptedEmail);

        finishSignPromise.then(function(_finishSignDetails){
            if(!_finishSignDetails){
                console.log('###Sign####_finishSignDetails is undefined');
                resolve('There is some problem while processing.');
                //res.json({  message: 'There is some problem while processing.'});
            }
            else{
                let contractAddress = config.contracts.signer3.address;
                let transactionHash = _finishSignDetails;
                let accountAddress = config.account1;

                console.log('###Sign#### : Transaction completed with blockNumber :', _finishSignDetails);
                let signedDocumentURL = config.WEBSITE_URL +  '/viewdocument?documentId='+ documentId +'&email='+email+'&contractAddress='+contractAddress;
                console.log("###Sign####signedDocumentURL###", signedDocumentURL);
                //send email
                let _pdfURL  = config.WEBSITE_URL + signedDocumentURLToSend;

                let emailParams = {
                    attachmentId  : documentId,
                    email : email,
                    pdfURL : _pdfURL,
                    contractAddress : contractAddress,
                    transactionHash : transactionHash,
                    accountAddress : accountAddress
                };
                sendEmailForFinishSign(emailParams);
                resolve();
            }
        });

    });
}

const encrypt = (key, data) => {
    // const iv = crypto.randomBytes(16)
    // let cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let cipher = crypto.createCipher('aes-256-cbc', key)
    let crypted = cipher.update(data, 'utf-8', 'hex')
    crypted += cipher.final('hex')

    return crypted
}

const decrypt = (key, data) => {
    // const iv = crypto.randomBytes(16)
    // let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decipher = crypto.createDecipher('aes-256-cbc', key)
    let decrypted = decipher.update(data, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')

    return decrypted
}


const getUniqueId = _ => {
    let psuedoRandomData = new Date().toString()
    psuedoRandomData += crypto.randomBytes(16).toString()
    return crypto.createHash('md5').update(psuedoRandomData, 'utf-8').digest('hex')
}



exports.signAndSendEmail = signAndSendEmail;
exports.initSignatureContract = initSignatureContract;
exports.storeFile = storeFile;
exports.getHashFromURL = getHashFromURL;
exports.getHashFromStoredFile = getHashFromStoredFile;
exports.getDocURLToBeSigned = getDocURLToBeSigned;
exports.signPdfWithImageAndText = signPdfWithImageAndText;

exports.sendEmailForInitSign = sendEmailForInitSign;
exports.sendEmailForFinishSign = sendEmailForFinishSign;

exports.encrypt = encrypt
exports.decrypt = decrypt

exports.getUniqueId = getUniqueId