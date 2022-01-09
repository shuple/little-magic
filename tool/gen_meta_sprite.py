# -*- coding: utf-8 -*-

import argparse, json, os, sys

sys.path.insert(0, f'{(os.path.dirname(os.path.abspath(__file__)))}/../lib')
import sprite

def parse_args():
    # options
    parser = argparse.ArgumentParser(description='Generate meta sprite data')
    parser.add_argument('-g', '--graphic', default='sfc', help='graphic type')
    parser.add_argument('-f', '--file', default='sprite', help='save file name')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

if __name__ == '__main__':
    args = parse_args()
    o = sprite.Sprite(args)
    o.load()
    o.write_image_dict()
#  if
