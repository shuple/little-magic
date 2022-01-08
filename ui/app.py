# -*- coding: utf-8 -*-

import argparse, flask, json, os, glob, re, sys
import logging, traceback

path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, f'{path}/../lib')

# flask instance
#
app = flask.Flask(__name__, static_url_path='/static')

# application info
#
with open("%s/../config/app.json" % (path), 'r') as fp:
    env = json.loads(fp.read())

# index
#
@app.route('/', methods=['GET'])
def root():
    return flask.redirect('/index')

@app.route('/index', methods=['GET'])
def index():
    try:
        return flask.render_template('index.htm', path='index.htm', env=env)
    except Exception as e:
        logging.error(f'{flask.request.path} {traceback.format_exc()}')
        return {}
#  def index()

# read arbitrary files
#
@app.route('/post/read', methods=['POST'])
def post_read():
    try:
        data = read_file(flask.request.json)
    except Exception as e:
        logging.error(f'{flask.request.path} {traceback.format_exc()}')
        data = { 'error': f'{str(e)}' }
    return data
#  def post_read()

def read_file(post):
    data = post.get('returnValue', {})
    for file in post['file']:
        file_path = f"{path}/../data/system/{post['graphic']}/{file}.json"
        with open(file_path) as f:
            d = json.loads(f.read())
            if isinstance(data, list):
                data += [ { k: v } for k, v in d.items() ]
            elif isinstance(data, dict):
                data = { **data, **d }
    #  for
    return { 'data': data }
#  def read_file()

# write file
#
@app.route('/post/write', methods=['POST'])
def post_write():
    try:
        post = flask.request.json
        if post['content'] == 'stage':
            stage_path = f"{path}/../data/system/{post['graphic']}/stage"
            file_path = max(glob.glob(f"{stage_path}/[0-9][0-9][0-9].json"))
            stage = '%03i' % (post['stage']) if post['stage'] else \
                '%03i' % (int(os.path.splitext(os.path.basename(file_path))[0]) + 1)
            with open(f'{stage_path}/{stage}.json', 'w') as fp:
                fp.write(json.dumps(post['blocks']))
            data = { 'data': { 'stage': int(stage) } }
        #  if
    except Exception as e:
        logging.error(f'{flask.request.path} {traceback.format_exc()}')
        data = { 'error': f'{str(e)}' }
    return data
#  def post_write()

# next stage
#
@app.route('/post/stage', methods=['POST'])
def post_stage():
    try:
        post = flask.request.json
        if post['stage'] == 0:
            stage_path = f"{path}/../data/system/{post['graphic']}/stage"
            file_path = max(glob.glob(f"{stage_path}/[0-9][0-9][0-9].json"))
            file = 'stage/%03i' % (int(os.path.splitext(os.path.basename(file_path))[0]))
        else:
            stage_string = '%03i' % (post['stage'])
            file_path = f"{path}/../data/system/{post['graphic']}/stage/{stage_string}.json"
            file = f'stage/{stage_string}' if os.path.exists(file_path) else 'stage/001'
        post['file'] = [ file ]
        stage = re.search(r'stage/(\d+)', post['file'][0])
        data = { 'data':
            { 'stage' : int(stage.group(1)),
              'blocks': read_file(post)['data'] }
        }
    except Exception as e:
        logging.error(f'{flask.request.path} {traceback.format_exc()}')
        data = { 'error': f'{str(e)}' }
    return data
# def post_stage

# parse command line argument
#
def parse_args():
    parser = argparse.ArgumentParser(description='Little Magic REST API')
    parser.add_argument('--host', default='0.0.0.0', help='bind IP address')
    parser.add_argument('-d', '--debug', action='store_true', help='development mode')
    parser.add_argument('-p', '--port', type=int, default=44344, help='bind port')
    return vars(parser.parse_args())
#  def parse_arg()

# run flask
#
if __name__ == '__main__':
    # command line argument
    args = parse_args()

    # log setting
    logging_level = level=logging.DEBUG if args['debug'] else logging.INFO
    logging.basicConfig(stream=sys.stdout, level=logging_level)

    # flask setting
    app.config.update({ 'MAX_CONTENT_LENGTH': 1024 * 1024 * 10, 'DEBUG': args['debug'] })
    app.run(host=args['host'], port=args['port'], debug=args['debug'])
#  if
