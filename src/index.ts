import { Probot } from "probot";
import { Client, Intents, ForumChannel, ThreadChannel } from "discord.js";
import { load } from "ts-dotenv";

const env = load({
	DISCORD_API_SECRET: String,
	DISCORD_CHANNEL: String
});

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
/*const postCommentQuery = `
  mutation ($discussionId: ID!, $body: String!) {
	addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
	  comment {
		url
	  }
	}
  }
`;*/

let discordChannel: ForumChannel;

function findThread(title: string) : ThreadChannel | null {
	var t: ThreadChannel | null = null;

	discordChannel.threads.cache.forEach((thr) => {
		if(thr.name == title) t = thr;
	});

	return t;
}

export = (app: Probot) => {
	client.on("ready", () => {
		client.guilds.cache.forEach((guild) => {
			guild.channels.cache.forEach((channel) => {
				if(channel.id == env.DISCORD_CHANNEL) {
					if(channel.type != "GUILD_FORUM") {
						console.log("[ERR] Channel must be a forum channel");
						process.exit(0);
					}

					discordChannel = channel as ForumChannel;
				}
			});
		});

		if(discordChannel === null || discordChannel === undefined) {
			console.log("[ERR] Channel was not found");
			process.exit(0);
		}

		console.log("Discord bot connected!");
	});

	client.login(env.DISCORD_API_SECRET);

	app.on('discussion.created', (context) => {
		discordChannel.threads.create({
			name: context.payload.discussion.title,
			reason: "Created by discussion.created webhook",
			message: {
				content: `*New discussion posted by **${context.payload.sender.login}** * \n\n${context.payload.discussion.body}`,
			},
			autoArchiveDuration: 1440
		})
  	});

	app.on('discussion_comment.created', (context) => {
		var thread = findThread(context.payload.discussion.title);

		if(thread == null) {
			console.warn(`Was not able to find thread for discussion named "${context.payload.discussion.title}"; was the discord thread renamed?`);
			return;
		}

		if(context.payload.comment.parent_id == null) {
			context.payload.comment.

			thread.send({
				content: `*New comment posted by **${context.payload.sender.login}** * \n\n${context.payload.comment.body}`,
			});
		}
	});
};
