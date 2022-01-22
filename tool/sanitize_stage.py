# -*- coding: utf-8 -*-

import argparse, json, glob, os, re, sys
path = os.path.dirname(os.path.abspath(__file__))

def parse_args():
    # options
    parser = argparse.ArgumentParser(description='Sanitize data/<cg>/system/stage/<stage>.json')
    parser.add_argument('-c', '--cg', type=int, default=0, help='CG type')
    parser.add_argument('file', nargs='?', type=int, default=0, help='stage file json format')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

# add layer1/block/<block>/field/00 under layer3/block/<block>/pillar/00
#
# blocks : dict of data/<cg>/system/stage/<stage>.json
#
def add_field(blocks):
    for row in range(len(blocks['layer3'])):
        for col in range(len(blocks['layer3'][row])):
            match = re.search(r'(block/\d{2})/pillar/', blocks['layer3'][row][col])
            if match:
                blocks['layer1'][row][col] = f'layer1/{match[1]}/field/00'
        #  for
    #  for
#  def add_field()

if __name__ == '__main__':
    args = parse_args()
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
        if not os.path.exists(stage_file):
            continue
        with open(stage_file, 'r') as fp:
            blocks = json.loads(fp.read())
            add_field(blocks)
        with open(stage_file, 'w') as fp:
            fp.write(json.dumps(blocks))
    #  for
#  if
