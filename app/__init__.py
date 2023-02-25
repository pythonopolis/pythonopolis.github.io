from flask import Flask, render_template, request, redirect, url_for, session
#from flask_mysqldb import MySQL
#import MySQLdb.cursors 
import mysql.connector
import re 
import speech_recognition as sr 
import webbrowser
from pickle import TRUE
from flask import render_template
from pickle import TRUE
from flask import Flask, render_template, request

import utils

connection = mysql.connector.connect(host='localhost',port='3306',
										database='pythonopolis', user='root', password='')

cursor = connection.cursor(prepared=True)
cursor.execute('''SELECT * FROM useraccount''')
for row in cursor:
    print(row)

app = Flask(__name__, template_folder='templates')

app.secret_key = 'your secret key'
@app.route('/')
def index():
	return render_template('login.html')

@app.route('/', methods =['GET', 'POST'])
def login():
	msg = ''
	if request.method == 'POST' and 'username' in request.form and 'password' in request.form:
		username = request.form['username']
		password = request.form['password']
		sqlQuery = '''SELECT * FROM useraccount WHERE username = ? AND password = ?'''
		queryMatch = [username,password]
		cursor.execute(sqlQuery, queryMatch)
		account = cursor.fetchone()
		if account:
			session['loggedin'] = True
			# session['id'] = account['id']
			# session['username'] = account['username']
			msg = 'Logged in successfully !'
			if account[1] == 'Admin':
				return redirect(url_for('home'))
			else:
				return redirect(url_for('editor'))
		else:
			msg = 'Incorrect username / password !'
	return render_template('login.html', msg = msg)

@app.route('/register', methods =['GET', 'POST'])
def register():
	msg = ''
	if request.method == 'POST' and 'username' in request.form and 'password' in request.form and 'email' in request.form :
		username = request.form['username']
		password = request.form['password']
		email = request.form['email']
		sqlQuery = '''SELECT * FROM useraccount WHERE username = ?'''
		queryMatch = [username]
		cursor.execute(sqlQuery, queryMatch)
		account = cursor.fetchone()
		if account:
			msg = 'Account already exists !'
		elif not re.match(r'[^@]+@[^@]+\.[^@]+', email):
			msg = 'Invalid email address !'
		elif not re.match(r'[A-Za-z0-9]+', username):
			msg = 'Username must contain only characters and numbers !'
		elif not username or not password or not email:
			msg = 'Please fill out the form !'
		else:
			sqlQuery = '''INSERT INTO useraccount(username,password,email) VALUES(%s,%s,%s)'''
			queryMatch = [username,password,email]
			cursor.execute(sqlQuery, queryMatch)
			connection.commit()
			msg = 'You have successfully registered !'
	elif request.method == 'POST':
		msg = 'Please fill out the form !'
	return render_template('register.html', msg = msg)

@app.route('/logout', methods =['GET', 'POST'])
def logout():
	session.pop('loggedin', None)
	# session.clear()	
	# session.pop('username', None)
	return redirect(url_for('login'))

@app.route('/home', methods =['GET', 'POST'])
def home():
	if 'loggedin' in session:
		sqlQuery = '''SELECT * FROM useraccount'''
		cursor.execute(sqlQuery)
		users = cursor.fetchall()
		return render_template('home.html', users = users)
	return redirect(url_for('login'))
	
@app.route('/view', methods =['GET', 'POST'])
def view():
	if 'loggedin' in session:
		viewId = request.args.get('id')
		sqlQuery = '''SELECT * FROM useraccount WHERE id = %s'''
		cursor.execute(sqlQuery, (viewId, ))
		user = cursor.fetchone()
		print(user)
		return render_template('view.html', user = user)
	return redirect(url_for('login'))

@app.route('/delete', methods =['GET'])
def delete():
	if 'loggedin' in session:
		deleteId = request.args.get('id')
		sqlQuery = '''DELETE FROM useraccount WHERE id = %s'''
		cursor.execute(sqlQuery, (deleteId, ))
		connection.commit()
		return redirect(url_for('home'))
	return redirect(url_for('login'))

@app.route('/userdetails', methods =['GET', 'POST'])
def viewuseraccount():
	if 'loggedin' in session:
		viewId = request.args.get('id')
		sqlQuery = '''SELECT * FROM useraccount WHERE id = %s'''
		cursor.execute(sqlQuery, (viewId, ))
		user = cursor.fetchone()
		print(user)
		return render_template('userdetails.html', user = user)
	return redirect(url_for('editor'))

@app.route('/deleteuser', methods =['GET'])
def deleteuseraccount():
	if 'loggedin' in session:
		deleteId = request.args.get('id')
		sqlQuery = '''DELETE FROM useraccount WHERE id = %s'''
		cursor.execute(sqlQuery, (deleteId, ))
		connection.commit()
		return redirect(url_for('userdetails'))
	return redirect(url_for('login'))

@app.route('/voice')
def voice():
	return render_template('voice.html')

# # game point
# @app.route('/flappybird')
# def flappybird():
# 	return render_template('flappybird.html')

@app.route('/voicebot')
def voicebot():
	print("hi")
	sr.Microphone(device_index=1)
	r=sr.Recognizer()
	r.energy_threshold=200000
	with sr.Microphone() as source:
		print("Say something")
		audio=r.listen(source, phrase_time_limit=3)
		try:
			text=r.recognize_google(audio)
			print("You said {}".format(text))
			url='https://google.com/search?q='
			search_url=url+text
			webbrowser.open(search_url)
			return render_template('editor.html')
		except:
			print("Sorry could not recognize what you said")
	# return render_template('editor.html')
	return redirect(url_for('editor'))


@app.route('/codeEditor', methods =['GET', 'POST'])
def editor():
	if 'loggedin' in session:
		viewId = request.args.get('id')
		sqlQuery = '''SELECT * FROM useraccount WHERE id = %s'''
		cursor.execute(sqlQuery, (viewId, ))
		user = cursor.fetchone()
		print(user)
		return render_template('codeEditor.html', user = user)
	return redirect(url_for('login'))

@app.route('/flappybird')
def flappybird():
	return render_template('flappybird.html')

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