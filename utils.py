import requests
from bs4 import BeautifulSoup
from lxml import etree, html
import requests



_SERPAPI_API_KEY = "5544cf4bff9e0d66f20ea7010b61bd941022c9a61c6bee3993019d98969fcd7d"


'''
HEADERS = ({'User-Agent':
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 \
                (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36', \
            'Accept-Language': 'en-US, en;q=0.5'})
'''


HEADERS = { "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0",
            "Accept-Encoding":"gzip, deflate", "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "DNT":"1",
            "Connection":"close",
            "Upgrade-Insecure-Requests":"1"}

def innerXML(elem):
    elemName = elem.xpath('name(/*)')
    resultStr = ''
    for e in elem.xpath('/'+ elemName + '/node()'):
        if(isinstance(e, str) ):
            resultStr = resultStr + ''
        else:
            resultStr = resultStr + etree.tostring(e, encoding='unicode')

    return resultStr


def getStackOverflowQuerySearchResults(searchText):

    searchText = searchText[len(searchText) - 512:]

    response = requests.get("https://serpapi.com/search.json?engine=google&q=[python] stackoverflow.com {}&api_key={}".format(searchText, _SERPAPI_API_KEY), HEADERS)

    results = response.json().get("organic_results") if response.json().get("organic_results", None) is not None else "<br>[no suggestive solution(s) found.]"

    strResults = ""

    if type(results) == str:
        strResults = results
    else:

        strResults += "<br>[suggestive solution(s) found.]"

        for result in results:
            strResults += "<br><br><b><a href='{}'>{}</a></b>&nbsp; - {}<br>".format(result["link"], result["title"], result["snippet"])

    return strResults


def stackoverflowQuerySearch_NOT_WORKING_1(searchText):

    #page = requests.get("https://stackoverflow.com/search?q=[python] {}".format(searchText), HEADERS)
    page = requests.get("https://www.google.com/search?q=[python] stackoverflow.com {}".format(searchText), HEADERS)

    tree = html.fromstring(page.content)
    #print(page.content)  # just to check the html string

    # google search xpath,
    #rows = tree.xpath("//a[@data-ved and @ping]")
    #rows = tree.xpath("//div[*//div][*//a][*//div][*//div]")
    #rows = tree.xpath("//div[*//div][*//div][*//div][*//a][*//div][*//div][*//a]")
    rows = tree.xpath("//div[@aria-expanded][@role][@tabindex][@id]")

    #rows = tree.xpath("//html/body")
    #
    for row in rows:
        #print(innerXML(row))
        print(etree.tostring(row, pretty_print=True))
        print("\r\n\r\n")

    #print(tree.xpath("//div[*//div][*//a]/text()"))

    #print(tree.tostring(tree, pretty_print=True))

    print(rows[0].text)


def stackoverflowQuerySearch_NOT_WORKING_2(searchText):

    #page = requests.get("https://stackoverflow.com/search?q=[python] {}".format(searchText), HEADERS)
    page = requests.get("https://www.google.com/search?q=[python] stackoverflow.com {}".format(searchText), HEADERS)

    soup = BeautifulSoup(page.content, 'html.parser')

    # document
    dom = etree.HTML(str(soup))

    # stackoverflow xpath,
    #rows = dom.xpath("//a[@class='answer-hyperlink ']")

    # google search xpath,
    rows = dom.xpath("//a[@data-ved and @ping]")

    print(etree.tostring(dom, pretty_print=True))

    print(rows[0].text)


    '''
    # Extract title of page
    page_title = soup.title

    # Extract body of page
    page_body = soup.body

    # Extract head of page
    page_head = soup.head

    # print the result
    print(page_title, page_head)    
    


def testScrape1():
    # Make a request
    page = requests.get(
        "https://codedamn-classrooms.github.io/webscraper-python-codedamn-classroom-website/")
    soup = BeautifulSoup(page.content, 'html.parser')

    # Extract title of page
    page_title = soup.title

    # Extract body of page
    page_body = soup.body

    # Extract head of page
    page_head = soup.head

    # print the result
    print(page_title, page_head)


testScrape1()

'''

#print(getStackOverflowQuerySearchResults("SyntaxError: invalid syntax"))
