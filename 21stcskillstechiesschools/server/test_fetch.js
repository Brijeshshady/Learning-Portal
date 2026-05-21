async function run() {
    try {
        const loginData = await login();
        const token = loginData.user?.token;
        console.log('Using token:', token);
        const rollouts = await getRollouts(token);
        console.log('Rollouts received:', JSON.stringify(rollouts, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

function login() {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const req = http.request('http://localhost:8102/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(JSON.stringify({ email: 'superadmin@21stc.com', password: 'password123' }));
        req.end();
    });
}

function getRollouts(token) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const req = http.request('http://localhost:8102/api/rollouts', {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.end();
    });
}

run();
