import helper
import sys

URL = 'http://127.0.0.1:5000'
URLS = {
    "INSTALL": f"{URL}/api/package/{{0}}/download",
    "PKG_INFO": "",
    "PUBLISH": "",
    "REGISTER": f"{URL}/api/users/register",
    "LOGIN": ""
}
HELP = open('help.txt', 'r').read()
VERSION = '0.1'
args = sys.argv[1:]

def err(message):
    print(f'\u001b[31mERROR: {message}\u001b[0m')
    exit()

if args == [] or args[0] == 'help' or args[0] == '-h':
    print(HELP)
elif args[0] == 'version' or args[0] == '-v':
    print(VERSION)
elif args[0] == 'install':
    try:
        url = URLS["INSTALL"].format(args[1])
    except Exception:
        err('Package argument not supplied.')

    helper.install(args[1], url)
elif args[0] == 'uninstall':
    helper.uninstall(args[1] if len(args) > 1 else err('Package argument not supplied.'))
elif args[0] == 'register':
    if len(args) < 3:
        err('User or password argument not supplied.')
    helper.register(args[1], args[2], URLS['REGISTER'])
else:
    err(f"Invalid subcommand '{args[0]}'")
