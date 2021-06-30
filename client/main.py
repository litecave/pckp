from zipfile import ZipFile
from shutil import rmtree
from pathlib import Path
import requests
import sys
import os
import re

URL = 'http://127.0.0.1:5000'
URLS = {
    "INSTALL": f"{URL}/api/package/{{0}}/download",
    "PKG_INFO": "",
    "PUBLISH": "",
    "REGISTER": "",
    "LOGIN": ""
}
HELP = open('help.txt', 'r').read()
VERSION = '0.1'
args = sys.argv[1:]

def err(message):
    print(f'ERROR: {message}')
    exit()

def success(message):
    print(f'SUCCESS: {message}')
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
    
    req = requests.get(url)

    if req.status_code != 200:
        err(req.json()['message'])
    
    pkg_name = args[1]
    if '-' in args[1]:
        pkg_name = args[1].split('-')[0]

    filename = re.findall('filename=(.+)', req.headers['content-disposition'])[0].replace('.zip', '')

    try:
        Path(f'libraries/{pkg_name}').mkdir(exist_ok=True)
    except FileNotFoundError:
        err('libraries folder not found in current working directory.')

    with open(f'libraries/{pkg_name}/package.zip', 'wb') as f:
        f.write(req.content)

    with ZipFile(f'libraries/{pkg_name}/package.zip', 'r') as zip_obj:
        zip_obj.extractall(f'libraries/{pkg_name}')

    os.remove(f'libraries/{pkg_name}/package.zip')
    success(f"{filename} installed successfully.")
elif args[0] == 'uninstall':
    try:
        rmtree(f'libraries/{args[1]}')
    except Exception as e:
        if isinstance(e, FileNotFoundError):
            err(f'{args[1]} is not installed.')
        elif isinstance(e, IndexError):
            err(f'Package argument not supplied.')
        else:
            err(e)

    success(f'{args[1]} successfully uninstalled.')
else:
    print(f"ERROR: Invalid subcommand '{args[0]}'.")
    print(HELP)
