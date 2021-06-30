from appdirs import user_data_dir
from zipfile import ZipFile
from shutil import rmtree
from pathlib import Path
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
    with open((TOK_PATH / 'token.txt'), 'w+') as f:
        return f.read()

def install(package, url):
    req = requests.get(url)

    if req.status_code != 200:
        err(req.json()['message'])
    
    pkg_name = package
    if '-' in package:
        pkg_name = package.split('-')[0]

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

    json = req.json()
    set_token(json['token'])
    success(json['message'])
