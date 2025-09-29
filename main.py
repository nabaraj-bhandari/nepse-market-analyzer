from bs4 import BeautifulSoup
import csv

file_path = "./rawHtml/2025-01-01.html"

try:
    with open(file_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    print("HTML content successfully read\n")
except FileNotFoundError:
    print(f"File not found at path {file_path}")
except Exception as e:
    print(f"Exception occured {e}")

soup = BeautifulSoup(html_content, "html.parser")

all_rows = soup.find_all("tr")
heads = all_rows[0].find_all("th")

rows = all_rows[1:]

headings = []
for head in heads:
    headings.append(head.text)
print(headings)

data = []
for row in rows:
    temp1 = []
    temp2 = row.find_all("td")
    for item in temp2:
        temp1.append(item.text)
    data.append(temp1)

data_to_write = [headings, *data]

with open("test.csv", "w") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerows(data_to_write)
