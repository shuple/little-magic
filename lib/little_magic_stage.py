# -*- coding: utf-8 -*-

import datetime, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sprite

class LittleMagicStage(sprite.Sprite):
    'Little Magic Stage Generator'

    # parameter:
    #
    # option['graphic'] : 'sfc'
    #
    def __init__(self, option):
        super().__init__(option)
    #  def __init__()

    # generate png image from stage data.
    #
    # parameter:
    #
    # data : stage data
    #
    def generate(self, data):
        # create image
        layer = next(iter(data))
        width  = len(data[layer][0]);
        heigth = len(data[layer]);
        image = Image.new('RGBA',
            (self.block['width'] * width, self.block['height'] * heigth),
            (255, 255, 255)
        )

        for l, d in data.items():
            self.set_image(image, d, l)

        timestamp =  datetime.datetime.today().strftime('%Y%m%d_%H%M%S')
        stage_name  = f"{self.option['graphic']}/{timestamp}.png"
        stage_file  = f"{self.path['root']}/data/image/stage/{stage_name}"
        image.save(stage_file, 'png')
    #  def generate()

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

                sprite = self.image_data[data[row][col]]
                image.paste(sprite, size, sprite)
            #  for
        #  for
    #  def set_image()
#  class LittleMagicStage

if __name__ == '__main__':
    pass
