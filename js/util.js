function randomBase64String() {
    var base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var stringLength = 8;
    var randomString = '';
    for (var i = 0; i < stringLength; i++) {
        randomString += base64Alphabet.charAt(Math.floor(Math.random() * base64Alphabet.length));
    }
    return randomString;
}

function saltAndHash(password) {
    var salt = randomBase64String();
    var digest = CryptoJS.enc.Base64.stringify(CryptoJS.SHA1(salt + "_" + password));
    return salt + "_" + digest;
}

function defaultFunction(arg, defaultFunction) {
    return typeof arg === 'function' ? arg : (typeof defaultFunction === 'function' ? defaultFunction : (function () {
    }));
}