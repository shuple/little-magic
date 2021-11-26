# -*- coding: utf-8 -*-

import copy, functools, json, os, re
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

        #  nested dict with a list of image file name
        # /path/to/image/01.png => { 'path': 'to': { 'image': [ '/path/to/image/01 ] } }
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

    #  load self.image_dict, nested dict with a list of image file name
    # /path/to/image/01.png => { 'path': 'to': { 'image': [ '/path/to/image/01 ] } }
    #
    # path       : path to image directory
    # image_dict : self.image_dict
    #
    def load_image_dict(self, path, image_dict):
        # merge nested dict y to x
        def merge(x, y):
            for k, v in y.items():
                if k in x and isinstance(x[k], dict) and isinstance(y[k], dict):
                    merge(x[k], y[k])
                else:
                    x[k] = y[k]
            #  for
        #  def merge

        for root, dir, file in os.walk(path):
            if not file: continue

            content_path = re.sub(f"{self.path['sprite']}/", '', root)
            # convert content_path to list
            d = [ c for c in content_path.split('/') ]

            # traverse reversed list and create a nested dict
            # the deepest dict value is relative path to the file
            d =functools.reduce(lambda x, y:
                { y: { x: sorted([ f'{content_path}/{os.path.splitext(f)[0]}' for f in file ]) }
                    if x == d[-1] else x }, d[::-1])

            # merge dict
            merge(image_dict, d)
        #  for
    #  def load_image_dict()

    # write self.image_dict to json
    #
    def write_image_dict(self):
        file = f"{self.path['root']}/data/system/sprite/{self.option['graphic']}.json"
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
