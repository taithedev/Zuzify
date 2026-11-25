-- Apply on Zuzify App Data / zuzify. Grant EXECUTE only to a dedicated website role.
CREATE OR REPLACE FUNCTION zuzify_bot.redeem_web_pairing(p_hash text,p_user uuid)
RETURNS TABLE(discord_id text,service text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE v jsonb; d text; s text; k text; affected integer;
BEGIN
 IF p_hash !~ '^[a-f0-9]{64}$' OR p_user IS NULL THEN RAISE EXCEPTION 'Invalid pairing request'; END IF;
 SELECT value::jsonb INTO v FROM zuzify_bot.bot_settings WHERE guild_id='discord_account_challenges' AND key=p_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Code expired or already used'; END IF;
 d:=v->>'discordId'; s:=v->>'service';
 IF d IS NULL OR d !~ '^[0-9]{15,25}$' OR s IS NULL OR s NOT IN ('zuzify','prezzstore','zuzifysocials','zuzuos','fastproxy','zuzuloader','zuzuai') OR COALESCE((v->>'expiresAt')::numeric,0)<extract(epoch from clock_timestamp())*1000 THEN RAISE EXCEPTION 'Code expired or invalid'; END IF;
 k:=d||':'||s;
 INSERT INTO zuzify_bot.bot_settings(guild_id,key,value,updated_at) VALUES('discord_ecosystem_account_links',k,p_user::text,now())
 ON CONFLICT(guild_id,key) DO UPDATE SET updated_at=now() WHERE zuzify_bot.bot_settings.value=EXCLUDED.value;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected=0 THEN RAISE EXCEPTION 'Discord is already connected to another account; unlink it first'; END IF;
 DELETE FROM zuzify_bot.bot_settings WHERE guild_id='discord_account_challenges' AND key=p_hash;
 RETURN QUERY SELECT d,s;
END $fn$;
REVOKE ALL ON FUNCTION zuzify_bot.redeem_web_pairing(text,uuid) FROM PUBLIC;
