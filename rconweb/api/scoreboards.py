import datetime

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from rcon.utils import MapsHistory
from rcon.recorded_commands import RecordedRcon
from rcon.commands import CommandFailedError
from rcon.steam_utils import get_steam_profile
from rcon.settings import SERVER_INFO
from rcon import game_logs
from rcon.models import LogLine, PlayerSteamID, PlayerName, enter_session
from rcon.discord import send_to_discord_audit
from .logs import historical_logs

from .views import ctl


def make_table(scoreboard):
    return "\n".join(
        ["Rank  Name                  Ratio Kills Death"]
        + [
            f"{('#'+ str(idx+1)).ljust(6)}{obj['player'].ljust(27)}{obj['ratio'].ljust(6)}{str(obj['(real) kills']).ljust(6)}{str(obj['(real) death']).ljust(5)}"
            for idx, obj in enumerate(scoreboard)
        ]
    )


def make_tk_table(scoreboard):
    justification = [6, 27, 10, 10, 14, 14]
    headers = ["Rank", "Name", "Time(min)", "Teamkills", "Death-by-TK", "TK/Minutes"]
    keys = [
        "idx",
        "player",
        "Estimated play time (minutes)",
        "Teamkills",
        "Death by TK",
        "TK Minutes",
    ]

    return "\n".join(
        ["".join(h.ljust(justification[idx]) for idx, h in enumerate(headers))]
        + [
            "".join(
                [
                    str({"idx": f"#{idx}", **obj}[key]).ljust(justification[i])
                    for i, key in enumerate(keys)
                ]
            )
            for idx, obj in enumerate(scoreboard)
        ]
    )


@csrf_exempt
def text_scoreboard(request):
    try:
        minutes = abs(int(request.GET.get("minutes")))
    except (ValueError, KeyError, TypeError):
        minutes = 180

    name = ctl.get_name()
    try:
        from_ = datetime.datetime(year=2021, day=13, month=1, hour=20, minute=0).isoformat()
        print(from_)
        kill_logs = historical_logs(from_=from_, action='KILL', server_filter='2', limit=100000)
 
        players = list(set([l["player_name"] for l in kill_logs]))
        kill_logs = {
            "players": players,
            "logs": kill_logs
        }
        scoreboard = ctl.get_scoreboard(kill_logs, minutes, "ratio")
        text = make_table(scoreboard)
        scoreboard = ctl.get_scoreboard(kill_logs, minutes, "(real) kills")
        text2 = make_table(scoreboard)
    except CommandFailedError:
        text, text2 = "No logs"

    return HttpResponse(
        f"""<div>
        <h1>{name}</h1>
        <h1>Scoreboard (last {minutes} min. 2min delay)</h1>
        <h6>Real death only (redeploy / suicides not included). Kills counted only if player is not revived</h6>
        <p>
        See for last:
        <a href="/api/scoreboard?minutes=120">120 min</a>
        <a href="/api/scoreboard?minutes=90">90 min</a>
        <a href="/api/scoreboard?minutes=60">60 min</a>
        <a href="/api/scoreboard?minutes=30">30 min</a>
        </p>
        <div style="float:left; margin-right:20px"><h3>By Ratio</h3><pre>{text}</pre></div>
        <div style="float:left; margin-left:20px"><h3>By Kills</h3><pre>{text2}</pre></div>
        </div>
        """
    )


@csrf_exempt
def text_tk_scoreboard(request):
    name = ctl.get_name()
    try:
        from_ = datetime.datetime(year=2021, day=13, month=1, hour=19, minute=30).isoformat()
        till_ = datetime.datetime(year=2021, day=13, month=1, hour=20, minute=5).isoformat()
        print(from_)
        logs = historical_logs(from_=from_, till=till_, server_filter='2', limit=100000)
 
        players = list(set([l["player_name"] for l in logs]))
        logs = {
            "players": players,
            "logs": logs
        }
        scoreboard = ctl.get_teamkills_boards(logs)
        text = make_tk_table(scoreboard)
        scoreboard = ctl.get_teamkills_boards(logs, "Teamkills")
        text2 = make_tk_table(scoreboard)
    except CommandFailedError:
        text, text2 = "No logs"

    return HttpResponse(
        f"""<div>
        <h1>{name}</h1>
        <div style="float:left; margin-right:20px"><h3>By TK / Minute</h3><pre>{text}</pre></div>
        <div style="float:left; margin-left:20px"><h3>By Total TK</h3><pre>{text2}</pre></div>
        </div>
        """
    )

