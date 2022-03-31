// PM2 config
// https://pm2.keymetrics.io/docs/usage/application-declaration/
// --transpile-only flag to reduce memory overhead.
// https://stackoverflow.com/a/65789609/3213175

module.exports = {
    apps: [
        {
            name: 'Game service',
            script: 'ts-node',
            args: '--transpile-only ./services/game/src/index.ts',
            exp_backoff_restart_delay: 1000,
        },
        {
            name: 'Map service',
            script: 'ts-node',
            args: '--transpile-only ./services/map/src/Server.ts',
            exp_backoff_restart_delay: 1000,
        },
    ],
};