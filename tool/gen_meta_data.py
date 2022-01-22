# -*- coding: utf-8 -*-

import argparse, json, glob, os, sys
path = f'{(os.path.dirname(os.path.abspath(__file__)))}/../data'

def parse_args():
    # options
    parser = argparse.ArgumentParser(description='Generate data/<cg>/system/meta/data.json')
    parser.add_argument('-c', '--cg', type=int, default=0, help='CG type')
    parser.add_argument('-f', '--file', default='data', help='save file name')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

# return return meta in dict
#
def meta_data(file, cg):
    meta = {}
    with open(f'{path}/{cg}/system/meta/{file}.json', 'r') as fp:
        meta = json.loads(fp.read())
        meta['lastBlock'] = block_count(cg)
        meta['lastCG'] = cg_count()
    return meta
#  def meta_data()

def block_count(cg):
    file = max(glob.glob(f'{path}/{cg}/image/sprite/layer1/block/[0-9][0-9]'))
    return int(os.path.basename(file))
#  def block_count()

def cg_count():
    file = max(glob.glob(f'{path}/[0-9][0-9]'))
    return int(os.path.basename(file))
#  def cg_count():

if __name__ == '__main__':
    args = parse_args()
    file = args['file']
    cg = '%02i' % (args['cg'])
    meta = meta_data(file, cg)
    with open(f'{path}/{cg}/system/meta/{file}.json', 'w') as fp:
        print(json.dumps(meta, indent=2))
        fp.write(json.dumps(meta, indent=2))
    #  with
#  if
