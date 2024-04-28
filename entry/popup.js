/** @type {typeof chrome} */ let env;
if (typeof chrome !== 'undefined') {
    env = chrome;
} else if (typeof browser !== 'undefined') {
    env = browser;
} else {
    env = null;
}

const statusOk = document.querySelector('.status-ok');
const statusError = document.querySelector('.status-error');
const statusMissingPermission = document.querySelector('.status-missing-permission');

statusMissingPermission.addEventListener('click', requestPermissions);

const requiredPermissions = {origins: ["https://www.dropout.tv/*"]};

async function update() {
    if (env === null) {
        statusOk.style.display = 'none';
        statusError.style.display = 'block';
        statusMissingPermission.style.display = 'none';
        return;
    }

    if (await env.permissions.contains(requiredPermissions)) {
        statusOk.style.display = 'block';
        statusError.style.display = 'none';
        statusMissingPermission.style.display = 'none';
        return;
    }

    statusOk.style.display = 'none';
    statusError.style.display = 'none';
    statusMissingPermission.style.display = 'block';
}

async function requestPermissions() {
    await env.permissions.request(requiredPermissions);
    await update();
}

(async () => {
    await update();
})();
