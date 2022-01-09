# -*- coding: utf-8 -*-

import copy, json, os, re
from PIL import Image

class Sprite:
    'Little Magic Sprite'

    # parameter:
    #
    # option['graphic'] : 'sfc'
    #
    def __init__(self, option):
        # copy option
        self.option = copy.deepcopy(option)

        # application root path
        path = f'{os.path.dirname(os.path.abspath(__file__))}/..'

        # application paths
        self.path = {
            'root'  : path,
            'sprite': f"{path}/data/image/sprite/{option['graphic']}",
        }

        # dict, key: relative path to image, dict meta data
        self.image_dict = { 'sprite': {} }

        # dict, key: relative path to image, value: PIL Image
        self.image_data = {}

        # hold images in PIL Image
        self.images = {}

        # block width/height in pixel
        self.block = {
            'width' : 16,
            'height': 16
        }
    #  def __init__

    # load self.image_dict self.image_data
    #
    def load(self):
        self.load_image_dict()
        self.merge_image_dict()
        self.load_image_data()
    #  def load()

    #  load self.image_dict
    # '/path/to/image/01': {}
    #
    def load_image_dict(self):
        for root, _, files in sorted(os.walk(self.path['sprite'])):
            if not files: continue
            for file in files:
                content_path = re.sub(f"{self.path['sprite']}/", '', root)
                content_path += f'/{os.path.splitext(file)[0]}'
                self.image_dict['sprite'][content_path] = {}
            #  for
        #  for
    #  def load_image_dict()

    # merge self.image_dict with existing meta/sprite.json
    #
    # image_dict : self.image_dict
    #
    def merge_image_dict(self):
        path = f"{self.path['root']}/data/system/{self.option['graphic']}/meta"
        file = f"{path}/{self.option['file']}.json"
        if os.path.exists(file):
            with open(file, 'r') as f:
                meta_data = json.loads(f.read())
                self.image_dict['sprite'] = { **self.image_dict['sprite'], **meta_data['sprite'] }
            #  with
        #  if
    #  def merge_image_dict

    # write self.image_dict to json
    #
    def write_image_dict(self):
        path = f"{self.path['root']}/data/system/{self.option['graphic']}/meta"
        if not os.path.exists(path):
            os.makedirs(path)
        file = f"{path}/{self.option['file']}.json"
        image_dict = { k : self.image_dict[k] for k in sorted(self.image_dict) }
        with open(file, 'w') as f:
            f.write(json.dumps(image_dict, indent=2))
    #  def write_image_dict()

    # load self.image_data, dict, key: relative path to image, value: PIL Image
    #
    def load_image_data(self):
        for image in self.image_dict.keys():
            file = f"{self.path['sprite']}/{image}.png"
            if os.path.exists(file):
                self.image_data[image] = Image.open(file).convert('RGBA')
        #  for
    #  def load_image_data()
#  class Sprite

if __name__ == '__main__':
    pass
