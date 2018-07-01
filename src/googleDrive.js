import config from './config';
import { toast } from 'react-toastify';

let authorized = false;

function authorize() {
    return new Promise((resolve, reject)=>{
        if (authorized) resolve();

        if (window.googleApiLoadedForNovel) {
            checkAuth();
        } else {
            reject("Google API hasn't loaded yet, try again later.");
        }

        function checkAuth() {
            gapi.auth.authorize(
                { client_id: config.googleClientId, scope: config.googleScope, immediate: true },
                handleAuthResult
            );
        }

        function handleAuthResult(authResult) {
            if (authResult && !authResult.error) {
                authorized = true;
                resolve();
            } else {
                const standardMessage = 'There was an error when authenticating to the google drive API';
                const message = authResult ? authResult.error || standardMessage : standardMessage;
                console.error(message);
                reject(standardMessage);
            }
        }
    });
}

export function uploadFile(fileJson) {
    authorize().then(()=>{
        gapi.client.load('drive', 'v2', function() {
            insertFile(fileJson);
        });
    }).catch(err=>{
        toast(err.message || err);
    });
}

function insertFile(fileJson) {
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
    var request = gapi.client.request({
        path: '/upload/drive/v2/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
    });
    request.execute(function(arg) {
        console.log(arg);
    });
}
