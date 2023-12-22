# -*- coding: utf-8 -*-

# Little Magic sprite interface

import copy, json, os, re
from PIL import Image

class Sprite:
    """ Little Magic sprite interface """

    def __init__(self, option):
        """
        Initialize attributes.

        Args:
            option (dict): Configuration options.
                cg (int): 0 for 'sfc', 1 for 'gbc'
                file (str): Stage configuration file name.
        """
        # copy option
        self.option = copy.deepcopy(option)

        # application root path
        path = f'{os.path.dirname(os.path.abspath(__file__))}/..'

        # application paths
        self.path = {
            'root'  : path,
            'sprite': '%s/data/%02i/image/sprite' % (path, option['cg'])
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

    def load(self):
        """ Load self.image_dict self.image_data """
        self.load_image_dict()
        self.merge_image_dict()
        self.load_image_data()
    #  def load()

    def load_image_dict(self):
        """ Load self.image_dict['sprite'] in { '/path/to/image/01': {} } format """
        for root, _, files in sorted(os.walk(self.path['sprite'])):
            if not files: continue
            for file in files:
                content_path = re.sub(f"{self.path['sprite']}/", '', root)
                content_path += f'/{os.path.splitext(file)[0]}'
                self.image_dict['sprite'][content_path] = {}
            #  for
        #  for
    #  def load_image_dict()

    def merge_image_dict(self):
        """ merge self.image_dict with existing meta/sprite.json """
        path = '%s/data/%02i/system/meta' % (self.path['root'], self.option['cg'])
        file = f"{path}/{self.option['file']}.json"
        if os.path.exists(file):
            with open(file, 'r') as f:
                meta_data = json.loads(f.read())
                self.image_dict['sprite'] = { **self.image_dict['sprite'], **meta_data['sprite'] }
            #  with
        #  if
    #  def merge_image_dict

    def write_image_dict(self):
        """ Write self.image_dict to json """
        path = '%s/data/%02i/system/meta' % (self.path['root'], self.option['cg'])
        if not os.path.exists(path):
            os.makedirs(path)
        file = f"{path}/{self.option['file']}.json"
        image_dict = { k : self.image_dict[k] for k in sorted(self.image_dict) }
        with open(file, 'w') as f:
            f.write(json.dumps(image_dict, indent=2))
    #  def write_image_dict()

    def load_image_data(self):
        """ Load self.image_data dict with key: relative path to image, value: PIL Image """
        for image in self.image_dict['sprite'].keys():
            file = f"{self.path['sprite']}/{image}.png"
            if os.path.exists(file):
                self.image_data[image] = Image.open(file).convert('RGBA')
        #  for
    #  def load_image_data()
#  class Sprite

if __name__ == '__main__':
    pass
