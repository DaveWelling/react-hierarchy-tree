import { toast } from 'react-toastify';
import authorize from './authorize';
import config from '../config';
const folderName = 'Curator';
export function openGoogleDriveFile(fileName) {
    return authorize()
        .then(loadDriveApi)
        .then(() => ensureFolderExists(folderName))
        .then(folderId => {
            return checkIfFileExists(folderId, fileName).then(fileId => {
                if (fileId) {
                    return getFile(fileId, folderId);
                } else {
                    throw new Error('File does not exist yet.');
                }
            });
        })
        .then(request => {
            return request.result;
        })
        .catch(err => {
            toast(err.message || err);
        });
}
export function removeGoogleDriveFile(fileName) {
    return authorize()
        .then(loadDriveApi)
        .then(() => ensureFolderExists(folderName))
        .then(folderId => {
            return checkIfFileExists(folderId, fileName).then(fileId => {
                if (fileId) {
                    return removeFile(fileId, folderId);
                } else {
                    throw new Error('File does not exist.  Did you already delete it?');
                }
            });
        })
        .then(request => {
            return request.result;
        })
        .catch(err => {
            toast(err.message || err);
        });
}
export function saveGoogleDriveFile(fileJson, fileName) {
    authorize()
        .then(loadDriveApi)
        .then(() => ensureFolderExists(folderName))
        .then(folderId => {
            return checkIfFileExists(folderId, fileName).then(fileId => {
                if (fileId) {
                    return updateFile(fileJson, fileId, fileName);
                } else {
                    return insertFile(fileJson, folderId, fileName);
                }
            });
        })
        .then(request => {
            toast(`File ${fileName} sent to Google Drive`);
        })
        .catch(err => {
            toast(err.message || err);
        });
}

export function saveNewImage(fileData, projectName) {
    return authorize()
        .then(loadDriveApi)
        .then(() => ensureFolderExists(folderName))
        .then(parentFolderId => ensureFolderExists(projectName, parentFolderId))
        .then(folderId => {
            return checkIfFileExists(folderId, fileData.name).then(fileId => {
                if (fileId) {
                    throw new Error('The file already exists. Pick a new name.');
                } else {
                    return insertFileFromFileData(fileData, folderId);
                }
            });
        })
        .then(request => {
            toast(`File ${fileData.name} sent to Google Drive`);
            return request;
        })
        .catch(err => {
            toast(err.message || err);
        });
}

function loadDriveApi() {
    return gapi.client.load('drive', 'v2');
}

function ensureFolderExists(folderName, parentFolderId) {
    let q = `mimeType="application/vnd.google-apps.folder" and title="${folderName}"`;
    if (parentFolderId) {
        q += ` and "${parentFolderId}" in parents`;
    }
    return gapi.client
        .request({
            path: '/drive/v2/files',
            method: 'GET',
            params: { q }
        })
        .then(request => {
            if (request.result.items.length === 0) {
                return gapi.client
                    .request({
                        path: '/drive/v2/files',
                        method: 'POST',
                        body: {
                            title: folderName,
                            mimeType: 'application/vnd.google-apps.folder'
                        }
                    })
                    .then(request => {
                        return request.result.id;
                    });
            }
            return Promise.resolve(request.result.items[0].id);
        });
}
export function getAllJsonInFolder() {
    return authorize()
        .then(loadDriveApi)
        .then(() => ensureFolderExists(folderName))
        .then(folderId => {
            return gapi.client
                .request({
                    path: '/drive/v2/files',
                    method: 'GET',
                    params: { q: `mimeType="application/json" and "${folderId}" in parents` }
                })
                .then(request => {
                    return request.result.items.map(i => ({ title: i.title.substr(0, i.title.length - 5), id: i.id }));
                });
        });
}

export function getAllPicturesInFolder(projectName) {
    return authorize()
        .then(loadDriveApi)
        .then(() => ensureFolderExists(folderName))
        .then(parentFolderId => ensureFolderExists(projectName, parentFolderId))
        .then(folderId => {
            return gapi.client
                .request({
                    path: '/drive/v2/files',
                    method: 'GET',
                    params: { q: `mimeType contains "image/" and "${folderId}" in parents` }
                })
                .then(request => {
                    return request.result.items.map(i => ({
                        title: i.title,
                        id: i.id,
                        embedLink: i.embedLink,
                        downloadUrl: i.downloadUrl,
                        thumbnailLink: i.thumbnailLink
                    }));
                });
        });
}

