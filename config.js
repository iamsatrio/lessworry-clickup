require('dotenv').config()
const env = process.env;

const config = {
    debug: env.DEBUG || false,
    env: env.NODE_ENV,
    port: env.PORT,
    listPerPage: env.LIST_PER_PAGE || 10,
    clickupToken: env.CLICKUP_TOKEN,
    mongo_user: env.MONGO_USER,
    mongo_pass: env.MONGO_PASS,
    mongo_server: env.MONGO_SERVER,
    mongo_args: env.MONGO_ARGS,
};

module.exports = config;