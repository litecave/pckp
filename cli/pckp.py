from os.path import exists
from json import loads, JSONDecodeError
import helper
import sys

URL = 'https://7bfbd4bbb12a.ngrok.io'
URLS = {
    "INSTALL": f"{URL}/api/package/{{0}}/download",
    "PKG_INFO": f"{URL}/api/package/{{0}}",
    "PUBLISH": f"{URL}/api/publish",
    "REGISTER": f"{URL}/api/users/register",
    "LOGIN": f"{URL}/api/users/login"
}
HELP = '''
Usage: pckp [subcommand] [other arguments]

Package manager for SPWN.

Subcommands:
  help, -h                         Help.
  version, -v                      Version of pckp.
  install [package]                Installs a package.
  uninstall [package]              Uninstalls a package.
  register [user] [password]       Registers a new account.
  login [user] [password]          Login into an account.
  publish                          Publishes a package.'''[1:]
VERSION = '1.0.0'
args = sys.argv[1:]

def err(message):
    print(f'\u001b[31mERROR: {message}\u001b[0m')
    sys.exit()

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
elif args[0] == 'login':
    if len(args) < 3:
        err('User or password argument not supplied.')
    helper.register(args[1], args[2], URLS['LOGIN'])
elif args[0] == 'publish':
    if not exists('package.json'):
        err('package.json does not exist in current working directory.')
    with open('package.json', 'r') as f:
        try:
            json = loads(f.read())
        except JSONDecodeError:
            err('Invalid JSON in package.json')

        helper.publish(json, URLS['PUBLISH'])
else:
    err(f"Invalid subcommand '{args[0]}'")