function checkIfFileExists(folderId, fileName) {
    return gapi.client
        .request({
            path: '/drive/v2/files',
            method: 'GET',
            params: { q: `mimeType="application/json" and title="${fileName}.json" and "${folderId}" in parents` }
        })
        .then(request => {
            if (request.result.items.length) {
                return request.result.items[0].id;
            }
        });
}
function updateFile(fileJson, fileId, fileName) {
    const boundary = '-------314159265358979323846264';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const contentType = 'application/json';
    const metadata = {
        title: fileName + '.json',
        mimeType: contentType
    };
    const base64Data = btoa(JSON.stringify(fileJson));
    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' +
        contentType +
        '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;
    return gapi.client.request({
        path: `/upload/drive/v2/files/${fileId}`,
        method: 'PUT',
        params: { uploadType: 'multipart' },
        headers: {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
    });
}
function insertFile(fileJson, folderId, fileName) {
    const boundary = '-------314159265358979323846264';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const contentType = 'application/json';
    const metadata = {
        title: fileName + '.json',
        mimeType: contentType,
        parents: [{ id: folderId }]
    };
    const base64Data = btoa(JSON.stringify(fileJson));
    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' +
        contentType +
        '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;
    return gapi.client.request({
        path: '/upload/drive/v2/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
    });
}
/**
 * Insert new file.
 *
 * @param {File} fileData File object to read data from.
 * @param {string} folderId googleId of folder to place file into
 */
function insertFileFromFileData(fileData, folderId) {
    return new Promise((resolve, reject) => {
        const boundary = '-------314159265358979323846';
        const delimiter = '\r\n--' + boundary + '\r\n';
        const close_delim = '\r\n--' + boundary + '--';

        var reader = new FileReader();
        reader.readAsBinaryString(fileData);
        reader.onload = function(e) {
            var contentType = fileData.type || 'application/octet-stream';
            var metadata = {
                title: fileData.name,
                mimeType: contentType,
                parents: [{ id: folderId }]
            };

            var base64Data = btoa(reader.result);
            var multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' +
                contentType +
                '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;

            var request = gapi.client.request({
                path: '/upload/drive/v2/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                headers: {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                body: multipartRequestBody
            });
            return request.then(({result})=>resolve({
                title: result.title,
                id: result.id,
                embedLink: result.embedLink,
                downloadUrl: result.downloadUrl,
                thumbnailLink: result.thumbnailLink
            }), reject);
        };
    });
}

export function removeFile(fileId) {
    return gapi.client.request({
        path: `/drive/v2/files/${fileId}`,
        method: 'DELETE'
    });
}

export function getFile(fileId) {
    return gapi.client.request({
        path: `/drive/v2/files/${fileId}`,
        method: 'GET',
        params: {
            alt: 'media'
        }
    });
}

export function getImageUrl(fileId) {
    return authorize()
        .then(loadDriveApi)
        .then(
            () =>
                new Promise((resolve, reject) => {
                    var accessToken = gapi.auth2
                        .getAuthInstance()
                        .currentUser.get()
                        .getAuthResponse().access_token; // or this: gapi.auth.getToken().access_token;
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', true);
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function() {
                        //const base64 = new Buffer(response.body, 'utf8').toString('base64');
                        //base64ArrayBuffer from https://gist.github.com/jonleighton/958841
                        var base64 = 'data:image/png;base64,' + base64ArrayBuffer(xhr.response);

                        //do something with the base64 image here
                        resolve(base64);
                    };
                    xhr.send();
                })
        );
}

function base64ArrayBuffer(arrayBuffer) {
    var base64 = '';
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    var bytes = new Uint8Array(arrayBuffer);
    var byteLength = bytes.byteLength;
    var byteRemainder = byteLength % 3;
    var mainLength = byteLength - byteRemainder;

    var a, b, c, d;
    var chunk;

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63; // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
}
