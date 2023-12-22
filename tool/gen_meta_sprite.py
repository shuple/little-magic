# -*- coding: utf-8 -*-

# Generate data/<cg>/system/meta/sprite.json which maps images and its motions

import argparse, json, os, sys

sys.path.insert(0, f'{(os.path.dirname(os.path.abspath(__file__)))}/../lib')
import sprite

def parse_args():
    """ Returns dict: Parsed command line arguments """
    parser = argparse.ArgumentParser(description='Generate data/<cg>/system/meta/sprite.json')
    parser.add_argument('-c', '--cg', type=int, default=0, help='CG type')
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
