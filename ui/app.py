# -*- coding: utf-8 -*-

import argparse, flask, json, os, glob, re, sys
import logging, traceback

path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, f'{path}/../lib')

# Flask instance
app = flask.Flask(__name__, static_url_path='/static')

# Create a blueprint with 'console' as the prefix
app_bp = flask.Blueprint('littlemagic', __name__,static_folder='static', url_prefix='/littlemagic')

# Application info
with open("%s/../config/app.json" % (path), 'r') as fp:
    env = json.loads(fp.read())

def htm():
    """ Returns str: The filename (str) for an HTML template """
    return f'{template()}.htm'

def template():
    """  Returns str: The URL path before any query parameters """
    url = re.sub(r'/$', '', flask.request.path)
    url = '/'.join(url.split('/')[2:])
    return '/'.join(url.split('?')[0].split('/')[0:])

@app_bp.route('/', methods=['GET'])
def root():
    """ Redirect to the index page """
    return flask.redirect('/index')

@app_bp.route('/index', methods=['GET'])
def index():
    """ Render the index page """
    try:
        return flask.render_template(htm(), path=template(), env=env)
    except Exception as e:
        logging.error(f'{flask.request.path} {traceback.format_exc()}')
        return {}
#  def index()

@app_bp.route('/post', methods=['POST'])
def post():
    """
    Handles a POST request to '/post/read'.

    This function takes JSON data from the request and passes it to the api() for further processing.

    Returns:
        dict: The response from the api().
    """
    try:
        post = flask.request.json
        print(post)
        method = re.sub(r'/', '_', post['method'])
        module = sys.modules[__name__]
        if hasattr(module, method) and callable(getattr(module, method)):
            data = getattr(module, method)(post)
        else:
            data = { 'error': f'method not found {method}' }
    except Exception as e:
        logging.error(f'{flask.request.path} {traceback.format_exc()}')
        data = { 'error': f'{str(e)}' }
    return data
#  def post_method()

# Register blueprint
app.register_blueprint(app_bp)


def read_stage(post):
    """ Returns dict: Stage data """
    data = post.get('returnValue', {})
    for file in post['file']:
        file_path = '%s/../data/%02i/system/%s.json' % (path, post['cg'], file)
        with open(file_path) as f:
            d = json.loads(f.read())
            if isinstance(data, list):
                data += [ { k: v } for k, v in d.items() ]
            elif isinstance(data, dict):
                data = { **data, **d }
    #  for
    return { 'data': data }
#  def read_stage()

def write_stage(post):
    """
    Write stage data to a file.

    Args:
        post (dict): Data received from UI.
            content (str): 'stage'
            cg (str): 'sfc' or 'gbc'
            stage (int): Stage number.
            blocks (dict): dict of nested list of block data.
    """
    try:
        if post['content'] == 'stage':
            stage_path = '%s/../data/%02i/system/stage' % (path, post['cg'])
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
#  def write_stage()

def next_stage(post):
    """
    Move to next or previous stage.

    Args:
        post (dict): Data received from UI.
            cg (str): 'sfc' or 'gbc'
            stage (int): Stage number.
            next (int): The increment to move to the next or previous stage. 
                        A positive value moves forward, while a negative value moves backward.
    """
    try:
        cg = '%02i' % (post['cg'])
        file_path = max(glob.glob(f"{path}/../data/{cg}/system/stage/[0-9][0-9][0-9].json"))
        last_stage = 'stage/%03i' % (int(os.path.splitext(os.path.basename(file_path))[0]))
        if post['stage'] + post['next'] <= 0:
            file = last_stage
        else:
            stage_string = '%03i' % (post['stage'] + post['next'])
            file_path = f"{path}/../data/{cg}/system/stage/{stage_string}.json"
            if os.path.exists(file_path):
                file = f'stage/{stage_string}'
            else:
                file = last_stage if post['next'] < 0 else 'stage/001'
        post['file'] = [ file ]
        stage = re.search(r'stage/(\d+)', post['file'][0])
        data = { 'data':
            { 'stage' : int(stage.group(1)),
              'blocks': read_stage(post)['data'] }
        }
    except Exception as e:
        logging.error(f'{flask.request.path} {traceback.format_exc()}')
        data = { 'error': f'{str(e)}' }
    return data
# def post_stage

def parse_args():
    """ Returns dict: Parsed command line arguments """
    parser = argparse.ArgumentParser(description='Little Magic REST API')
    parser.add_argument('--host', default='0.0.0.0', help='bind IP address')
    parser.add_argument('-d', '--debug', action='store_true', help='development mode')
    parser.add_argument('-p', '--port', type=int, default=44344, help='bind port')
    return vars(parser.parse_args())
#  def parse_arg()

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
