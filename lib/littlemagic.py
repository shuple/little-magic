# -*- coding: utf-8 -*-

# Little Magic game play class

import os, sys

sys.path.insert(0, f'{os.path.dirname(os.path.abspath(__file__))}/../lib')
import sprite

class LittleMagic(sprite.Sprite):
    """ Little Magic game play """

    def __init__(self, option):
        super().__init__(option)
    #  def __init__()
#  class LittleMagic
