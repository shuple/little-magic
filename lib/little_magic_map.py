# -*- coding: utf-8 -*-

import datetime, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sprite

class LittleMagicMap(sprite.Sprite):
    'Little Magic Map'

    # parameter:
    #
    # option['graphic'] : 'sfc'
    #
    def __init__(self, option):
        super().__init__(option)
    #  def __init__()

    # generate png image from map data.
    #
    # parameter:
    #
    # data : map data
    #
    def gen_map(self, data):
        # create image
        width  = len(data['foreground'][0]);
        heigth = len(data['foreground']);
        image = Image.new('RGBA',
            (self.block['width'] * width, self.block['height'] * heigth),
            (255, 255, 255)
        )

        # background, foreground
        self.set_map(image, data)

        # object
        for d in data['object']:
            self.set_object(image, d)

        timestamp =  datetime.datetime.today().strftime('%Y%m%d_%H%M%S')
        map_name  = f"{self.option['graphic']}/{timestamp}.png"
        map_file  = f"{self.path['root']}/data/image/map/{map_name}"
        image.save(map_file, 'png')
    #  def gen_map()

    # set background and foreground on PIL Image.
    #
    # parameters:
    #
    # image               : PIL Image
    # data['foreground']  : map foreground data
    # data['background']  : map background data
    #
    def set_map(self, image, data):
        fg = data['foreground']
        bg = data['background']
        for row in range(len(fg)):
            for col in range(len(fg[row])):
                width, height = self.block['width'] * col, self.block['height'] * row
                size = (width, height)

                background = self.image_data[bg[row][col]]
                foreground = self.image_data[fg[row][col]]

                image.paste(background, size)
                image.paste(foreground, size, foreground)
            #  for
        #  for
    #  def set_map()

    # set object PIL Image.
    #
    # parameters:
    #
    # image          : PIL Image
    # data['object'] : map object data
    #
    def set_object(self, image, data):
        y = data['coordinate']['y']
        x = data['coordinate']['x']
        width, height = self.block['width'] * x, self.block['height'] * y
        image.paste(self.image_data[data['image']], (width ,height), self.image_data[data['image']])
    #  def set_object
#  class LittleMagicMap

if __name__ == '__main__':
    pass
