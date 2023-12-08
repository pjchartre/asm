const { app } = require('@azure/functions');
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

async function main(context) {
  try {
    const uploadContainerName = 'upload';
    const webContainerName = '$web';

    // Quick start code goes here
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw Error('Azure Storage Connection string not found');
    }

    // Create the BlobServiceClient object with connection string
    const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
    );
    const uploadContainerClient = blobServiceClient.getContainerClient(uploadContainerName);
    const webContainerClient = blobServiceClient.getContainerClient(webContainerName);

    /*context.log('\nDeleting blobs...');

    for await (const dataBlob of webContainerClient.listBlobsFlat({prefix: 'data/'})) {
        if(dataBlob.properties.ResourceType != 'directory') {
            context.log('Deleting ', dataBlob.name);
            const dataBlockBlobClient = await webContainerClient.getBlockBlobClient(dataBlob.name);
            await dataBlockBlobClient.deleteIfExists({deleteSnapshots: 'include'});    
        }
        else {

        }
    }*/

    await removeBlobHierarchical(webContainerClient, 'data', context);


    context.log('\nCopying blobs...');

    const allPollers = [];
    for await (const item of uploadContainerClient.listBlobsFlat()) {
        if(item.properties.ResourceType != 'directory') {
            const blob = uploadContainerClient.getBlobClient(item.name);
            context.log(`\nCopying ${blob.name} from URL: ${blob.url}`);
            const destinationBlob = webContainerClient.getBlobClient(`data/${blob.name}`);
            const poller = await destinationBlob.beginCopyFromURL(blob.url);
    
            allPollers.push( poller.pollUntilDone());
        }
    }
    
    context.log('Waiting for copy to finish');
    await Promise.all(allPollers);
    context.log('Copy is done');

  } catch (err) {
    context.log(`Error: ${err.message}`);
  }

  context.done();

  return new Promise( (resolve, reject) => {
    resolve(true);
  });
}


async function removeBlobHierarchical(dataBlobClient, prefix, context) {
    for await (const item of dataBlobClient.listBlobsByHierarchy('/', {prefix: prefix})) {
        if (item.kind === 'prefix') {
            const blob = dataBlobClient.getBlobClient(item.name);
            context.log(`\tBlobPrefix: ${item.name}`);
            await removeBlobHierarchical(dataBlobClient, item.name, context);
            context.log(`\tDeleted: ${item.name}`);
          } else {
            context.log(`\tBlobItem: name - ${item.name}`);
            const dataBlockBlobClient = await dataBlobClient.getBlockBlobClient(item.name);
            await dataBlockBlobClient.deleteIfExists({deleteSnapshots: 'include'});
            context.log(`\tDeleted: ${item.name}`);
          }
    }
}

module.exports = async function (context, eventGridEvent) {
  context.log({context});
  context.log("Data: " + JSON.stringify(eventGridEvent.data));
  await main(context);
};