module.exports = {
    error,
    info,
    warn,
    debug
};


function debug(message) {
    console.log(message);
}

function error(message, err) {
    if (typeof message === 'object') {
        console.error(message.stack || message.message || JSON.stringify(message));
    } else {
        console.error(message);
        console.info(err.stack || err.message || JSON.stringify(err));
    }
}

function info(message) {
    console.info(message);
}

function warn(message) {
    console.warn(message);
}