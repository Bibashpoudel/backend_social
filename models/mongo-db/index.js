const mongoose = require('mongoose');
const InstagramProfileFeed = require('./InstagramProfileFeed');
const SocialMediaProfile = require('./SocialMediaProfile');
const SocialMediaProfileFeedTypeColor = require('./SocialMediaProfileFeedTypeColor');
const InstagramProfileFanGrowth = require('./InstagramProfileFanGrowth');
const SocialTag = require('./SocialTag');
const SocialFeedTag = require('./SocialFeedTag');
const SocialFeedEmoji = require('./SocialFeedEmoji');

const {mongoDbConnectionURL} = require('../../config');

/* Configuration deprication warning */
mongoose.set('useFindAndModify', false);

const connectMongoDb = () => {
    const DATABASE_URL = mongoDbConnectionURL;

    console.log('DATABASE_URL', DATABASE_URL);
    return mongoose.connect(DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};
mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
});


mongoose.connection.on('error', (err) => {
    console.log('err', err);
});

mongoose.connection.on('connected', (err, res) => {
    console.log('mongoose is connected');
});


/* Merging all models into single object */
const models = {
    InstagramProfileFanGrowth,
    InstagramProfileFeed,
    SocialMediaProfile,
    SocialMediaProfileFeedTypeColor,
    SocialFeedTag,
    SocialFeedEmoji,
    SocialTag,
};


module.exports.connectMongoDb = connectMongoDb;


exports.default = models;
