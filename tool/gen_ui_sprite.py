# -*- coding: utf-8 -*-

import argparse, os, pathlib, re, sys
from PIL import Image

sys.path.insert(0, f'{(os.path.dirname(os.path.abspath(__file__)))}/../lib')
import little_magic_map as lm

def parse_args():
    path = f'{os.path.dirname(os.path.abspath(__file__))}/../ui/static/image'

    # options
    parser = argparse.ArgumentParser(description='Copy and resize sprite')
    parser.add_argument('path', nargs='?', default=path, help='ui sprite path')
    parser.add_argument('-s', '--scale', type=float, default=1.0, help='scale of image')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

if __name__ == '__main__':
    args = parse_args()
    path = f'{os.path.dirname(os.path.abspath(__file__))}/../data/image'
    backslash = '\\'
    for file in pathlib.Path(f'{path}/sprite').rglob('*.png'):
        image = Image.open(file).convert('RGBA')

        # resize image by scale
        w, h = image.size
        image = image.resize((w * args['scale'], h * args['scale']), Image.NEAREST)

        # create directory and save file
        replace = f"\\1/{args['scale']}"
        save_file = f"{args['path']}/{re.sub(f'{path}/(sprite)', replace, str(file))}"
        os.makedirs(os.path.dirname(save_file), exist_ok=True)
        image.save(save_file, 'png')
    #  for
#  if
