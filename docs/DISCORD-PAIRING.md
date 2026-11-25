# Discord pairing without a bot website

The bot generates a private one-time code, hashed in Zuzify App Data, and DMs the user. The user signs into Zuzify and enters the code at https://www.zuzify.xyz/link.

For direct Neon pairing, install the corresponding SQL migration in each database:
- Zuzify App Data / zuzify: discord-pairing-bot.sql
- Zuzify Accounts / neondb: discord-pairing-accounts.sql

Use a separate least-privilege PostgreSQL login for each database. On the bot database grant schema USAGE on zuzify_bot and EXECUTE on zuzify_bot.redeem_web_pairing(text,uuid). On the accounts database grant schema USAGE on public and EXECUTE on public.sync_web_discord_pairing(uuid,text,text). Do not grant general table access. Add the connection strings as sensitive server-only Vercel variables ZUZIFY_PAIRING_BOT_DATABASE_URL and ZUZIFY_PAIRING_ACCOUNTS_DATABASE_URL, then redeploy the site. Ensure the bot has its existing DATABASE_URL and ZUZIFY_ACCOUNTS_DATABASE_URL configured for linking and unlinking.

As an alternative, set BOT_LINK_API_URL to the working public HTTPS origin of the bot, with no path. The website uses that API if direct database variables are not configured.

No database secrets should use the VITE_ prefix or be committed to source.
