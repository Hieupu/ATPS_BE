// config/redisClient.js
const {createClient} = require('redis');

const redisClient = createClient({
    username: 'default',
    password: 'yURyrC20usUZSD0Rq1kc5l53BcHj00D2',
    socket: {
        host: 'redis-11139.c1.ap-southeast-1-1.ec2.cloud.redislabs.com',
        port: 11139
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Connected'));

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
})();

module.exports = {redisClient};