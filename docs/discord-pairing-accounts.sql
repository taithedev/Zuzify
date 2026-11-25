-- Apply on Zuzify Accounts / neondb. Grant EXECUTE only to a dedicated website role.
CREATE OR REPLACE FUNCTION public.sync_web_discord_pairing(p_user uuid,p_discord text,p_service text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE affected integer;
BEGIN
 IF p_user IS NULL OR p_discord !~ '^[0-9]{15,25}$' THEN RETURN false; END IF;
 IF p_service='zuzify' THEN
 INSERT INTO public.zuzify_account_links(user_id,app_slug,local_account_id,status,last_verified_at)
 VALUES(p_user,'zuzify-discord-bot',p_discord,'active',now())
 ON CONFLICT(app_slug,local_account_id) DO UPDATE SET user_id=EXCLUDED.user_id,status='active',last_verified_at=now()
 WHERE public.zuzify_account_links.user_id=EXCLUDED.user_id OR public.zuzify_account_links.status='revoked';
 GET DIAGNOSTICS affected=ROW_COUNT;
 RETURN affected=1;
 ELSIF p_service IN ('prezzstore','zuzifysocials','zuzuos','fastproxy','zuzuloader','zuzuai') THEN
 RETURN EXISTS(SELECT 1 FROM public.zuzify_account_links WHERE user_id=p_user AND app_slug=p_service AND status='active');
 END IF;
 RETURN false;
END $fn$;
REVOKE ALL ON FUNCTION public.sync_web_discord_pairing(uuid,text,text) FROM PUBLIC;
