from os.path import exists
from json import loads, JSONDecodeError
import helper
import sys

URL = 'http://localhost:5000'
URLS = {
    "INSTALL": f"{URL}/api/package/{{0}}/download",
    "PKG_INFO": f"{URL}/api/package/{{0}}",
    "PUBLISH": f"{URL}/api/publish",
    "REGISTER": f"{URL}/api/users/register",
    "LOGIN": f"{URL}/api/users/login",
    "SEARCH": f"{URL}/api/search"
}
HELP = '''Usage: pckp [subcommand] [other arguments]

Package manager for SPWN.

Subcommands:
  help, -h                         Help.
  version, -v                      Version of pckp.
  install [package]                Installs a package.
  uninstall [package]              Uninstalls a package.
  register                         Registers a new account.
  login                            Login into an account.
  publish                          Publishes a package.
  search [package]                 Searches for packages.'''
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
    if len(args) < 2:
        err('Package argument not supplied.')

    helper.install(args[1], URLS["INSTALL"])
elif args[0] == 'uninstall':
    helper.uninstall(args[1] if len(args) > 1 else err('Package argument not supplied.'))
elif args[0] == 'register':
    helper.register(URLS['REGISTER'])
elif args[0] == 'login':
    helper.register(URLS['LOGIN'])
elif args[0] == 'publish':
    if not exists('pckp.json'):
        err('pckp.json does not exist in current working directory.')
    with open('pckp.json', 'r') as f:
        try:
            json = loads(f.read())
        except JSONDecodeError:
            err('Invalid JSON in pckp.json')

        helper.publish(json, URLS['PUBLISH'])
elif args[0] == 'search':
    if len(args) < 2:
        err('Package argument not supplied.')
    helper.search(args[1], URLS['SEARCH'])
else:
    err(f"Invalid subcommand '{args[0]}'")
