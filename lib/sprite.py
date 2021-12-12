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
        self.image_dict = {}

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
        self.load_image_dict(self.path['sprite'], self.image_dict)
        self.load_image_data(self.image_dict, self.image_data)
    #  def load()

    #  load self.image_dict
    # '/path/to/image/01.png': {}
    #
    # path       : path to image directory
    # image_dict : self.image_dict
    #
    def load_image_dict(self, path, image_dict):
        for root, dir, file in sorted(os.walk(path)):
            if not file: continue

            content_path = re.sub(f"{self.path['sprite']}/", '', root)
            image_dict[content_path] = {}
        #  for
    #  def load_image_dict()

    # write self.image_dict to json
    #
    def write_image_dict(self):
        file = f"{self.path['root']}/data/system/{self.option['graphic']}/meta/sprite.json"
        with open(file, 'w') as f:
            f.write(json.dumps(self.image_dict, indent=2))
    #  def write_image_dict()

    # load self.image_data, dict, key: relative path to image, value: PIL Image
    #
    # parameters:
    #
    # image_dict : self.image_dict in the first recursion
    # image_data : self.image_dict
    #
    def load_image_data(self, image_dict, image_data):
        for k, v in image_dict.items():
            if isinstance(v, list):
                for image in v:
                    file = f"{self.path['sprite']}/{image}.png"
                    if os.path.exists(file):
                        image_data[image] = Image.open(file).convert('RGBA')
                #  for
            else:
                self.load_image_data(v, image_data)
        #  for
    #  def load_image_data()
#  class Sprite

if __name__ == '__main__':
    pass
