const Models = require('../models/mongo-db').default;
const SmProfileUpdateEmitter = require('../event-emitters/SmProfileUpdateEmitter');
const Services = require('../services');
const { profileUpdateInterval } = require('../config');
const mysqlModels = require('../models/mysql').default;
const { format } = require('date-fns');
const { Enums, helperFns } = require('../utils');
const moment = require('moment-timezone');
const configs = require('./../config');
const fs = require('fs');

const fetchLeastUpdatedProfileNdUpdate = async (profileToBeUpdated = null, feedLimit = 100) => {
    try {
        /* leastUpdatedProfileBefore1Day*/
        if (!profileToBeUpdated) {
            /* profile id(s) of subdoain*/
            const subdomainSocialMediaProfiles = await mysqlModels.CustomerSubdomainSocialMediaProfile.findAll({
                attributes: ['profile_id'],
                social_type: 'instagram',
                raw: true,
            });

            const subdomainProfileIds = subdomainSocialMediaProfiles.map((profile) => profile.profile_id);
            const today = moment().tz(`${configs.profileUpdateTimezone}`).format('YYYY-MM-DD');

            /* Getting only the least updated profile which is added in customer subdomain*/
            profileToBeUpdated = await Models.SocialMediaProfile.findOne({
                social_type: 'instagram',
                'last_updated_date': {
                    $ne: today,
                },
                'social_page_id': { '$in': subdomainProfileIds },
            }).sort({ updatedAt: 1 });

            console.log('profileToBeUpdated', profileToBeUpdated);
        }

        if (profileToBeUpdated && profileToBeUpdated.page_username) {
            const date = moment().tz('Asia/Singapore').format("YYYY-MM-DD");
            /* Sending profile to update*/
            let logData= {
                time: moment().tz('Asia/Singapore').format("YYYY-MM-DD HH:mm:ss"),
                payload: profileToBeUpdated,
                status: "success"
            }
            fs.appendFile(`./logs/${profileToBeUpdated.social_page_id}-${date}.log`,JSON.stringify(logData), (err)=>{
                if (err) throw err;
                console.log("log created");
            });
            console.log("Log created");
            await Services.InstagramProfileService.createOrUpdateProfile(profileToBeUpdated);

            console.log('profile updated');

            /* Sheduling for next profile update time >> 3-min */
            const scheduleTimeInMs = profileUpdateInterval * 60000; // converts env value in minutes

            SmProfileUpdateEmitter.emit('schedule-profile-updater', scheduleTimeInMs);

            return;
        }

        console.log('All profiles updated');

        /* schedule for next update on 2 hours */
        const scheduleTimeInMs = 2 * 3600000;


        /* Sheduling for next time*/
        SmProfileUpdateEmitter.emit('schedule-profile-updater', scheduleTimeInMs);
    } catch (error) {
        const { response, status, statusText } = error;

        console.log('error', error);

        console.log('error in fetchLeastUpdatedProfileNdUpdate:==> ', response);

        if (response) {
            try {
                const { config, data: { error: { code } }, request: { socket: { servername, _host } } } = response;


                SmProfileUpdateEmitter.emit('error', {
                    code: code,
                    profileToBeUpdated: profileToBeUpdated,
                    feedLimit: feedLimit,
                });

                logger.error(code);
            } catch (error) {
                logger.error(error);
            }
        } else {
            /* restart profile update profile when thers is reponse in error*/
            SmProfileUpdateEmitter.emit('update-social-profiles');

            logger.error(error);
        }
    }
};



SmProfileUpdateEmitter.on('update-social-profiles', function (feedLimit = 100) {
    fetchLeastUpdatedProfileNdUpdate();
});


SmProfileUpdateEmitter.on('schedule-profile-updater', function (scheduleTime) {
    if (Number.isInteger(scheduleTime)) {
        setTimeout(function () {
            SmProfileUpdateEmitter.emit('update-social-profiles');
        }, scheduleTime);

        logger.info(`Scheduled for hours ${helperFns.parseMillisecondsIntoReadableTime(scheduleTime)} `);
    }
});

SmProfileUpdateEmitter.on('error', function (data) {
    console.log('error handling for emmiter', data);
    const { code, profileToBeUpdated, feedLimit } = data;
    /* Trying to update profile when */
    switch (code) {
        case 1:
            let newFeedLimit = (feedLimit / 2);

            newFeedLimit = newFeedLimit > 0 ? newFeedLimit : 1;

            fetchLeastUpdatedProfileNdUpdate(profileToBeUpdated, newFeedLimit.toFixed(0));
            break;
        case 4:
            /* APP RATE LIMIT CASE*/
            const scheduleTimeInMs = 1 * 3600000; // 1 hours

            /* Sheduling for next time*/
            SmProfileUpdateEmitter.emit('schedule-profile-updater', scheduleTimeInMs);
            break;

        default:
            break;
    }
});


/* exporting modules*/
module.exports.fetchLeastUpdatedProfileNdUpdate = fetchLeastUpdatedProfileNdUpdate;
