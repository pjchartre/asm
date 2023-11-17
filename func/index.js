const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

async function main() {
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

    /*console.log('\nDeleting blobs...');

    for await (const dataBlob of webContainerClient.listBlobsFlat({prefix: 'data/'})) {
        if(dataBlob.properties.ResourceType != 'directory') {
            console.log('Deleting ', dataBlob.name);
            const dataBlockBlobClient = await webContainerClient.getBlockBlobClient(dataBlob.name);
            await dataBlockBlobClient.deleteIfExists({deleteSnapshots: 'include'});    
        }
        else {

        }
    }*/

    await removeBlobHierarchical(webContainerClient, 'data');


    console.log('\nCopying blobs...');

    const allPollers = [];
    for await (const item of uploadContainerClient.listBlobsFlat()) {
        if(item.properties.ResourceType != 'directory') {
            const blob = uploadContainerClient.getBlobClient(item.name);
            console.log(`\nCopying ${blob.name} from URL: ${blob.url}`);
            const destinationBlob = webContainerClient.getBlobClient(`data/${blob.name}`);
            const poller = await destinationBlob.beginCopyFromURL(blob.url);
    
            allPollers.push( poller.pollUntilDone());
        }
    }
    
    console.log('Waiting for copy to finish');
    await Promise.all(allPollers);
    console.log('Copy is done');

  } catch (err) {
    console.log(`Error: ${err.message}`);
  }

  return new Promise( (resolve, reject) => {
    resolve(true);
  });
}


async function removeBlobHierarchical(dataBlobClient, prefix) {
    for await (const item of dataBlobClient.listBlobsByHierarchy('/', {prefix: prefix})) {
        if (item.kind === 'prefix') {
            const blob = dataBlobClient.getBlobClient(item.name);
            console.log(`\tBlobPrefix: ${item.name}`);
            await removeBlobHierarchical(dataBlobClient, item.name);
             console.log(`\tDeleted: ${item.name}`);
          } else {
            console.log(`\tBlobItem: name - ${item.name}`);
            const dataBlockBlobClient = await dataBlobClient.getBlockBlobClient(item.name);
            await dataBlockBlobClient.deleteIfExists({deleteSnapshots: 'include'});
            console.log(`\tDeleted: ${item.name}`);
          }
    }
}

main()
  .then(() => console.log("Done"))
  .catch((ex) => console.log(ex.message));