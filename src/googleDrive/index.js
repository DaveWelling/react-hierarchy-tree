
import { toast } from 'react-toastify';
import authorize from './authorize';

export function openGoogleDriveFile(){
    return authorize()
    .then(loadDriveApi)
    .then(ensureFolderExists)
    .then((folderId)=>{
        return checkIfFileExists(folderId)
        .then(fileId=>{
            if (fileId) {
                return getFile(fileId, folderId);
            } else {
                throw new Error('File does not exist yet.');
            }
        })
    })
    .then(request=>{
        return request.result;
    }).catch(err=>{
        toast(err.message || err);
    });

}
export function saveGoogleDriveFile(fileJson) {
    authorize()
    .then(loadDriveApi)
    .then(ensureFolderExists)
    .then((folderId)=>{
        return checkIfFileExists(folderId)
        .then(fileId=>{
            if (fileId) {
                return updateFile(fileJson, fileId, folderId);
            } else {
                return insertFile(fileJson, folderId);
            }
        })
    }).then(request=>{
        toast('File sent to Google Drive');
    }).catch(err=>{
        toast(err.message || err);
    });
}

function loadDriveApi(){
    return gapi.client.load('drive', 'v2');
}

function ensureFolderExists(){
    return gapi.client.request({
        path: '/drive/v2/files',
        method: 'GET',
        params: { q: 'mimeType="application/vnd.google-apps.folder" and title="Novel"' }
    }).then(request=>{
        if (request.result.items.length === 0) {
            return gapi.client.request({
                path: '/drive/v2/files',
                method: 'POST',
                body: {
                    title: 'Novel',
                    mimeType: "application/vnd.google-apps.folder"
                }
            }).then(request=>{
                return request.result.id
            });
        }
        return Promise.resolve(request.result.items[0].id);
    });
}
function checkIfFileExists(folderId){
    return gapi.client.request({
        path: '/drive/v2/files',
        method: 'GET',
        params: { q: `mimeType="application/json" and title="novel.json" and "${folderId}" in parents` }
    }).then(request=>{
        if (request.result.items.length) {
            return request.result.items[0].id;
        }
    })
}
function updateFile(fileJson, fileId, folderId) {
    const boundary = '-------314159265358979323846264';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const fileName = 'novel.json';
    const contentType = 'application/json';
    const metadata = {
        title: fileName,
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
function insertFile(fileJson, folderId) {
    const boundary = '-------314159265358979323846264';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const fileName = 'novel.json';
    const contentType = 'application/json';
    const metadata = {
        title: fileName,
        mimeType: contentType,
        parents: [{id:folderId}]
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

function getFile(fileId){
    return gapi.client.request({
        path: `/drive/v2/files/${fileId}`,
        method: 'GET',
        params: {
            alt:'media'
        }
    });
}