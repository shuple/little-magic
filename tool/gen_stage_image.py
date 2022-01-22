# -*- coding: utf-8 -*-

import argparse, glob, json, os, re, sys

path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, f'{path}/../lib')
import little_magic_stage as lm

def parse_args():
    # options
    parser = argparse.ArgumentParser(description='Generate data/<cg>/image/stage/<stage>.png')
    parser.add_argument('-c', '--cg', type=int, default=0, help='CG type')
    parser.add_argument('file', nargs='?', type=int, default=0, help='stage file json format')
    parser.add_argument('-s', '--scale', type=float, default=2.0, help='scale of image')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

if __name__ == '__main__':
    args = parse_args()
    o = lm.LittleMagicStage(args)
    o.load()
    stage_files = []
    stage_path = '%s/../data/%02i/system/stage' % (path, args['cg'])
    if args['file'] == 0:
        for stage_file in sorted(glob.glob(f'{stage_path}/[0-9][0-9][0-9].json')):
            stage_files.append(stage_file)
    else:
        stage_file = '%s/%03i.json' % (stage_path, args['file'])
        stage_files.append(stage_file)
    #  if
    for stage_file in stage_files:
        if os.path.exists(stage_file):
            stage_num = int(re.search(r'(\d{3})\.json', stage_file)[1])
            with open(stage_file, 'r') as f:
                data = json.load(f)
                o.generate(stage_num, data)
            #  with
    #  for
#  if
