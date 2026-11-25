-- Run on Zuzify Accounts / neondb after testing on a branch.
-- Existing links are preserved; only new active Discord identities are limited.
CREATE OR REPLACE FUNCTION public.enforce_discord_link_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
BEGIN
 IF NEW.app_slug <> 'zuzify-discord-bot' OR NEW.status <> 'active' THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('zuzify-discord-id:'||NEW.local_account_id,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('zuzify-discord-user:'||NEW.user_id::text,0));
 IF EXISTS(SELECT 1 FROM public.zuzify_account_links WHERE app_slug='zuzify-discord-bot' AND local_account_id=NEW.local_account_id AND status='active' AND user_id<>NEW.user_id) THEN
  RAISE EXCEPTION 'Discord is already connected to another account; unlink it first';
 END IF;
 IF (SELECT count(*) FROM public.zuzify_account_links WHERE user_id=NEW.user_id AND app_slug='zuzify-discord-bot' AND status='active' AND local_account_id<>NEW.local_account_id)>=3 THEN
  RAISE EXCEPTION 'You can link a maximum of 3 Discord accounts';
 END IF;
 RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION public.enforce_discord_link_limit() FROM PUBLIC;
CREATE OR REPLACE TRIGGER enforce_discord_link_limit BEFORE INSERT OR UPDATE OF user_id,app_slug,local_account_id,status ON public.zuzify_account_links FOR EACH ROW EXECUTE FUNCTION public.enforce_discord_link_limit();

CREATE OR REPLACE FUNCTION public.list_web_discord_pairings(p_user uuid)
RETURNS TABLE(discord_id text,linked_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $fn$
 SELECT local_account_id, connected_at FROM public.zuzify_account_links
 WHERE user_id=p_user AND app_slug='zuzify-discord-bot' AND status='active'
 AND local_account_id ~ '^[0-9]{15,25}$' ORDER BY connected_at;
$fn$;
REVOKE ALL ON FUNCTION public.list_web_discord_pairings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_web_discord_pairings(uuid) TO zuzify_web_pairing;
