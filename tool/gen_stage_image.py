# -*- coding: utf-8 -*-

import argparse, json, os, sys

path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, f'{path}/../lib')
import little_magic_stage as lm

def parse_args():
    # options
    parser = argparse.ArgumentParser(description='Generate stage from json file')
    parser.add_argument('-c', '--cg', type=int, default=0, help='CG type')
    parser.add_argument('file', nargs='?', type=int, default=1, help='stage file in json format')
    parser.add_argument('-s', '--scale', type=float, default=2.0, help='scale of image')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

if __name__ == '__main__':
    args = parse_args()
    o = lm.LittleMagicStage(args)
    o.load()
    stage_file = '%s/../data/system/%02i/stage/%03i.json' % (path, args['cg'], args['file'])
    with open(stage_file, 'r') as f:
        data = json.load(f)
        o.generate(args['file'], data)
#  if
