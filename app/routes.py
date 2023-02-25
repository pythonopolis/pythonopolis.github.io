from pickle import TRUE
from app import app
from flask import render_template
from pickle import TRUE
from flask import Flask, render_template, request

import utils

@app.route('/')
@app.route('/codeEditor')
def codeEditor():
   return render_template('codeEditor.html')

@app.route('/get_stack_overflow_query_search_results', methods=['POST'])
def get_stack_overflow_query_search_results():
   searchText = request.form.get('searchText')

   results = utils.getStackOverflowQuerySearchResults(searchText)
   return results

if __name__ == '__main__':
   app.run(debug=TRUE)
