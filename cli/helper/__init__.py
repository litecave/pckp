from prettytable import PrettyTable, MSWORD_FRIENDLY
from .printing import err, success
from appdirs import user_data_dir
from getpass import getpass
from shutil import rmtree
from pathlib import Path
import requests
import tarfile
import json
import os
import re

TOK_PATH = Path(user_data_dir('pckp', 'sertdfyguhi'))
TOK_PATH.mkdir(exist_ok=True, parents=True)

def set_token(tok):
    with open((TOK_PATH / 'token.txt'), 'w') as f:
        f.write(tok)
        f.close()

def get_token():
    if not os.path.exists((TOK_PATH / 'token.txt')):
        err('You are not logged in.')
    with open((TOK_PATH / 'token.txt'), 'r') as f:
        return f.read()

def install(package, url, message=True):
    req = requests.get(url.format(package))

    if req.status_code != 200:
        err(req.json()['message'])
    
    pkg_name = package
    if '-' in package:
        pkg_name = package.split('-')[0]

    filename = re.findall('filename="(.+)"', req.headers['content-disposition'])[0].replace('.tar', '')
    path = Path(f'libraries/{pkg_name}')

    if os.path.exists(path):
        rmtree(path)
        os.mkdir(path)

    try:
        path.mkdir(exist_ok=True)
    except FileNotFoundError:
        err('libraries folder not found in current working directory.')

    with open((path / 'package.tar'), 'wb') as f:
        f.write(req.content)

    with tarfile.open((path / 'package.tar'), 'r') as tar:
        tar.extractall(f'libraries/{pkg_name}')

    os.remove((path / 'package.tar'))

    with open((path / 'pckp.json'), 'r') as f:
        c_json = json.loads(f.read())

        if 'dependencies' in c_json:
            for dep_pkg in c_json['dependencies']:
                install(f"{dep_pkg}-{c_json['dependencies'][dep_pkg]}", url, False)

    if message:
        if not os.path.exists('pckp.json'):
            with open('pckp.json', 'w') as f:
                f.write('{}')
                f.close()

        with open('pckp.json', 'r+') as f:
            try:
                c_json = json.loads(f.read())
            except json.JSONDecodeError:
                err('Invalid JSON in pckp.json')

            f.seek(0)

            try:
                c_json['dependencies'] = {
                    **c_json['dependencies'],
                    **{ pkg_name: filename.split('-')[1] }
                }
            except KeyError:
                c_json['dependencies'] = { pkg_name: filename.split('-')[1] }

            f.write(json.dumps(c_json, sort_keys=False, indent=2))
            f.close()

    if message:
        success(f"{filename} installed successfully.")

def uninstall(package):
    if os.path.exists(f'libraries/{package}'):
        rmtree(f'libraries/{package}')
    else:
        err(f'{package} is not installed.')

    if os.path.exists('pckp.json'):
        with open('pckp.json', 'r+') as f:
            try:
                c_json = json.loads(f.read())
            except json.JSONDecodeError:
                err('Invalid JSON in pckp.json')

            f.seek(0)

            del c_json['dependencies'][package]

            f.write(json.dumps(c_json, sort_keys=False, indent=2))
            f.close()
    else:
        with open('pckp.json', 'w') as f:
            f.write(json.dumps({ "dependencies": {} }, sort_keys=False, indent=2))
            f.close()

    success(f'{package} successfully uninstalled.')

def register(url):
    data = {
        "user": input('username: '),
        "pass": getpass('password: ')
    }

    req = requests.post(url, json=data)

    if req.status_code != 200:
        err(req.json()['message'])

    res = req.json()
    set_token(res['token'])
    success(res['message'])

def publish(json, url):
    files = { f: open(f, 'r').read() for f in os.listdir() if os.path.isfile(f) }
    json['data'] = files
    json['token'] = get_token()

    if 'long_desc' in json and os.path.exists(json['long_desc']):
        json['long_desc'] = open(json['long_desc'], 'r').read()

    req = requests.post(url, json=json)
    res = req.json()
    if req.status_code != 200:
        err(res['message'])

    success(res['message'])

def search(package, url):
    req = requests.get(url, { 'q': package })
    res = req.json()

    if req.status_code != 200:
        err(res['message'])

    table = PrettyTable([ 'Name', 'Version', 'Author' ])
    for rating in res:
        table.add_row(rating.values())
    table.set_style(MSWORD_FRIENDLY)
    print(table)
