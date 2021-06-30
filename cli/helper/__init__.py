from appdirs import user_data_dir
from shutil import rmtree
from pathlib import Path
from sys import exit
import tarfile
import requests
import os
import re

TOK_PATH = Path(user_data_dir('pckp', 'sertdfyguhi'))
TOK_PATH.mkdir(exist_ok=True, parents=True)

def err(message):
    print(f'\u001b[31mERROR: {message}\u001b[0m')
    exit()

def success(message):
    print(f'\u001b[32mSUCCESS: {message}\u001b[0m')
    exit()

def set_token(tok):
    with open((TOK_PATH / 'token.txt'), 'w') as f:
        f.write(tok)
        f.close()

def get_token():
    if not os.path.exists((TOK_PATH / 'token.txt')):
        err('You are not logged in.')
    with open((TOK_PATH / 'token.txt'), 'r') as f:
        return f.read()

def install(package, url):
    req = requests.get(url)

    if req.status_code != 200:
        err(req.json()['message'])
    
    pkg_name = package
    if '-' in package:
        pkg_name = package.split('-')[0]

    filename = re.findall('filename=(.+)', req.headers['content-disposition'])[0].replace('.tar', '')
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
    success(f"{filename} installed successfully.")

def uninstall(package):
    try:
        rmtree(f'libraries/{package}')
    except FileNotFoundError:
        err(f'{package} is not installed.')

    success(f'{package} successfully uninstalled.')

def register(user, password, url):
    data = {
        "user": user,
        "pass": password
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