"use strict";
var discord_js_1 = require("discord.js");
var ts_dotenv_1 = require("ts-dotenv");
var env = (0, ts_dotenv_1.load)({
    DISCORD_API_SECRET: String,
    DISCORD_CHANNEL: String
});
var client = new discord_js_1.Client({ intents: [discord_js_1.Intents.FLAGS.GUILDS] });
/*const postCommentQuery = `
  mutation ($discussionId: ID!, $body: String!) {
    addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
      comment {
        url
      }
    }
  }
`;*/
var discordChannel;
function findThread(title) {
    var t = null;
    discordChannel.threads.cache.forEach(function (thr) {
        if (thr.name == title)
            t = thr;
    });
    return t;
}
module.exports = function (app) {
    client.on("ready", function () {
        client.guilds.cache.forEach(function (guild) {
            guild.channels.cache.forEach(function (channel) {
                if (channel.id == env.DISCORD_CHANNEL) {
                    if (channel.type != "GUILD_FORUM") {
                        console.log("[ERR] Channel must be a forum channel");
                        process.exit(0);
                    }
                    discordChannel = channel;
                }
            });
        });
        if (discordChannel === null || discordChannel === undefined) {
            console.log("[ERR] Channel was not found");
            process.exit(0);
        }
        console.log("Discord bot connected!");
    });
    client.login(env.DISCORD_API_SECRET);
    app.on('discussion.created', function (context) {
        discordChannel.threads.create({
            name: context.payload.discussion.title,
            reason: "Created by discussion.created webhook",
            message: {
                content: "*New discussion posted by **".concat(context.payload.sender.login, "** * \n\n").concat(context.payload.discussion.body),
            },
            autoArchiveDuration: 1440
        });
    });
    app.on('discussion_comment.created', function (context) {
        var thread = findThread(context.payload.discussion.title);
        if (thread == null) {
            console.warn("Was not able to find thread for discussion named \"".concat(context.payload.discussion.title, "\"; was the discord thread renamed?"));
            return;
        }
        console.log(context.payload.comment);
        thread.send({
            content: "*New comment posted by **".concat(context.payload.sender.login, "** * \n\n").concat(context.payload.comment.body),
        });
    });
};
//# sourceMappingURL=index.js.map