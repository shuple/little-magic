# -*- coding: utf-8 -*-

import argparse, os, pathlib, re, shutil, sys
from PIL import Image

sys.path.insert(0, f'{(os.path.dirname(os.path.abspath(__file__)))}/../lib')

def parse_args():
    path = f'{os.path.dirname(os.path.abspath(__file__))}/../ui/static/image'

    # options
    parser = argparse.ArgumentParser(description='Copy and resize sprite')
    parser.add_argument('path', nargs='?', default=path, help='ui sprite path')
    parser.add_argument('--delete', action='store_true', default=False, help='delete existing image file')
    parser.add_argument('-g', '--graphic', default='sfc', help='scale of image')
    parser.add_argument('-s', '--scale', type=float, default=2.0, help='scale of image')

    # convert to dict
    return vars(parser.parse_args())
#  def parse_args()

if __name__ == '__main__':
    args = parse_args()
    path = f'{os.path.dirname(os.path.abspath(__file__))}/../data/image'
    if (args['delete']):
        ui_path = f"{os.path.dirname(os.path.abspath(__file__))}/../ui/static/image/{args['graphic']}"
        if os.path.exists(ui_path): shutil.rmtree(ui_path)
    for file in pathlib.Path(f"{path}/sprite/{args['graphic']}").rglob('*.png'):
        image = Image.open(file).convert('RGBA')

        # resize image by scale
        w, h = image.size
        image = image.resize((int(w * args['scale']), int(h * args['scale'])), Image.NEAREST)

        # create directory and save file
        save_file = f"{args['path']}/{re.sub(f'{path}/', '', str(file))}"
        os.makedirs(os.path.dirname(save_file), exist_ok=True)
        image.save(save_file, 'png')
    #  for
#  if
