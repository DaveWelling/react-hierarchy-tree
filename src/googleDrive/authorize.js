import config from '../config';
let authorized = false;

export default function authorize() {
    return new Promise((resolve, reject)=>{
        if (authorized) resolve();

        if (!window.googleApiLoadedForProject) {
            reject("Google API hasn't loaded yet, try again later.");
            return;
        }

        init().then(()=>{
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

        }).catch(err=>{
            let message = 'There was an error when authenticating to the google drive API';
            if (err.error === 'idpiframe_initialization_failed') {
                message = 'It looks like you may have disabled cookies.  You need them to log into Google Drive with this application.';
            }
            reject(message + '  Details: ' + err.message || err);
        });

        function updateSigninStatus(isSignedIn) {
            authorized = isSignedIn;
            if (isSignedIn) resolve();
            else {
                gapi.auth2.getAuthInstance().signIn();
            }
        }
        function init() {
            return gapi.client.init({
                client_id: config.googleClientId,
                scope: config.googleScope
            });
        }
    });
}