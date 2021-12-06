# -*- coding: utf-8 -*-

import argparse, json, os, sys

sys.path.insert(0, f'{(os.path.dirname(os.path.abspath(__file__)))}/../lib')
import little_magic_stage as lm

def parse_args():
    # options
    parser = argparse.ArgumentParser(description='Generate stage from json file')
    parser.add_argument('file', nargs='?', default='', help='stage file in json format')
    parser.add_argument('-g', '--graphic', default='sfc', help='graphic type')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

if __name__ == '__main__':
    args = parse_args()
    o = lm.LittleMagicStage(args)
    o.load()
    with open(args['file'], 'r') as f:
        data = json.load(f)
        o.generate(data)
#  if
