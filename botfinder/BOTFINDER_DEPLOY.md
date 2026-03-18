# BotFinder Manual Deploy

`botfinder` is intentionally excluded from `deploy-all.sh`.

Use one of these manual options when you need to deploy or configure it:

1. Windows script from repo root:
`deploy-botfinder.bat`

2. VS Code task:
`Deploy botfinder`

3. Direct server command:
`ssh root@89.191.225.207 "cd /opt/bots/lazart/botfinder && bash deploy.sh"`

## Manual status check

1. VS Code task:
`Status botfinder (manual)`

2. Direct server command:
`ssh root@89.191.225.207 "systemctl status kiberone-botfinder.service --no-pager"`

## Notes

- Service unit: `kiberone-botfinder.service`
- Runtime directory: `/opt/bots/lazart/botfinder`
- Environment file on server: `/opt/bots/lazart/botfinder/.env`
