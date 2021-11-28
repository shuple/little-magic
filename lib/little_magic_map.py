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
        width  = len(data['layer0'][0]);
        heigth = len(data['layer0']);
        image = Image.new('RGBA',
            (self.block['width'] * width, self.block['height'] * heigth),
            (255, 255, 255)
        )

        for i in range(4):
            layer = f'layer{i}'
            self.set_image(image, data[layer], layer)

        timestamp =  datetime.datetime.today().strftime('%Y%m%d_%H%M%S')
        map_name  = f"{self.option['graphic']}/{timestamp}.png"
        map_file  = f"{self.path['root']}/data/image/map/{map_name}"
        image.save(map_file, 'png')
    #  def gen_map()

    # set PIL Image on layer.
    #
    # parameters:
    #
    # image : PIL Image
    # data  : 2D array of sprite data
    # layer : layer name
    #
    def set_image(self, image, data, layer):
        for row in range(len(data)):
            for col in range(len(data[row])):
                if not data[row][col]: continue

                width, height = self.block['width'] * col, self.block['height'] * row
                size = (width, height)

                relative_path = f'{layer}/{data[row][col]}'
                sprite = self.image_data[relative_path]
                image.paste(sprite, size, sprite)
            #  for
        #  for
    #  def set_image()
#  class LittleMagicMap

if __name__ == '__main__':
    pass
