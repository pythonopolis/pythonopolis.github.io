from pickle import TRUE
from flask import Flask, render_template, request

import utils

#app = Flask(__name__)
app = Flask(__name__, static_url_path='/static')
#app._static_folder = "./FYP-22-S4-15/app/static"

@app.route('/')
#@app.route('/codeEditor')
def codeEditor():
   return render_template('codeEditor.html')


@app.route('/get_stack_overflow_query_search_results', methods=['POST'])
def get_stack_overflow_query_search_results():
   searchText = request.form.get('searchText')

   results = utils.getStackOverflowQuerySearchResults(searchText)
   return results


if __name__ == '__main__':
   app.run(debug=TRUE)
